// Checks every external link in content/ and prints the ones that look broken.
//     npm run check-links
// Some sites (Medium, LeetCode, Microsoft community blogs) block automated
// requests; a 403 from them usually means the page is fine in a browser.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'content');
const urls = new Map(); // url → [files]
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(md|html)$/.test(e.name)) {
      const text = fs.readFileSync(p, 'utf8');
      for (const m of text.matchAll(/\]\((https?:\/\/[^)\s]+)\)|href="(https?:\/\/[^"]+)"/g)) {
        const u = m[1] || m[2];
        if (/fonts\.(googleapis|gstatic)\.com/.test(u)) continue;
        if (!urls.has(u)) urls.set(u, []);
        urls.get(u).push(path.relative(CONTENT, p));
      }
    }
  }
}
walk(CONTENT);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
async function check(u) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const r = await fetch(u, { method, redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, signal: AbortSignal.timeout(20000) });
      if (r.ok || method === 'GET') return r.status;
    } catch (e) {
      if (method === 'GET') return 'ERR ' + (e.cause?.code || e.name);
    }
  }
}
const list = [...urls.keys()];
const results = [];
let i = 0;
await Promise.all(Array.from({ length: 10 }, async () => {
  while (i < list.length) {
    const u = list[i++];
    results.push({ u, status: await check(u) });
  }
}));
const bad = results.filter((r) => !(typeof r.status === 'number' && r.status < 400));
console.log(`checked ${results.length} unique links; ${bad.length} not OK`);
for (const r of bad.sort((a, b) => String(a.status).localeCompare(String(b.status)))) {
  console.log(r.status, r.u, '←', [...new Set(urls.get(r.u))].join(', '));
}
