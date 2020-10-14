import { injectScript } from './helpers/content-script-helpers.js';
import {
  overrideNetworkRequest,
  DB_GROUP_NAME,
  DB_CONFIG,
  saveToLocalStorage,
} from './helpers/content-script-document-start-helpers.js';

// Note : Using localStorage instead of indexdb.
// As localStorage is sync and helps to execute overriding script before any other scripts
const content = localStorage.getItem(DB_GROUP_NAME);
let db1 = content ? JSON.parse(content) : [];

const configContent = localStorage.getItem(DB_CONFIG);
let configDb = configContent ? JSON.parse(configContent) : {};

const putData = (request) => {
  const data = request.data;

  if (!('id' in data)) {
    // add
    data.id = Date.now();
    db1.push(data);
  } else {
    // update
    const index = db1.findIndex(item => item.id === data.id);
    db1[index] = data;
  }

  saveToLocalStorage(db1);
  return { data: db1 };
};

const deleteData = (request) => {
  const index = db1.findIndex(item => item.id === request.key);

  if (index >= 0) {
    db1.splice(index, 1);
    saveToLocalStorage(db1);
  }

  return { data: db1 };
};

const clearData = () => {
  db1 = [];
  saveToLocalStorage(db1);
  return { data: db1 };
};

const putConfigData = (data) => {
  configDb = data;
  saveToLocalStorage(configDb, DB_CONFIG);
  return { data: configDb };
};

// run this in the main page context, as `window` is not accessible from the content-script
function overrideNetworkRequestSetup() {
  window.__GRASSHOPPER_DEVTOOLS_OVERRIDE__.overrideNetworkRequestSetup();
}

// TODO: refactor to simplify
// Note: content script doesn't has direct access to window,
// calling injectScript to insert script to main page.
// Alternative is to use background script to execute in main page and return result back here.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.db1 === 'put') {
    const result = putData(request);
    injectScript(overrideNetworkRequestSetup);
    return sendResponse(result);
  } else if (request.db1 === 'getAll') {
    return sendResponse({ data: db1 });
  } else if (request.db1 === 'delete') {
    injectScript(overrideNetworkRequestSetup);
    return sendResponse(deleteData(request));
  } else if (request.db1 === 'clear') {
    injectScript(overrideNetworkRequestSetup);
    return sendResponse(clearData());
  } else if (request.configDb === 'put') {
    const result = putConfigData(request.data);
    injectScript(overrideNetworkRequestSetup);
    return sendResponse(result);
  } else if (request.configDb === 'getAll') {
    return sendResponse({ data: configDb });
  }

  //  to asynchronously use sendResponse, add return true; to the onMessage event handler.
  return true;
});

(function () {
  // injectScript(chrome.runtime.getURL('/build/test.js'));

  // override the network request and set __GRASSHOPPER_DEVTOOLS_OVERRIDE__.overrideNetworkRequestSetup
  injectScript(overrideNetworkRequest);
}());
