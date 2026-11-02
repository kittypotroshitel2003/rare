import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.mjs':  'text/javascript',
  '.json': 'application/json',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.ttf':  'font/ttf',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.webp': 'image/webp',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mov':  'video/quicktime',
};

// те же 301, что настраивает deploy.js в Caddy (см. url-map.json)
const REDIRECTS = JSON.parse(fs.readFileSync(path.join(__dirname, 'url-map.json'), 'utf8')).redirects;

http.createServer((req, res) => {
  // на сервере /api/lead обслуживает server/rare-leads.py; локально заявку
  // только печатаем в консоль, никуда не отправляя
  if (req.method === 'POST' && req.url.split('?')[0] === '/api/lead') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      console.log('[lead]', body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  const redirectTo = REDIRECTS[urlPath] || REDIRECTS[urlPath + '/'];
  if (redirectTo) {
    res.writeHead(301, { Location: redirectTo });
    res.end();
    return;
  }
  // страницы лежат как /uslugi/smas-lifting/index.html
  const dirPath = path.join(__dirname, urlPath);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    if (!urlPath.endsWith('/')) {
      res.writeHead(301, { Location: urlPath + '/' });
      res.end();
      return;
    }
    urlPath += 'index.html';
  }

  const filePath = path.join(__dirname, urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found: ' + urlPath);
      return;
    }

    const range = req.headers.range;
    // Range support is required for <video> seeking/scrubbing — without
    // it the browser can only play a file start-to-end with no scrubbing.
    if (range) {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      const start = match[1] ? parseInt(match[1], 10) : 0;
      const end = match[2] ? parseInt(match[2], 10) : stat.size - 1;
      if (isNaN(start) || isNaN(end) || start > end || end >= stat.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        res.end();
        return;
      }
      res.writeHead(206, {
        'Content-Type': contentType,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}).listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
