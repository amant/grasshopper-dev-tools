import { LitElement, html, css } from 'lit-element';

class AtTree extends LitElement {
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
        `;
    }

    static get properties() {
        return {
            data: { type: String },
            toCompactOneChildElement: { type: Boolean }
        };
    }

    constructor() {
        super();
        this.toCompactOneChildElement = false;
    }

    _getElements(value) {
        try {
            return JSON.parse(value);
        } catch(err) {
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

    _handlerClick(event, selector) {
        // clear previous selection
        const prevSelectedEl = this.shadowRoot.querySelector('.selected-element');
        prevSelectedEl && prevSelectedEl.classList.remove('selected-element');

        // add new selection
        event.target.classList.add('selected-element');

        this.dispatchEvent(new CustomEvent('show-properties', {
            detail: { selector },
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
            <span class="caret" @click="${this._toggleExpand}"></span>
            ${getName(el)}
        `;

        const getName = el => {
            const nodeName = el.nodeName.toLowerCase();
            return html`<span 
                class="${el.inShadow ? 'shadow' : ''}" 
                @click="${(event) => this._handlerClick(event, nodeName)}"
                @mouseover="${this._mouseOver}"
                @mouseout="${this._mouseOut}"
                ><${nodeName}></span>`
        };

        const compactOneChildElement = element => {
            const compactElementWithOneChild = el => {
                const hasOneChild = el.children && el.children.length === 1;
                const nameTemplate = [];
                if (hasOneChild) {
                    nameTemplate.push(getName(el));
                    nameTemplate.push( html`<span> &#8250; </span>` );
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
                } else if ( !hasChildren ) {
                    nameTemplate.push(getName(el));
                } else {
                    nameTemplate.push(getNameWithToggleExpand(el));
                }

                return el;
            };

            const newElement = walk(element);

            return [nameTemplate, newElement];
        };

        const buildList = (elements, parentNodeName = 'root') => elements.map(el => {
            const [nameTemplate, newElement] = this.toCompactOneChildElement
                ? compactOneChildElement(el) : getNodeNameAndElement(el);
            const hasChildren = newElement.children && newElement.children.length > 0;
            const newParentNodeName = `${parentNodeName}>${(elements.inShadow ? `::shadow::${el.nodeName}` : el.nodeName)}`;
            return html`<li data-selector="${parentNodeName}">
                ${nameTemplate}
                <span>${parentNodeName}</span>
                ${ hasChildren ? html`<ul class="nested">${buildList(newElement.children, newParentNodeName)}</ul>` : ''}
            </li>`;
        });

        return html`<ul id="myUL">${buildList(this._getElements(this.data))}</ul>`;
    }

    render() {
        return html`
            <div>
              <button @click=${this._expandAll}>Expand</button>
              <button @click=${this._collapseAll}>Collapse</button>
            </div>
            ${this._componentStructureTemplate}
        `;
    }
}
customElements.define('at-tree', AtTree);
export { AtTree };
