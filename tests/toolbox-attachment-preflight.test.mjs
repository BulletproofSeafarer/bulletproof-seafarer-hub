import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {inspectAttachments}=require('../dist/toolbox-attachment-preflight.cjs');
test('missing IndexedDB fails closed',async()=>await assert.rejects(inspectAttachments(null),/IndexedDB unavailable/));
test('missing legacy database aborts attempted creation',async()=>{
 let aborted=false;
 const fake={open(){const request={};queueMicrotask(()=>{request.transaction={abort(){aborted=true}};request.onupgradeneeded();request.onerror()});return request}};
 await assert.rejects(inspectAttachments(fake),/does not exist/);
 assert.equal(aborted,true);
});
test('open failure does not silently report zero attachments',async()=>{
 const fake={open(){const request={};queueMicrotask(()=>request.onerror());return request}};
 await assert.rejects(inspectAttachments(fake),/Cannot open/);
});
