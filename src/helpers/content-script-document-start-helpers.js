export function overrideNetworkRequest() {
  const DB_CONFIG = 'grasshopper-config-db';
  const DB_GROUP_NAME = 'grasshopper-db';
  const open = XMLHttpRequest.prototype.open;

  const resolveUrl = (url) => {
    var anchorElement = document.createElement('a');
    anchorElement.href = url;
    return anchorElement.href;
  }

  const getDb = () => {
    const content = localStorage.getItem(DB_GROUP_NAME);
    let parseContent;
    let data;

    try {
      parseContent = JSON.parse(content);
    } catch (err) {
      parseContent = [];
      console.error(`error reading ${DB_GROUP_NAME}`, err);
    }

    return parseContent;
  }

  const getConfigDb = () => {
    const configContent = localStorage.getItem(DB_CONFIG);
    let configDb;

    try {
      configDb = configContent ? JSON.parse(configContent) : {};
    } catch(err) {
      configDb = {};
      console.error(`error reading ${DB_CONFIG}`, err);
    }

    return configDb;
  }

  const overrideNetworkRequestSetup = () => {
    const db1 = getDb();
    const configDb = getConfigDb();

    // mock only when `Enable mocking` is checked
    if (!configDb.mockEnable) {
      XMLHttpRequest.prototype.open = open;
      return;
    }

    // override Ajax open to set mocked reponses
    XMLHttpRequest.prototype.open = function (__, url) {
      const callback = this.onreadystatechange;
      const that = this;
      const resolvedUrl = resolveUrl(url);
      const foundItem = db1.find(item => item.requestEnable && resolvedUrl.indexOf(item.requestUrl) >= 0);

      this.onreadystatechange = function() {
        if (foundItem) {
          Object.defineProperty(that, 'response', { value: JSON.stringify(foundItem.responseBody) });
          Object.defineProperty(that, 'responseText', { value: JSON.stringify(foundItem.responseBody) });
          Object.defineProperty(that, 'status', { value: JSON.stringify(foundItem.responseStatus) });
        }

        if (callback) {
          callback.apply(this, arguments);
        }
      }

      open.apply(this, arguments);
    }
  };

  // initial setup
  overrideNetworkRequestSetup();

  window.__GRASSHOPPER_DEVTOOLS_OVERRIDE__ = {
    overrideNetworkRequestSetup
  };
}

export const DB_CONFIG = 'grasshopper-config-db';
export const DB_GROUP_NAME = 'grasshopper-db';
export const saveToLocalStorage = (data, dbTable = DB_GROUP_NAME) => localStorage.setItem(dbTable, JSON.stringify(data));