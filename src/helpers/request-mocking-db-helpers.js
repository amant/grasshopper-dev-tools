// import { openDB } from 'idb';
// export const DB_GROUP_NAME = 'grasshopper-db';
// export const DB_TABLE_NAME = 'mock-requests';

// export const db1 = openDB(DB_GROUP_NAME, 1, {
//     upgrade(db) {
//         db.createObjectStore(DB_TABLE_NAME, {
//             keyPath: 'id',
//             autoIncrement: true,
//         });
//     }
// });

// function run(fn, data) {
//     return new Promise((resolve, reject) => {
//         chrome.devtools.inspectedWindow.eval(
//             `(${fn.toString()}(${JSON.stringify(data)}))`, (result, isException) => {
//                 if (isException) {
//                     console.error('Error reading DOM', isException);
//                     reject(isException);
//                 } else {
//                     console.info('result', result);
//                     resolve(result);
//                 }
//             }
//         );
//     });
// }

// function addDB(data) {
//     return window.__GRASSHOPPER_DB__.db1.then(db => add('mock-requests', data));
// }

// function putDB(data) {
//     return window.__GRASSHOPPER_DB__.db1.then(db => {
//         console.log('db put', data);
//         return db.put('mock-requests', data);
//     });
// }

// function getAllDB() {
//     return window.__GRASSHOPPER_DB__.db1.then(db => db.getAll('mock-requests'));
// }

// function deleteDB(data) {
//     return window.__GRASSHOPPER_DB__.db1.then(db => db.delete('mock-requests', data));
// }

// function clearDB() {
//     return window.__GRASSHOPPER_DB__.db1.then(db => db.clear('mock-requests'));
// }

// export const db = {
//     add: async (data) => (await db1).add(DB_TABLE_NAME, data),
//     put: async (data) => (await db1).put(DB_TABLE_NAME, data),
//     getAll: async () => (await db1).getAll(DB_TABLE_NAME),
//     delete: async (key) => (await db1).delete(DB_TABLE_NAME, key),
//     clear: async () => (await db1).clear(DB_TABLE_NAME),
// };

// let store = {};

// chrome.runtime.onMessage.addListener(
// function(request, sender, sendResponse) {
//     console.log(sender.tab ?
//                 "from a content script:" + sender.tab.url :
//                 "from the extension");
//     if (request.greeting == "hello")
//     sendResponse({farewell: "goodbye"});
// });

export const db = {
    put: (data) => {
        return new Promise(resolve => {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {db1: 'put', data}, function(response) {
                    console.log('response of data', response);
                    resolve(response.data);
                });
              });
        });
    },
    getAll: () => {
        return new Promise(resolve => {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {db1: 'getAll'}, function(response) {
                    console.log('response of getALL', response);
                    resolve(response.data);
                });
              });
        });
    },
    delete: (key) => {
        return new Promise(resolve => {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {db1: 'delete', key}, function(response) {
                    console.log('response of delete', response);
                    resolve(response.data);
                });
              });
        })
    },
    clear: () => {
        return new Promise(resolve => {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {db1: 'clear'}, function(response) {
                    console.log('response of clear', response);
                    resolve(response.data);
                });
              });
        })
    },
};



