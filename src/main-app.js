import { LitElement, html } from 'lit-element';
import './components/at-tree.js';
import { getAllDocumentElement } from './helpers/helpers.js'

class MainApp extends LitElement {
  static get properties() {
    return {
      _documentElements: { type: Object },
      _elementProperties: { type: Array },
      _showProperty: { type: Boolean }
    };
  }

  constructor() {
    super();
    this._elementProperties = [];
  }

  connectedCallback() {
    super.connectedCallback();
    getAllDocumentElement().then(elements => {
      this._documentElements = elements;
    });
  }

  _handlerShowProperties(event) {
    // console.log('showProperties', event.detail.selector);
    this._showProperty = Boolean(event.detail.selector);
    this._elementProperties = [event.detail.selector];
  }

  get _elementPropertiesTemplate() {
    return html`<ul>${this._elementProperties.map(property => 
                html`<li>${property}</li>`)
                }</ul>
            `;
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
                        html`<at-tree 
                              data=${ JSON.stringify(this._documentElements) }
                              @show-properties=${this._handlerShowProperties}
                             ></at-tree>`
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
                    <section class="notice" id="component-properties">
                    ${this._showProperty ? 
                        this._elementPropertiesTemplate : html`<div>Select a component to inspect.</div>`
                    }
                    </section>
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
