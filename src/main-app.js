import { LitElement, html, css } from 'lit-element';
import { debounce as _debounce } from 'lodash';
import {
  getAllComponents,
  getComponentProperties,
  showSource,
  highlightComponent,
  unhighlightComponent,
  setProperty,
} from './helpers/helpers.js';
import './components/component-tree.js';
import './components/property-tree.js';
import {
  componentsWalk,
  enrichWithSelector,
  enrichWithRef,
  convertNodeNameToLowerCase
} from './helpers/enrich-helpers.js';
import { buildComponentsSearchIndex, searchComponents, searchComponentProperty } from './helpers/search-helpers.js';
import { DEBOUNCE_WAIT } from './constants';

class MainApp extends LitElement {
  static get properties() {
    return {
      _componentsFilter: { type: Object },
      _componentPropertiesFilter: { type: Array },
      _showProperty: { type: Boolean },
      _selectedComponentName: { type: String }
    };
  }

  static get styles() {
    return [css`
      .b { 1px solid blue;}
      .property-title { margin-right: 8px; }
    `]
  }

  constructor() {
    super();
    this._currentQuerySelector = null;
    this._components = null;
    this._componentsFilter = null;
    this._componentProperties = null;
    this._componentPropertiesFilter = null;

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
  }

  connectedCallback() {
    super.connectedCallback();

    (async function () {
      const components = await getAllComponents();

      // enrich with node reference and element selector path
      componentsWalk([enrichWithRef, enrichWithSelector, convertNodeNameToLowerCase])(components);

      this._componentsFilter = this._components = components;

      buildComponentsSearchIndex(this._components);
    }.bind(this)());
  }

  async _handlerShowProperties(event) {
    this._selectedComponentName = event.detail.nodeName;
    this._currentQuerySelector = event.detail.selector;
    this._showProperty = Boolean(this._currentQuerySelector);

    this._componentProperties = this._componentPropertiesFilter = await getComponentProperties(this._currentQuerySelector);
  }

  render() {
    return html`
      <link rel="stylesheet" href="./styles/light-style.css">
      <div id="app-container">
        <div class="app">
          <div class="header">
            <div class="logo"></div>
            <span class="message-container">
              <span class="message"><span class="text">GrassHopper Dev Tools</span></span>
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
            <div class="split-pane vertical">
              <div class="left top" style="width: 50%">
                <div class="scroll-pane">
                  <div class="header">
                    <div class="action-header">
                      <input
                        type="text"
                        placeholder="Filter component"
                        class="search"
                        @input=${(event) => this._debouncedComponentFilter(event.target.value)}
                      >
                    </div>
                  </div>
                  <div class="scroll">
                    <div id="component-tree">
                      ${ !this._componentsFilter ?
                        html`<span>Loading...</span>` :
                        html`<component-tree 
                              data=${ JSON.stringify(this._componentsFilter) }
                              @show-properties=${ this._handlerShowProperties }
                              @show-source=${ (event) => showSource(event.detail.nodeName) }
                              @highlight-component=${ (event) => highlightComponent(event.detail.selector) }
                              @unhighlight-component=${ (event) => unhighlightComponent(event.detail.selector) }
                             ></component-tree>`
                      }
                    </div>
                  </div>
                </div>
                <div class="dragger"></div>
              </div>
              <div class="right bottom" style="width: 50%">
                <div class="scroll-pane">
                  <div class="header">
                    <div class="action-header">
                      ${ this._showProperty ? 
                      html`<div class="property-title">${ this._selectedComponentName } :</div>` : ''}                      
                      <input 
                        type="text" 
                        placeholder="Filter properties" 
                        class="search" 
                        @input=${ (event) => this._debouncedPropertyFilter(event.target.value) }
                      >
                    </div>
                  </div>
                  <div class="scroll">
                    ${ this._showProperty ?
                        html`<section>
                              <property-tree 
                                .data=${ this._componentPropertiesFilter } 
                                @change-property=${ (event) => setProperty({ 
                                  querySelector: this._currentQuerySelector, 
                                  property: event.detail.property, 
                                  value: event.detail.value 
                                })}
                              ></property-tree>
                             </section>` : 
                        html`<section class="notice"><div>Select a component to inspect.</div></section>`
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('main-app', MainApp);
