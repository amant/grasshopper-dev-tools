import { LitElement, html, css } from 'lit-element';
import { getAllDocumentElement, getProperties, showSource } from './helpers/helpers.js';

import './components/component-tree.js';
import './components/property-tree.js';
import { setProperty } from "./helpers/helpers";

class MainApp extends LitElement {
  static get properties() {
    return {
      _documentElements: { type: Object },
      _elementProperties: { type: Array },
      _showProperty: { type: Boolean },
    };
  }

  static get styles() {
    return [css`
      .b { 1px solid blue;}
    `]
  }

  constructor() {
    super();
    this._currentQuerySelector = null;
  }

  connectedCallback() {
    super.connectedCallback();
    getAllDocumentElement().then(elements => {
      this._documentElements = elements;
    });
  }

  async _handlerShowProperties(event) {
    this._currentQuerySelector = event.detail.selector;
    this._showProperty = Boolean(this._currentQuerySelector);
    this._elementProperties = await getProperties(this._currentQuerySelector);
  }

  _handlerShowSource(event) {
    showSource(event.detail.nodeName);
  }

  _handlerChangeProperty(event) {
    const value = event.detail.value;
    const property = event.detail.property;
    setProperty({
      querySelector: this._currentQuerySelector,
      property,
      value
    }).then(() => console.log('setProperty done!'));
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
                      <input type="text" placeholder="Filter component" class="search">
                    </div>
                  </div>
                  <div class="scroll">
                    <div id="component-tree">
                      ${ !this._documentElements ?
                        html`<span>Loading...</span>` :
                        html`<component-tree 
                              data=${ JSON.stringify(this._documentElements) }
                              @show-properties=${ this._handlerShowProperties }
                              @show-source=${ this._handlerShowSource }
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
                      <span class="title" style="margin-right: 10px;">&lt;To-do&gt;</span>
                      <input type="text" placeholder="Filter properties" class="search">
                    </div>
                  </div>
                  <div class="scroll">
                    ${ this._showProperty ?
                        html`<section>
                              <property-tree 
                                .data=${ this._elementProperties } 
                                @change-property=${ this._handlerChangeProperty }
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
