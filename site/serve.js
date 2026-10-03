// Serves the built site locally:  npm run serve  → http://localhost:8790
// index.html for page routes; other files in dist/ (the figures) as themselves.
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = +process.env.PORT || 8790;
const DIST = path.join(__dirname, '..', 'dist');
const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.css': 'text/css', '.js': 'text/javascript' };
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('dist/index.html not found: run "npm run build" first'); process.exit(1); }
http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  const file = path.join(DIST, rel);
  const type = TYPES[path.extname(file).toLowerCase()];
  if (type && file.startsWith(DIST + path.sep) && fs.existsSync(file)) {
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    return fs.createReadStream(file).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  fs.createReadStream(path.join(DIST, 'index.html')).pipe(res);
}).listen(PORT, () => console.log('http://localhost:' + PORT));
