import { LitElement, html, css } from 'lit-element';
import { get as _get } from 'lodash';

// TODO: rename to component-tree
class ComponentTree extends LitElement {
  static get styles() {
    return css`
            /* Remove default bullets */
            ul, #myUL {
                list-style-type: none;
            }

            /* Remove margins and padding from the parent ul */
            #myUL {
                margin: 0;
                padding: 0;
            }

            /* Style the caret/arrow */
            .caret {
                cursor: pointer;
                user-select: none; /* Prevent text selection */
            }

            /* Create the caret/arrow with a unicode, and style it */
            .caret::before {
                content: "\\25B6";
                color: black;
                display: inline-block;
                margin-right: 6px;
            }

            /* Rotate the caret/arrow icon when clicked on (using JavaScript) */
            .caret-down::before {
                transform: rotate(90deg);
            }

            /* Hide the nested list */
            .nested {
                display: none;
            }

            /* Show the nested list when the user clicks on the caret/arrow (with JavaScript) */
            .active {
                display: block;
            }

            .shadow {
                border: 1px dashed #E0E0E0;
            }
            
            .hover-element {
                background-color: #C9ECFF;
            }
             
            .selected-element {
                background-color: #00A5FF;
            }
            
            .small-button {
              border: 1px solid black;
              background-color: grey;
              color: white;
              font-size: 9px;
              border-radius: 2px;
              cursor: pointer;
            }
        `;
  }

  static get properties() {
    return {
      data: { type: String },
      toShowCompactView: { type: Boolean }
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

  _collapseAll(event) {
    Array
      .from(this.shadowRoot.querySelectorAll('.caret'))
      .map(el => el.classList.remove('caret-down'));

    Array
      .from(this.shadowRoot.querySelectorAll('.nested'))
      .map(el => el.classList.remove('active'));
  }

  _handlerClick(event) {
    // clear previous selection
    const prevSelectedEl = this.shadowRoot.querySelector('.selected-element');
    prevSelectedEl && prevSelectedEl.classList.remove('selected-element');

    // add new selection
    event.target.classList.add('selected-element');

    const parentElement = event.target.closest('li');
    const selector = _get(parentElement, ['dataset', 'selector'], null);

    // emit event to parent 'show-properties'
    this.dispatchEvent(new CustomEvent('show-properties', {
      detail: { selector },
      bubbles: true,
      composed: true
    }));
  }

  _handlerCustomElementClick(event, nodeName) {
    // emit event to parent 'show-properties'
    this.dispatchEvent(new CustomEvent('show-source', {
      detail: { nodeName },
      bubbles: true,
      composed: true
    }));
  }

  _mouseOver(event) {
    event.target.classList.add('hover-element');
  }

  _mouseOut(event) {
    event.target.classList.remove('hover-element');
  }

  get _componentStructureTemplate() {
    const getNameWithToggleExpand = el => html`
            <span class="caret" @click="${ this._toggleExpand }"></span>
            ${ getName(el) }
        `;

    const isCustomElement = nodeName => nodeName.includes('-');

    const getName = el => {
      const nodeName = el.nodeName.toLowerCase();
      return html`<span 
                class="${ el.inShadow ? 'shadow' : '' }" 
                @click="${ this._handlerClick }"
                @mouseover="${ this._mouseOver }"
                @mouseout="${ this._mouseOut }"
                ><${ nodeName }></span> 
                ${isCustomElement(nodeName) && !this.toShowCompactView? 
                  html`<span class="small-button" @click=${(e) => this._handlerCustomElementClick(e, nodeName)}>custom</span>` : ''
                }
                `
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

    const getQuerySelector = (element, selector = 'body') => {
      const nodeName = element.nodeName.toLowerCase();
      return `${ selector }>${ (element.inShadow ? `::shadowroot>${ nodeName }` : nodeName) }`;
    };

    const buildList = (elements, selector) => elements.map(el => {
      const [nameTemplate, newElement] = this.toShowCompactView
        ? compactOneChildElement(el) : getNodeNameAndElement(el);

      const hasChildren = _get(newElement, ['children', 'length']) > 0;

      const currentSelector = getQuerySelector(newElement, selector);

      return html`<li data-selector="${ currentSelector }">
                ${ nameTemplate }                
                ${ hasChildren ? html`<ul class="nested">${ buildList(newElement.children, currentSelector) }</ul>` : '' }
            </li>`;
    });

    return html`<ul id="myUL">${ buildList(this._getElements(this.data)) }</ul>`;
  }

  render() {
    return html`
            <div>
              <button @click=${ this._expandAll }>Expand</button>
              <button @click=${ this._collapseAll }>Collapse</button>
              
              <span>
                <input 
                  type="checkbox" 
                  @click=${() => this.toShowCompactView = !this.toShowCompactView} 
                  ?check=${this.toShowCompactView}
                >         
                <label>Compact View</label>
              </span>              
            </div>
            ${ this._componentStructureTemplate }
        `;
  }
}

customElements.define('component-tree', ComponentTree);
export { ComponentTree };
