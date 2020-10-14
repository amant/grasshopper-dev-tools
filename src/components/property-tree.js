import { LitElement, html, css } from 'lit-element';
import { isArray as _isArray, isBoolean as _isBoolean, isObject as _isObject, isEmpty as _isEmpty } from 'lodash';

class PropertyTree extends LitElement {
  static get properties() {
    return {
      data: { type: Array },
    };
  }

  static get styles() {
    return [css`
      .property {
        padding: 0px;
      }

      .property-list {
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
      }

      .property-name {
        color: var(--component-property-name-color);
      }

      .property-value {
        margin-left: 4px;
        width: 100%
      }

      input {
        font-size: 14px;
        background-color: var(--app-bg-color);
        color: var(--app-text-color);
        outline: none;
        border: 1px solid var(--divider-color);
        width: 100%;
      }
    `];
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
    <ul class="property">${ Object.keys(this.data).map(key => html`
      <li class="property-list">
        <div class="property-name">${ key }:</div>
        <div class="property-value">${ this._getValue(key, this.data[key]) }</div>
      </li>`) }
    </ul>`;
  };

  _getValue(key, val) {
    const value = this._parseValue(val);

    if (typeof value === 'string') {
      return html`<input @change=${ (event) => this._onChange(event, key) } type="text" value="${ value }">`;
    } else if (_isArray(value)) {
      return html`<input @change=${ (event) => this._onChange(event, key) } type="text" value="${ JSON.stringify(value) }">`;
      // return html`<button>arr +</button>${value.map(item => this._getValue(key, item))}`;
    } else if (_isObject(value) && !_isEmpty(value)) {
      return html`<input @change=${ (event) => this._onChange(event, key) } type="text" value="${ JSON.stringify(value) }">`;
      //return html`${this._treeList(value)}`;
    } else if (_isBoolean(value)) {
      return html`
      <select @change=${ (event) => this._onChange(event, key) }>
        <option value="true" ?selected=${ value.toString() === 'true' }>True</option>
        <option value="false" ?selected=${ value.toString() === 'false' }>False</option>
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
    return html`${ (Object.keys(this.data).length > 0) ? this._treeList() : html`<div>No Properties Found</div>` }`;
  }
}

customElements.define('property-tree', PropertyTree);
export { PropertyTree };
