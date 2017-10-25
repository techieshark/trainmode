
// TODO
// rather than console.log on popup which disappears, send message to background and print there.

/* global messages*/


// Error: Invocation of form runtime.connect(null, )
// doesn't match definition runtime.connect(optional string extensionId, optional object connectInfo)

function logMsg(text) {
  chrome.runtime.sendMessage(
    null, /* optional string: current extension */
    { method: messages.LOG, text }, // message object
    null, /* optional string: options */
    (response) => {
      if (!response) {
        console.error('Error connecting to extension background: ', chrome.runtime.lastError.message, text);
      } else {
        console.log(`Result of sendMessage(LOG): ${response.status}`);
      }
    });
}


function updateEnableButton(enabled) {
  // toggle on/off 'enabled' on body
  const className = 'tm-enabled';
  const classList = document.body.classList;
  console.log(`toggling on/off button to: ${enabled}`);
  // logMsg(`toggling on/off button to: ${enabled}`);
  if (enabled) {
    classList.add(className);
  } else {
    classList.remove(className);
  }
  console.log(`popup body classList now: "${document.body.classList}"`);
}


document.addEventListener('DOMContentLoaded', () => {
  const enableBtn = document.getElementById('enableBtn');

  console.log('initializing Train Mode popup window');
  if (!chrome.extension) {
    console.error('Weirdness in popup.js - chrome.extension not available');
    return;
  }

  const BG = chrome.extension.getBackgroundPage();
  if (!BG) {
    console.error('Extension has no background page.');
    return;
  }
  const lib = BG.lib; // so it is long living

  enableBtn.onclick = function toggleEnabled() {
    // flip enabled state on click
    const newState = !lib.getEnabled();
    logMsg(`enableBtn.onclick: new desired state is: ${newState}`);
    lib.setEnabled(newState);
  };

  // initial view state
  const isEnabled = lib.getEnabled();
  console.log('popup saw enabled state: ', isEnabled);
  updateEnableButton(isEnabled);
  // setBrowserActionTitle(isEnabled);
  document.body.classList.remove('initial');

  // listen for changes in state and update view as needed
  lib.onEnabledChanged(enabled => updateEnableButton(enabled));

  // console.log('Total bytes downloaded: ', BG.totalResponseSize);
});
