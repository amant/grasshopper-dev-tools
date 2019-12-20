import { LitElement, html, css } from 'lit-element';
import * as d3 from 'd3';
import * as uuid from 'uuid';
import { ComponentTree } from "./component-tree";

const DURATION = 300;

// Collapse the node and all it's children
function collapse(d) {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}

// Creates a curved (diagonal) path from parent to the child nodes
function diagonal(s, d) {
  return `M ${ s.y } ${ s.x }
            C ${ (s.y + d.y) / 2 } ${ s.x },
              ${ (s.y + d.y) / 2 } ${ d.x },
              ${ d.y } ${ d.x }`;
}

// Add Circle for the nodes
function addCircle(nodeEnter) {
  return nodeEnter
    .append('circle')
    .attr('class', (d) => {
      const list = ['node'];
      if (d.data.inShadow) {
        list.push('shadow');
      }
      return list.join(' ')
    })
    .attr('r', 1e-6)
    .style('fill', d => d._children ? 'lightsteelblue' : '#fff');
}

// Add labels for the nodes
function addText(nodeEnter) {
  return nodeEnter.append('text')
    .attr('dy', '.35em')
    .attr('x', d => d.children || d._children ? -13 : 13)
    .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
    .text(d => `<${d.data.nodeName}>`);
}

function renderChart({ treeData, parentElement, width, height, margin }) {
  // declares a tree layout and assigns the size
  const treemap = d3.tree().size([height, width]);

  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  const svg = d3.select(parentElement)
    .append('svg')
    .attr('width', '100%')
    .attr('height', height + margin.top + margin.bottom)
    .attr('class', 'svg-wrapper')
    .call(d3
      .zoom()
      .on('zoom', () => {
        // if (d3.event.transform.x < 10 && d3.event.transform.y < 10) {
        //   return;
        // }

        svg.attr('transform', d3.event.transform)
      }))
    .on("dblclick.zoom", null)
    .append('g')
    .attr('transform', `translate(${ margin.left },${ margin.top })`);

  // Assigns parent, children, height, depth
  const root = d3.hierarchy(treeData, function (d) {
    return d.children;
  });
  root.x0 = height / 2;
  root.y0 = 0;

  // Collapse after the second level
  root.children.forEach(collapse);

  update(root);

  function update(source) {
    // Assigns the x and y position for the nodes
    const treeMapData = treemap(root);

    // Compute the new tree layout.
    const nodes = updateNodes(treeMapData, source);
    updateLinks(treeMapData, source);

    // Store the old positions for transition.
    nodes.forEach(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  function updateNodes(treeMapData, source) {
    const nodes = treeMapData.descendants();

    // Normalize for fixed-depth.
    nodes.forEach(d => {
      d.y = d.depth * 180
    });

    // Update the nodes...
    const node = svg
      .selectAll('g.node')
      .data(nodes, d => d.id || (d.id = uuid()));

    // Enter any new modes at the parent's previous position.
    const nodeEnter = node
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', () => source ? `translate(${ source.y0 },${ source.x0 })`: null)
      .on('click', clickHandler);

    addCircle(nodeEnter);
    addText(nodeEnter);

    // UPDATE
    const nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate
      .transition()
      .duration(DURATION)
      .attr('transform', d => `translate(${ d.y },${ d.x })`);

    // Update the node attributes and style
    nodeUpdate
      .select('circle.node')
      .attr('r', 10)
      .style('fill', d => d._children ? 'lightsteelblue' : '#fff')
      .attr('cursor', 'pointer')
      .classed('selected', d => d.id === source.id);

    // Remove any exiting nodes
    const nodeExit = node
      .exit()
      .transition()
      .duration(DURATION)
      .attr('transform', () => source ? `translate(${ source.y },${ source.x })` : null)
      .remove();

    // On exit reduce the node circles size to 0
    nodeExit
      .select('circle')
      .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit
      .select('text')
      .style('fill-opacity', 1e-6);

    return nodes;
  }

  function updateLinks(treeMapData, source) {
    const links = treeMapData.descendants().slice(1);

    // Update the links...
    const link = svg
      .selectAll('path.link')
      .data(links, d => d.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link
      .enter()
      .insert('path', 'g')
      .attr('class', 'link')
      .attr('d', () => {
        if (source) {
          var o = { x: source.x0, y: source.y0 };
          return diagonal(o, o)
        }
      });

    // UPDATE
    const linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate
      .transition()
      .duration(DURATION)
      .attr('d', d => diagonal(d, d.parent));

    // Remove any exiting links
    link
      .exit()
      .transition()
      .duration(DURATION)
      .attr('d', () => {
        if (source) {
          const o = { x: source.x, y: source.y };
          return diagonal(o, o);
        }
      })
      .remove();

    return links;
  }

  // Toggle children on click.
  function clickHandler(d) {
    d3.event.preventDefault();

    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(d);
  }
}

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
