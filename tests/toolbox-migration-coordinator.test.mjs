import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const crypto=require('../dist/toolbox-vault-crypto.cjs');
const staging=require('../dist/toolbox-vault-staging.cjs');
const verification=require('../dist/toolbox-migration-verify.cjs');
const {prepare}=require('../dist/toolbox-migration-coordinator.cjs');
const passphrase='test-migration-passphrase-123';
function memory(){const rows=new Map();return {rows,async get(k){return rows.get(k)},async add(k,v){if(rows.has(k))throw Error('Duplicate');rows.set(k,structuredClone(v))}}}
const plan=[{id:'doc:demo',kind:'document'},{id:'photo:demo:page',kind:'attachment'}];
const values={'doc:demo':{id:'demo',type:'passport'},'photo:demo:page':{bytes:[0,12,255],mime:'image/jpeg'}};
test('complete dummy migration stages and verifies without legacy writes',async()=>{
 const store=memory(),legacy=JSON.stringify(values);
 const result=await prepare({plan,values,store,crypto,passphrase,staging,verification});
 assert.deepEqual(result,{ready:true,stagedCount:2,verifiedCount:2,legacyUntouched:true});
 assert.equal(JSON.stringify(values),legacy);
 assert.equal(store.rows.size,2);
});
test('missing source attachment fails before reporting readiness',async()=>{
 const store=memory();
 await assert.rejects(prepare({plan,values:{'doc:demo':values['doc:demo']},store,crypto,passphrase,staging,verification}),/Missing source/);
 assert.equal(store.rows.size,1);
});
test('duplicate staging never overwrites a previous encrypted record',async()=>{
 const store=memory(),args={plan,values,store,crypto,passphrase,staging,verification};
 await prepare(args);
 const snapshot=JSON.stringify([...store.rows.values()]);
 await assert.rejects(prepare(args),/already exists/);
 assert.equal(JSON.stringify([...store.rows.values()]),snapshot);
});
