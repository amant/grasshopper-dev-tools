const sendMessageToContentScript = (messageObj, responseCallback) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        chrome.tabs.sendMessage(tabs[0].id, messageObj, responseCallback);
    });
};

const sendMessage = (messageObj) => new Promise(resolve => {
    sendMessageToContentScript(messageObj, response => {
        console.log('response of data', response);
        resolve(response.data);
    });
});

export const db = {
    put: data => sendMessage({ db1: 'put', data }),
    getAll: () => sendMessage({ db1: 'getAll' }),
    delete: key => sendMessage({ db1: 'delete', key }),
    clear: () => sendMessage({ db1: 'clear' }),
};



