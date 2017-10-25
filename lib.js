
(function iife() {
  if (self.initDone) {
    return;
  }


  const lib = self.lib = self.lib || {}; // library functions
  const storageCache = self.storageCache = self.storageCache || {};
  const requestLog = self.requestLog = self.requestLog || [];


  const storage = chrome.storage.local;


  // crazy JS doesn't have this already
  // http://stackoverflow.com/a/3561711/1024811
  lib.escapeRE = function escapeRE(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // eslint-disable-line no-useless-escape
  };

  // returns true if added
  lib.pushIfNew = function pushIfNew(array, item) {
    if (array.indexOf(item) === -1) {
      array.push(item);
      return true;
    }
    return false;
  };


  lib.logRequest = function logRequest(url) {
    if (lib.pushIfNew(requestLog, url)) {
      console.log('added resource to might-be-cached list: ', url);
    } else {
      console.log('resource already on might-be-cached list: ', url);
    }
  };


  lib.mightBeCached = function wasRequestLogged(url) {
    return requestLog.indexOf(url) > -1;
  };

  lib.isWhitelisted = function isWhitelisted() {
    return false; // whitelisting feature not implemented. TODO
  };


  function fetchStoredState() {
    storage.get('enabled', (config) => {
      console.log('lib fetched storage enabled state: ', config.enabled);
      storageCache.enabled = config.enabled;
    });
  }

  function setupStorageCaching() {
    // sync storage cache
    lib.onEnabledChanged((enabled) => { storageCache.enabled = enabled; });
  }


  lib.initalizeStorageCache = function initalizeStorageCache() {
    // fetch state from storage
    fetchStoredState();

    // listen for changes and update state as needed
    setupStorageCaching();
  };


  lib.uninstall = function uninstall() {
    storage.clear();
    chrome.storage.onChanged.removeListener();
  };


  // is functionality enabled?
  lib.getEnabled = function getEnabled() {
    return storageCache.enabled || false; // return false if undefined.
  // callback(enabled:bool) is called with result
    // storage.get('enabled', config => callback(config.enabled));
  };

  // enable or disable functionality
  lib.setEnabled = function setEnabled(enabled) {
    console.log(`setting enabled: ${enabled}`);
    storage.set({ enabled });
  };

  // watch state changes
  // call callback(enabled:bool) if enabled state changes
  lib.onEnabledChanged = function onEnabledChanged(callback) {
    chrome.storage.onChanged.addListener((changes) => {
      // pay attention to 'enabled' key only
      console.log('noticed changes: ', changes);
      const key = 'enabled';
      if (Object.keys(changes).includes(key)) {
        callback(changes[key].newValue);
      }
    });
  };

  self.initDone = true; // only initialize once
}());

