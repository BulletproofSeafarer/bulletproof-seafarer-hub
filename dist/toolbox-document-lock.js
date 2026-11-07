/* Optional device-local PIN wraps the same random key used for new attachments. */
const ToolboxDocumentLock=(()=>{
 const setting='toolbox-doc-key-v1';
 let session=null;
 const config=()=>JSON.parse(localStorage.getItem(setting)||'null');
 const enabled=()=>Boolean(config()?.wrapped);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)session=null});
 window.addEventListener('pagehide',()=>{session=null});
 async function ask(create){
  const dialog=document.createElement('dialog'),form=document.createElement('form');
  form.method='dialog';dialog.append(form);
  form.innerHTML='<h2>'+ (create?'Set document PIN':'Unlock attachments')+'</h2><p>'+ (create?'Remember your PIN to open your saved files.':'Enter your 6-digit document PIN.')+'</p>';
  function field(label){
   const row=document.createElement('label');row.className='field';row.textContent=label;
   const input=document.createElement('input');
   Object.assign(input,{type:'password',inputMode:'numeric',pattern:'[0-9]{6}',maxLength:6,required:true,autocomplete:'off'});
   row.append(input);form.append(row);return input;
  }
  const pin=field('6-digit PIN');
  if(create){const repeat=field('Confirm PIN');form.oninput=()=>repeat.setCustomValidity(pin.value===repeat.value?'':'PINs must match.')}
  form.insertAdjacentHTML('beforeend','<button value="ok">Continue</button><button value="cancel" formnovalidate>Cancel</button>');
  document.body.append(dialog);
  try{return await new Promise((resolve,reject)=>{dialog.onclose=()=>dialog.returnValue==='ok'?resolve(pin.value):reject(Error('Cancelled.'));dialog.showModal()})}
  finally{dialog.remove()}
 }
 async function unlock(state){
  const pin=await ask(false);let bytes;
  try{bytes=await ToolboxVaultCrypto.open(state.wrapped,'toolbox-pin:'+pin,setting)}
  catch{throw Error('Incorrect PIN or unreadable device key.')}
  return new TextDecoder().decode(bytes);
 }
 async function key(){
  return navigator.locks.request(setting,async()=>{
   const state=config();
   if(!state){const plain=crypto.randomUUID()+crypto.randomUUID();localStorage.setItem(setting,JSON.stringify({plain}));return plain}
   if(state.plain)return state.plain;
   if(session?.version===state.version)return session.key;
   const value=await unlock(state);session={version:state.version,key:value};return value;
  });
 }
 async function toggle(){
  if(!config())await key();
  await navigator.locks.request(setting,async()=>{
   const state=config();
   if(state.wrapped){const checked=await unlock(state);localStorage.setItem(setting,JSON.stringify({plain:checked}));session=null;return}
   const value=state.plain;
   const pin=await ask(true),version=crypto.randomUUID();
   const wrapped=await ToolboxVaultCrypto.seal(new TextEncoder().encode(value),'toolbox-pin:'+pin,setting);
   localStorage.setItem(setting,JSON.stringify({wrapped,version}));session={key:value,version};
  });
 }
 document.addEventListener('click',async event=>{
  const button=event.target.closest('#documentLockSetting');if(!button)return;
  button.disabled=true;
  try{await toggle();button.textContent='Document PIN · '+(enabled()?'On':'Off')}
  catch(error){if(error.message!=='Cancelled.')alert(error.message)}
  finally{button.disabled=false}
 });
 return {key,enabled};
})();
