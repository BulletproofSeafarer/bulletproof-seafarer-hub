/* Toolbox 2.9 encrypted staging protocol. Isolated from live document storage.
   Staging never deletes or modifies legacy records. No automatic promotion. */
(function(root){
'use strict';
const PREFIX='toolbox-stage-v1:';
function validateId(id){if(typeof id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9:_-]{0,119}$/.test(id))throw Error('Invalid staging identifier')}
function validateStore(store){if(!store||!['get','put'].every(k=>typeof store[k]==='function'))throw Error('Staging store unavailable')}
async function stageRecord({store,crypto,passphrase,id,value}){
 validateId(id);validateStore(store);
 if(!crypto||typeof crypto.sealJSON!=='function'||typeof crypto.openJSON!=='function')throw Error('Vault encryption unavailable');
 const key=PREFIX+id;
 if(await store.get(key)!==undefined)throw Error('Staging entry already exists');
 const envelope=await crypto.sealJSON(value,passphrase,key);
 const verified=await crypto.openJSON(envelope,passphrase,key);
 if(JSON.stringify(verified)!==JSON.stringify(value))throw Error('Encrypted staging verification failed');
 await store.put(key,envelope);
 const saved=await store.get(key);
 if(!saved)throw Error('Staging persistence failed');
 const reread=await crypto.openJSON(saved,passphrase,key);
 if(JSON.stringify(reread)!==JSON.stringify(value))throw Error('Persisted staging verification failed');
 return {id,staged:true,verified:true};
}
async function verifyRecord({store,crypto,passphrase,id}){
 validateId(id);validateStore(store);
 const key=PREFIX+id,envelope=await store.get(key);
 if(!envelope)throw Error('Staging entry missing');
 return crypto.openJSON(envelope,passphrase,key);
}
const api=Object.freeze({stageRecord,verifyRecord});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.ToolboxVaultStaging=api;
})(typeof globalThis!=='undefined'?globalThis:this);
