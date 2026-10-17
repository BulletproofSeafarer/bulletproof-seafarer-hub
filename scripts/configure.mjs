import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
const e=process.env;
const url=(e.HUB_SUPABASE_URL||'').trim(),key=(e.HUB_SUPABASE_PUBLISHABLE_KEY||'').trim();
if(Boolean(url)!==Boolean(key))throw Error('Supply both HUB_SUPABASE_URL and HUB_SUPABASE_PUBLISHABLE_KEY.');
if(url&&!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw Error('Use the HTTPS URL of a separate Supabase project.');
if(key.startsWith('sb_secret_'))throw Error('Never publish a Supabase secret key. Use the publishable/anon key.');
if(key.startsWith('eyJ')){let claims;try{claims=JSON.parse(Buffer.from(key.split('.')[1],'base64url'))}catch{throw Error('Invalid anon JWT key.')}if(claims.role!=='anon')throw Error('Only an anon/publishable key belongs in this app.');}
if(key&&!key.startsWith('sb_publishable_')&&!key.startsWith('eyJ'))throw Error('Expected an anon or sb_publishable key.');
const registrationOpen=e.HUB_REGISTRATION_OPEN==='true';const privacyContact=(e.HUB_PRIVACY_CONTACT||'').trim();
if(registrationOpen&&(!url||!privacyContact))throw Error('Registration requires cloud configuration and a privacy contact.');
const config={supabaseUrl:url,publishableKey:key,registrationOpen,privacyContact,communityUrl:(e.HUB_FACEBOOK_GROUP_URL||'').trim(),turnstileSiteKey:(e.HUB_TURNSTILE_SITE_KEY||'').trim()};
if(registrationOpen&&!config.turnstileSiteKey)throw Error('Configure Supabase CAPTCHA and HUB_TURNSTILE_SITE_KEY before opening registration.');
writeFileSync('dist/config.js','// Public configuration; generated at build time.\nwindow.HubConfig=Object.freeze('+JSON.stringify(config)+');\n');
mkdirSync('dist/vendor',{recursive:true});copyFileSync('node_modules/@supabase/supabase-js/dist/umd/supabase.js','dist/vendor/supabase.js');copyFileSync('node_modules/@supabase/supabase-js/LICENSE','dist/vendor/SUPABASE-LICENSE.txt');
console.log(url?'Cloud client configured. No service secrets included.':'Local preview configured; Supabase is not connected.');
