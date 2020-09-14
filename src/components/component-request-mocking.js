import { LitElement, html, css } from 'lit-element';
import * as dJSON from 'dirty-json';
import { get as _get } from 'lodash';
import { db, configDb } from '../helpers/request-mocking-db-helpers.js';
import { refreshCurrentPage } from '../helpers/helpers.js';

const SHOW_ADD_FORM = 0;

const defaultFormValues = {
  requestUrl: 'https://google.com',
  responseBody: { hello: 'world' },
  responseStatus: '200',
};

class ComponentRequestMocking extends LitElement {
  static get styles() {
    return css`
      .b {
        border: 1px solid red;
      }

      .response-body {
        max-height: 150px;
        width: 100%;
        overflow: scroll;
      }
  `;
  }

  static get properties() {
    return {
      _mockLists: { type: Array },
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
        <fieldset>
          <input type="hidden" id="requestId" value=${id}>
          <div>
            <input type="checkbox" ?checked=${requestEnable} id="requestEnable"> : Enable request mocking
          </div>
          <div>Url: <input type="text" id="requestUrl" value=${requestUrl}></div>
          <div>Response: <textarea id="responseBody">${JSON.stringify(responseBody)}</textarea></div>
          <div>Response Status: <input type="text" id="responseStatus" value=${responseStatus}></div>
          <div><button type="button" @click=${() => this._handleSave()}>Save</button> | <a href="#nolink" @click=${this._handleCancel}>Cancel</a></div>
        </fieldset>
      </form>
    `;
  }

  firstUpdated() {
    this._setConfigLists();
    this._setMockLists();
  }

  // TODO: add spinner icon for saving and loading
  render() {
    return html`
        ${this._showSaving ? html`<div>Saving....</div>` : html``}
        ${this._showLoading ? html`<div>Loading....</div>` : html``}

         <div class="b">
          <input type="checkbox" ?checked=${this._enableMock} id="mockEnable" @click=${(e) => this._handleEnableMock(e) }> : Enable Mocking |
          <button @click=${() => this._handleAddMock()}>+ Add</button>
          <button @click=${() => this._handleRemoveAllMocks()}>- Remove All</button>
        </div>

        ${ this._formIdToShow === SHOW_ADD_FORM ? this._templateForm(defaultFormValues) : html``}

        ${ (!this._mockLists.length) ? html`
            <div>Request Mocked Empty. <button @click=${() => this._handleAddMock()}>+Add Pattern</button></div>
          ` : html`
            <ul>
              ${this._mockLists.map(list => html`
                <li class="list" id="${`mock-list-id-${list.id}`}">
                  ${this._formIdToShow !== list.id ? html`` : html`
                    <div class="edit-list">
                      ${this._templateForm(list)}
                    </div>
                  `}

                  ${this._formIdToShow === list.id ? html`` : html`
                    <div class="mock-list">
                      <div>
                        <input type="checkbox" ?checked=${list.requestEnable} @click=${(e) => this._handleRequestEnableClick(list.id, e)}> : Enable request mocking
                      </div>
                      <div>Id: ${list.id}</div>
                      <div>URL: ${list.requestUrl}</div>
                      <div>Status: ${list.responseStatus}</div>
                      <div class="response-body">Body: ${JSON.stringify(list.responseBody)}</div>
                      <div><button @click=${() => this._handleEditMock(list.id)}>Edit</button> | <a href="#nolink" @click=${() => this._handleDelete(list.id)}>Delete</a></div>
                    </div>
                  `}
                </li>
              `)}
            </ul>`
      }
    `;
  }

  _handleAddMock() {
    this._formIdToShow = SHOW_ADD_FORM;
    console.log('handle add mock');
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
    const responseBodyText = this.shadowRoot.querySelector('#responseBody').value;
    const responseStatus = this.shadowRoot.querySelector('#responseStatus').value;
    const requestFormFieldSet = this.shadowRoot.querySelector('#requestForm > fieldset');

    requestFormFieldSet.disabled = true;
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

    console.log('this is the data', data);

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
        requestFormFieldSet.disabled = false;
      });
  }

  _handleRequestEnableClick(id, event) {
    const requestEnable = event.target.checked
    const list = this._mockLists.find(item => item.id === id);
    const data = { ...list, requestEnable }

    db.put(data)
      .then(result => {
        console.log('saved', result);
        this._setMockLists();
      })
      .catch(err => {
        console.error('error saving checked', err);
      });
  }

  async _setMockLists() {
    const data = await db.getAll();
    this._mockLists = data;
    // console.log('mockLists', this._mockLists);
  }

  async _setConfigLists() {
    try {
      console.log('before');
      const data = await configDb.getAll();
      console.log('configDB', data);
      this._enableMock = _get(data, 'mockEnable');
    } catch(e) {
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
