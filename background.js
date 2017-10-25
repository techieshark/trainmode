
// background script
// note: it cannot be an event page because we use webRequest.onBeforeRequest

/* global lib, whitelist, messages */

// operate on all images on all pages
const webRequestFilter = { urls: ['http://*/*', 'https://*/*'], types: ['image', /* 'stylesheet', */ 'object'] };
let A = document.createElement('a'); // long living anchor element, keeping around for performance

// client can add ?tmReload to resources to force browser to refetch
// Once the resource's URL is changed (e.g. <img src="...?tmReload">),
// the browser sees this as a new resource, and will attempt to download it again
// (even if base resource failed because we previously blocked it -- it's a "different" resource)
// When the filter code sees the request, it can remove ?tmReload and check if
// the resource should be allowed. Note that that ?tmReload *must* be removed (via redirect),
// as the browser will attempt to fetch the new item from the network otherwise.
const RELOAD_KEY = '?tmReload';

// gets URL, minus the potential trailing reload key
function getUrlSansReload(url) {
  // if RELOAD_KEY appended to URL, remove & redirect to the original (cached) resource
  const reloadRE = new RegExp(`${lib.escapeRE(RELOAD_KEY)}$`);
  if (reloadRE.test(url)) {
    // remove key from end of url
    return {
      url: url.slice(0, url.length - RELOAD_KEY.length),
      reload: true,
    };
  } else {
    return { url, reload: false }; // didn't see reload, return unaltered url
  }
}


// UI updates -----------------------------------------------------------------
function updateIcon(enabled) {
  chrome.browserAction.setIcon({ path: `images/icon16${enabled ? '' : '-disabled'}.png` });
}

function updateBadge(enabled) { // setBadge
  const badgeTextDetails = { text: enabled ? 'ON' : 'OFF' };
  // console.log(badgeTextDetails);
  chrome.browserAction.setBadgeText(badgeTextDetails);
  chrome.browserAction.setBadgeBackgroundColor({ color: enabled ? [0, 0, 0, 255] : 'gray' });
}

function updateBrowserActionTitle(enabled) { // set...title
  chrome.browserAction.setTitle({ title: `Train Mode (${enabled ? 'enabled' : 'disabled'})` });
}

function updateUI(enabled) { // setEnabled
  updateIcon(enabled);
  updateBadge(enabled);
  updateBrowserActionTitle(enabled);
}
// ----------------------------------------------------------------------------


function reqListener() {
  // console.log('xhr for image load event: ', this.responseText);
  console.log('xhr for image load event');
}

function getResource(url) {
  // send network request for image
  const oReq = new XMLHttpRequest();
  oReq.addEventListener('load', reqListener);
  oReq.open('GET', url);
  oReq.send();
}


function logExtMsgFailure() {
  console.error('Error communicating via extension port(s): ', chrome.runtime.lastError.message);
}


