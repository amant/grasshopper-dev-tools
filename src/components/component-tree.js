import { LitElement, html, css } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';
import { get as _get } from 'lodash';
import { fontAwesomeStyle, fontAwesomeSolidStyle } from '../helpers/fontawesome-helpers.js';

class ComponentTree extends LitElement {
  static get styles() {
    return [
      fontAwesomeStyle,
      fontAwesomeSolidStyle,
      css`
      .action {
        display: flex;
        justify-content: flex-end;
      }

      .action .item {
        margin: 0 4px;
        height: 18px;
      }

      .divider {
        color: var(--divider-color);
      }

      ul, #tree {
        list-style-type: none;
      }

      #tree {
        margin: 0;
        padding: 0;
      }

      #tree li {
        line-height: 18px;
      }

      .caret {
        cursor: pointer;
        user-select: none; /* Prevent text selection */
        font-size: 9px;
        position: relative;
        top: -2px;
      }

      .caret::before {
        content: "\\25B6";
        color: var(--item-tree-caret-color);
        display: inline-block;
      }

      .caret-down::before {
        transform: rotate(90deg);
      }

      .nested {
        display: none;
      }

      .active {
        display: block;
      }

      .shadow {
        border: 1px dotted var(--item-is-shadow-element-color);
      }

      .selected-element {
        background-color: var(--item-selection-inactive-bg-color);
      }

      .small-button {
        border: 1px solid black;
        background-color: grey;
        color: white;
        font-size: 9px;
        border-radius: 2px;
        cursor: pointer;
        padding: 0 2px;
      }

      .small-button:hover {
        background-color: black;
      }

      .dom-tag-name:hover {
        background-color: var(--item-selection-bg-color);
        cursor: pointer;
      }

      .dom-attribute-name {
        color: var(--dom-attribute-name-color);
      }

      .dom-attribute-value {
        color: var(--dom-attribute-value-color);
      }

      .dom-tag-name {
        color: var(--dom-tag-name-color);
        font-size: 12px;
      }

      .inspect-element {
        width: 18px;
        height: 18px;
        font-size: 12px;
        color: var(--app-text-color);
        cursor: pointer;
      }
  `];
  }

  static get properties() {
    return {
      data: { type: String },
      toShowCompactView: { type: Boolean },
      _activeItem: { type: String },
    };
  }

  constructor() {
    super();
    this.toShowCompactView = false;
  }

