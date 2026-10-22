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
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

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
    "url": "index.html",
    "revision": "7623490e0343f22514b415cbad16b302"
  }, {
    "url": "assets/purify.es-BZxk_wWO.js",
    "revision": null
  }, {
    "url": "assets/index.es--Nj1rqRZ.js",
    "revision": null
  }, {
    "url": "assets/index-DqRmo9WT.css",
    "revision": null
  }, {
    "url": "assets/index-BkjBE0PM.js",
    "revision": null
  }, {
    "url": "assets/html2canvas-Cfs1Hib9.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "25154f6a2c3110db1a6bb6f0942b9182"
  }, {
    "url": "icon.svg",
    "revision": "8416b15aad5a82ed6e23fc77b3f34c3d"
  }, {
    "url": "pwa-192x192.png",
    "revision": "0000b9f56f81774b3294142423e26ca1"
  }, {
    "url": "pwa-512x512.png",
    "revision": "ea9ab09aeb788c3c89976b2cfb4312f5"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "ea9ab09aeb788c3c89976b2cfb4312f5"
  }, {
    "url": "manifest.webmanifest",
    "revision": "b7ddc021dfcad5c33ead3100ee62ac55"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
