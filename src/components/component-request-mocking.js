import { LitElement, html, css } from 'lit-element';
import * as dJSON from 'dirty-json';
import { get as _get } from 'lodash';
import CodeMirror from 'codemirror/lib/codemirror.js';
import { db, configDb } from '../helpers/request-mocking-db-helpers.js';
import { refreshCurrentPage } from '../helpers/helpers.js';
import { codeMirrorStyle, codeMirrorTheme } from '../helpers/codemirror-helpers.js';
import { fontAwesomeStyle, fontAwesomeSolidStyle } from '../helpers/fontawesome-helpers.js';

import 'codemirror/mode/javascript/javascript.js';

// default form id
const SHOW_ADD_FORM = 0;

// TODO: remove
const defaultFormValues = {
  requestUrl: 'https://google.com',
  responseBody: { hello: 'world' },
  responseStatus: '200',
};

class ComponentRequestMocking extends LitElement {
  static get styles() {
    return [codeMirrorStyle, codeMirrorTheme, fontAwesomeStyle, fontAwesomeSolidStyle, css`
      .response-body {
        max-height: 100px;
        width: 98%;
        overflow: scroll;
      }

      .mock-list {
        display: flex;
        flex-flow: column;
        gap: 8px;
        margin-bottom: 8px;
      }

      .mock-list .action {
        margin-top: 12px;
      }

      #requestUrl {
        width: 50%;
      }

      #responseBody {
        min-height: 150px;
        width: 100%;
      }

      .CodeMirror {
        border: 1px solid #eee;
        height: 250px;
        max-height: 250px;
      }

      .empty-mock {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100px;
      }

      .small-btn {
        width: 18px;
        height: 18px;
        padding: 0px;
        font-size: 12px;
      }

      .divider {
        color: var(--divider-color);
      }

      .mock-menu {
        padding: 0;
        margin: 0;
        line-height: 32px;
        border-bottom: 1px solid var(--divider-color);
      }

      .mock-enable-input {
        vertical-align: middle;
        position: relative;
        margin-top: 0;
      }

      .mock-enable {
        margin-left: 8px;
        display: inline-block;
      }

      .request-form-items {
        padding: 8px;
        background-color: var(--toolbar-bg-color);
        display: flex;
        flex-flow: column;
        gap: 12px;
      }

      .mock-list-container {
        list-style: none;
        margin: 0;
        padding: 8px;
      }

      .list {
        margin-top: 8px;
        border-bottom: 1px solid var(--divider-color);
      }

      .list:first-child {
        margin-top: 0;
      }

      .delete-btn,
      .cancel-btn {
        color: var(--app-text-color);
      }

      .hidden {
        display: none;
      }
    `];
  }

  static get properties() {
    return {
      _mockLists: { type: Array },
      // TODO: refactor to activeFormId
      _formIdToShow: { type: Number },

      _showSaving: { type: Boolean },
      _showLoading: { type: Boolean },
      _enableMock: { type: Boolean },
    }
  }

  // TODO: save default on localhost storage
  constructor() {
    super();
    this._mockLists = [];
    this._formIdToShow = null;
    this._showSaving = false;
    this._showLoading = false;
    this._enableMock = false;
    this._editor = null;
  }

  connectedCallback() {
    super.connectedCallback();

    chrome.tabs.onUpdated.addListener((_, changeInfo) => {
      if (changeInfo.status === 'complete') {
        this._refresh();
      }
    });
  }

  _templateForm({
                  id = '',
                  requestEnable = true,
                  requestUrl = '',
                  responseBody = '',
                  responseStatus = ''
                } = {}) {
    return html`
      <form id="requestForm">
        <div class="request-form-items">
          <input type="hidden" id="requestId" value=${ id }>
          <div>
            <label><input class="mock-enable-input" type="checkbox" ?checked=${ requestEnable } id="requestEnable"> : Enable request mock</label>
          </div>
          <div>
            <div>URL (use * for wildcard): </div>
            <div><input type="text" id="requestUrl" value=${ requestUrl }></div>
          </div>
          <div>
            <div>Response Status: </div>
            <div><input type="text" size="12" id="responseStatus" value=${ responseStatus }></div>
          </div>
          <div>
            <div>Response Body: </div>
            <div><textarea id="responseBody">${ JSON.stringify(responseBody, null, 2) }</textarea></div>
          </div>
          <div>
            <button title="Save" type="button" id="save-btn" @click=${ () => this._handleSave() }><i class="fas fa-save"></i> Save</button>&nbsp;&nbsp;
            <span class="divider">|</span>&nbsp;&nbsp;
            <a title="Cancel" class="cancel-btn" href="#nolink" @click=${ this._handleCancel }>Cancel</a>
          </div
        </div>
      </form>
    `;
  }

  _refresh() {
    this._setMockLists();
  }

  firstUpdated() {
    this._setConfigLists();
    this._setMockLists();
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    // classes are added only for backward compatibility - they are deprecated
    if (changedProperties.has('_formIdToShow') && this._formIdToShow !== null) {
      this._editor = CodeMirror.fromTextArea(this.shadowRoot.querySelector('#responseBody'), {
        lineNumbers: true,
        matchBrackets: true,
        viewportMargin: 10,
      });
    }
  }