  _getElements(value) {
    try {
      return JSON.parse(value);
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  _toggleExpand(event) {
    const el = event.target;
    el.parentElement.querySelector('.nested').classList.toggle('active');
    el.classList.toggle('caret-down');
  }

  _expandAll() {
    Array
      .from(this.shadowRoot.querySelectorAll('.caret:not(.caret-down)'))
      .map(el => el.classList.add('caret-down'));

    Array
      .from(this.shadowRoot.querySelectorAll('.nested:not(.active)'))
      .map(el => el.classList.add('active'));
  }

  _collapseAll() {
    Array
      .from(this.shadowRoot.querySelectorAll('.caret'))
      .map(el => el.classList.remove('caret-down'));

    Array
      .from(this.shadowRoot.querySelectorAll('.nested'))
      .map(el => el.classList.remove('active'));
  }

  _refresh() {
    this.dispatchEvent(new CustomEvent('refresh', {
      bubbles: true,
      composed: true
    }));
  }

  _handleClick(event, el) {
    if (event.target.classList.contains('dom-tag-name')) {
      // clear previous selection
      const prevSelectedEl = this.shadowRoot.querySelector('.selected-element');
      prevSelectedEl && prevSelectedEl.classList.remove('selected-element');

      // add new selection
      event.target.classList.add('selected-element');
    }

    // emit event to parent 'show-properties'
    this.dispatchEvent(new CustomEvent('show-properties', {
      detail: { selector: el._selector, nodeName: el.nodeName },
      bubbles: true,
      composed: true
    }));

    this._activeItem = el._selector;
  }

  _handleCustomElementClick(event, nodeName) {
    this.dispatchEvent(new CustomEvent('show-source', {
      detail: { nodeName },
      bubbles: true,
      composed: true
    }));
  }

  _handleInspectElementClick(event, el) {
    this.dispatchEvent(new CustomEvent('show-element', {
      detail: { selector: el._selector },
      bubbles: true,
      composed: true
    }));
  }

  _mouseOver(event, el) {
    this.dispatchEvent(new CustomEvent('highlight-component', {
      detail: { selector: el._selector },
      bubbles: true,
      composed: true
    }));
  }

  _mouseOut(event, el) {
    this.dispatchEvent(new CustomEvent('unhighlight-component', {
      detail: { selector: el._selector },
      bubbles: true,
      composed: true
    }));
  }

  get _componentStructureTemplate() {
    const getNameWithToggleExpand = el => html`
            <span class="caret" @click="${ this._toggleExpand }"></span>
            ${ getName(el) }
        `;

    const isCustomElement = nodeName => nodeName.includes('-');

    const attributeTemplate = (key, value) => html` <span class="dom-attribute-name">${ key }="</span><span class="dom-attribute-value">${ value }</span>"`;
    const getName = el => {
      const nodeName = el.nodeName;
      const isCustomEl = isCustomElement(nodeName);
      const cssClassName = {
        shadow: el.inShadow,
        'custom-element': isCustomEl
      };
      const idAttribute = isCustomEl && el.idName ? attributeTemplate('id', el.idName) : '';
      const nameAttribute = el.name && nodeName === 'slot' ? attributeTemplate('name', el.name) : '';
      const attributes = !this.toShowCompactView ? html`${ idAttribute }${ nameAttribute }` : '';
      const uniqueElId = el._selector;

      return html`<span
                    class="dom-tag-name ${ classMap(cssClassName) }"
                    title="${ el.inShadow ? 'inside shadowroot' : '' }"
                    @click="${ (event) => this._handleClick(event, el) }"
                    @mouseover="${ (event) => this._mouseOver(event, el) }"
                    @mouseout="${ (event) => this._mouseOut(event, el) }"
                  ><${ nodeName }${ attributes }></span>

                ${(isCustomEl && !this.toShowCompactView)
                  ? html`<span
                            class="small-button"
                            @click=${(e) => this._handleCustomElementClick(e, nodeName)}
                          >custom</span>`
                  : ''
                }

                ${ (uniqueElId === this._activeItem) ? html`
                  <span title="Inspect element" class="fas fa-crosshairs inspect-element" @click=${ e => this._handleInspectElementClick(e, el) }></span>
                ` : ''
                }
              `;
    };

    const compactOneChildElement = element => {
      const compactElementWithOneChild = el => {
        const hasOneChild = el.children && el.children.length === 1;
        const nameTemplate = [];
        if (hasOneChild) {
          nameTemplate.push(getName(el));
          nameTemplate.push(html`<span> &#8250; </span>`);
          return [nameTemplate, el.children[0]]
        }
      };

      return getNodeNameAndElement(element, compactElementWithOneChild);
    };

    const getNodeNameAndElement = (element, fn = null) => {
      const nameTemplate = [];

      const walk = el => {
        const hasChildren = el.children && el.children.length > 0;
        const [names, node] = (fn && fn(el)) || [[], null];

        if (names && names.length > 0) {
          nameTemplate.push(...names);
          return walk(node);
        } else if (!hasChildren) {
          nameTemplate.push(getName(el));
        } else {
          nameTemplate.push(getNameWithToggleExpand(el));
        }

        return el;
      };

      const newElement = walk(element);

      return [nameTemplate, newElement];
    };

    const buildList = (elements) => elements.map(el => {
      const [nameTemplate, newElement] = this.toShowCompactView
        ? compactOneChildElement(el) : getNodeNameAndElement(el);

      const hasChildren = _get(newElement, ['children', 'length']) > 0;

      return html`<li>
                ${ nameTemplate }
                ${ hasChildren ? html`<ul class="nested">${ buildList(newElement.children) }</ul>` : '' }
            </li>`;
    });

    return html`<ul id="tree">${ buildList(this._getElements(this.data)) }</ul>`;
  }

  render() {
    return html`
            <div class="action">
              <span class="item">
                <input
                  type="checkbox"
                  id="toggleCompactView"
                  @click=${ () => this.toShowCompactView = !this.toShowCompactView }
                  ?check=${ this.toShowCompactView }
                >
                <label for="toggleCompactView">Compact View</label>
              </span>
              <span class="divider">|<span>
              <button class="item" title="Expand elements list" @click=${ this._expandAll }><i class="fas fa-expand"></i></button>
              <button class="item" title="Collapse elements list" @click=${ this._collapseAll }><i class="fas fa-compress-arrows-alt"></i></button>
              <button class="item" title="Refresh elements list" @click=${ () => this._refresh() }><i class="fas fa-redo"></i></button>
            </div>

            ${ this._componentStructureTemplate }
        `;
  }
}

customElements.define('component-tree', ComponentTree);
export { ComponentTree };
