/* Toolbox 2.9: validate a complete staged migration set without touching legacy data.
   All records must decrypt before a migration can be considered ready. */
(function(root){
'use strict';
function validatePlan(plan){
 if(!Array.isArray(plan)||!plan.length)throw Error('Migration plan is empty');
 const ids=new Set();
 for(const item of plan){
  if(!item||typeof item.id!=='string'||!item.id||ids.has(item.id)||!['document','attachment'].includes(item.kind))throw Error('Invalid or duplicate migration item');
  ids.add(item.id);
 }
 return plan.length;
}
async function verifyPlan({plan,store,crypto,passphrase}){
 validatePlan(plan);
 if(!store||typeof store.get!=='function'||!crypto||typeof crypto.openJSON!=='function')throw Error('Migration verifier unavailable');
 const verified=[];
 for(const item of plan){
  const key='toolbox-stage-v1:'+item.id,envelope=await store.get(key);
  if(!envelope)throw Error('Staged migration item missing: '+item.id);
  const value=await crypto.openJSON(envelope,passphrase,key);
  if(item.kind==='document'&&(!value||typeof value!=='object'||Array.isArray(value)))throw Error('Invalid staged document');
  if(item.kind==='attachment'&&(!value||!Array.isArray(value.bytes)||value.bytes.some(n=>!Number.isInteger(n)||n<0||n>255)))throw Error('Invalid staged attachment');
  verified.push({id:item.id,kind:item.kind});
 }
 return {ready:true,verifiedCount:verified.length,items:verified};
}
const api=Object.freeze({validatePlan,verifyPlan});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.ToolboxMigrationVerify=api;
})(typeof globalThis!=='undefined'?globalThis:this);