// onclick callback function for context menu
function imageMenuClickHandler(info, tab) {
  console.log('info.menuID was clicked', info.menuItemId);
  console.log('info, tab:', info, tab);

  // GRR XXX TODO. chrome doesn't pass anything other than srcUrl that is useful.
  // const imgUrl = info.currentSrc;

  // get all possible resources associated with the image
  // -> src url + srcset (and later <picture>) resources
  // do this by either inspecting the current tab's DOM (attribute selector match for img url)
  // or by finding a way to get the context menu handling code to run in the page,
  //    and lookup which element was just clicked.
  // trick to help: content script adds a click handler to all images, stores last element clicked.

  // const imgUrl = info.srcUrl;
  // console.log('Revealing image: ', imgUrl);
  // // whitelist for this & future requests
  // whitelist.add(imgUrl);

  // handle srcset. Image's src attribute might not be the thing being requested.
  // We need to figure out, based on the image element, what exactly are the URLs
  // that will be blocked, and whitelist them all.


  // const refreshImages = `
  //   imgs = [...document.querySelectorAll('[src]')].filter((img) => img.src.indexOf("${imgUrl}") > -1);
  //   imgs.every((img) => { img.src = "${imgUrl}" + "${RELOAD_KEY}"; return true; });
  // `;
  // console.log('attempting refreshImages: ', refreshImages);

  // send message to client script
  // this seems like a bit of an ugly hack...
  // chrome.tabs.executeScript({
  //   code: refreshImages,
  // });

  chrome.tabs.sendMessage(
    // "Sends a single message to the content script(s) in the specified tab,
    // with an optional callback to run when a response is sent back.
    // The runtime.onMessage event is fired in each content script running
    // in the specified tab for the current extension."
    tab.id,
    { method: messages.TAB_GET_CLICKED_IMAGES }, // get image url(s) user clicked
    null, // options, e.g. frame
    (response) => { // client responsible for reporting back [URL]s to unblock
      if (!response) {
        logExtMsgFailure();
      } else { // response.urls is array of URLs to unblock
        // whitelist for this & future requests
        [...response.urls].every((url) => { whitelist.add(url); return true; });
      }
      // finally, tell content script to try requesting url(s) of now-unblocked image
      // content script should still have idea of which element was clicked on most recently.
      chrome.tabs.sendMessage(
        tab.id,
        { method: messages.TAB_REFETCH_IMAGE, reloadKey: RELOAD_KEY },
        null, // options / frame
        (response_) => { // not expecting anything but check that comm happened
          if (!response_) {
            logExtMsgFailure();
          }
        });
    });
}

// TODO
function divMenuClickHandler(info, tab) {
  console.log('info.menuID was clicked', info.menuItemId);
  console.log('info: ', info);
  console.log('tab:', tab);

  // Strategy:
  // When a page context menu item is clicked, the background code
  // doesn't have access to the page dom element being clicked on.
  // So we figure out which page is active, and send a message
  // to the content script in that page. The content script is
  // responsible for determining the item being clicked on at that moment,
  // and figuring out which image(s) are to be unblocked.
  // Then the contentscript sends a message containing that information
  // to the background which runs the whitelisting as above.

  // Either that, or figure out how to fix this zero-width image issue.
  // (Which could be done using a server?)
}

function initializeDivContextMenuItem() {
  const context = 'page';
  const title = 'Always show images inside this div';

  const id = chrome.contextMenus.create({
    title,
    contexts: [context],
    onclick: divMenuClickHandler,
  });
  console.log(`'${context}' item:${id}`);
}


function initializeImgContextMenuItem() {
  const context = 'image';
  const title = 'Always show image';

  const id = chrome.contextMenus.create({
    title,
    contexts: [context],
    onclick: imageMenuClickHandler,
  });
  console.log(`'${context}' item:${id}`);
}

function initializeContextMenuItems() {
  initializeImgContextMenuItem();
  initializeDivContextMenuItem();
}


// listen for UI icon click
// chrome.browserAction.onClicked.addListener(() => {
//   // extension icon was clicked; toggle on/off

//   storage.get(CONFIG, (config) => {
//     const newState = !config.enabled;
//     storage.set(CONFIG, { enabled: newState });
//     updateUI(newState);
//   });
// });

// is the URL for an SVG? true or false.
function isSVG(url) {
  // http://stackoverflow.com/a/6560644/1024811 a el &
  // http://stackoverflow.com/a/4497576/1024811 parseUri &
  // http://stackoverflow.com/a/10473222/1024811 image regexs
  A.href = url;
  const result = /\.(svg)$/i.test(A.pathname);
  console.log('isSVG(url): ', result);
  return result;
}

function hasSpecialPass(url) {
  // allow content script to bypass by appending 'tmPassThru=1' url param
  const passthruRE = /tmPassThru=1/;
  const result = passthruRE.test(url);
  console.log('hasSpecialPass(url): ', result);
  return result;
}

function isTrainmode(url) {
  A.href = url;
  return A.hostname === 'trainmode.herokuapp.com';
}

