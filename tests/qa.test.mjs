import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
function setup(){
 const nodes={},events={};
 const el=s=>nodes[s]??={innerHTML:'',textContent:'',value:'',querySelector:el,querySelectorAll:()=>[],remove(){},focus(){},appendChild(){},insertAdjacentHTML(where,html){this.innerHTML+=html},setAttribute(){},classList:{add(){},remove(){}}};
 const memory={};
 const context=createContext({document:{querySelector:el,getElementById:el,querySelectorAll:()=>[],createElement:el,body:el('body'),addEventListener:(t,f)=>{(events[t]??=[]).push(f)}},localStorage:{getItem:k=>memory[k]||null,setItem:(k,v)=>memory[k]=v},sessionStorage:{getItem:()=>null},window:{scrollTo(){},matchMedia:()=>({matches:false})},setTimeout:()=>0,clearTimeout(){},console,FormData:class{constructor(f){this.data=f.data}get(k){return this.data[k]}*[Symbol.iterator](){yield*Object.entries(this.data)}}});
 const inline=readFileSync('dist/index.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
 runInContext(inline,context);runInContext(readFileSync('dist/qa.js','utf8'),context);return context;
}
test('Q&A navigation replaces social feed, messages, and lesson routes',()=>{
 const c=setup();assert.equal(runInContext("document.querySelector('#app').innerHTML.includes('Your experience matters.')",c),true);
 assert.equal(runInContext("document.getElementById('desktopNav').innerHTML.includes('Messages')",c),false);
 runInContext("nav('feed')",c);assert.equal(runInContext('page',c),'home');
 runInContext("nav('learn')",c);assert.equal(runInContext("app.innerHTML.includes('Every posted question')",c),true);
 assert.equal(runInContext("app.innerHTML.includes('Guides & case studies')",c),false);
});
test('metrics count own questions and distinct other questions answered',()=>{
 const c=setup();runInContext("mutateQ(all()[0],q=>q.answers.push({name:'JV Ursal',text:'First answer'},{name:'JV Ursal',text:'Follow-up'}));state.questions.push({id:'own',author:'JV Ursal',equipment:'Pumps',status:'Open',answers:[{name:'JV Ursal',text:'Self reply'}]})",c);
 assert.equal(runInContext('activityMetrics().answered',c),1);assert.equal(runInContext('activityMetrics().asked',c),1);assert.equal(runInContext('activityMetrics().topics[0][1]',c),1);
});
test('engine and deck questions are searchable with department and alias filters',()=>{
 const c=setup();runInContext("page='learn';qaDepartment='Deck';query='';topic='All topics'",c);assert.equal(runInContext('filtered().length',c),1);
 runInContext("qaDepartment='All departments';query='FWG'",c);assert.equal(runInContext('filtered().length',c),1);
 runInContext("query='';qaView='unanswered'",c);assert.equal(runInContext('filtered().every(q=>q.answers.length===0)',c),true);
});
test('badges distinguish a contribution, a conversation, and a recorded outcome',()=>{
 const c=setup();runInContext("state.questions.push({id:'own',author:'JV Ursal',equipment:'Pumps',status:'Open',answers:[{name:'JV Ursal',text:'Self reply'}]});persist()",c);
 assert.equal(runInContext('Boolean(state.qaBadges.conversation)',c),false);
 runInContext("state.questions[0].answers.push({name:'Other crew',text:'An observation'});persist()",c);assert.equal(runInContext('Boolean(state.qaBadges.conversation)',c),true);
 runInContext("state.questions[0].status='Resolved';state.questions[0].outcome='Reported result and conditions';persist()",c);assert.equal(runInContext('Boolean(state.qaBadges.loop)',c),true);
 runInContext("state.saved=['a','a','a'];persist()",c);assert.equal(runInContext('Boolean(state.qaBadges.keeper)',c),false);
});
test('profile changes persist and unlock Starter without pretending verification',()=>{
 const c=setup();runInContext("page='profile';render();document.querySelector('#qaProfileForm').onsubmit({preventDefault(){},target:{data:{name:'Test Crew',department:'Deck',rank:'Cadet',experience:'1',country:'Philippines',bio:'Learning from shared experience'}}})",c);
 assert.equal(runInContext('state.profile.name',c),'Test Crew');assert.equal(runInContext('Boolean(state.qaBadges.starter)',c),true);
 assert.equal(runInContext("app.innerHTML.includes('SELF-REPORTED')",c),true);
});
