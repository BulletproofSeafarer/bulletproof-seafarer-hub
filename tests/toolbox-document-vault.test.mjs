import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
const crypto=require('../dist/toolbox-vault-crypto.cjs');
const {createVault,DB,STORE}=require('../dist/toolbox-document-vault.cjs');
function fakeIDB(){
 const records=new Map();let writes=0;
 const db={objectStoreNames:{contains:()=>true},close(){},transaction(){
  const tx={oncomplete:null,onabort:null,onerror:null,objectStore(){return {
   put(value,key){writes++;records.set(key,value);const req={result:key};queueMicrotask(()=>{req.onsuccess?.();tx.oncomplete?.()});return req},
   get(key){const req={result:records.get(key)};queueMicrotask(()=>{req.onsuccess?.();tx.oncomplete?.()});return req}
  }}};return tx}};
 return {records,get writes(){return writes},open(){const req={result:db};queueMicrotask(()=>req.onsuccess?.());return req}};
}
test('encrypted vault round trip never stores plaintext or passphrase',async()=>{
 const idb=fakeIDB(),vault=createVault({idb,crypto});
 const blob=new Blob(['synthetic document only'],{type:'application/pdf'});
 await vault.save('test-record','page',blob,'a long test passphrase 123');
 assert.equal(idb.writes,1);
 const stored=idb.records.get('test-record::page');
 assert.equal(stored.envelope.cipher,'AES-256-GCM');
 assert.ok(!JSON.stringify(stored).includes('synthetic document only'));
 assert.ok(!JSON.stringify(stored).includes('a long test passphrase 123'));
 const restored=await vault.read('test-record','page','a long test passphrase 123');
 assert.equal(await restored.text(),'synthetic document only');
 assert.equal(DB,'toolbox-document-vault-v1');
 assert.equal(STORE,'attachments');
});
test('wrong passphrase and wrong record binding cannot decrypt',async()=>{
 const idb=fakeIDB(),vault=createVault({idb,crypto});
 await vault.save('test-record','front',new Blob(['synthetic'],{type:'image/png'}),'a long test passphrase 123');
 await assert.rejects(()=>vault.read('test-record','front','different passphrase 123'));
 idb.records.set('another-record::front',idb.records.get('test-record::front'));
 await assert.rejects(()=>vault.read('another-record','front','a long test passphrase 123'));
});
test('invalid attachments are rejected without writes',async()=>{
 const idb=fakeIDB(),vault=createVault({idb,crypto});
 await assert.rejects(()=>vault.save('bad/id','page',new Blob(['x'],{type:'image/png'}),'a long test passphrase 123'));
 await assert.rejects(()=>vault.save('ok','unknown',new Blob(['x'],{type:'image/png'}),'a long test passphrase 123'));
 await assert.rejects(()=>vault.save('ok','page',new Blob(['x'],{type:'text/plain'}),'a long test passphrase 123'));
 assert.equal(idb.writes,0);
});