function isBlockedURL(url) {
  // return true if the URL should be blocked

  const whitelisted = whitelist.has(url);
  const cached = lib.mightBeCached(url);
  const isFB = lib.isFacebookUI(url);
  const isTM = isTrainmode(url);

  console.log(
    `isBlockedURL(): whitelisted: ${whitelisted}, cached: ${cached}, isFB: ${isFB}, tm: ${isTM}`);

  return !isSVG(url) && // SVGs are OK, often small & part of UI
         !hasSpecialPass(url) &&  // URL has bypass key
         !isFB && // Let Facebook UI images thru
         !whitelisted &&    // URL is whitelisted
         !cached &&  // URL may be cached
         !isTM; // URL is compressed & approved
}

function isActivelyBlocked(url) {
  const libEnabled = lib.getEnabled();
  const resourceBlocked = isBlockedURL(url);
  console.log(`isActivelyBlocked(): lib enabled (${libEnabled}), url blocked (${resourceBlocked})`);
  return lib.getEnabled() && isBlockedURL(url);
}


function modifyRequestHeaders() {
  // Always send Save-Data, like Google's page speed extension
  chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
      details.requestHeaders.push({
        name: 'Save-Data',
        value: 'On',
      }, {
        name: 'Downlink',
        value: '0.384', // GPRS EDGE http://httpwg.org/http-extensions/client-hints.html#downlink
      });
      // console.log('Added "Save-Data" header to : ', details.requestHeaders);
      return { requestHeaders: details.requestHeaders };
    },
    { urls: ['<all_urls>'] },
    ['blocking', 'requestHeaders']);
}


// intercept image requests
function blockImageRequests(blockImages) {
  chrome.webRequest.onBeforeRequest.addListener((details) => {
    let response;
    console.log('trainmode blockImageRequests() details:', details);
    const { url, reload: needsRedirect } = getUrlSansReload(details.url);

    if (blockImages && isActivelyBlocked(url)) {
      console.log('blocking request to non-cached url: ', url);
      response = {
        // redirectUrl: 'data:image/png;base64,' +
        //   'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAA' +
        //   'AACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
        redirectUrl: chrome.extension.getURL('assets/4x3.png'),
        // redirectUrl: chrome.extension.getURL('assets/1280x720.png'),
        // redirectUrl: chrome.extension.getURL('assets/1280x720-whiteish.png'),
      };
      // response = { cancel: true };
    } else if (needsRedirect) {
      console.log('redirecting allowed request to url: ', url);
      response = { redirectUrl: url };
    } else {
      console.log('allowing request to url: ', url);
      response = {};
    }

    return response;
  }, webRequestFilter, ['blocking']);

  // // allow all trainmode server requests (compressed images) -- xx n/m doesn't work
  // // because 2nd listener can block it.
  // const webRequestTrainmodeFilter = {
  //   urls: ['*://trainmode.herokuapp.com/*'],
  //   types: ['image', 'object'],
  // };
  // chrome.webRequest.onBeforeRequest.addListener((details) => {
  //   console.log('allowing request to trainmode compressed image: ', details.url);
  //   return {};
  // }, webRequestTrainmodeFilter, ['blocking']);
}

function isYoutubeEmbed(url) {
  // A.href = url;
  // const passthruRE = /tmPassThru=/;
  // if (passthruRE.test(url)) {
  //   console.log('bypassing check for url: ', url);
  //   return false;
  // } else {
  // }
  return /youtube\.com/.test(A.hostname) && /youtube\.com\/embed/.test(url);
}

function youtubeBlocker(details) {
  // if we get to this point, details.url must be youtube.com/embed/*
  // because of onBeforeRequest `urls` option
  if (!hasSpecialPass(details.url)) {
    console.log('blocking youtube iframe: ', details);
    return { cancel: true };
  } else {
    console.log('youtube iframe had special pass, not blocking it: ', details.url);
    return {};
  }
}

function unblockYoutubeRequests() {
  console.log('disabling youtube blocking');
  chrome.webRequest.onBeforeRequest.removeListener(youtubeBlocker);
}

function blockYoutubeRequests() {
  console.log('enabling youtube blocking');
  chrome.webRequest.onBeforeRequest.addListener(youtubeBlocker, {
    urls: ['*://*.youtube.com/embed/*'],
    types: ['sub_frame'],
  }, ['blocking']);
}


