/* global lib */

(function iife() {
  if (self.initFbDone) {
    console.log('already initialized, skipping execution in facebook.js');
    return;
  }

  console.log('executing facebook.js');

  if (!self.lib) {
    console.error('Error: lib is undefined');
  }
  const lib = self.lib = self.lib; // library functions


  const urls = [
    'https://www.facebook.com/rsrc.php/v3/yZ/r/3Qthvek6kqx.gif',
    'https://www.facebook.com/rsrc.php/v3/yc/r/K_BrTiD28l1.png',
    'https://www.facebook.com/rsrc.php/v3/yO/r/kWjQESU8aJV.png',
    'https://www.facebook.com/rsrc.php/v3/y6/r/KRjqUzVfNrc.png',
    'https://www.facebook.com/rsrc.php/v3/yJ/r/_xLB5kZsJ63.png',
    'https://www.facebook.com/rsrc.php/v3/y3/r/c3CNAfMUGru.png',
    'https://www.facebook.com/rsrc.php/v3/yv/r/tjvhMulZ-W8.png',
    'https://www.facebook.com/rsrc.php/v3/yW/r/Cg43IrsPc7P.png',
    'https://www.facebook.com/rsrc.php/v3/yu/r/yTtSEFbxIMr.png',
    'https://www.facebook.com/rsrc.php/v3/y4/r/cj6XtJxjFyq.png',
    'https://www.facebook.com/rsrc.php/v3/yW/r/-8uKO6LFsOx.png',
    'https://www.facebook.com/rsrc.php/v3/yF/r/GtWy2MKJqwZ.png',
    'https://www.facebook.com/rsrc.php/v3/yD/r/t-wz8gw1xG1.png',
    'https://www.facebook.com/rsrc.php/v3/yY/r/2lbMzJ3my2D.png',
    'https://www.facebook.com/rsrc.php/v3/yY/r/95mP3iqAHQG.png',
    'https://www.facebook.com/rsrc.php/v3/yv/r/tlQgBHy1WZ9.png',
    'https://www.facebook.com/rsrc.php/v3/yV/r/uLWLA1lWkEx.png',
    'https://www.facebook.com/rsrc.php/v3/yM/r/NBYvgFic_Jk.png',
    'https://www.facebook.com/rsrc.php/v3/yu/r/YMjpKfMrD6I.png',
    'https://www.facebook.com/rsrc.php/v3/yU/r/n93MoBZD7fU.png',
    'https://www.facebook.com/rsrc.php/v3/yt/r/D47CF9k_yA8.png',
    'https://www.facebook.com/rsrc.php/v3/y0/r/f1VBM9ZaMw5.png',
    'https://www.facebook.com/rsrc.php/v3/y4/r/-PAXP-deijE.gif',
    'https://www.facebook.com/rsrc.php/v3/yJ/r/GeDnuL6fruy.png',
    'https://www.facebook.com/rsrc.php/v3/yF/r/GtWy2MKJqwZ.png',
    'https://www.facebook.com/rsrc.php/v3/yN/r/lhltfEJTTYj.png',
    'https://www.facebook.com/rsrc.php/v3/yU/r/n93MoBZD7fU.png',
    'https://www.facebook.com/rsrc.php/v3/yJ/r/_xLB5kZsJ63.png',
    'https://www.facebook.com/rsrc.php/v3/ym/r/KRk8EehrpjO.png',
    'https://www.facebook.com/rsrc.php/v3/yH/r/oyO8OjcaqSp.png',
    'https://www.facebook.com/rsrc.php/v3/yw/r/iiy40TSF95R.png',
    'https://www.facebook.com/rsrc.php/v3/yG/r/RozqvGf0LV-.gif',
    'https://www.facebook.com/rsrc.php/v3/yc/r/K_BrTiD28l1.png',
    'https://www.facebook.com/rsrc.php/v3/yA/r/KgMjNNPJc5W.png',
    'https://www.facebook.com/rsrc.php/v3/y5/r/3zcUUUQYjb3.png',
    'https://www.facebook.com/rsrc.php/v3/y9/r/6K8v8Ju8kL2.png',
    'https://www.facebook.com/rsrc.php/v3/yC/r/wzjc71CPBlw.png',
  ];


  lib.isFacebookUI = function isFbUI(url) {
    return urls.includes(url);
  };

  self.initFbDone = true; // only initialize once
}());
