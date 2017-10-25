// blockimage 

// background.js


if (!localStorage.on) {
    localStorage.on = '1';
}

if (localStorage.on == '1') {
    chrome.browserAction.setIcon({path: "images/icon16.png"});
} else {
    chrome.browserAction.setIcon({path: "images/icon16-disabled.png"});
}

chrome.browserAction.onClicked.addListener(function(tab) {
    if (localStorage.on == '1') {
        chrome.browserAction.setIcon({path: "images/icon16-disabled.png"});
        localStorage.on = '0';
    } else {
        chrome.browserAction.setIcon({path: "images/icon16.png"});
        localStorage.on = '1';
    }
});

chrome.webRequest.onBeforeRequest.addListener(function(details) {
    if (localStorage.on == '1') {
        // return {redirectUrl: ""}
        // https://www.base64-image.de/
        return {redirectUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=="};
    }
}, {urls: ["http://*/*", "https://*/*"], types: ["image", "object"]}, ["blocking"]);

chrome.tabs.onUpdated.addListener(function() {
    if (localStorage.on == '1') {
        chrome.tabs.insertCSS(null, {code: "img{visibility: hidden;}", runAt: "document_start"});       
    }
});
