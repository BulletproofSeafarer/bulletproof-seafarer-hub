import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const crypto=require('../dist/toolbox-vault-crypto.cjs');
const {stageRecord,verifyRecord}=require('../dist/toolbox-vault-staging.cjs');
const passphrase='dummy-migration-passphrase-123';
function store(){const rows=new Map();return {rows,async get(k){return rows.get(k)},async add(k,v){if(rows.has(k))throw Error('Duplicate');rows.set(k,structuredClone(v))}}}
test('realistic dummy metadata and binary attachment can stage and recover independently',async()=>{
 const storage=store();
 const metadata={id:'demo-passport',type:'passport',expiry:'2030-06-01',attachmentIds:['demo-passport:page']};
 const bytes=new Uint8Array([0,255,128,42,11,9]);
 const attachment={documentId:'demo-passport',side:'page',mime:'image/jpeg',bytes:Array.from(bytes)};
 await stageRecord({store:storage,crypto,passphrase,id:'doc:demo-passport',value:metadata});
 await stageRecord({store:storage,crypto,passphrase,id:'photo:demo-passport:page',value:attachment});
 assert.deepEqual(await verifyRecord({store:storage,crypto,passphrase,id:'doc:demo-passport'}),metadata);
 const recovered=await verifyRecord({store:storage,crypto,passphrase,id:'photo:demo-passport:page'});
 assert.deepEqual(new Uint8Array(recovered.bytes),bytes);
 assert.equal(storage.rows.size,2);
 assert.ok(!JSON.stringify([...storage.rows.values()]).includes('2030-06-01'));
});
test('corrupt attachment prevents successful recovery while metadata stays recoverable',async()=>{
 const storage=store();
 await stageRecord({store:storage,crypto,passphrase,id:'doc:demo',value:{id:'demo'}});
 await stageRecord({store:storage,crypto,passphrase,id:'photo:demo:page',value:{bytes:[1,2,3]}});
 storage.rows.get('toolbox-stage-v1:photo:demo:page').data='AAAA';
 await assert.rejects(verifyRecord({store:storage,crypto,passphrase,id:'photo:demo:page'}));
 assert.deepEqual(await verifyRecord({store:storage,crypto,passphrase,id:'doc:demo'}),{id:'demo'});
});
