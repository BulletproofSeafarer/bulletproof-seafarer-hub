import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('dist/toolbox2.js','utf8');

test('unencrypted attachment writes fail closed before opening legacy database',()=>{
  assert.match(source,/async function photoOperation\(id,action,blob\)\{if\(action==='write'\)throw new Error\('Attachment saving is disabled until the encrypted vault is integrated/);
});

test('attachment save is rejected before plaintext document metadata is committed',()=>{
  const gate=source.indexOf('if(Object.values(pendingDocPhotos).some(value=>value instanceof Blob))');
  const metadata=source.indexOf('const item={id,title,category,issued,expiry,attachmentKind};');
  assert.ok(gate>0&&metadata>gate);
  assert.match(source.slice(gate,metadata),/No document or attachment was changed/);
});

test('legacy document attachment database is retained for migration',()=>{
  assert.match(source,/const PHOTO_DB='toolbox2-document-attachments-test-v1'/);
  assert.doesNotMatch(source,/deleteDatabase\(PHOTO_DB\)/);
});
