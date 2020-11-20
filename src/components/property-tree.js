import { LitElement, html, css } from 'lit-element';

// https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
function isValidDate(d) {
  return d instanceof Date && !isNaN(d);
}

class PropertyTree extends LitElement {
  static get properties() {
    return {
      data: { type: Array },
    };
  }

  static get styles() {
    return [css`

      ::-webkit-calendar-picker-indicator {
          filter: invert(var(--calendar-picker-indicator));
      }

      .property {
        padding: 0px;
      }

      .property-list {
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        margin-top: 4px;
      }

      .property-name {
        color: var(--component-property-name-color);
        width: 20%;
      }

      .property-value {
        margin-left: 4px;
        width: 75%;
      }

      .property-value input,
      .property-value textarea {
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
        <div class="property-value">${ this._getValue(key, this.data[key].value, this.data[key].type) }</div>
      </li>`) }
    </ul>`;
  };

  _getValue(key, val, type) {
    const value = this._parseValue(val);

    if (type === 'string') {
      return html`<input @change=${ (event) => this._onChange(event, key) } type="text" value="${ value }">`;
    } else if (type === 'array') {
      return html`<input @change=${ (event) => this._onChange(event, key) } type="text" value="${ JSON.stringify(value) }">`;
    } else if (type === 'object') {
      const dateValue = new Date(value);
      // TODO: pass down date object from page content, rather than guess via the value
      // is a date type object
      if ( value && isValidDate(dateValue) ) {
        return html`<input
                        type="date"
                        value="${dateValue.toLocaleDateString('en-CA')}"
                        @change=${ (event) => this._onChangeDate(event, key)}
                    >`;
      }

      return html`<textarea rows="3" @change=${ (event) => this._onChange(event, key)}>${ JSON.stringify(value) }</textarea>`;
    } else if (type === 'boolean') {
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

  _onChangeDate(event, key) {
    this._dispatch(key, new Date(event.target.value));
  }

  _onChange(event, key) {
    this._dispatch(key, event.target.value);
  }

  _dispatch(property, value) {
    this.dispatchEvent(new CustomEvent('change-property', {
      detail: { property, value },
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
