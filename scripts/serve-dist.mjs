// scripts/serve-dist.mjs
// ============================================================
// Minimal static preview server for the AIMS production build
// (dist/). Uses only node:http/fs — no esbuild or child processes —
// so it can run in sandboxed/background contexts where spawning
// is restricted. SPA fallback: unknown paths serve /index.html.
//
// Usage: node scripts/serve-dist.mjs   (PORT / HOST env, default 4173 / 0.0.0.0)
// ============================================================

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

http
  .createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let filePath = normalize(join(root, urlPath === '/' ? 'index.html' : urlPath));
      if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      let body;
      try {
        body = await readFile(filePath);
      } catch {
        // SPA fallback → index.html (deep links work on refresh)
        filePath = join(root, 'index.html');
        body = await readFile(filePath);
      }
      const ext = extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(body);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(String(err));
    }
  })
  .listen(port, host, () => {
    console.log(`AIMS preview serving ${root}`);
    console.log(`  → http://127.0.0.1:${port}`);
    console.log(`  → http://${host}:${port}  (LAN: 0.0.0.0 binding)`);
  });
