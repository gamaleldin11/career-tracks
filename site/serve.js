// Serves the built site locally:  npm run serve  → http://localhost:8790
// index.html for page routes; other files in dist/ (the figures) as themselves;
// /qa/* from site/qa (the diagram checks described in the README).
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = +process.env.PORT || 8790;
const DIST = path.join(__dirname, '..', 'dist');
const QA = path.join(__dirname, 'qa');
const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.css': 'text/css', '.js': 'text/javascript', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.json': 'application/json' };
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('dist/index.html not found: run "npm run build" first'); process.exit(1); }
// VERCEL_HEADERS=1 also sends the production headers from vercel.json (security headers, CSP, caching), to test them
// locally. Off by default: the CSP blocks the eval() that the diagram checks in site/qa rely on.
const RULES = process.env.VERCEL_HEADERS ? (JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8')).headers || [])
  .map((r) => ({ re: new RegExp('^' + r.source.replace(/\(\.\*\)/g, '.*') + '$'), headers: r.headers })) : [];
http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  for (const r of RULES) if (r.re.test(urlPath)) for (const h of r.headers) res.setHeader(h.key, h.value);
  const rel = decodeURIComponent(urlPath).replace(/^\/+/, '');
  // /qa/*.js are the local diagram checks in site/qa (not part of the published build)
  const root = rel.startsWith('qa/') ? QA : DIST;
  const file = path.join(root, rel.startsWith('qa/') ? rel.slice(3) : rel);
  const type = TYPES[path.extname(file).toLowerCase()];
  if (type && file.startsWith(root + path.sep) && fs.existsSync(file)) {
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    return fs.createReadStream(file).pipe(res);
  }
  // /interview is its own page (Vercel's cleanUrls maps it to interview.html the same way)
  // /guides/… pages likewise map to dist/guides/….html (a folder maps to its index.html)
  const clean = rel.replace(/\/$/, '');
  let page = clean === 'interview' ? 'interview.html' : clean === '' || clean === 'index.html' ? 'index.html' : null;
  if (clean === 'guides' || clean.startsWith('guides/')) {
    const g = [clean + '.html', path.join(clean, 'index.html')].find((f) => fs.existsSync(path.join(DIST, f)) && path.join(DIST, f).startsWith(DIST + path.sep));
    if (g) page = g;
  }
  // anything else is a 404, as on Vercel (sections are #fragments of the start page, never paths)
  const status = page ? 200 : 404;
  if (!page) page = fs.existsSync(path.join(DIST, '404.html')) ? '404.html' : 'index.html';
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  fs.createReadStream(path.join(DIST, page)).pipe(res);
}).listen(PORT, () => console.log('http://localhost:' + PORT));
