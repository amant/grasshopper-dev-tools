export function overrideNetworkRequest() {
  const DB_CONFIG = 'grasshopper-config-db';
  const DB_GROUP_NAME = 'grasshopper-db';
  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;

  const getDb = () => {
    const content = localStorage.getItem(DB_GROUP_NAME);
    let parseContent;

    try {
      parseContent = JSON.parse(content);
    } catch (err) {
      parseContent = [];
      console.error(`error reading ${ DB_GROUP_NAME }`, err);
    }

    return parseContent;
  };

  const getConfigDb = () => {
    const configContent = localStorage.getItem(DB_CONFIG);
    let configDb;

    try {
      configDb = configContent ? JSON.parse(configContent) : {};
    } catch (err) {
      configDb = {};
      console.error(`error reading ${ DB_CONFIG }`, err);
    }

    return configDb;
  };

  const overrideNetworkRequestSetup = () => {
    const db1 = getDb();
    const configDb = getConfigDb();
    const delaySets = new WeakMap();

    // mock only when `Enable mocking` is checked
    if (!configDb.mockEnable) {
      XMLHttpRequest.prototype.open = open;
      XMLHttpRequest.prototype.send = send;
      return;
    }

    // override Ajax open to set mocked reponses
    XMLHttpRequest.prototype.open = function (__, url, isAsync) {
      const callback = this.onreadystatechange;
      const that = this;
      const resolvedURL = new URL(url, window.location.href).href;

      const foundItem = db1.find(item => {
        // regexp escape
        const escapedUrlString = item.requestUrl.replace(/[.+^${}()|[\]\\]/g, '\\$&');

        // support wildcard
        const reg = new RegExp(`^${ escapedUrlString.replace(/\*/g, '.*') }$`, 'i');

        return item.requestEnable && reg.test(resolvedURL);
      });

      if (foundItem) {
        delaySets.set(that, { isAsync, delay: foundItem.requestDelay, url: resolvedURL });
      }

      this.onreadystatechange = function () {
        if (foundItem) {
          Object.defineProperty(that, 'response', { value: JSON.stringify(foundItem.responseBody) });
          Object.defineProperty(that, 'responseText', { value: JSON.stringify(foundItem.responseBody) });
          Object.defineProperty(that, 'status', { value: Number(foundItem.responseStatus) || 200 });
        }

        if (callback) {
          callback.apply(this, arguments);
        }
      };

      open.apply(this, arguments);
    }

    XMLHttpRequest.prototype.send = function () {
      const delaySet = delaySets.get(this);
      const delay = (delaySet && Number(delaySet.delay)) || 0;

      if (delaySet && delaySet.isAsync && delay > 0) {
        setTimeout(() => send.apply(this, arguments), delay);
        return;
      }

      return send.apply(this, arguments);
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
