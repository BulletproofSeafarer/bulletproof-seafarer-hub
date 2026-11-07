/* Toolbox offline shell. No personal records or third-party/API responses are cached. */
importScripts('./offline-assets.js');
const VERSION='toolbox-shell-'+toolboxOfflineAssets.version+'-'+toolboxOfflineAssets.studyVersion;
const CORE=[...toolboxOfflineAssets.core,...toolboxOfflineAssets.extra].filter(path=>
 path==='review-bank.js'||path==='assets/bulletproof-seafarer-official.png'||/^(assets\/review\/.+\.pdf$|toolbox|assets\/toolbox|assets\/learning\/[^/]+\.json$)/.test(path)
);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(VERSION);
 const files=CORE.filter(path=>!path.endsWith('.cjs'));
 async function cacheFile(path){
  const response=await fetch(new URL(path,self.registration.scope),{cache:'reload'});
  if(!response.ok)throw Error('Unable to cache '+path);
  // Clean-URL hosts redirect the HTML entry. Offline navigations need a direct response.
  await cache.put(path,response.redirected?new Response(response.body,{headers:response.headers,status:response.status}):response);
 }
 for(let i=0;i<files.length;i+=6)await Promise.all(files.slice(i,i+6).map(cacheFile));
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
 const isEntry=url.pathname===new URL('./toolbox2',scope).pathname||url.pathname===scope.pathname||url.pathname===new URL('./index.html',scope).pathname;
 if(!isCore&&!isEntry)return;
 event.respondWith((async()=>{
 const cache=await caches.open(VERSION);
 if(isEntry){try{return await fetch(req)}catch{return await cache.match('./toolbox2.html')||Response.error()}}
 // Network-first while connected: prevents a stale Home bundle after deployment.
 try{const response=await fetch(req,{cache:'no-store'});if(response.ok){await cache.put(req,response.clone());return response}}catch(e){}
 return await cache.match(req,{ignoreSearch:true})||await cache.match(url.pathname)||Response.error();
 })());
});
