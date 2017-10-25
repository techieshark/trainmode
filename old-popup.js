

/* */
  // chrome.storage.onChanged.addListener(function(changes, namespace) {
  //       for (key in changes) {
  //         var storageChange = changes[key];
  //         console.log('Storage key "%s" in namespace "%s" changed. ' +
  //                     'Old value was "%s", new value is "%s".',
  //                     key,
  //                     namespace,
  //                     storageChange.oldValue,
  //                     storageChange.newValue);
  //       }
  //     });



  // // listen for changes in state and update view as needed
  // chrome.storage.onChanged.addListener((changes) => {
  //   // pay attention to 'enabled' key only
  //   const key = 'enabled';

  //   if (Object.keys(changes).includes(key)) {
  //     callback(changes[key].newValue);
  //     enableButton(changes[key].newValue === true);
  //   }

  //   // Object.keys(changes).forEach((key) => {
  //   //   const storageChange = changes[key];
  //   //   console.log('Storage key "%s" in namespace "%s" changed. ' +
  //   //               'Old value was "%s", new value is "%s".',
  //   //               key,
  //   //               namespace,
  //   //               storageChange.oldValue,
  //   //               storageChange.newValue);
  //   // });
  // });


/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
// function getCurrentTabUrl(callback) {
//   // Query filter to be passed to chrome.tabs.query - see
//   // https://developer.chrome.com/extensions/tabs#method-query
//   const queryInfo = {
//     active: true,
//     currentWindow: true,
//   };

//   chrome.tabs.query(queryInfo, (tabs) => {
//     // chrome.tabs.query invokes the callback with a list of tabs that match the
//     // query. When the popup is opened, there is certainly a window and at least
//     // one tab, so we can safely assume that |tabs| is a non-empty array.
//     // A window can only have one active tab at a time, so the array consists of
//     // exactly one tab.
//     const tab = tabs[0];

//     // A tab is a plain object that provides information about the tab.
//     // See https://developer.chrome.com/extensions/tabs#type-Tab
//     const url = tab.url;

//     // tab.url is only available if the "activeTab" permission is declared.
//     // If you want to see the URL of other tabs (e.g. after removing active:true
//     // from |queryInfo|), then the "tabs" permission is required to see their
//     // "url" properties.
//     console.assert(typeof url === 'string', 'tab.url should be a string');

//     callback(url);
//   });

//   // Most methods of the Chrome extension APIs are asynchronous. This means that
//   // you CANNOT do something like this:
//   //
//   // var url;
//   // chrome.tabs.query(queryInfo, function(tabs) {
//   //   url = tabs[0].url;
//   // });
//   // alert(url); // Shows "undefined", because chrome.tabs.query is async.
// }


// function renderStatus(statusText) {
//   document.getElementById('status').textContent = statusText;
// }
