/* Offline status and safe app-shell registration. Records remain in existing local storage. */
(()=>{'use strict';
 const CSS=`#tb-connection{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 8px;font:600 10px/1.1 system-ui,sans-serif;background:#e7f4ed;color:#13553e;max-width:150px;white-space:nowrap}#tb-connection[data-offline="true"]{background:#fff1d8;color:#835010}#tb-connection:before{content:"";width:7px;height:7px;border-radius:50%;background:#1b9864}#tb-connection[data-offline="true"]:before{background:#d18a20}`;
 const style=document.createElement('style');style.textContent=CSS;document.head.append(style);
 const badge=document.createElement('span');badge.id='tb-connection';badge.setAttribute('role','status');badge.setAttribute('aria-live','polite');badge.title='Online status does not guarantee fresh data or successful synchronization';
 const header=document.querySelector('.app header');if(header){const alerts=header.querySelector('#alerts');header.insertBefore(badge,alerts||null)}
 function render(){const offline=!navigator.onLine;badge.dataset.offline=String(offline);badge.textContent=offline?'Offline · saved data':'Online · local data';badge.title=offline?'Offline: locally saved records and cached app screens remain available. External marine forecasts and rates will not refresh.':'Connected: records remain on this device. Live feeds and cloud sync are not yet configured.'}
 addEventListener('online',render);addEventListener('offline',render);render();
 if(!('serviceWorker'in navigator)||!isSecureContext)return;
 addEventListener('load',()=>{navigator.serviceWorker.register('./toolbox-sw.js',{scope:'./'}).then(reg=>{
   if(reg.waiting)reg.waiting.postMessage({type:'CHECK_VERSION'});
 }).catch(err=>console.warn('Toolbox offline setup unavailable:',err));});
})();
