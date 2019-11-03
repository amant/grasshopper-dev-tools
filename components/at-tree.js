import { LitElement, html, css } from 'https://unpkg.com/lit-element?module';

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
                border: 1px dashed #E0E0E0
            }
        `;
    }

    static get properties() {
        return {
            data: { type: String }
        };
    }

    _isCustomElement(elementName) {
        return elementName.includes('-');
    }

    _getElements(value) {
        try {
            const elementCollection = JSON.parse(value);
            return elementCollection;
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

    _showProperties(selector) {
        this.dispatchEvent(new CustomEvent('show-properties', {
            detail: { selector },
            bubbles: true,
            composed: true
        }));
    }

    get _componentStructureTemplate() {
        const getNameWithToggleExpand = el => html`
            <span class="caret" @click="${this._toggleExpand}"></span>
            ${getName(el)}
        `;

        const getName = el => {
            const nodeName = el.nodeName.toLowerCase();
            return html`<span class="${el.inShadow ? 'shadow' : ''}" @click="${() => this._showProperties(nodeName)}"><${nodeName}></span>`
        };

        const compactOneChildElement = element => {
            const compactNamesTemplate = [];

            const walk = el => {
                const hasChildren = el.children && el.children.length > 0;
                const hasOneChild = el.children && el.children.length === 1;

                if (hasOneChild) {
                    compactNamesTemplate.push(getName(el));
                    compactNamesTemplate.push( html`<span> &#8250; </span>` )
                    return walk(el.children[0]);
                } else if ( !hasChildren ) {
                    compactNamesTemplate.push(getName(el));
                } else {
                    compactNamesTemplate.push(getNameWithToggleExpand(el));
                }

                return el;
            }

            const newElement = walk(element);

            return [compactNamesTemplate, newElement];
        }

        const buildList = elements => elements.map(el => {
            const [compactNamesTemplate, newElement] = compactOneChildElement(el);
            const hasChildren = newElement.children && newElement.children.length > 0;

            return html`<li>
                ${compactNamesTemplate}
                ${ hasChildren ? html`<ul class="nested">${buildList(newElement.children)}</ul>` : ''}
            </li>`;
        });

        const collection = this._getElements(this.data);
        console.log('my collection', collection);

        return html`<ul id="myUL">${buildList(collection)}</ul>`;
    }

    render() {
        return html`${this._componentStructureTemplate}`;
    }
}
customElements.define('at-tree', AtTree)
export { AtTree };