  // TODO: add spinner icon for saving and loading
  render() {
    return html`
        ${ this._showSaving ? html`<div>Saving....</div>` : html`` }
        ${ this._showLoading ? html`<div>Loading....</div>` : html`` }

         <div class="mock-menu">
         <div class="mock-enable">
          <label>
            <input class="mock-enable-input" type="checkbox" ?checked=${ this._enableMock } id="mockEnable" @click=${ (e) => this._handleEnableMock(e) }> Enable All Mocking
          </label>&nbsp;
          </div>
          <span class="divider">|</span>&nbsp;&nbsp;
          <button class="small-btn" title="Add a mock" @click=${ () => this._handleAddMock() }><i class="fas fa-plus"></i></button>&nbsp;&nbsp;
          <button class="small-btn" title="Remove all mock(s)" @click=${ () => this._handleRemoveAllMocks() }><i class="fas fa-ban"></i></button>
          <button class="small-btn" title="Refresh" @click=${ () => this._refresh() }><i class="fas fa-redo"></i></button>
        </div>

        ${ this._formIdToShow === SHOW_ADD_FORM ? this._templateForm(defaultFormValues) : html`` }

        ${ (!this._mockLists.length) ? html`
            <div class="empty-mock">Request Mocked Empty. &nbsp; <button class="small-btn" title="Add a mock" @click=${ () => this._handleAddMock() }><i class="fas fa-plus"></i></button></div>
          ` : html`
            <ul class="mock-list-container">
              ${ this._mockLists.map(list => html`
                <li class="list" id="${ `mock-list-id-${ list.id }` }">
                  ${ this._formIdToShow !== list.id ? html`` : html`
                    <div class="edit-list">
                      ${ this._templateForm(list) }
                    </div>
                  ` }

                  ${ this._formIdToShow === list.id ? html`` : html`
                    <div class="mock-list">
                      <div>
                        <div>
                          <label><input type="checkbox" ?checked=${ list.requestEnable } @click=${ (e) => this._handleRequestEnableClick(list.id, e) }> URL:</label>
                        </div>
                        <div>${ list.requestUrl }</div>
                      </div>
                      <div>
                        <div>Response Status:</div>
                        <div>${ list.responseStatus }</div>
                      </div>
                      <div>
                        <div>Response Body:</div>
                        <div class="response-body">${ JSON.stringify(list.responseBody) }</div>
                      </div>
                      <div class="action">
                        <button title="Edit" @click=${ () => this._handleEditMock(list.id) }><i class="fas fa-edit"></i> Edit</button>&nbsp;&nbsp;
                        <span class="divider">|</span>&nbsp;&nbsp;
                        <a title="Delete" class="delete-btn" href="#nolink" @click=${ () => this._handleDelete(list.id) }>Delete</a>
                      </div>
                    </div>
                  ` }
                </li>
              `) }
            </ul>`
    }
    `;
  }

  _handleAddMock() {
    this._formIdToShow = SHOW_ADD_FORM;
  }

  async _handleRemoveAllMocks() {
    if (confirm('Are you sure to remove all mocks?')) {
      await db.clear();
      this._setMockLists();
    }
  }

  _handleEditMock(id) {
    this._formIdToShow = id;
  }

  _handleCancel() {
    this._formIdToShow = null;
  }

  async _handleDelete(id) {
    if (confirm('Are you sure?')) {
      await db.delete(id);
      this._setMockLists();
    }
  }

  // TODO: refactor to make code readable
  _handleSave() {
    const id = this.shadowRoot.querySelector('#requestId').value;
    const requestEnable = this.shadowRoot.querySelector('#requestEnable').checked;
    const requestUrl = this.shadowRoot.querySelector('#requestUrl').value;
    const responseBodyText = this._editor ? this._editor.getValue() : this.shadowRoot.querySelector('#responseBody').value;

    const responseStatus = this.shadowRoot.querySelector('#responseStatus').value;
    const saveBtn = this.shadowRoot.querySelector('#save-btn');

    saveBtn.disabled = true;
    this._showSaving = true;

    let responseBody;

    try {
      // validate and fix reponseBodyText, and JSON.parse
      responseBody = dJSON.parse(responseBodyText);

    } catch (err) {
      console.log('parse error responseBodyText', err);
      responseBody = responseBodyText;
    }

    const data = {
      requestEnable,
      requestUrl,
      responseBody,
      responseStatus,
    };

    if (id) {
      data.id = Number(id);
    }

    db.put(data)
      .then(result => {
        console.log('saved to index db', result);
        this._setMockLists();
        this._formIdToShow = null;
      })
      .catch(err => {
        console.error('error saving to index db', err);
        this._formIdToShow = id;
      })
      .finally(() => {
        this._showSaving = false;
        saveBtn.disabled = false;
      });
  }

  _handleRequestEnableClick(id, event) {
    const requestEnable = event.target.checked;
    const list = this._mockLists.find(item => item.id === id);
    const data = { ...list, requestEnable };

    db.put(data)
      .then(result => {
        this._setMockLists();
      })
      .catch(err => {
        console.error('error saving checked', err);
      });
  }

  async _setMockLists() {
    const data = await db.getAll();
    this._mockLists = data;
  }

  async _setConfigLists() {
    try {
      const data = await configDb.getAll();
      this._enableMock = _get(data, 'mockEnable');
    } catch (e) {
      console.log('error', e);
    }
  }

  _handleEnableMock(event) {
    configDb.put({ mockEnable: event.target.checked })
      .then(() => {
        this._setConfigLists();
        refreshCurrentPage();
      })
      .catch(err => {
        console.error('error saving mock enable', err);
      });
  }
}

customElements.define('component-request-mocking', ComponentRequestMocking);
export { ComponentRequestMocking };