// onBeforeSendHeaders: possibly modify headers before sending (e.g. cross site origin headers)
// chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
//   console.log('saw headers in ', details, details.requestHeaders);
//   // details.requestHeaders.every((header) => {
//   //   if (header.name === 'User-Agent') {
//   //     details.requestHeaders.splice(i, 1);
//   //     break;
//   //   }
//   // })
//   return { requestHeaders: details.requestHeaders };
// }, webRequestFilter, ['blocking', 'requestHeaders']);


// onHeadersReceived - use to check content-length (large images)
// - link to other results w/ requestId
// chrome.webRequest.onHeadersReceived.addListener((details) => {
//   console.log('onHeadersReceived details: ', details);
// }, webRequestFilter);


// build our own "cached log"
function logResponseCaching() {
  chrome.webRequest.onResponseStarted.addListener((details) => {
    // any time we start downloading something, note the URI for that item
    // so later, when desired, we can block all image requests that aren't
    // already cached.
    // This approach is the only thing that seems possible, as we don't have
    // any way to know what has been cached until we get the first bytes of a
    // response, and once we do it is too late to block the resource from downloading.

    console.log(`onResponseStarted: Response started for resource "${details.url}"; details: `, details);
    lib.logRequest(details.url /* , details.fromCache*/);
  }, webRequestFilter);
}


// callback is function callback({blocked:boolean})
function lookupBlockedStatus(fullURL, callback) {
  console.log('looking up if blocked: ', fullURL);
  const { url, reload: needsRedirect } = getUrlSansReload(fullURL);

  if (isActivelyBlocked(url)) {
    console.log('url blocked: ', url);
    callback({ urlBlocked: true });
  } else {
    console.log('url NOT blocked: ', url);
    callback({ urlBlocked: false });
  }
}


// Listen for messages from client script
function onContentScriptMessage(message, _sender, sendResponse) {
  console.log('onContentScriptMessage: message received from client', message.method);
  switch (message.method) {
    case messages.LOG:
      console.log(message.text);
      sendResponse({ status: 'All good, message logged.' });
      break;
    case messages.GET_BLOCKED_STATUS:
      lookupBlockedStatus(message.url, sendResponse);
      break;
    // case messages.GET_BYTES_DOWN:
    //   sendResponse({ bytes: totalResponseSize });
    //   break;
    default:
      sendResponse({ error: 'Unknown message' });
      break;
  }
}

function updateListeners(enabled) {
  // turn on / off iframe blocker
  if (!enabled) {
    unblockYoutubeRequests();
  } else {
    blockYoutubeRequests();
  }
}
// End function definitions ---------------------------------------------------


// Meat of the application background -----------------------------------------

// set initial state on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Installed Train Mode extension');
  lib.initalizeStorageCache();
  const enabled = true;
  lib.setEnabled(enabled);
  updateUI(enabled);
  initializeContextMenuItems();
});

chrome.runtime.onStartup.addListener(() => {
  console.log('Startup of Train Mode extension');
  A = document.createElement('a');
});

// update button style when enabled status changes
lib.onEnabledChanged((enabled) => {
  updateUI(enabled);
  updateListeners(enabled);
});

modifyRequestHeaders(); // set Save-Data etc
blockImageRequests(true);
blockYoutubeRequests();
logResponseCaching();
chrome.runtime.onMessage.addListener(onContentScriptMessage);

chrome.runtime.onSuspend.addListener(() => {
  // alert('uninstalling TM extension');
  lib.uninstall();
});


// Fired when a tab is updated.
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (!tab.url /* new tab */ || changeInfo.status !== 'complete') {
//     return; // nothing to do until we get to a complete page.
//   }

//   storage.get('enabled', (config) => {
//     if (config.enabled) {
//       window.console.log('Train Mode ON; hiding images; changeinfo:', changeInfo);
//       // console.log('Tab:', tab);
//       chrome.tabs.insertCSS(tabId, { code: 'img{opacity: 0.5}', runAt: 'document_start' });
//     }
//   });
// });
