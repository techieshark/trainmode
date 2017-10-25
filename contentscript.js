
// injected in each page -- Train Mode extension
// @flow
/* global messages, lib */

(function iife() {
  if (self.initDone) {
    return;
  }

  console.log(`executing contentscript.js for location: ${window.location}`);

  // UPDATE: bad idea. This isn't guaranteed to run before image starts downloading images,
  //         so by switching the image to load, we force browser to load other images *in addition*
  //         to the original images.
  // function dropSrcSets() {
  //   // Remove all 'srcset' attributes so the browser is forced to use the smallest image
  //   const images = document.querySelectorAll('img[srcset]');
  //   console.log(`Trainmode: DOMContentLoaded in ccontentscript.js, found ${images.length} images`);
  //   // debugger;
  //   images.forEach((img) => {
  //     console.log('removed srcset from image: ', img.outerHTML);
  //     img.removeAttribute('srcset');
  //   });
  // }

  // consts
  const WRAPCLASS = 'tm-image-wrapper';

  // helper functions
  const head = array => array[0];
  const tail = array => array.slice(1);
  const isNotEmpty = s => s.trim().length > 0;


  function scaleTitleFont(img, w) {
    if (w < 250) { /* narrow image, need smaller font size */
      return '20px';
    }
    return '30px';
  }


  // dDim = d.getBoundingClientRect();
  // ClientRect {top: 14, right: 106, bottom: 56, left: 36, width: 70…}
  // dDim.bottom - dDim.top

  // use p.clientWidth and p.clientHeight


  function getDimensions(img) {
    if (img.src === 'https://grist.files.wordpress.com/2017/02/stillresisting.jpg?w=640&h=360&crop=1') {
      return {
        width: 640,
        height: 360,
      };
    }
    return {
      width: img.outerWidth || img.getBoundingClientRect().width,
      height: img.outerHeight || img.getBoundingClientRect().width * 0.6, // guess at aspect ratio
    };
  }


  function getImageDescription(img) {
    return img.title || img.alt || '';
  }


  function imageToText(img) {
    // we'll replace each image with a newly made div
    const div = document.createElement('div');
    div.className = 'tm-replaced-image';
    const p = document.createElement('p');
    div.appendChild(p);

    // replacement div should match dimensions of image we're replacing
    console.log('img dimensions w/h', img, img.outerWidth, img.outerHeight);
    // const minPixels = 25;
    // const minPixels = 0;
    const imgDim = getDimensions(img);
    div.style.height = `${imgDim.height}px`;
    div.style.width = `${imgDim.width}px`;

    p.style.fontSize = scaleTitleFont(img, imgDim.width);

    // present a text alternative to the image
    p.innerText = getImageDescription(img);

    // out with the old (img), in with the new (div)
    img.parentNode.replaceChild(div, img);

    console.log('replaced img with div', img, div);

    // should give something like:
    // <div class="tm-replaced-image"><p>Solar Panels</p></div>
  }

  /* flow-include
    declare var chrome: any;
    declare var messages: {
      method: string,
      GET_BLOCKED_STATUS: string,
      GET_BYTES_DOWN: string,
      LOG: string,
      TAB_GET_CLICKED_IMAGES: string,
      TAB_REFETCH_IMAGE: string,
      TAB_UNBLOCK_IMAGE: string
    }
  */

  function runIfImageBlocked(imageProcessFunc, img) {
    // ask background page if blocked, and if so, replace image w/ something readable
    chrome.runtime.sendMessage(
      null, /* optional string: current extension */
      { url: img.src, method: messages.GET_BLOCKED_STATUS }, // message object
      null, /* optional string: options */
      (response) => {
        if (!response) {
          console.error(
            'runIfImageBlocked(): Error connecting to extension background: ',
            chrome.runtime.lastError.message);
        } else if (response.urlBlocked) {
          console.log('Image blocked; running imageProcessFunc on it:', img);
          imageProcessFunc(img);
        } else {
          console.log('runIfImageBlocked(): Extension background says image not blocked:', img);
        }
      });
  }

  function nodesToArray(nodeList) {
    return [].slice.call(nodeList, 0);
  }

  // show text instead of images
  function imagesToText() {
    const images = nodesToArray(document.querySelectorAll('img'));
    images.forEach(img => runIfImageBlocked(imageToText, img));
  }


  // thx, http://stackoverflow.com/a/18453767/1024811
  const wrap = function wrap(toWrap, wrapper, wrapClassName, alt, descr) {
    wrapper = wrapper || document.createElement('div');
    wrapper.className = wrapClassName;
    wrapper.dataset.descr = descr || ''; // data-desc description for tool tip

    // add a div/p containing the replacement alt
    if (alt) {
      const altDiv = document.createElement('div');
      altDiv.className = 'tm-alt';

      const imgDim = getDimensions(toWrap);
      altDiv.style.height = `${imgDim.height}px`;
      altDiv.style.width = imgDim.width ? `${imgDim.width}px` : '100%';

      const p = document.createElement('p');
      p.innerText = alt || '';
      altDiv.appendChild(p);
      wrapper.appendChild(altDiv);
    }

    if (toWrap.nextSibling) {
      toWrap.parentNode.insertBefore(wrapper, toWrap.nextSibling);
    } else {
      toWrap.parentNode.appendChild(wrapper);
    }

    console.log('wrapped child with wrapper:', toWrap, wrapper);
    return wrapper.appendChild(toWrap);
  };

  function getImageTooltip(img) {
    return `Image: "${getImageDescription(img)}", show via menu`;
  }

  let lastTarget; // last target of the contextmenu event
  function trackLastClick() {
    window.addEventListener('contextmenu', (event) => {
      // console.log('saw click ', event);
      lastTarget = event.target;
      // console.log('target: ', lastTarget);
    });
  }


  function getAllUrls(el) {
    // ASSERT el is img
    if (el.tagName !== 'IMG') {
      console.error('huh, thought we only dealt with images!');
    }

    // sometimes we have structure like this:
    // <div class='tm-image-wrapper'><img></div><img src="decorative.svg">
    // so if this image isn't wrapped, check immediate prior sibling
    // maybe later?

    // todo check for background images (e.g. grist logo sprite)

    const srcSetUrls =
      el.srcset
        .split(',') // "http://one 500w, http://two 2x" -> array of urls
        .map(url => url.trim().split(' ')[0]); // discard anything after a space ('500x', '2x', etc)

    /* trim & remove empties*/
    const urls =
      [el.src, ...srcSetUrls]
        .map(s => s.trim())
        .filter(isNotEmpty);

    return urls;
  }


  function tabGetClickedImages(sendResponse) {
    // lookup urls associated w/ clicked target
    if (!lastTarget) {
      console.error('weird, lastTarget s/not be null');
    }

    const urls = getAllUrls(lastTarget);
    console.log('Found URLs for target: ', lastTarget, urls);

    // sendResponse so background can unblock these
    sendResponse({ urls });
  }


  // forces reload of image
  function addImgReloadKey(el, reloadKey) {
    // stick reload key on element's src tag
    if (!el) {
      console.error('weird, el s/not be null');
      return;
    }
    if (el.tagName !== 'IMG') {
      console.error('huh, thought we only dealt with images!');
      return;
    }

    // use compression server
    const minifier = 'http://trainmode.herokuapp.com/compress?url=';
    el.src += reloadKey;
    el.src = minifier + el.src;
    console.log(`added reload key to img, now looks like: ${el.src}`);

    // and all entries of srcset
    if (el.srcset) {
      el.srcset =
        el.srcset.split(',') // a srcset is a comma separated list of images candidates
          .map((candidate) => {
            // add reload key to this image candidate, each is like "URL[ [\d+w|\d+x]]"
            const tokens = candidate.match(/\S+/g); // split on whitespace
            const newURL = minifier + head(tokens) + reloadKey; // first part of image candidate will be URL
            const newCandidate = [newURL, ...tail(tokens)].join(' '); // collapse to string again
            return newCandidate;
          })
          .join(',');
      console.log('added reload key to srcset, now looks like ', el.srcset);
    }
  }

  function unwrap(img) {
    // if image is contained in WRAPCLASS

    const iswrapped = img.parentNode.classList.contains(WRAPCLASS);
    if (iswrapped) {
      const wrapper = img.parentNode;
      wrapper.parentNode.replaceChild(img, wrapper);
    }
  }

  function tabRefetchImages(reloadKey, sendResponse) {
    // update DOM, append token to force browser refetch of now-allowed images

    // fix urls associated w/ clicked target
    addImgReloadKey(lastTarget, reloadKey);

    // image now shown; get rid of wrapper we used to highlight missing images
    unwrap(lastTarget);

    // const imgs =
    //   [...document.querySelectorAll('[src]')]
    //     .filter(img => img.src.indexOf("${imgUrl}") > -1);
    // imgs.every((img) => { img.src = "${imgUrl}" + "${RELOAD_KEY}"; return true; });

    // console.log('attempting refreshImages: ', refreshImages);

    sendResponse(true);
  }

  // communicate with background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    function msgError() {
      console.log('faulty message receieved from sender: ', message, sender);
    }
    if (!message || !message.method) {
      msgError();
    }

    console.log('received msg: ', messages.method);
    switch (message.method) {
      case messages.TAB_GET_CLICKED_IMAGES:
        tabGetClickedImages(sendResponse);
        // contextUnblockImage(sendResponse);
        break;
      case messages.TAB_REFETCH_IMAGE:
        tabRefetchImages(message.reloadKey, sendResponse);
        break;
      default:
        msgError();
    }
  });


  function wrapImages() {
    const images = nodesToArray(document.getElementsByTagName('img'));
    [...images].every((img) => {
      console.log('wrapImages() processing img: ', img);
      // wrap image
      const wrapFunc =
        img_ => wrap(img_, null, WRAPCLASS, getImageDescription(img), getImageTooltip(img));
      runIfImageBlocked(wrapFunc, img);
      // const div = document.createElement('div').appendChild(img);
      // div.className = 'tm-image-wrapper';
      // img.replaceWith(div);
      // make all images 5 by 5 minimum so we can click on them
      // img.style.minWidth = '5px';
      // img.style.minHeight = '5px';

      return true; // ignoring return val
    });
  }

  // listen for broadcasts & update DOM if needed - TODO

  function initializeDOM() {
    document.body.classList.add('tm-enabled'); // HACK, need to actually query BG.
  }


  function youtube() {
    // replace any youtube iframes with mini-youtube iframes
    const iframes = [
      ...nodesToArray(document.querySelectorAll('iframe[src^="https://www.youtube.com/embed"]')),
      ...nodesToArray(document.querySelectorAll('iframe[src^="http://www.youtube.com/embed"]')),
      ...nodesToArray(document.querySelectorAll('iframe[src^="https://youtube.com/embed"]')),
      ...nodesToArray(document.querySelectorAll('iframe[src^="http://youtube.com/embed"]')),
    ];

    console.log('replacing all youtube embed iframes found: ', iframes);
    iframes.every((iframe) => {
      iframe.src = `http://minitube.herokuapp.com/youtube?url=${iframe.src}?tmPassThru=1`;
      return true;
    });


    // in place of blocked youtube iframe, show image

    // find iframe
    // const iframe = document.querySelector('iframe[src="https://www.youtube.com/embed/nEea_wNQUM8"]');

    // replace with image
    // const img = document.createElement('img');
    // img.src = 'https://i.ytimg.com/vi/nEea_wNQUM8/sddefault.jpg';
    // iframe.parentNode.replaceChild(img, iframe);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initializeDOM();

    // dropSrcSets();

    // imagesToText();

    // track last clicked element
    trackLastClick();

    youtube();

    wrapImages();


    // catch image load errors (because, presumably, we blocked them)
    // step 1: detect which images aren't loading
    // step 2: do something to a) make those images visible, and b) make alt/title visible
    window.onerror = function onerror(msg, url, lineNo, columnNo, error) {
      const string = msg.toLowerCase();
      const substring = 'script error';
      if (string.indexOf(substring) > -1) {
        console.log('Script Error: See Browser Console for Detail');
      } else {
        const message = [
          `Message: ${msg}`,
          `URL: ${url}`,
          `Line: ${lineNo}`,
          `Column: ${columnNo}`,
          `Error object: ${JSON.stringify(error)}`,
        ].join(' - ');
        console.log(message);
      }
      return false;
    };
  });

  self.initDone = true; // only initialize once
}());
