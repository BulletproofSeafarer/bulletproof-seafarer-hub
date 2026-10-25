import {readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
function walk(path){return readdirSync(path).flatMap(n=>{const p=join(path,n);return statSync(p).isDirectory()?walk(p):[p]})}
const files=walk('dist').map(p=>p.slice(5)).filter(p=>!['sw.js','offline-assets.js'].includes(p)&&!/LICENSE/.test(p));
const core=files.filter(p=>!p.startsWith('assets/learning/')&&!p.startsWith('assets/review/'));
const extra=files.filter(p=>!core.includes(p));
function digest(list){const hash=createHash('sha256');for(const f of [...list].sort())hash.update(f).update(readFileSync(join('dist',f)));return hash.digest('hex').slice(0,16)}
writeFileSync('dist/offline-assets.js','// Generated public file manifest. No user data.\nconst toolboxOfflineAssets='+JSON.stringify({version:digest(core),studyVersion:digest(extra),core,extra})+';\n');
console.log(`Offline manifest: ${core.length} app files, ${extra.length} study sources.`);
