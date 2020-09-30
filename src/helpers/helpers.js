// refresh current main page
export const refreshCurrentPage = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.reload(tabs[0].id);
  });
}

export const evaluate = (expression) => new Promise((resolve, reject) => {
  chrome.devtools.inspectedWindow.eval(expression, (result, exceptionInfo) => {
      if (exceptionInfo) {
        console.error(`Error ${exceptionInfo}`);
        reject(exceptionInfo);
      } else {
        resolve(result);
      }
    }
  );
});

/**
 * Returns application's DOM structure
 *
 * @returns {Promise<unknown>}
 */
export const getAllComponents = () => evaluate(`__GRASSHOPPER_DEVTOOLS__.getAllComponents(document.body)`);

export const getComponentProperties = (querySelector) =>
  evaluate(`__GRASSHOPPER_DEVTOOLS__.getComponentProperties('${querySelector}')`);

export const setProperty = ({ querySelector, property, value }) =>
  evaluate(`__GRASSHOPPER_DEVTOOLS__.setComponentProperty('${querySelector}', '${property}', '${value}')`);

export const showSource = (nodeName) => {
  function _showSource(customElementName) {
    inspect(customElements.get(customElementName));
  }

  return evaluate(`(${_showSource.toString()}('${nodeName}'))`);
};

export const showElement = (querySelector) => {
  function _showElement(query) {
    inspect(document.querySelector(query));
  }

  return evaluate(`(${_showElement.toString()}('${querySelector}'))`);
};

// Add a overlay ontop of a component's DOM
export const highlightComponent = (querySelector) =>
  evaluate(`__GRASSHOPPER_DEVTOOLS__.highlightComponent('${querySelector}')`);

// Remove overlay from the component's DOM
export const unHighlightComponent = () =>
  evaluate(`__GRASSHOPPER_DEVTOOLS__.unHighlightComponent()`);