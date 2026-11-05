import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
globalThis.crypto=webcrypto;
const vault=require('../dist/toolbox-vault-crypto.cjs');
test('vault seals and opens JSON',async()=>{const value={title:'Dummy passport',expiry:'2030-01-01'};const envelope=await vault.sealJSON(value,'a-long-test-passphrase','doc-1');assert.deepEqual(await vault.openJSON(envelope,'a-long-test-passphrase','doc-1'),value);assert.equal(envelope.format,'toolbox-local-vault-v1');assert.ok(!JSON.stringify(envelope).includes('Dummy passport'))});
test('wrong passphrase, changed id and tampering fail',async()=>{const envelope=await vault.sealJSON({dummy:1},'a-long-test-passphrase','doc-1');await assert.rejects(vault.openJSON(envelope,'wrong-passphrase-long','doc-1'));await assert.rejects(vault.openJSON(envelope,'a-long-test-passphrase','doc-2'));const damaged=Buffer.from(envelope.data,'base64');damaged[0]^=1;const altered={...envelope,data:damaged.toString('base64')};await assert.rejects(vault.openJSON(altered,'a-long-test-passphrase','doc-1'))});
test('unique salt and iv for each encryption',async()=>{const a=await vault.sealJSON({x:1},'a-long-test-passphrase','doc-1'),b=await vault.sealJSON({x:1},'a-long-test-passphrase','doc-1');assert.notEqual(a.salt,b.salt);assert.notEqual(a.iv,b.iv);assert.notEqual(a.data,b.data)});
test('reject short passphrases',async()=>{await assert.rejects(vault.sealJSON({x:1},'short','doc-1'))});

test('reject altered metadata and malformed envelope',async()=>{const e=await vault.sealJSON({dummy:true},'a-long-test-passphrase','doc-1');for(const change of [{iterations:1},{version:2},{cipher:'AES-128-GCM'},{salt:'AA=='},{iv:'AA=='},{data:'%%%'}])await assert.rejects(vault.openJSON({...e,...change},'a-long-test-passphrase','doc-1'))});
test('binary attachment round trip',async()=>{const original=new Uint8Array([0,1,2,128,255]);const e=await vault.seal(original,'a-long-test-passphrase','attachment-1');assert.deepEqual(await vault.open(e,'a-long-test-passphrase','attachment-1'),original)});
