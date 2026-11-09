import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Script } from 'node:vm';
for(const entry of ['index.html','toolbox2.html']){
  const html=readFileSync(join('dist',entry),'utf8');
  for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(match[1].trim())new Script(match[1]);

  const markup=html.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/g,'$1</script>');
  for(const match of markup.matchAll(/(?:src|href)="([^"#]+)"/g)){
   const path=match[1];if(!/^(https?:|data:|mailto:)/.test(path)&&!existsSync(join('dist',path.split(/[?#]/)[0])))throw Error('Missing asset: '+path);
  }
  if(/maximum-scale|user-scalable\s*=\s*no/i.test(html))throw Error('Do not disable accessibility zoom.');
}
for(const file of readdirSync('dist'))if(file.endsWith('.js'))new Script(readFileSync(join('dist',file),'utf8'),{filename:file});
console.log('PASS: JavaScript syntax, local asset references, accessible viewport. ');
