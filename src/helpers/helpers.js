export const getAllDocumentElement = () => {
  function _getAllElements(rootNode) {
    const toFilterOut = (node) => {
      return !(node instanceof HTMLElement) ||
        (['template', 'custom-style', 'style', 'script'].includes(node.nodeName.toLowerCase()));
    };

    const findAllElements = (node) => {
      const nodeCollection = [];

      for (let element of node.children) {
        const nodeObj = {
          inShadow: element.parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE,
          nodeName: element.nodeName,
          id: element.id,
          classList: Array.from(element.classList),
          children: []
        };

        if (toFilterOut(element)) {
          continue;
        }

        nodeCollection.push(nodeObj);

        if (element.shadowRoot) {
          nodeObj.children = nodeObj.children.concat(findAllElements(element.shadowRoot));
        }

        if (element.children && element.children.length > 0) {
          nodeObj.children = nodeObj.children.concat(...findAllElements(element));
        }

      }

      return nodeCollection;
    };

    return findAllElements(rootNode);
  }

  return new Promise((resolve, reject) => {
    // run the component walker on the inspectedWindow context
    chrome.devtools.inspectedWindow.eval(
      `(${ _getAllElements.toString() }(document.body))`,
      (result, isException) => {
        if (isException) {
          console.error('Error can not read component structure.');
          reject(isException);
        } else {
          resolve(result);
        }
      }
    );
  });
};

export const getProperties = (querySelector) => {
  function _getProperties(selector) {
    const getElement = selectorQuery => {
      const sel = selectorQuery.split('>::shadowroot>');
      let result = document.querySelector(sel[0]);
      for (let i = 1, len = sel.length; i < len; i++) {
        if (result) {
          result = result.shadowRoot.querySelector(sel[i]);
        } else {
          break;
        }
      }
      return result;
    };

    const element = getElement(selector);

    const props = ((element.__data) ?
      Object.keys(element.__data) :
      Object.keys(element).filter(el => el.includes('__') && el.substr(2) in element)) || [];

    return props.reduce((acc, prop) => {
      acc[prop.substr(2)] = JSON.stringify(element[prop]) || null;
      return acc;
    }, {});
  }

  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(`(${ _getProperties.toString() }('${ querySelector }'))`, (result, isException) => {
      if (isException) {
        console.log('Could not get properties', isException);
        return reject();
      }
      resolve(result);
    });
  });
};

export const setProperty = ({querySelector, property, value}) => {
  function _setProperty(selector, key, val) {

    const getElement = selectorQuery => {
      const sel = selectorQuery.split('>::shadowroot>');
      let result = document.querySelector(sel[0]);
      for (let i = 1, len = sel.length; i < len; i++) {
        if (result) {
          result = result.shadowRoot.querySelector(sel[i]);
        } else {
          break;
        }
      }
      return result;
    };

    const element = getElement(selector);

    if (!element) {
      return;
    }

    if (val.trim()[0] === '{' || val === 'true' || val === 'false') {
      try{
        const parsedVal = JSON.parse(val);
        element[key] = parsedVal;
      } catch(e) {
        element[key] = val;
      }
    } else {
      element[key] = val;
    }

    // TODO: implement for polymer elements
    /*if (element.__data) {
      element[key] = val;
    } else {
      element[`__${key}`] = val;
    }*/
  }

  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(`(${ _setProperty.toString() }('${ querySelector }', '${ property }', '${ value }'))`, (result, isException) => {
      if (isException) {
        console.log('Could not get properties', isException);
        return reject();
      }
      resolve(result);
    });
  });
};

export const showSource = (nodeName) => {
  function _showSource(customElementName) {
    inspect(customElements.get(customElementName));
  }

  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(`(${ _showSource.toString() }('${ nodeName }'))`, (result, isException) => {
      if (isException) {
        console.log('Could not show source', isException);
        return reject();
      }
      resolve(result);
    });
  });
};

// Add a overlay ontop of a component's DOM
export const highlightComponent = (componentId) => {
  const _highlightComponent = function (id) {
    let componentEl = $('[componentid="' + id + '"]')[0];
    if (componentEl) {
      $('#JiveDevtoolComponentHighlight').remove();
      let rect = componentEl.getBoundingClientRect();
      let el = $(`<div id="JiveDevtoolComponentHighlight" style="width:${ rect.width }px; height:${ rect.height }px; left: ${ rect.left }px; top: ${ rect.top }px; position: fixed; background-color: orange; opacity: 0.5; z-index: 1000;"><span style="font-size:9px; color: blue;">${ id }</span></div>`)[0];
      document.body.appendChild(el);
    }
  };

  chrome.devtools.inspectedWindow.eval(`(${ _highlightComponent.toString() }('${ componentId }'))`, (result, isException) => {
    if (isException) {
      console.log('Could not highlight component layer', isException);
    }
  });
};

// Remove overlay from the component's DOM
export const unhighlightComponent = () => {
  chrome.devtools.inspectedWindow.eval(`$('#JiveDevtoolComponentHighlight').remove();`, (result, isException) => {
    if (isException) {
      console.log('Could not remove highlight component layer', isException);
    }
  });
};
