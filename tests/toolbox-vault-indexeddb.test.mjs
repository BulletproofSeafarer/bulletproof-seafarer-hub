import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createStore,DB,STORE}=require('../dist/toolbox-vault-indexeddb.cjs');
test('staging adapter uses its own database and encrypted envelope store',()=>{assert.equal(DB,'toolbox-vault-staging-v1');assert.equal(STORE,'envelopes')});
test('unavailable IndexedDB fails closed',()=>assert.throws(()=>createStore(null),/unavailable/));
test('open failure does not report success',async()=>{
 const idb={open(){const req={};queueMicrotask(()=>req.onerror());return req}};
 await assert.rejects(createStore(idb).get('dummy'),/Unable to open/);
});
test('blocked database does not report success',async()=>{
 const idb={open(){const req={};queueMicrotask(()=>req.onblocked());return req}};
 await assert.rejects(createStore(idb).add('dummy',{data:'encrypted'}),/blocked/);
});
