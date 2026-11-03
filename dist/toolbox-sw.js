/* Toolbox offline shell. No personal records or third-party/API responses are cached. */
const VERSION='toolbox-shell-2.3.10';
const CORE=['./toolbox2.html','./toolbox2.css','./toolbox2.js','./toolbox-onboarding.css','./toolbox-onboarding.js','./toolbox-print.js','./toolbox-career.js','./toolbox-utilities.css','./toolbox-utilities.js','./toolbox-offline.js','./assets/toolbox-icon-192.png'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(VERSION);
 await Promise.all(CORE.map(async path=>{try{const res=await fetch(path,{cache:'reload'});if(res.ok)await cache.put(path,res)}catch(e){/* missing optional resource should not block installation */}}));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('toolbox-shell-')&&key!==VERSION)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;
 const url=new URL(req.url);if(url.origin!==self.location.origin)return;
 const scope=new URL(self.registration.scope);
 if(!url.pathname.startsWith(scope.pathname))return;
 const isCore=CORE.some(p=>new URL(p,scope).pathname===url.pathname);
 const isEntry=url.pathname===scope.pathname||url.pathname===new URL('./index.html',scope).pathname;
 if(!isCore&&!isEntry)return;
 event.respondWith((async()=>{
 const cache=await caches.open(VERSION);
 if(isEntry){try{const response=await fetch(req);if(response.ok)await cache.put('./toolbox2.html',response.clone());return response}catch{return await cache.match('./toolbox2.html')||Response.error()}}
 // Network-first while connected: prevents a stale Home bundle after deployment.
 try{const response=await fetch(req,{cache:'no-store'});if(response.ok){await cache.put(req,response.clone());return response}}catch(e){}
 return await cache.match(req,{ignoreSearch:true})||await cache.match(url.pathname)||Response.error();
 })());
});
