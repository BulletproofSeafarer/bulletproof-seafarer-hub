/* Toolbox 2.9 isolated IndexedDB encrypted staging adapter.
   Separate database; no access to legacy document stores. */
(function(root){
'use strict';
const DB='toolbox-vault-staging-v1',STORE='envelopes';
function createStore(idb=root.indexedDB){
 if(!idb)throw Error('IndexedDB unavailable');
 function open(){
  return new Promise((resolve,reject)=>{
   const request=idb.open(DB,1);
   request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};
   request.onerror=()=>reject(new Error('Unable to open encrypted staging'));
   request.onblocked=()=>reject(new Error('Encrypted staging database blocked'));
   request.onsuccess=()=>resolve(request.result);
  });
 }
 async function operation(mode,method,key,value){
  const db=await open();
  return new Promise((resolve,reject)=>{
   let done=false,result;
   const fail=()=>{if(done)return;done=true;db.close();reject(new Error('Encrypted staging transaction failed'))};
   let tx,request;
   try{tx=db.transaction(STORE,mode);request=tx.objectStore(STORE)[method](...(method==='add'?[value,key]:[key]))}
   catch{fail();return}
   request.onsuccess=()=>{result=request.result};
   request.onerror=()=>{}; // Transaction abort is authoritative; no premature success.
   tx.oncomplete=()=>{if(done)return;done=true;db.close();resolve(result)};
   tx.onabort=fail;tx.onerror=fail;
  });
 }
 return Object.freeze({
  async get(key){return operation('readonly','get',key)},
  async add(key,value){return operation('readwrite','add',key,value)}
 });
}
const api=Object.freeze({createStore,DB,STORE});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.ToolboxVaultIndexedDB=api;
})(typeof globalThis!=='undefined'?globalThis:this);
