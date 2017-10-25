(function iife() {
  /* global lib */

  const whitelist = self.whitelist = self.whitelist || {};

  whitelist.list = [];

  whitelist.add = function add(url) {
    console.log('whitelisting URL: ', url);
    lib.pushIfNew(whitelist.list, url);
  };

  // returns true if url included in whitelist
  whitelist.has = function has(url) {
    return whitelist.list.indexOf(url) > -1;
  };
}());
