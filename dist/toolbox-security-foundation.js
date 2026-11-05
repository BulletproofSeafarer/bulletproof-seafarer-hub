/* Toolbox Secure Vault 2.8.0: isolated cryptography preflight. No user documents or keys are persisted. */
(()=>{'use strict';
const enc=new TextEncoder(),dec=new TextDecoder();
const supported=()=>window.isSecureContext&&!!window.crypto?.subtle&&!!window.crypto?.getRandomValues;
async function preflight(){
 if(!supported())throw Error('This device does not provide the required secure browser cryptography.');
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const material=await crypto.subtle.importKey('raw',enc.encode('Toolbox disposable self-test only'),{name:'PBKDF2'},false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:210000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
 const sample=enc.encode('Toolbox vault encryption check. Not a personal document.');
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,sample);
 const restored=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ciphertext);
 if(dec.decode(restored)!==dec.decode(sample))throw Error('Encrypted data did not round-trip correctly.');
 const tampered=new Uint8Array(ciphertext);tampered[0]^=1;
 let rejected=false;try{await crypto.subtle.decrypt({name:'AES-GCM',iv},key,tampered)}catch{rejected=true}
 if(!rejected)throw Error('Tamper detection failed.');
 return 'Browser AES-256-GCM, PBKDF2 and tamper rejection passed on this device. Existing documents remain unencrypted.';
}
document.addEventListener('click',async e=>{
 const button=e.target.closest('[data-vault-preflight]');if(!button)return;
 const status=document.getElementById('tbVaultPreflightStatus');if(!status)return;
 button.disabled=true;status.textContent='Testing encryption support…';status.dataset.state='running';
 try{status.textContent=await preflight();status.dataset.state='passed'}catch(_err){status.textContent='The security check could not complete on this device. Please try again in a secure browser.';status.dataset.state='failed'}
 finally{button.disabled=false}
});
})();