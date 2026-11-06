/* Toolbox 2.9 migration coordinator: stage all items, verify all, never delete legacy data.
   A failure returns an error; already staged records remain for manual recovery. */
(function(root){
'use strict';
async function prepare({plan,values,store,crypto,passphrase,staging,verification}){
 verification.validatePlan(plan);
 if(!values||typeof values!=='object'||!staging||typeof staging.stageRecord!=='function')throw Error('Migration preparation unavailable');
 for(const item of plan){
  if(!Object.prototype.hasOwnProperty.call(values,item.id))throw Error('Missing source item: '+item.id);
 }
 const staged=[];
 for(const item of plan){
  const value=values[item.id];
  await staging.stageRecord({store,crypto,passphrase,id:item.id,value});
  staged.push(item.id);
 }
 const result=await verification.verifyPlan({plan,store,crypto,passphrase});
 if(result.verifiedCount!==plan.length)throw Error('Incomplete migration verification');
 return {ready:true,stagedCount:staged.length,verifiedCount:result.verifiedCount,legacyUntouched:true};
}
const api=Object.freeze({prepare});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.ToolboxMigrationCoordinator=api;
})(typeof globalThis!=='undefined'?globalThis:this);
