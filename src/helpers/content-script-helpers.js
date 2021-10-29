export function injectScript(fnOrUrl) {
  const script = document.createElement('script');

  if (typeof fnOrUrl === 'function') {
    // set script content
    const source = `;( ${ fnOrUrl.toString() } )(window)`;
    script.textContent = source;
    document.documentElement.appendChild(script);
  } else {
    // set src attribute, this is async
    script.type = 'text/javascript';
    script.src = fnOrUrl;
    document.documentElement.appendChild(script);
  }

  document.documentElement.appendChild(script);
  script.parentNode.removeChild(script);
}


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

  // https://stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
  const isValidDate = (date) => date instanceof Date && !isNaN(date)

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
            width:${ rect.width }px; height:${ rect.height }px;
            min-width: 9px; min-height: 9px;
            left: ${ rect.left }px; top: ${ rect.top }px; position: fixed;
            background-color: orange; opacity: 0.5; z-index: 999999;
          `
    );
    highlightEl.innerHTML = `<span style="font-size:9px; color: blue;">${ element.nodeName.toLowerCase() }</span>`;
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

  const getLitElementProperties = (element) => {
    // attempt to get constructor of the custom-element
    const tagName = element && element.tagName.toLowerCase();
    let elConstructor = customElements.get(tagName);

    // open-wc scopedElement mixer created an anonymous class by extending the custom element's constructor
    if (elConstructor && !elConstructor.name) {
      elConstructor = Object.getPrototypeOf(elConstructor);
    }

    const properties = elConstructor?.properties;

    return properties && Object.keys(properties).sort().map(prop => ({
      key: prop,
      type: properties[prop]?.type?.name?.toLowerCase() ?? typeof element[prop],
      value: JSON.stringify(element[prop]) || null
    }));
  }

  // try to get properties from an element object
  const getElementProperties = (element) => {
    const properties = ((element.__data) ?
      Object.keys(element.__data) :
      Object.keys(element).filter(prop => prop.includes('__') && prop.substr(2) in element)) || [];

    return properties && properties.sort().map(prop => ({
      key: prop.includes('__') ? prop.substr(2) : prop,
      type: typeof element[prop],
      value: JSON.stringify(element[prop]) || null,
    }));
  }

  const getComponentProperties = (selector) => {
    const element = getElement(selector);

    // get properties
    const props = getLitElementProperties(element) || getElementProperties(element);

    return props.reduce((acc, prop) => {
      let { key, type, value } = prop;

      // set defaults
      if (type === 'boolean' && value === null) {
        value = false;
      }

      acc[key] = {
        type,
        value,
      }

      return acc;
    }, {});
  };

  const getProperties = (tagName) => {
    let elConstructor = customElements.get(tagName);

    // open-wc scopedElement mixer created an anonymous class by extending the custom element's constructor
    if (elConstructor && !elConstructor.name) {
      elConstructor = Object.getPrototypeOf(elConstructor);
    }

    return elConstructor && elConstructor.properties;
  }

  const setComponentProperty = (selector, key, value) => {
    const element = getElement(selector);
    const tagName = element?.tagName.toLowerCase();
    const properties = getProperties(tagName) ?? {};
    const type = properties[key]?.type?.name.toLowerCase();

    if (!element) {
      return;
    }

    const dateValue = new Date(value);

    if (value && isValidDate(dateValue)) {
      element[key] = dateValue;
    } else if (value === 'true') {
      element[key] = true;
    } else if (value === 'false') {
      element[key] = false;
    } else if (properties[key] && (type === 'array' || type === 'object')) {
      try {
        element[key] = JSON.parse(value);
      } catch (err) {
        element[key] = value;
      }
    } else {
      element[key] = value;
    }
  };

  Object.defineProperty(target, '__GRASSHOPPER_DEVTOOLS__', {
    get() {
      return {
        getElement,
        highlightComponent,
        unHighlightComponent,
        getAllComponents,
        getComponentProperties,
        setComponentProperty,
      }
    }
  });
}
