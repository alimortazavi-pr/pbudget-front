if(!self.define){let e,s={};const n=(n,c)=>(n=new URL(n+".js",c).href,s[n]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=n,e.onload=s,document.head.appendChild(e)}else e=n,importScripts(n),s()})).then((()=>{let e=s[n];if(!e)throw new Error(`Module ${n} didn’t register its module`);return e})));self.define=(c,a)=>{const i=e||("document"in self?document.currentScript.src:"")||location.href;if(s[i])return;let t={};const o=e=>n(e,i),r={module:{uri:i},exports:t,require:o};s[i]=Promise.all(c.map((e=>r[e]||o(e)))).then((e=>(a(...e),t)))}}define(["./workbox-588899ac"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/_next/static/chunks/209-1d85eec725f02b8b.js",revision:"1d85eec725f02b8b"},{url:"/_next/static/chunks/210-de7879de24b1f111.js",revision:"de7879de24b1f111"},{url:"/_next/static/chunks/397-20c076ab429ebc2d.js",revision:"20c076ab429ebc2d"},{url:"/_next/static/chunks/599-aca11bcc0c105afd.js",revision:"aca11bcc0c105afd"},{url:"/_next/static/chunks/666-dd3d1fcde82af083.js",revision:"dd3d1fcde82af083"},{url:"/_next/static/chunks/75fc9c18-0cf132890bf6dedc.js",revision:"0cf132890bf6dedc"},{url:"/_next/static/chunks/framework-114634acb84f8baa.js",revision:"114634acb84f8baa"},{url:"/_next/static/chunks/main-8e65c6fcee628a80.js",revision:"8e65c6fcee628a80"},{url:"/_next/static/chunks/pages/%5BbudgetId%5D-423f7cf93a9f4689.js",revision:"423f7cf93a9f4689"},{url:"/_next/static/chunks/pages/_app-28456922667d812c.js",revision:"28456922667d812c"},{url:"/_next/static/chunks/pages/_error-8353112a01355ec2.js",revision:"8353112a01355ec2"},{url:"/_next/static/chunks/pages/create-budget-8686205dbc9b05f5.js",revision:"8686205dbc9b05f5"},{url:"/_next/static/chunks/pages/get-started-ac627500cc083db0.js",revision:"ac627500cc083db0"},{url:"/_next/static/chunks/pages/index-d320ade616672c1f.js",revision:"d320ade616672c1f"},{url:"/_next/static/chunks/pages/profile-71c723e1e00c1c6e.js",revision:"71c723e1e00c1c6e"},{url:"/_next/static/chunks/pages/profile/categories-12df948a37504353.js",revision:"12df948a37504353"},{url:"/_next/static/chunks/polyfills-c67a75d1b6f99dc8.js",revision:"837c0df77fd5009c9e46d446188ecfd0"},{url:"/_next/static/chunks/webpack-62c02dad1a6a4cb4.js",revision:"62c02dad1a6a4cb4"},{url:"/_next/static/css/91db516229a934b5.css",revision:"91db516229a934b5"},{url:"/_next/static/media/yekan bakh en 01 hairline.74b1c4ec.woff",revision:"74b1c4ec"},{url:"/_next/static/media/yekan bakh en 02 thin.2cd162db.woff",revision:"2cd162db"},{url:"/_next/static/media/yekan bakh en 03 light.e6b6bbff.woff",revision:"e6b6bbff"},{url:"/_next/static/media/yekan bakh en 04 regular.30782d62.woff",revision:"30782d62"},{url:"/_next/static/media/yekan bakh en 05 medium.64dffc18.woff",revision:"64dffc18"},{url:"/_next/static/media/yekan bakh en 06 bold.0343a009.woff",revision:"0343a009"},{url:"/_next/static/media/yekan bakh en 07 heavy.60b978b4.woff",revision:"60b978b4"},{url:"/_next/static/media/yekan bakh en 08 fat.79735a4a.woff",revision:"79735a4a"},{url:"/_next/static/mu8E5yUVAu6c1u_iXEAcm/_buildManifest.js",revision:"c51836df919cdbab26a28334f0138306"},{url:"/_next/static/mu8E5yUVAu6c1u_iXEAcm/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/assets/icons/apple-touch-icon.png",revision:"09c8513398441021a8034981c28cbb73"},{url:"/assets/icons/icon-128x128.png",revision:"ec3bd40ce9e1a1218b0d09064525d17c"},{url:"/assets/icons/icon-144x144.png",revision:"7c3a9b24c783b6e2db064716a1c82176"},{url:"/assets/icons/icon-152x152.png",revision:"f4fedde5972e0d23b152ce104b767e88"},{url:"/assets/icons/icon-192x192.png",revision:"7337641ad5709f9fccc42e477c1309a5"},{url:"/assets/icons/icon-384x384.png",revision:"424efbd7f5f7e0d36035a6d3c81d4aad"},{url:"/assets/icons/icon-48x48.png",revision:"11735589409a8711319d5ef522dfbdfe"},{url:"/assets/icons/icon-512x512.png",revision:"400b086bf195a5fbca0fbcb7dadb5819"},{url:"/assets/icons/icon-72x72.png",revision:"bdb2c2f417e44012529329c7541f057b"},{url:"/assets/icons/icon-96x96.png",revision:"d211bc0d844eb3b2d93b3f31bbed90b7"},{url:"/favicon.ico",revision:"58490de525daffb869ad4e82ccbafcb4"},{url:"/manifest.json",revision:"848a61738da1800609156b5095bee70e"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:n,state:c})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));
