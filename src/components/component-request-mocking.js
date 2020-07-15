import { LitElement, html, css } from 'lit-element';
import { db } from '../helpers/request-mocking-db-helpers.js';

class ComponentRequestMocking extends LitElement {
  static get styles() {
    return css`
      .b {
        border: 1px solid red;
      }
  `;
  }

  static get properties() {
    return {
      _toEnableRequestMocking: { type: Boolean },
      _mockLists: { type: Array },
      _showForm: { type: Boolean },
    }
  }

  // TODO: save default on localhost storage
  constructor() {
    super();
    this._toEnableRequestMocking = true; // todo: should be false by default
    this._showForm = false;

    this._mockLists = [];    
    this._setMockLists()
  }

  render() {
    return html`
         <div class="b"><input type="checkbox" ?checked=${this._toEnableRequestMocking}>
          <span>Enable request mocking | </span>
          <button @click=${this._handlerAddMock}>+ Add Pattern</button>
          <button @click=${this._handlerRemoveAllMocks}>- Remove All Patterns</button>
        </div>
        
        ${ this._showForm ? html`
          <div>
            <div>Url: <input type="text" id="requestUrl" value="https://goole.com"></div>
            <div>Response: <textarea id="responseBody">{"hello": "world"}</textarea></div>
            <div>Response Status: <input type="text" id="responseStatus" value="200"></div>
            <div><button @click=${() => this._handlerSave()}>Save</button> | <button @click=${this._handlerCancel}>Cancel</button></div>
          </div>
        ` : html``}
       
        ${ (!this._mockLists.length) ? html`
            <div>Not any XHR Request Mocked. <button>+Add Pattern</button></div>
          ` :
          html`
          <ul>
            ${this._mockLists.map(list => html`
              <li>
                <div>Id: ${list.id}</span>
                <div>URL: ${list.requestUrl}</span>
                <div>Status: ${list.responseStatus}</span>
                <div>Body: ${JSON.stringify(list.responseBody)}</span>
              </li>
            `)}
          </ul>`
        }
    `;
  }

  _handlerAddMock() {
    this._showForm = true;
    console.log('handler add mock');
  }

  _handlerRemoveAllMocks() {
    console.log('handler remove all mock');
  }

  _handlerRemoveMock() {
   // TODO: implement
    console.log('handler remove mock');
  }

  _handlerEditMock() {
    // TODO: implement
    console.log('handler edit mock');
  }

  _handlerCancel() {
    this._showForm = false;
    console.log('handler cancel');
  }

  _handlerSave() {
    const requestUrl = this.shadowRoot.querySelector('#requestUrl').value;
    const responseBodyText = this.shadowRoot.querySelector('#responseBody').value;
    const responseStatus = this.shadowRoot.querySelector('#responseStatus').value;

    let responseBody;

    try {
      // todo: validate and fix reponseBodyText, and JSON.parse
      // https://www.npmjs.com/package/dirty-json
      // https://github.com/4ossiblellc/fixjson/blob/117a2f6f35d16f6fc700e74e6891171493f29812/src/routes/home/Home.js
      responseBody = JSON.parse(responseBodyText);
      
    } catch (err) {
      console.log('parse error responseBodyText', err);
      responseBody = responseBodyText;
    }

    db.add({
      requestUrl,
      responseBody,
      responseStatus,
    }).then(result => {
      console.log('saved to index db', result);

      this._setMockLists();
      
    }).catch(err => {
      console.error('error saving to index db', err);
      this._showForm = true;
    });

    this._showForm = false;
  }

  async _setMockLists() {
    const data = await db.getAll();
    this._mockLists = data;    
    console.log('mockLists', this._mockLists);
  }
}

customElements.define('component-request-mocking', ComponentRequestMocking);
export { ComponentRequestMocking };
