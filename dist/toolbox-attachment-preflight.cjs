/* Toolbox 2.9 read-only attachment inventory; never creates or upgrades a database. */
(function(root){
'use strict';
const DB='toolbox2-document-attachments-test-v1',STORE='photos';
function inspectAttachments(idb=root.indexedDB){
 return new Promise((resolve,reject)=>{
  if(!idb) return reject(new Error('IndexedDB unavailable'));
  let finished=false,db=null,created=false;
  const request=idb.open(DB);
  function fail(message){if(finished)return;finished=true;try{db?.close()}catch{}reject(new Error(message))}
  request.onupgradeneeded=()=>{created=true;try{request.transaction.abort()}catch{}};
  request.onerror=()=>fail(created?'Legacy attachment database does not exist':'Cannot open legacy attachments');
  request.onsuccess=()=>{
   db=request.result;
   if(created)return fail('Legacy attachment database does not exist');
   if(!db.objectStoreNames.contains(STORE))return fail('Legacy attachment store missing');
   let tx;try{tx=db.transaction(STORE,'readonly')}catch{return fail('Cannot inspect attachment store')}
   const rows=[];const cursor=tx.objectStore(STORE).openCursor();
   cursor.onerror=()=>fail('Cannot read legacy attachments');
   cursor.onsuccess=()=>{
    const c=cursor.result;if(!c)return;
    if(typeof c.key!=='string'||!(c.value instanceof Blob)){try{tx.abort()}catch{}return fail('Unsupported legacy attachment')}
    rows.push({key:c.key,bytes:c.value.size,mime:c.value.type});c.continue();
   };
   tx.onabort=()=>fail('Attachment inspection interrupted');
   tx.onerror=()=>fail('Attachment inspection failed');
   tx.oncomplete=()=>{if(finished)return;finished=true;db.close();resolve({count:rows.length,totalBytes:rows.reduce((n,r)=>n+r.bytes,0),attachments:rows,readOnly:true})};
  };
 });
}
const api=Object.freeze({inspectAttachments});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.ToolboxAttachmentPreflight=api;
})(typeof globalThis!=='undefined'?globalThis:this);
