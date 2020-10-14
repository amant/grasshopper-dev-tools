function walk(children = []) {
  const collection = [];

  const toFilterOut = (node) => {
    return !(node instanceof HTMLElement) ||
      (['template', 'custom-style', 'style', 'script'].includes(node.nodeName.toLowerCase()));
  };

  for (let el of children) {
    const obj = {
      name: el.nodeName,
      children: []
    };

    if (toFilterOut(el)) {
      continue;
    }

    if (el.nodeName.toLowerCase() === 'slot') {
      obj.children = walk(el.assignedElements());

    } else if (el.shadowRoot) {
      obj.children = walk(el.shadowRoot.children);

    } else if (el.children && el.children.length > 0) {
      obj.children = walk(el.children);
    }

    collection.push(obj);
  }

  return collection;
}

function getList(value) {
  let list = '<ul>';

  value.forEach(el => {
    list += `<li>${ el.name }</li>`;

    if (el.children && el.children.length > 0) {
      list += getList(el.children);
    }
  });

  list += '</ul>';

  return list;
}

(function () {
  document.querySelector('#reload').addEventListener('click', () => {
    document.querySelector('#app').innerHTML = 'Loading...';

    chrome.devtools.inspectedWindow.eval(
      `(${ walk.toString() }(document.body.children))`, (result, isException) => {
        if (isException) {
          console.error('Error reading DOM');
        } else {
          document.querySelector('#app').innerHTML = getList(result);
        }
      }
    );
  })
}());
