import {
    overrideNetworkRequest,
    DB_GROUP_NAME,
    saveToLocalStorage,
} from './helpers/content-script-document-start-helpers.js';

const content = localStorage.getItem(DB_GROUP_NAME);
let db1 = content ? JSON.parse(content) : [];

const putData = (request) => {
    const data = request.data;

    if (!('id' in data)) {
        // add
        data.id = Date.now()
        db1.push(data);
    } else {
        // update
        const index = db1.findIndex(item => item.id === data.id);
        db1[index] = data;
    }

    saveToLocalStorage(db1);
    return { data: db1 };
}

const deleteData = (request) => {
    const index = db1.findIndex(item => item.id === request.key);

    if (index >= 0) {
        db1.splice(index, 1);
        saveToLocalStorage(db1);
    }

    return { data: db1 };
}

const clearData = () => {
    db1 = [];
    saveToLocalStorage(db1);
    return { data: db1 };
}

// TODO: refactor to simplify
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.db1 === 'put') {
        return sendResponse(putData(request));
    }
    else if (request.db1 === 'getAll') {
        return sendResponse({data: db1});
    }
    else if (request.db1 === 'delete') {
        return sendResponse(deleteData(request));
    }
    else if (request.db1 === 'clear') {
        return sendResponse(clearData());
    }

    //  to asynchronously use sendResponse, add return true; to the onMessage event handler.
    return true;
});

(function () {
    const el = document.createElement('script');
    el.textContent = `(${ overrideNetworkRequest.toString() })()`;
    document.documentElement.appendChild(el);
}());
