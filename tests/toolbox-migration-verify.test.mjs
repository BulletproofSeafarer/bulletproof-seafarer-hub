import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const crypto=require('../dist/toolbox-vault-crypto.cjs');
const {stageRecord}=require('../dist/toolbox-vault-staging.cjs');
const {verifyPlan,validatePlan}=require('../dist/toolbox-migration-verify.cjs');
const passphrase='dummy-migration-passphrase-123';
function store(){const map=new Map();return {map,async get(k){return map.get(k)},async add(k,v){if(map.has(k))throw Error('Duplicate');map.set(k,structuredClone(v))}}}
const plan=[{id:'doc:sample',kind:'document'},{id:'photo:sample:page',kind:'attachment'}];
test('full encrypted dummy migration set verifies',async()=>{
 const s=store();
 await stageRecord({store:s,crypto,passphrase,id:plan[0].id,value:{id:'sample',title:'Dummy'}});
 await stageRecord({store:s,crypto,passphrase,id:plan[1].id,value:{bytes:[0,128,255],mime:'image/jpeg'}});
 const result=await verifyPlan({plan,store:s,crypto,passphrase});
 assert.equal(result.ready,true);assert.equal(result.verifiedCount,2);
});
test('missing attachment blocks migration readiness',async()=>{
 const s=store();await stageRecord({store:s,crypto,passphrase,id:plan[0].id,value:{id:'sample'}});
 await assert.rejects(verifyPlan({plan,store:s,crypto,passphrase}),/missing/);
});
test('corrupted attachment blocks migration readiness',async()=>{
 const s=store();
 await stageRecord({store:s,crypto,passphrase,id:plan[0].id,value:{id:'sample'}});
 await stageRecord({store:s,crypto,passphrase,id:plan[1].id,value:{bytes:[1,2]}});
 s.map.get('toolbox-stage-v1:'+plan[1].id).data='AAAA';
 await assert.rejects(verifyPlan({plan,store:s,crypto,passphrase}));
});
test('duplicate or invalid migration plans rejected',()=>{
 assert.throws(()=>validatePlan([]),/empty/);
 assert.throws(()=>validatePlan([plan[0],plan[0]]),/duplicate/);
 assert.throws(()=>validatePlan([{id:'x',kind:'unknown'}]),/Invalid/);
});
