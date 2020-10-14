// Collapse the node and all it's children
import * as d3 from "d3";
import * as uuid from "uuid";

const DURATION = 300;

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
    .text(d => {
      if (d.data.nodeName === 'slot' && d.data.name) {
        return `<${ d.data.nodeName } name="${ d.data.name }">`;
      } else if (d.data.idName) {
        return `<${ d.data.nodeName } id="${ d.data.idName }">`;
      }
      return `<${ d.data.nodeName }>`;
    })
    .call(wrap, 120);
}

// Wraps Long Labels, https://bl.ocks.org/mbostock/7555321
function wrap(text, width) {
  text.each(function () {
    let text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1, // ems
      y = text.attr('y'),
      x = text.attr('x'),
      dy = parseFloat(text.attr('dy')),
      tspan = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', `${ dy }em`);
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(' '));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = text.append('tspan').attr('x', 0).attr('y', y).attr('dy', `${ ++lineNumber * lineHeight + dy }em`).text(word);
      }
    }
  });
}

export function renderChart({ treeData, parentElement, width, height, margin }) {
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
        if (d3.event.transform.x <= 1 && d3.event.transform.y <= 1) {
          return;
        }

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
      .attr('transform', () => source ? `translate(${ source.y0 },${ source.x0 })` : null)
      .on('click', clickHandler)
      .on('mouseover', mouseOverHandler)
      .on('mouseout', mouseOutHandler);

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

  function mouseOverHandler(d) {
    this.dispatchEvent(new CustomEvent('highlight-component', {
      detail: { selector: d.data._selector },
      bubbles: true,
      composed: true
    }));
  }

  function mouseOutHandler(d) {
    this.dispatchEvent(new CustomEvent('unhighlight-component', {
      detail: { selector: d.data._selector },
      bubbles: true,
      composed: true
    }));
  }
}
