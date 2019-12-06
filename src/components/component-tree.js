import { LitElement, html, css } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map';
import { get as _get } from 'lodash';

class ComponentTree extends LitElement {
  static get styles() {
    return css`
      :host {
        color: #666;
      }
      
      .action {
        display: flex;
        justify-content: flex-end;        
      }
      
      .action .item {
        margin: 0 4px;
      }
      
      ul, #tree {
          list-style-type: none;
      }

      #tree {
          margin: 0;
          padding: 0;
      }

      
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
          cursor: pointer;
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
        padding: 0 2px;
      }
      
      .small-button:hover {
        background-color: black;
      }
      
      .custom-element {
        color: #000;
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

  _collapseAll() {
    Array
      .from(this.shadowRoot.querySelectorAll('.caret'))
      .map(el => el.classList.remove('caret-down'));

    Array
      .from(this.shadowRoot.querySelectorAll('.nested'))
      .map(el => el.classList.remove('active'));
  }

  _handlerClick(event, el) {
    // clear previous selection
    const prevSelectedEl = this.shadowRoot.querySelector('.selected-element');
    prevSelectedEl && prevSelectedEl.classList.remove('selected-element');

    // add new selection
    event.target.classList.add('selected-element');

    // emit event to parent 'show-properties'
    this.dispatchEvent(new CustomEvent('show-properties', {
      detail: { selector: el._selector, nodeName: el.nodeName },
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

  _mouseOver(event, el) {
    event.target.classList.add('hover-element');
    this.dispatchEvent(new CustomEvent('highlight-component', {
      detail: { selector: el._selector },
      bubbles: true,
      composed: true
    }));
  }

  _mouseOut(event, el) {
    event.target.classList.remove('hover-element');
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

    const getName = el => {
      const nodeName = el.nodeName;
      const isCustomEl = isCustomElement(nodeName);
      const cssClassName = {
        shadow: el.inShadow ,
        'custom-element': isCustomEl
      };

      return html`<span 
                    class="${ classMap(cssClassName) }" 
                    @click="${ (event) => this._handlerClick(event, el) }"
                    @mouseover="${ (event) => this._mouseOver(event, el) }"
                    @mouseout="${ (event) => this._mouseOut(event, el) }"
                  ><${ nodeName }></span> 
                ${ (isCustomEl && !this.toShowCompactView) 
                  ? html`<span 
                            class="small-button" 
                            @click=${(e) => this._handlerCustomElementClick(e, nodeName)}
                         >custom</span>` 
                  : ''
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
              <button class="item" @click=${ this._expandAll }>Expand</button>
              <button class="item" @click=${ this._collapseAll }>Collapse</button>
              
              <span class="item">
                <input 
                  type="checkbox"
                  id="toggleCompactView" 
                  @click=${() => this.toShowCompactView = !this.toShowCompactView} 
                  ?check=${this.toShowCompactView}
                >         
                <label for="toggleCompactView">Compact View</label>
              </span>              
            </div>
            
            ${ this._componentStructureTemplate }
        `;
  }
}

customElements.define('component-tree', ComponentTree);
export { ComponentTree };
