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
import './components/component-tree.js';
import './components/property-tree.js';
import './components/split-pane.js';
import {
  componentsWalk,
  enrichWithSelector,
  enrichWithRef,
  convertNodeNameToLowerCase
} from './helpers/enrich-helpers.js';
import { buildComponentsSearchIndex, searchComponents, searchComponentProperty } from './helpers/search-helpers.js';
import { DEBOUNCE_WAIT, VERTICAL, HORIZONTAL } from './constants';
import { mainAppStyle } from './styles/main-app-style';

const chromeTheme = chrome.devtools.panels.themeName || 'dark';

class MainApp extends LitElement {
  static get properties() {
    return {
      _componentsFilter: { type: Object },
      _componentPropertiesFilter: { type: Array },
      _showProperty: { type: Boolean },
      _selectedComponentName: { type: String },
      _view: { type: String }
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

    // TODO: css for high-contrast mode
    if (chromeTheme === 'dark') {
      document.body.classList.add('dark-mode')
    }
  }

  async _handlerShowProperties(event) {
    this._selectedComponentName = event.detail.nodeName;
    this._currentQuerySelector = event.detail.selector;
    this._showProperty = Boolean(this._currentQuerySelector);

    this._componentProperties = this._componentPropertiesFilter = await getComponentProperties(this._currentQuerySelector);
  }

  async _refreshComponent() {
    const components = await getAllComponents();

    // enrich with node reference and element selector path
    componentsWalk([enrichWithRef, enrichWithSelector, convertNodeNameToLowerCase])(components);

    this._componentsFilter = this._components = components;

    buildComponentsSearchIndex(this._components);

    // reset search component value
    this.shadowRoot.querySelector('#inputFilterComponent').value = '';
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
                  <button>Tree</button>
                  <button>Chart</button>
                  <button>A11Y Check</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="container">
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
                ${!this._componentsFilter ?
      html`<span>Loading...</span>` :
      html`<component-tree 
                        data=${JSON.stringify(this._componentsFilter)}
                        @show-properties=${this._handlerShowProperties}
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
        </div>
      </div>
    `;
  }
}

customElements.define('main-app', MainApp);
