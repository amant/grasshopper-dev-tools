export function injectScript(fn) {
  const source = `;( ${fn.toString()} )(window)`;
  const script = document.createElement('script');

  script.textContent = source;
  document.documentElement.appendChild(script);
  script.parentNode.removeChild(script);
};


export function installHelpers(target) {
  if (target.hasOwnProperty('__GRASSHOPPER_DEVTOOLS__')) return;

  const getElement = (query) => {
    const ancestors = [];

    const findInAncestor = (selectorQuery) => {
      let element = null;

      for (let i = ancestors.length - 1; i >= 0; i--) {
        element = ancestors[i].querySelector(selectorQuery);

        if (element) {
          break;
        }
      }

      return element;
    };

    const selector = query
      .split('>::shadowroot>')
      .flatMap(value => value.split(/>?slot:nth-child\(.\)>/))
      .filter(value => value.trim());

    let element = document.querySelector(selector[0]);

    for (let i = 1, len = selector.length; i < len; i++) {
      if (element) {
        ancestors.push(element);
        element = element.shadowRoot && element.shadowRoot.querySelector(selector[i]) || findInAncestor(selector[i]);
      } else {
        break;
      }
    }

    return element;
  };

  const highlightComponent = (selector) => {
    const el = getElement(selector);
    const element = el.nodeName.toLowerCase() === 'slot' ? el.parentElement : el;

    if (!element) {
      return;
    }

    if (document.querySelector('#grasshopper-devtool-highlight')) {
      document.querySelector('#grasshopper-devtool-highlight').remove();
    }

    const rect = element.getBoundingClientRect();
    const highlightEl = document.createElement('div');
    highlightEl.setAttribute('id', 'grasshopper-devtool-highlight');
    highlightEl.setAttribute('style', `
            width:${rect.width}px; height:${rect.height}px;
            min-width: 9px; min-height: 9px;
            left: ${rect.left}px; top: ${rect.top}px; position: fixed;
            background-color: orange; opacity: 0.5; z-index: 999999;
          `
    );
    highlightEl.innerHTML = `<span style="font-size:9px; color: blue;">${element.nodeName.toLowerCase()}</span>`;
    document.body.appendChild(highlightEl);
  };

  const unHighlightComponent = () => {
    const element = document.querySelector('#grasshopper-devtool-highlight');
    if (element) {
      element.remove();
    }
  };

  const getAllComponents = (rootNode) => {
    const toFilterOut = (node) => {
      return !(node instanceof HTMLElement) ||
        (['template', 'custom-style', 'style', 'script'].includes(node.nodeName.toLowerCase()));
    };

    const getComponentObj = (element) => ({
      inShadow: element.parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE,
      nodeName: element.nodeName,
      idName: element.id,
      classList: Array.from(element.classList),
      name: element.name,
      ownIndex: [...element.parentNode.children].indexOf(element),
      children: []
    });

    const findAllElements = (elements) => {
      const nodeCollection = [];

      for (let element of elements) {
        if (toFilterOut(element)) {
          continue;
        }

        const nodeObj = getComponentObj(element);

        nodeCollection.push(nodeObj);

        if (element.nodeName.toLowerCase() === 'slot') {
          nodeObj.children = findAllElements(element.assignedElements());
        } else if (element.shadowRoot) {
          nodeObj.children = nodeObj.children.concat(findAllElements(element.shadowRoot.children));
        } else if (element.children && element.children.length > 0) {
          nodeObj.children = nodeObj.children.concat(findAllElements(element.children));
        }
      }

      return nodeCollection;
    };

    return findAllElements(rootNode.children);
  };

  const getComponentProperties = (selector) => {
    const element = getElement(selector);

    const props = ((element.__data) ?
      Object.keys(element.__data) :
      Object.keys(element).filter(prop => prop.includes('__') && prop.substr(2) in element)) || [];

    return props.sort().reduce((acc, prop) => {
      const key = prop.includes('__') ? prop.substr(2) : prop;
      acc[key] = JSON.stringify(element[prop]) || null;
      return acc;
    }, {});
  };

  const setComponentProperty = (selector, key, value) => {
    const element = getElement(selector);

    if (!element) {
      return;
    }

    // TODO: implement for polymer elements
    if (value === 'true') {
      element[key] = true;
    } else if (value === 'false') {
      element[key] = false;
    } else {
      element[key] = value;
    }
  };

  Object.defineProperty(target, '__GRASSHOPPER_DEVTOOLS__', {
    get() {
      return {
        highlightComponent,
        unHighlightComponent,
        getAllComponents,
        getComponentProperties,
        setComponentProperty
      }
    }
  });
}
