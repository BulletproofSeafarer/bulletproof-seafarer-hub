/* Attachment references change only after all new copies have been reopened. */
async function documentPassphrase(confirmNew=false){
 const dialog=document.createElement('dialog');
 dialog.innerHTML='<form method="dialog"><h2>Attachment passphrase</h2><p>Use your attachment passphrase to reopen this file. Keep a copy somewhere safe.</p><label class="field">Passphrase<input type="password" required minlength="12" autocomplete="off"></label>'+
 (confirmNew?'<label class="field">Confirm passphrase<input type="password" required minlength="12" autocomplete="off"></label>':'')+
 '<button value="ok">Continue</button><button value="cancel" formnovalidate>Cancel</button></form>';
 document.body.append(dialog);
 const inputs=dialog.querySelectorAll('input');
 if(confirmNew)dialog.oninput=()=>inputs[1].setCustomValidity(inputs[1].value===inputs[0].value?'':'Passphrases must match.');
 try{return await new Promise((resolve,reject)=>{
  dialog.onclose=()=>dialog.returnValue==='ok'?resolve(inputs[0].value):reject(Error('Cancelled.'));
  dialog.showModal();
 })}finally{dialog.remove()}
}
const attachmentSides=['front','back','page'];
async function withDocumentLock(action){
 if(!navigator.locks)throw Error('Open Toolbox in a secure browser to update documents.');
 return navigator.locks.request('toolbox-document-update',action);
}
async function clearLegacyFiles(id){
 for(const suffix of ['::front','::back','::page',''])await legacyPhoto(id+suffix,'delete');
}
async function saveVaultDocument(details,changes,isNew,restorePass){
 return withDocumentLock(async()=>{
  const previous=docRecords().find(doc=>doc.id===details.id);
  if(!previous&&!isNew)throw Error('This document was removed. Reopen Documents.');
  const refs={...previous?.vaultFiles},staged=[],obsolete=[];
  const vault=ToolboxDocumentVault.createVault();
  if(previous&&!previous.vaultFiles){
   for(const side of attachmentSides){
    if(side in changes)continue;
    const blob=await legacyPhoto(details.id+'::'+side,'read')||(side==='page'&&await legacyPhoto(details.id,'read'));
    if(blob)changes[side]=blob;
   }
  }
  try{
   const writes=Object.values(changes).some(blob=>blob instanceof Blob);
   const pass=writes?(restorePass||await documentPassphrase(true)):'';
   for(const [side,blob] of Object.entries(changes)){
    if(refs[side])obsolete.push([refs[side],side]);
    delete refs[side];
    if(!blob)continue;
    const ref=crypto.randomUUID();
    staged.push([ref,side]);
    await vault.save(ref,side,blob,pass);
    const restored=await vault.read(ref,side,pass);
    const actual=new Uint8Array(await restored.arrayBuffer()),expected=new Uint8Array(await blob.arrayBuffer());
    if(actual.length!==expected.length||actual.some((byte,i)=>byte!==expected[i]))throw Error('Could not verify saved copy.');
    refs[side]=ref;
   }
   const records=docRecords(),index=records.findIndex(doc=>doc.id===details.id);
   const item={...previous,...details,vaultFiles:refs};
   if(index<0)records.push(item);else records[index]=item;
   if(!saveDocRecords(records))throw Error('Document could not be saved.');
  }catch(error){
   await Promise.allSettled(staged.map(([id,side])=>vault.remove(id,side)));
   throw error;
  }
  if(previous)await clearLegacyFiles(details.id);
  for(const [id,side] of obsolete)await vault.remove(id,side);
 });
}
async function deleteVaultDocument(id){
 return withDocumentLock(async()=>{
  const record=docRecords().find(doc=>doc.id===id);
  await clearLegacyFiles(id);
  for(const [side,ref] of Object.entries(record?.vaultFiles||{}))await ToolboxDocumentVault.createVault().remove(ref,side);
  if(!saveDocRecords(docRecords().filter(doc=>doc.id!==id)))throw Error('Could not remove document.');
 });
}
