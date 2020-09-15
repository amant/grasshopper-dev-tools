import { LitElement, html, css } from 'lit-element';
import { debounce as _debounce } from 'lodash';
import {
  getAllComponents,
  getComponentProperties,
  showSource,
  highlightComponent,
  unHighlightComponent,
  setProperty,
} from './helpers/helpers.js';
import {
  componentsWalk,
  enrichWithSelector,
  enrichWithRef,
  convertNodeNameToLowerCase
} from './helpers/enrich-helpers.js';
import { buildComponentsSearchIndex, searchComponents, searchComponentProperty } from './helpers/search-helpers.js';
import {
  DEBOUNCE_WAIT,
  VERTICAL,
  HORIZONTAL,
  CHROME_THEME,
  COMPONENT_TREE,
  COMPONENT_CHART,
  COMPONENT_REQUEST_MOCKING,
} from './constants';
import { mainAppStyle } from './styles/main-app-style';

import './components/component-tree.js';
import './components/component-tree-chart.js';
import './components/component-request-mocking';
import './components/property-tree.js';
import './components/split-pane.js';

class MainApp extends LitElement {
  static get properties() {
    return {
      _componentsFilter: { type: Object },
      _componentPropertiesFilter: { type: Array },
      _showProperty: { type: Boolean },
      _selectedComponentName: { type: String },
      _view: { type: String },
      _mainContent: { type: String }
    };
  }

  static get styles() {
    return [css`
      :host {
        display: flex;
        height: 100vh;
        min-height: 500px;
      }

      .app-title {
        color: var(--title-text-color);
      }

      .property-title {
        margin-right: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--dom-tag-name-color);
      }
    `,
      mainAppStyle,
    ]
  }

  constructor() {
    super();
    this._currentQuerySelector = null;
    this._components = null;
    this._componentProperties = null;
    this._mainContent = COMPONENT_REQUEST_MOCKING;

    this._debouncedComponentFilter = _debounce(async (value) => {
      if (!value) {
        this._componentsFilter = this._components;
        return;
      }

      this._componentsFilter = searchComponents(this._components, value);
    }, DEBOUNCE_WAIT);

    this._debouncedPropertyFilter = _debounce(async (value) => {
      if (!value) {
        this._componentPropertiesFilter = this._componentProperties;
        return;
      }

      this._componentPropertiesFilter = searchComponentProperty(this._componentProperties, value);
    }, DEBOUNCE_WAIT);

    const mediaQuery = window.matchMedia('(min-width: 685px)');
    this.mediaQueryHandler(mediaQuery);

    mediaQuery.addListener(this.mediaQueryHandler.bind(this));
  }

  mediaQueryHandler(mediaQuery) {
    this._view = mediaQuery.matches ? VERTICAL : HORIZONTAL;
  }

  connectedCallback() {
    super.connectedCallback();

    this._refreshComponent();

    // TODO: refactor to use bridge event bus pattern
    // listen for changes to the tab
    chrome.tabs.onUpdated.addListener((_, changeInfo) => {
      if (changeInfo.status === 'complete') {
        this._refreshComponent();
      }
    });

    if (CHROME_THEME === 'dark') {
      document.body.classList.add('dark-mode')
    }
  }

  async _handleShowProperties(event) {
    this._selectedComponentName = event.detail.nodeName;
    this._currentQuerySelector = event.detail.selector;
    this._showProperty = Boolean(this._currentQuerySelector);

    this._componentProperties = this._componentPropertiesFilter = await getComponentProperties(this._currentQuerySelector);
  }

  async _refreshComponent() {
    const components = await getAllComponents();

    // enrich with node reference and element selector path
    componentsWalk([enrichWithRef, enrichWithSelector, convertNodeNameToLowerCase])(components);

    // reset components and properties lists
    this._componentsFilter = this._components = components;
    this._componentPropertiesFilter = [];

    buildComponentsSearchIndex(this._components);

    // reset search component value
    const inputFilterComponentEl = this.shadowRoot.querySelector('#inputFilterComponent');
    if (inputFilterComponentEl) {
      inputFilterComponentEl.value = '';
    }
  }

