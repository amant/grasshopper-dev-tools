import { LitElement, html, css } from 'lit-element';
import { classMap } from 'lit-html/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { VERTICAL } from '../constants';

customElements.define('split-pane', class SplitPane extends LitElement {
  static get properties() {
    return {
      view: { type: String },
      dragging: { type: Boolean },
      split: {type: Number },
      leftStyle: { type: Object },
      rightStyle: { type: Object }
    }
  }

  static get styles() {
    return [css`
      .split-pane {
        display: flex;
        height: 100%;
        outline: 1px solid blue;
      }
    
      .vertical {
        flex-direction: row;
      }
  
      .horizontal {
        flex-direction: column;
      }
    
      .left, .right {
        position: relative;
        height: 100%;
      }
    
      .scroll-pane {
        display: flex;
        flex-direction: column;
        height: 100%;        
      }
      
      .divider-outline {
        outline: 1px solid var(--divider-color);
      }
    
      .dragger {
        position: absolute;
        z-index: 99;
      }
      
      .vertical.dragging {
        cursor: ew-resize;
      }

      .horizontal.dragging {
        cursor: ns-resize;
      }
    
      .vertical .dragger {
        top: 0;
        bottom: 0;
        right: -5px;
        width: 10px;
        cursor: ew-resize;
      }
      
      .horizontal .dragger {
        left: 0;
        right: 0;
        bottom: -5px;
        height: 10px;
        cursor: ns-resize;
      }
    `];
  }

  constructor() {
    super();

    this.view = VERTICAL;
    this.dragging = false;

    this.startPosition = null;
    this.startSplit = this.split = 50;
    this.totalHeight = 0;
    this.totalWidth = 0;
  }

  get boundSplit() {
    const split = this.split;

    if (split < 20) {
      return 20;

    } else if (split > 80) {
      return 80;
    }

    return split;
  }

  _onDragStart(event) {
    this.dragging = true;
    this.startPosition = (this.view === VERTICAL) ? event.pageX : event.pageY;
    this.startSplit = this.boundSplit;

    const el = this.shadowRoot.querySelector('#split-pane');
    this.totalHeight = el.offsetHeight;
    this.totalWidth = el.offsetWidth;

    event.preventDefault();
  }

  _onDragMove(event) {
    if (this.dragging) {
      const [position, totalSize] = (this.view === VERTICAL)
        ? [event.pageX, this.totalWidth] : [event.pageY, this.totalHeight];

      this.split = this.startSplit + Math.floor((position - this.startPosition) / totalSize * 100);
    }
  }

  _onDragEnd() {
    this.dragging = false;
  }

  render() {
    const styleKey = this.view === VERTICAL ? 'width' : 'height';
    const leftStyle = { [styleKey]: `${this.boundSplit}%` };
    const rightStyle = { [styleKey]: `${100 - this.boundSplit}%` };
    const splitPaneCssClasses = {
      'split-pane': true,
      [this.view]: true,
      'dragging' : this.dragging
    };

    return html`
             <div id="split-pane"
                class="split-pane ${classMap(splitPaneCssClasses)}"
                @mousemove=${this._onDragMove}
                @mouseup=${this._onDragEnd}
                @mouseleave=${this._onDragEnd}
                ><div id="left-side" class="left top" style="${styleMap(leftStyle)}">
                    <div class="scroll-pane divider-outline">
                        <slot name="left-pane"></slot>
                    </div>
                    <div class="dragger" @mousedown=${this._onDragStart}></div>
                </div>
                <div id="right-side" class="right bottom" style="${styleMap(rightStyle)}">
                    <div class="scroll-pane">
                      <slot name="right-pane"></slot>
                    </div>
                </div>
             </div>
            `;
  }
})
