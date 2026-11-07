/* Offline status and safe app-shell registration. Records remain in existing local storage. */
(()=>{'use strict';
 const CSS=`#tb-connection{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 8px;font:600 10px/1.1 system-ui,sans-serif;background:#e7f4ed;color:#13553e;max-width:150px;white-space:nowrap}#tb-connection[data-offline="true"]{background:#fff1d8;color:#835010}#tb-connection:before{content:"";width:7px;height:7px;border-radius:50%;background:#1b9864}#tb-connection[data-offline="true"]:before{background:#d18a20}`;
 const style=document.createElement('style');style.textContent=CSS;document.head.append(style);
 const badge=document.createElement('span');badge.id='tb-connection';badge.setAttribute('role','status');badge.setAttribute('aria-live','polite');badge.title='Online status does not guarantee fresh data or successful synchronization';
 const header=document.querySelector('.app header');if(header){const alerts=header.querySelector('#alerts');header.insertBefore(badge,alerts||null)}
 let ready=false,failed=false;function render(){const offline=!navigator.onLine;badge.dataset.offline=String(offline);badge.textContent=ready?(offline?'Offline':'Ready offline'):failed?'Offline setup failed':'Preparing offline…';badge.title=offline?'Offline: locally saved records and cached app screens remain available. External marine forecasts and rates will not refresh.':'Connected: records remain on this device. Live feeds and cloud sync are not yet configured.'}
 addEventListener('online',render);addEventListener('offline',render);render();
 async function setup(){
  try{
   const reg=await navigator.serviceWorker.register('./toolbox-sw.js',{scope:'./',updateViaCache:'none'});
   const worker=reg.installing||reg.waiting||reg.active;
   function check(){ready=worker?.state==='activated';failed=!worker||worker.state==='redundant';render()}
   worker?.addEventListener('statechange',check);check();
  }catch{failed=true;render()}
 }
 setup();
})();