  get _mainContentTemplate() {
    if (this._mainContent === COMPONENT_CHART) {
     return html`<component-tree-chart
                  .data=${this._components}
                  @highlight-component=${(event) => highlightComponent(event.detail.selector)}
                  @unhighlight-component=${(event) => unHighlightComponent(event.detail.selector)}
                 ></component-tree-chart>`
    }

    if (this._mainContent === COMPONENT_REQUEST_MOCKING) {
      return html`<component-request-mocking></component-request-mocking>`
    }

    return html`
      <split-pane view=${this._view}>
        <!-- Start left-pane -->
        <div slot="left-pane" class="header">
          <div class="action-header">
            <input
              id="inputFilterComponent"
              type="search"
              placeholder="Filter component"
              class="search"
              @input=${(event) => this._debouncedComponentFilter(event.target.value)}
            >
          </div>
        </div>
        <div slot="left-pane" class="scroll">
          <div class="component-tree-container">
            ${!this._components ?
              html`<span>Loading...</span>` :
              html`<component-tree
                      data=${JSON.stringify(this._componentsFilter)}
                      @show-properties=${this._handleShowProperties}
                      @show-source=${(event) => showSource(event.detail.nodeName)}
                      @highlight-component=${(event) => highlightComponent(event.detail.selector)}
                      @unhighlight-component=${(event) => unHighlightComponent(event.detail.selector)}
                      @refresh-component=${this._refreshComponent}
                     ></component-tree>`
              }
          </div>
        </div>
        <!-- End left-pane -->

        <!-- Start right-pane -->
        <div slot="right-pane" class="header">
          <div class="action-header">
            ${this._showProperty ? html`<div class="property-title"><${this._selectedComponentName}> :</div>` : ''}
            <input
              id="inputFilterProperties"
              type="search"
              placeholder="Filter properties"
              class="search"
              @input=${(event) => this._debouncedPropertyFilter(event.target.value)}
            >
          </div>
        </div>
        <div slot="right-pane" class="scroll">
          ${this._showProperty ?
            html`<section class="property-tree-container">
                   <property-tree
                    .data=${this._componentPropertiesFilter}
                    @change-property=${(event) => setProperty({
                      querySelector: this._currentQuerySelector,
                      property: event.detail.property,
                      value: event.detail.value
                    })}></property-tree>
                  </section>` :
            html`<section class="notice"><div>Select a component to inspect.</div></section>`
          }
        </div>
        <!-- End right-pane -->
      </split-pane>
    `;
  }

  get actionButtonTemplate() {
    const selectedBtn = value => this._mainContent === value ? 'selected' : '';

    return html`
      <button type="button" class="btn ${selectedBtn(COMPONENT_TREE)}"
        @click=${() => this._mainContent = COMPONENT_TREE }
      >Tree</button>
      <button type="button" class="btn ${selectedBtn(COMPONENT_CHART)}"
        @click=${() => this._mainContent = COMPONENT_CHART }
      >Chart</button>
      <button type="button" class="btn ${selectedBtn(COMPONENT_REQUEST_MOCKING)}"
        @click=${() => this._mainContent = COMPONENT_REQUEST_MOCKING }
      >Request mocking</button>
    `;
  }

  render() {
    return html`
      <div class="app">
        <div class="header">
          <div class="logo"></div>
          <span class="message-container">
            <span class="message"><span class="app-title">Grass-Hopper Dev-Tools</span></span>
          </span>
          <div class="actions">
            <div class="ui-group">
              <div class="content-wrapper">
                <div class="content">
                  ${this.actionButtonTemplate}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="container">
          ${ this._mainContentTemplate }
        </div>
      </div>
    `;
  }
}

customElements.define('main-app', MainApp);
