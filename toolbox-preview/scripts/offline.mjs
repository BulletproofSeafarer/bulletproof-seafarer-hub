import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';

const files = (await readdir('dist', { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile() && entry.name !== 'sw.js')
  .map(entry => entry.parentPath.slice(4) + '/' + entry.name).sort();
const digest = createHash('sha256').update(await readFile(new URL(import.meta.url)));
for (const file of files) digest.update(await readFile('dist' + file));
const version = 'toolbox-preview-' + digest.digest('hex').slice(0, 12);
await writeFile('dist/sw.js', `
const version = ${JSON.stringify(version)};
const files = ${JSON.stringify(files.map(name => '.' + name))};
self.addEventListener('install', event => event.waitUntil(caches.open(version).then(cache => cache.addAll(files)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('toolbox-preview-') && key !== version).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('./index.html')));
    return;
  }
  const asset = files.find(file => new URL(file, self.registration.scope).href === request.url);
  if (asset) event.respondWith(caches.match(asset, { cacheName: version, ignoreVary: true }).then(response => response || fetch(request)));
});
`);
