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



(function() {
    function getAllElements(rootNode) {
        const isWebComponent = (element) => element.tagName.includes('-');
    
        const toFilter = (node) => {
            return !(node instanceof HTMLElement) || 
                (!isWebComponent(node) && node.children.length <= 0) ||
                (['template', 'custom-style', 'style', 'script'].includes(node.nodeName.toLowerCase()));
        }
    
    
        const findAllElements = (node, nodeCollection = []) => {
            for (let element of node.children) {
                const nodeObj = {
                    nodeName: element.nodeName,
                    children: []
                };
    
                // if (toFilter(element)) {
                //     continue;
                // }
    
                
                nodeCollection.push(nodeObj);
    
                if (element.children.length > 0) {
                    nodeObj.children = findAllElements(element);
                }
    
                if (element.shadowRoot) {
                    nodeObj.children = findAllElements(element.shadowRoot);
                }
            }

            return nodeCollection;
        }
    
        return findAllElements(rootNode);
    }
    
    getAllElements(document.body);

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
    }

    const htmlComponentStructure = (elementCollection) => {
        let htmlTemplate = '';

        const walk = (elements) => {
            htmlTemplate += '<ul>';

            elements.map(el => {
                console.log(el);

                htmlTemplate += `<li>${el.nodeName}</li>`

                if (el.children && el.children.length > 0) {
                    walk(el.children);
                }
            });

            htmlTemplate += '</ul>';

            return htmlTemplate;
        }
        
        return walk(elementCollection); 
    }

    collectElements().then(elementCollection => {
        console.log('elementCollection', elementCollection);

        const templateComponentTree = htmlComponentStructure(elementCollection);
    
        document.querySelector('#app').innerHTML = templateComponentTree;
    })
 })();