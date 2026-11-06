import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const crypto=require('../dist/toolbox-vault-crypto.cjs');
const {stageRecord,verifyRecord}=require('../dist/toolbox-vault-staging.cjs');
const passphrase='safe-test-passphrase-123';
function memoryStore(){const map=new Map();return {map,async get(k){return map.get(k)},async add(k,v){if(map.has(k))throw Error('Duplicate key');map.set(k,structuredClone(v))}}}
test('stage encrypted dummy metadata and verify persisted copy',async()=>{const store=memoryStore(),value={id:'dummy-1',title:'Sample'};assert.deepEqual(await stageRecord({store,crypto,passphrase,id:'dummy-1',value}),{id:'dummy-1',staged:true,verified:true});assert.deepEqual(await verifyRecord({store,crypto,passphrase,id:'dummy-1'}),value);assert.ok(!JSON.stringify([...store.map.values()]).includes('Sample'))});
test('staging never overwrites existing entry',async()=>{const store=memoryStore(),args={store,crypto,passphrase,id:'dummy-1',value:{dummy:true}};await stageRecord(args);await assert.rejects(stageRecord(args),/already exists/);assert.equal(store.map.size,1)});
test('wrong passphrase and tampered stored envelope fail',async()=>{const store=memoryStore(),args={store,crypto,passphrase,id:'dummy-1',value:{dummy:true}};await stageRecord(args);await assert.rejects(verifyRecord({...args,passphrase:'another-passphrase-123'}));const key='toolbox-stage-v1:dummy-1',e=store.map.get(key);e.data='AAAA';await assert.rejects(verifyRecord(args))});
test('invalid identifiers rejected before writes',async()=>{const store=memoryStore();await assert.rejects(stageRecord({store,crypto,passphrase,id:'../bad',value:{}}));assert.equal(store.map.size,0)});
test('failed persistence verification never reports success',async()=>{const store={async get(){return undefined},async add(){}};await assert.rejects(stageRecord({store,crypto,passphrase,id:'dummy-1',value:{}}),/persistence failed/)});
