import { LitElement, html, css } from 'lit-element';

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
    this._mockLists = [];
    this._showForm = false;
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
            <div>Url: <input type="text" id="requestUrl"></div>
            <div>Response: <textarea id="responseBody"></textarea></div>
            <div><button @click=${this._handlerSave}>Save</button> | <button @click=${this._handlerCancel}>Cancel</button></div>
          </div>
        ` : html``}
       
        ${ (!this._mockLists.length) ? html`
          <div>Not any XHR Request Mocked. <button>+Add Pattern</button></div>
        ` : 
          this._mockLists.map(({url, method}) => html`
            <div><span>${url}</span><span>${method}</span></div>
          `)
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

    console.log('responseBodyText', responseBodyText);

    let responseBody;
    try {
      // todo: validate and fix reponseBodyText, and JSON.parse
      // https://www.npmjs.com/package/dirty-json
      // https://github.com/4ossiblellc/fixjson/blob/117a2f6f35d16f6fc700e74e6891171493f29812/src/routes/home/Home.js
      responseBody = JSON.parse(responseBodyText);
    } catch (err) {
      console.log('err', err);
      responseBody = responseBodyText;
    }

    this._mockLists.push({
      url: requestUrl,
      method: 'GET',
      mock: {
        body: responseBody
      }
    });

    // TODO: save list to local storage

    // TODO: run the mock

    this._showForm = true;

    console.log('handler save');
    console.log('mocklists', this._mockLists);
  }

  _storeData() {

  }

  _getStoredData() {

  }
}

customElements.define('component-request-mocking', ComponentRequestMocking);
export { ComponentRequestMocking };
