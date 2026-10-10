// Serves the built site locally:  npm run serve  → http://localhost:8790
// index.html for page routes; other files in dist/ (the figures) as themselves;
// /qa/* from site/qa (the diagram checks described in the README).
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = +process.env.PORT || 8790;
const DIST = path.join(__dirname, '..', 'dist');
const QA = path.join(__dirname, 'qa');
const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.css': 'text/css', '.js': 'text/javascript' };
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('dist/index.html not found: run "npm run build" first'); process.exit(1); }
http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  // /qa/*.js are the local diagram checks in site/qa (not part of the published build)
  const root = rel.startsWith('qa/') ? QA : DIST;
  const file = path.join(root, rel.startsWith('qa/') ? rel.slice(3) : rel);
  const type = TYPES[path.extname(file).toLowerCase()];
  if (type && file.startsWith(root + path.sep) && fs.existsSync(file)) {
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    return fs.createReadStream(file).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  fs.createReadStream(path.join(DIST, 'index.html')).pipe(res);
}).listen(PORT, () => console.log('http://localhost:' + PORT));
