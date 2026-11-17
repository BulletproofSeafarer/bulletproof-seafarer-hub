const { getDefaultConfig } = require('expo/metro-config');
const { existsSync, readdirSync, readFileSync } = require('node:fs');
const { join, relative } = require('node:path');

const config = getDefaultConfig(__dirname);
const webRoot = join(__dirname, '../toolbox-preview/dist');
const prefix = '/toolbox-web/';
const mime = {
  css: 'text/css',
  html: 'text/html',
  js: 'text/javascript',
  png: 'image/png',
  webp: 'image/webp'
};

// Share Metro’s port and optional tunnel so Expo Go and the preview need only one connection.
const files = new Map();
if (existsSync(webRoot)) {
  for (const entry of readdirSync(webRoot, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const file = join(entry.parentPath, entry.name);
    const path = relative(webRoot, file).split('\\').join('/');
    const type = mime[path.split('.').pop()];
    if (type) files.set(prefix + path, { file, type });
  }
}

const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const serveMetro = enhanceMiddleware?.(middleware, server) ?? middleware;
  return (request, response, next) => {
    const url = new URL(request.url, 'http://localhost');
    if (!url.pathname.startsWith(prefix)) return serveMetro(request, response, next);

    const path = url.pathname === prefix ? prefix + 'index.html' : url.pathname;
    const asset = files.get(path);
    if (!asset || !['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('Preview file unavailable. Build toolbox-preview and restart Metro.');
      return;
    }

    const body = readFileSync(asset.file);
    response.writeHead(200, {
      'Content-Type': asset.type,
      'Content-Length': body.length,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  };
};

module.exports = config;
