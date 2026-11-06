import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const vault=require('../dist/toolbox-vault-crypto.cjs');
const {createStore}=require('../dist/toolbox-vault-indexeddb.cjs');
const {stageRecord,verifyRecord}=require('../dist/toolbox-vault-staging.cjs');
function fakeIndexedDB(){
 const records=new Map(),flags={abortNext:false,opens:0,closes:0};
 const db={objectStoreNames:{contains:()=>true},close(){flags.closes++},transaction(_store,mode){
  const tx={oncomplete:null,onabort:null,onerror:null,objectStore(){return {
   get(key){const req={};queueMicrotask(()=>{req.result=structuredClone(records.get(key));req.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.())});return req},
   add(value,key){const req={};queueMicrotask(()=>{
    if(flags.abortNext||records.has(key)){flags.abortNext=false;req.onerror?.();queueMicrotask(()=>tx.onabort?.());return}
    records.set(key,structuredClone(value));req.result=key;req.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.());
   });return req}
  }}};
  return tx;
 }};
 return {flags,records,open(){flags.opens++;const req={result:db};queueMicrotask(()=>req.onsuccess?.());return req}};
}
const passphrase='test-staging-passphrase-123';
test('persist encrypted dummy record and verify after reopening',async()=>{
 const idb=fakeIndexedDB(),value={id:'sample-1',title:'Dummy voyage document'};
 await stageRecord({store:createStore(idb),crypto:vault,passphrase,id:'sample-1',value});
 const recovered=await verifyRecord({store:createStore(idb),crypto:vault,passphrase,id:'sample-1'});
 assert.deepEqual(recovered,value);
 assert.ok(!JSON.stringify([...idb.records.values()]).includes('Dummy voyage document'));
 assert.equal(idb.flags.opens,4);
 assert.equal(idb.flags.closes,4);
});
test('duplicate staging entry fails without overwriting',async()=>{
 const idb=fakeIndexedDB(),store=createStore(idb),args={store,crypto:vault,passphrase,id:'sample-1',value:{test:1}};
 await stageRecord(args);const snapshot=JSON.stringify([...idb.records.values()]);
 await assert.rejects(stageRecord(args),/already exists/);
 assert.equal(JSON.stringify([...idb.records.values()]),snapshot);
});
test('interrupted write is rejected and can be retried safely',async()=>{
 const idb=fakeIndexedDB(),store=createStore(idb),args={store,crypto:vault,passphrase,id:'sample-1',value:{test:1}};
 idb.flags.abortNext=true;
 await assert.rejects(stageRecord(args),/transaction failed/);
 assert.equal(idb.records.size,0);
 await stageRecord(args);
 assert.deepEqual(await verifyRecord(args),{test:1});
});
test('wrong recovery passphrase does not reveal record',async()=>{
 const idb=fakeIndexedDB(),store=createStore(idb),args={store,crypto:vault,passphrase,id:'sample-1',value:{test:1}};
 await stageRecord(args);
 await assert.rejects(verifyRecord({...args,passphrase:'incorrect-passphrase-123'}));
});
