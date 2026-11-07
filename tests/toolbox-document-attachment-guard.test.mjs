import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import cryptoEngine from '../dist/toolbox-vault-crypto.js';
import {createRequire} from 'node:module';
const {createVault}=createRequire(import.meta.url)('../dist/toolbox-document-vault.js');
const read=name=>readFileSync('dist/'+name,'utf8');
function fixture(){
 const legacy=new Map(),cipher=new Map(),state={records:[{id:'doc-test',title:'Sample'}],fail:false};
 const idb={open(){const req={result:{close(){},transaction(){
  const tx={objectStore:()=>({get:key=>request(cipher.get(key)),put:(value,key)=>request(cipher.set(key,value)),delete:key=>request(cipher.delete(key))})};
  function request(result){const op={result};queueMicrotask(()=>{op.onsuccess?.();tx.oncomplete()});return op}
  return tx;
 }}};queueMicrotask(()=>req.onsuccess());return req}};
 function reopen(){
  const ctx=vm.createContext({crypto:webcrypto,Blob,Uint8Array,navigator:{locks:{request:(_,fn)=>fn()}},
   ToolboxDocumentVault:{createVault:()=>createVault({idb,crypto:cryptoEngine})},
   docRecords:()=>structuredClone(state.records),saveDocRecords:records=>{if(state.fail)return false;state.records=records;return true},
   legacyPhoto:async(key,action)=>action==='read'?legacy.get(key):legacy.delete(key)});
  vm.runInContext(read('toolbox-document-files.js'),ctx);
  const src=read('toolbox2.js');vm.runInContext(src.slice(src.indexOf('async function photoOperation'),src.indexOf('\n}',src.indexOf('async function photoOperation'))+2),ctx);
  ctx.documentPassphrase=async()=>'sample recovery passphrase';
  return ctx;
 }
 return {state,legacy,cipher,reopen};
}
test('saving migrates an unsuffixed legacy page and reopens both encrypted attachments',async()=>{
 const f=fixture(),blob=new Blob(['synthetic page'],{type:'application/pdf'});
 f.legacy.set('doc-test',blob);
 await f.reopen().saveVaultDocument(f.state.records[0],{front:blob},false);
 assert.equal(f.legacy.size,0);
 const reader=f.reopen();
 for(const side of ['page','front'])assert.equal(await (await reader.photoOperation('doc-test::'+side,'read')).text(),'synthetic page');
 reader.documentPassphrase=async()=>'incorrect passphrase';
 await assert.rejects(reader.photoOperation('doc-test::page','read'));
 assert.doesNotMatch(JSON.stringify([...f.cipher.values()]),/synthetic page/);
});
test('failed metadata commit keeps legacy data available for a retry',async()=>{
 const f=fixture();f.legacy.set('doc-test',new Blob(['dummy'],{type:'application/pdf'}));
 f.state.fail=true;
 await assert.rejects(f.reopen().saveVaultDocument(f.state.records[0],{},false));
 assert.equal(f.cipher.size,0);assert.equal(f.legacy.size,1);
 f.state.fail=false;await f.reopen().saveVaultDocument(f.state.records[0],{},false);
 assert.equal(f.legacy.size,0);
});
