import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const asset = path => readFileSync('dist/'+path,'utf8');
const audit = JSON.parse(readFileSync('review-import-audit.json','utf8'));
const practice = JSON.parse(asset('assets/learning/oic-practice.json')).questions;

test('bell and five dock buttons include their original artwork in the preview entry',()=>{
  const html=asset('toolbox2.html'), sprite=asset('toolbox-icons.svg');
  for(const [selector,id] of Object.entries({'id="alerts"':'reminders','data-tab="home"':'home','data-tab="learn"':'learn','data-tab="create"':'create','data-tab="documents"':'documents','data-tab="account"':'profile'})){
    const button=html.split(selector)[1].split('</button>')[0];
    const artwork=sprite.split('<symbol id="'+id+'" viewBox="0 0 24 24">')[1].split('</symbol>')[0];
    assert.ok(button.includes(artwork),id);
  }
});

test('Learn recovers both complete OIC tracks when the reviewer script is unavailable',async()=>{
  const handlers=[];
  const root={addEventListener(type,fn){if(type==='click')handlers.push(fn)}};
  let allowBank=false;
  const ctx={
    document:{getElementById:()=>root,querySelector:()=>true,querySelectorAll:()=>[],addEventListener(){}},
    MutationObserver:class{observe(){}},window:{},ToolboxScreens:{visit(){}},toolboxGlyph:()=>'',localStorage:{getItem:()=>null},
    fetch:async path=>({ok:allowBank||!path.match(/oic-(nw|ew)/),json:async()=>JSON.parse(asset(path))})
  };
  runInNewContext(asset('toolbox-voyage.js'),ctx);
  runInNewContext(asset('toolbox-learn.js'),ctx);
  await new Promise(resolve=>setImmediate(resolve));
  function click(target){return Promise.all(handlers.map(fn=>fn({target,stopImmediatePropagation(){}})))}
  function open(track){return click({closest:s=>s.includes('button[data-open]')?{dataset:{open:track}}:null})}
  await open('deck');
  assert.match(root.innerHTML,/Retry reviewer/);
  allowBank=true;
  await click({closest:s=>s==='[data-retry-reviewer]'?{}:null});
  for(const [id,track] of [['nw','deck'],['ew','engine']]){
    await open(track);
    const count=audit.find(row=>row.track===id).included+practice.filter(q=>q.track===track).length;
    assert.ok(root.innerHTML.includes(count+' matching questions'),track);
  }
});

test('voyage checkpoints survive reopening and award XP once after 5, 10 and 5 tasks',()=>{
  const store = new Map();
  const ctx={localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}};
  runInNewContext(asset('toolbox-voyage.js'),ctx);
  const create=()=>ctx.createLearningVoyage({},String,()=>{},()=>{});
  let voyage=create();
  const tap=action=>voyage.click({dataset:{voyage:action}});
  voyage.change('interview');
  tap('start');
  for (const size of [5,10,5]){
    for(let i=0;i<size;i++)tap('spoken');
    voyage=create();
    tap('start');
    assert.match(voyage.render(),new RegExp(size+' speaking tasks completed'));
    tap('advance');
  }
  assert.match(voyage.render(),/20 XP/);
});
