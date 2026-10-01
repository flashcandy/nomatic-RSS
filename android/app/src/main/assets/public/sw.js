/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-b1bafff1'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "0decb1cbb0acdc332852bc208eacc57e"
  }, {
    "url": "pwa-512x512.png",
    "revision": "ec1c740f495b8a56183b227c5383cde8"
  }, {
    "url": "pwa-192x192.png",
    "revision": "120944ec2c7b4ccf60a86ea97d59f8ed"
  }, {
    "url": "index.html",
    "revision": "ce58d43347c24102f82072f5c69b107e"
  }, {
    "url": "icon.svg",
    "revision": "4294dee6d2a73a10642ec98b84041344"
  }, {
    "url": "icon-maskable.svg",
    "revision": "643869bd04979ff196c770f1259b2ec7"
  }, {
    "url": "favicon.png",
    "revision": "9456c3bb9c6c19423cd4f268d159c6f4"
  }, {
    "url": "favicon.ico",
    "revision": "a4ee0e3ac5540f94f1e207702fe4e51c"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "e8558617a57b6989d5895463844889b0"
  }, {
    "url": "assets/web-EXdVzjyV.js",
    "revision": null
  }, {
    "url": "assets/web-Dd_mdpCL.js",
    "revision": null
  }, {
    "url": "assets/web-D-NJXaKB.js",
    "revision": null
  }, {
    "url": "assets/index-DaJfzpln.css",
    "revision": null
  }, {
    "url": "assets/index-CaGxHvJe.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "e8558617a57b6989d5895463844889b0"
  }, {
    "url": "favicon.ico",
    "revision": "a4ee0e3ac5540f94f1e207702fe4e51c"
  }, {
    "url": "icon.svg",
    "revision": "4294dee6d2a73a10642ec98b84041344"
  }, {
    "url": "pwa-192x192.png",
    "revision": "120944ec2c7b4ccf60a86ea97d59f8ed"
  }, {
    "url": "pwa-512x512.png",
    "revision": "ec1c740f495b8a56183b227c5383cde8"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "0decb1cbb0acdc332852bc208eacc57e"
  }, {
    "url": "manifest.webmanifest",
    "revision": "f03bf1998fa1a98c99bb6498b88c0220"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/img\.alternativeto\.net\/.*/i, new workbox.StaleWhileRevalidate({
    "cacheName": "feed-images-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
