
// problem: don't have access to chrome.devtools when devtools panel isn't open
// let totalResponseSize = self.totalResponseSize = self.totalResponseSize || 0;
// console.log(`totalResponseSize is now: ${totalResponseSize}`);

// convoluted solution:
// a local proxy server that tracks bandwidth usage for each request.
// http://localhost:8888/<tabidnumber-or-requesting-url>/address


// chrome.devtools.network.onRequestFinished.addListener((request) => {
//   totalResponseSize += request.response.bodySize;

//   // if (request.response.bodySize > 40*1024) {
//   //   chrome.devtools.inspectedWindow.eval(
//   //       'console.log("Large image: " + unescape("' +
//   //       escape(request.request.url) + '"))');
//   // }
// });

// chrome.devtools.network.getHAR((harlog) =>
