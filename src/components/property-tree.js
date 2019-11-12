import { LitElement, html } from 'lit-element';
import { isArray as _isArray, isBoolean as _isBoolean, isObject as _isObject, isEmpty as _isEmpty } from 'lodash';

class PropertyTree extends LitElement {
  static get properties() {
    return {
      data: { type: Array },
    };
  }

  _parseValue(value) {
    try {
      return JSON.parse(value);
    } catch (e) {
      console.log('_parseValue error', e);
      return null;
    }
  };

  _treeList() {
    return html`
    <ul>${ Object.keys(this.data).map(key => html`
      <li>
        <span>${ key }:</span>
        ${ this._getValue(key, this.data[key]) }
      </li>`) }
    </ul>`;
  };

  _getValue(key, val) {
    const value = this._parseValue(val);

    if (typeof value === 'string') {
      return html`<input @change=${(event) => this._onChange(event, key)} type="text" value="${value}">`;
    }
    else if (_isArray(value)) {
      return html`<button>arr +</button>${value.map(item => this._getValue(key, item))}`;
    }
    else if (_isObject(value) && !_isEmpty(value)) {
      return html`<input @change=${(event) => this._onChange(event, key)} type="text" value="${JSON.stringify(value)}">`;
      //return html`${this._treeList(value)}`;
    }
    else if (_isBoolean(value)) {
      return html`
      <span>${value}</span>
      <select>
        <option value="true" ?selected=${value.toString() === 'true'}>True</option>
        <option value="false" ?selected=${value.toString() === 'false'}>False</option>
      </select>`;
    }


  };

  constructor() {
    super();
    this.data = [];
  }

  _onChange(event, key) {
    const el = event.target;
    this.dispatchEvent(new CustomEvent('change-property', {
      detail: { value: el.value, property: key },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return  html`${(Object.keys(this.data).length > 0)  ? this._treeList() : html`<div>No Properties Found</div>`}`;
  }
}

customElements.define('property-tree', PropertyTree);
export { PropertyTree };
