// chrome.devtools.network.onRequestFinished.addListener(request => {
//     request.getContent(body => {
//         if (request.request && request.request.url) {
//             if (request.request.url.includes('http://www.mocky.io/v2/5da07a9f3000005100f89ee8')) {
//                 console.log('Yo', body);

//                 chrome.runtime.sendMessage({
//                     response: body
//                 })
//             }
//         }
//     })
// })




(function () {
  function getAllElements(rootNode) {
    const toFilterOut = (node) => {
      return !(node instanceof HTMLElement) ||
        (['template', 'custom-style', 'style', 'script'].includes(node.nodeName.toLowerCase()));
    }

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
    }

    return findAllElements(rootNode);
  }

  const collectElements = () => {
    return new Promise((resolve, reject) => {
      // run the component walker on the inspectedWindow context
      chrome.devtools.inspectedWindow.eval(
        `(${getAllElements.toString()}(document.body))`,
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

  collectElements().then(elements => {
    document.querySelector('#component-tree').innerHTML = `<at-tree data=${JSON.stringify(elements)}></at-tree>`;
  });
})();