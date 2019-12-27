import { LitElement, html, css } from 'lit-element';
import { renderChart } from '../helpers/component-tree-chart-helpers';

class ComponentTreeChart extends LitElement {
  static get styles() {
    return [css`
        .svg-wrapper {
          border: 1px solid var(--divider-color);
        }
        .node circle {
          fill: #fff;
          stroke: steelblue;
          stroke-width: 2px;
        }

        .node circle.shadow {
          stroke-dasharray: 4;
        }
        
        .node circle.selected {
          stroke-width: 4px;
        }

        .node text {
          font: 16px sans-serif;
          fill: var(--dom-tag-name-color);
        }

        .link {
          fill: none;
          stroke: var(--item-tree-caret-color);
          stroke-width: 1px;
        }
      `];
  }

  static get properties() {
    return {
      data: { type: String },
    };
  }

  constructor() {
    super();

    // Set the dimensions and margins of the chart
    const margin = { top: 20, right: 90, bottom: 30, left: 90 };

    this.width = 800 - margin.left - margin.right;
    this.height = 800 - margin.top - margin.bottom;
    this.margin = margin;
  }

  firstUpdated() {
    // TODO: get ride of need to add body node to display tree hierarchy
    renderChart({
      treeData: { nodeName: 'body', children: this.data },
      margin: this.margin,
      width: this.width,
      height: this.height,
      parentElement: this.shadowRoot.querySelector('#chart')
    });
  }

  render() {
    return html`<div id="chart"></div>`
  }
}

customElements.define('component-tree-chart', ComponentTreeChart);

export { ComponentTreeChart };
