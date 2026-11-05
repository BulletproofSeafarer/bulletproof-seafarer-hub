/* Toolbox 2.8.3: read-only encrypted backup verification. */
(()=>{'use strict';
const enc=new TextEncoder(),dec=new TextDecoder();
const from64=s=>{if(typeof s!=='string'||s.length>150000000||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw Error('Invalid encoding');const raw=atob(s),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out};
async function check(file,button){const status=document.getElementById('tbBackupStatus');if(!status)return;button.disabled=true;try{
status.textContent='Verifying backup without changing your documents…';
if(!file||file.size>120*1024*1024)throw Error('Invalid file');
const pass=document.getElementById('tbBackupPassword')?.value;if(!pass){status.textContent='Enter the backup passphrase first.';return}
const envelope=JSON.parse(await file.text());
if(envelope?.format!=='toolbox-documents-encrypted-v1'||envelope.kdf!=='PBKDF2-SHA256'||envelope.cipher!=='AES-256-GCM'||envelope.iterations!==310000)throw Error('Invalid envelope');
const salt=from64(envelope.salt),iv=from64(envelope.iv),data=from64(envelope.data);
if(salt.length!==16||iv.length!==12)throw Error('Invalid crypto parameters');
if(!isSecureContext||!crypto?.subtle)throw Error('Crypto unavailable');
const base=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);
const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
const plaintext=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:enc.encode('toolbox-documents-encrypted-v1')},key,data));
let payload;try{payload=JSON.parse(dec.decode(plaintext))}finally{plaintext.fill(0)}
if(payload?.format!=='toolbox2-full-documents-v1'||!Array.isArray(payload.documents)||!Array.isArray(payload.attachments)||payload.documents.length>2000||payload.attachments.length>4000)throw Error('Invalid backup');
const ids=new Set();for(const d of payload.documents){if(!d||typeof d.id!=='string'||!/^doc-[a-zA-Z0-9-]+$/.test(d.id)||ids.has(d.id)||typeof d.title!=='string'||d.title.length>120)throw Error('Invalid record');ids.add(d.id)}
let total=0;const keys=new Set();for(const a of payload.attachments){if(!a||typeof a.key!=='string'||keys.has(a.key)||typeof a.data!=='string')throw Error('Invalid attachment');const id=a.key.split('::')[0];if(!ids.has(id)||!new RegExp('^'+id+'(?:::front|::back|::page)?$').test(a.key))throw Error('Invalid attachment key');keys.add(a.key);if(!/^data:(image\/(jpeg|png|webp|gif)|application\/pdf);base64,/.test(a.data))throw Error('Invalid media');const blob=await(await fetch(a.data)).blob();total+=blob.size;if(blob.size>15*1024*1024||total>60*1024*1024)throw Error('Oversize attachment')}
status.textContent='Verified encrypted backup: '+payload.documents.length+' records, '+payload.attachments.length+' attachments. No documents were changed. Actual restore still needs testing.';
}catch(_err){status.textContent='Verification failed. Check the passphrase and file. No documents were changed.'}finally{const p=document.getElementById('tbBackupPassword');if(p)p.value='';button.disabled=false}}
function install(){const panel=document.getElementById('tbBackupPanel');if(!panel||panel.querySelector('#tbBackupVerify'))return;const actions=panel.querySelector('.tb-backup-actions');if(!actions)return;const button=document.createElement('button');button.type='button';button.id='tbBackupVerify';button.className='btn secondary';button.textContent='Verify backup safely';const input=document.createElement('input');input.type='file';input.accept='application/json,.json';input.hidden=true;actions.append(button,input);button.addEventListener('click',()=>input.click());input.addEventListener('change',e=>{check(e.target.files[0],button);e.target.value=''})}
new MutationObserver(install).observe(document.getElementById('view')||document.body,{childList:true,subtree:true});install();
})();