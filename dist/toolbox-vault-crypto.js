/* Toolbox 2.9.0 — isolated local vault crypto engine. Not connected to live documents.
   A vault passphrase is required; do not persist it or derived keys. */
(function(root){
'use strict';
const te=new TextEncoder(),td=new TextDecoder();
const ITERATIONS=310000,VERSION=1,CONTEXT='toolbox-local-vault-v1';
function supported(){return !!root.crypto?.subtle&&!!root.crypto?.getRandomValues}
function random(n){const b=new Uint8Array(n);root.crypto.getRandomValues(b);return b}
function b64(bytes){let out='';for(let i=0;i<bytes.length;i+=8192)out+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(out)}
function un64(value){if(typeof value!=='string'||value.length>120000000||!/^[A-Za-z0-9+/]*={0,2}$/.test(value))throw Error('Invalid encoded data');const str=atob(value),b=new Uint8Array(str.length);for(let i=0;i<str.length;i++)b[i]=str.charCodeAt(i);return b}
async function derive(pass,salt){if(!supported())throw Error('Secure cryptography unavailable');if(typeof pass!=='string'||pass.length<12)throw Error('Vault passphrase too short');const material=await root.crypto.subtle.importKey('raw',te.encode(pass),'PBKDF2',false,['deriveKey']);return root.crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:ITERATIONS},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function seal(bytes,pass,recordId){if(!(bytes instanceof Uint8Array)||typeof recordId!=='string'||!recordId||recordId.length>200)throw Error('Invalid vault input');const salt=random(16),iv=random(12),key=await derive(pass,salt);const aad=te.encode(CONTEXT+':'+recordId);const ciphertext=await root.crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},key,bytes);return {format:CONTEXT,version:VERSION,kdf:'PBKDF2-SHA256',iterations:ITERATIONS,cipher:'AES-256-GCM',recordId,salt:b64(salt),iv:b64(iv),data:b64(new Uint8Array(ciphertext))}}
async function open(envelope,pass,expectedId){if(!envelope||envelope.format!==CONTEXT||envelope.version!==VERSION||envelope.iterations!==ITERATIONS||envelope.kdf!=='PBKDF2-SHA256'||envelope.cipher!=='AES-256-GCM'||envelope.recordId!==expectedId)throw Error('Invalid vault envelope');const salt=un64(envelope.salt),iv=un64(envelope.iv);if(salt.length!==16||iv.length!==12)throw Error('Invalid vault parameters');const key=await derive(pass,salt);const ciphertext=un64(envelope.data);return new Uint8Array(await root.crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:te.encode(CONTEXT+':'+expectedId)},key,ciphertext))}
async function sealJSON(value,pass,id){return seal(te.encode(JSON.stringify(value)),pass,id)}
async function openJSON(envelope,pass,id){const bytes=await open(envelope,pass,id);try{return JSON.parse(td.decode(bytes))}finally{bytes.fill(0)}}
const api=Object.freeze({supported,seal,open,sealJSON,openJSON});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.ToolboxVaultCrypto=api;
})(typeof globalThis!=='undefined'?globalThis:this);
