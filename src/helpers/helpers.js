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
          `(${_getAllElements.toString()}(document.body))`,
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
}






export const getProperties = (elementId) => {
    function _getProperties(elementId) {
        const element = document.getQuerySelector(elementId);
        const props = Object.keys(element).filter(el => el.includes('__'));
        return props.reduce((acc, prop) => {
            acc[prop.substr(2)] = element[prop];
            return acc;
        }, {});
    }

    return new Promise((resolve, reject) => {
        chrome.devtools.inspectedWindow.eval(`(${getProperties.toString()}('${elementId}'))`, (result, isException) => {
            if (isException) {
                console.log('Could not get properties', isException);
                return reject();
            }

            resolve(result);
        });
    })
};


// Add a overlay ontop of a component's DOM
export const highlightComponent = (componentId) => {
    const _highlightComponent = function (id) {
        let componentEl = $('[componentid="' + id + '"]')[0];
        if (componentEl) {
            $('#JiveDevtoolComponentHighlight').remove();
            let rect = componentEl.getBoundingClientRect();
            let el = $(`<div id="JiveDevtoolComponentHighlight" style="width:${rect.width}px; height:${rect.height}px; left: ${rect.left}px; top: ${rect.top}px; position: fixed; background-color: orange; opacity: 0.5; z-index: 1000;"><span style="font-size:9px; color: blue;">${id}</span></div>`)[0];
            document.body.appendChild(el);
        }
    };

    chrome.devtools.inspectedWindow.eval(`(${_highlightComponent.toString()}('${componentId}'))`, (result, isException) => {
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
