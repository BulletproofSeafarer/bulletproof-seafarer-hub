/* Encrypted document attachment vault. Separate from legacy photo storage.
   Passphrases and plaintext never enter persistent storage. */
(function(root){
'use strict';
const DB='toolbox-document-vault-v1',STORE='attachments';
function createVault({idb=root.indexedDB,crypto=root.ToolboxVaultCrypto}={}){
 if(!idb||!crypto?.seal||!crypto?.open)throw Error('Encrypted vault unavailable');
 function connect(){return new Promise((resolve,reject)=>{
  const req=idb.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};
  req.onerror=()=>reject(req.error||Error('Vault unavailable'));
  req.onblocked=()=>reject(Error('Vault blocked by another tab'));
  req.onsuccess=()=>resolve(req.result);
 })}
 async function transact(mode,method,key,value){
  const db=await connect();
  return new Promise((resolve,reject)=>{
   let result,settled=false;
   const fail=()=>{if(settled)return;settled=true;db.close();reject(Error('Vault transaction failed'))};
   try{
    const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
    const req=method==='put'?store.put(value,key):store[method](key);
    req.onsuccess=()=>{result=req.result};
    req.onerror=()=>{};
    tx.oncomplete=()=>{if(settled)return;settled=true;db.close();resolve(result)};
    tx.onabort=fail;tx.onerror=fail;
   }catch{fail()}
  });
 }
 function keyFor(id,side){
  if(typeof id!=='string'||!id||id.length>120||!/^[a-zA-Z0-9_-]+$/.test(id))throw Error('Invalid document ID');
  if(!['front','back','page'].includes(side))throw Error('Invalid document side');
  return id+'::'+side;
 }
 async function save(id,side,blob,passphrase){
  const key=keyFor(id,side);
  if(!(blob instanceof Blob)||blob.size>8*1024*1024||blob.size===0)throw Error('Invalid attachment');
  if(!['application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(blob.type))throw Error('Unsupported attachment type');
  const bytes=new Uint8Array(await blob.arrayBuffer());
  try{
   const envelope=await crypto.seal(bytes,passphrase,key);
   const verify=await crypto.open(envelope,passphrase,key);
   try{if(verify.length!==bytes.length||verify.some((v,i)=>v!==bytes[i]))throw Error('Encryption verification failed')}
   finally{verify.fill(0)}
   await transact('readwrite','put',key,{envelope,type:blob.type,size:blob.size});
   return {encrypted:true,id,side,size:blob.size};
  }finally{bytes.fill(0)}
 }
 async function read(id,side,passphrase){
  const key=keyFor(id,side),stored=await transact('readonly','get',key);
  if(!stored)return null;
  const bytes=await crypto.open(stored.envelope,passphrase,key);
  try{
   if(bytes.length!==stored.size)throw Error('Attachment integrity mismatch');
   return new Blob([bytes],{type:stored.type});
  }finally{bytes.fill(0)}
 }
 return Object.freeze({save,read,remove:(id,side)=>transact('readwrite','delete',keyFor(id,side))});
}
const api=Object.freeze({createVault,DB,STORE});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.ToolboxDocumentVault=api;
})(typeof globalThis!=='undefined'?globalThis:this);
