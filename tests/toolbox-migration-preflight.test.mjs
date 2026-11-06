import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {inspectMetadata}=require('../dist/toolbox-migration-preflight.cjs');
const storage=(value)=>({getItem:()=>value});
test('missing legacy records are safe to inspect',()=>assert.deepEqual(inspectMetadata(storage(null)),{present:false,count:0,ids:[]}));
test('valid dummy records inspected without mutation',()=>{const raw=JSON.stringify([{id:'dummy-1',title:'Dummy record'}]);const source=storage(raw);assert.deepEqual(inspectMetadata(source),{present:true,count:1,ids:['dummy-1']});assert.equal(source.getItem(),raw)});
test('malformed or unsupported metadata stops preflight',()=>{for(const raw of ['{','{}','[null]','[{}]','[{"id":"a"},{"id":"a"}]'])assert.throws(()=>inspectMetadata(storage(raw)))});
