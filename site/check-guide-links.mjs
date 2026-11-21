// Checks every source cited in the study guides (dist/guides/sources.json, written by the build).
// Usage: npm run build && npm run check-guide-links [-- --only fe]
// Prints each URL that does not answer 2xx after redirects. Some publishers answer 403 to
// scripts but work in a browser; those are listed separately to check by hand.
import fs from 'node:fs';

const urls = JSON.parse(fs.readFileSync(new URL('../dist/guides/sources.json', import.meta.url), 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const bad = [], blocked = [];
let i = 0, ok = 0;

async function check(u) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(u, { redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,*/*' }, signal: AbortSignal.timeout(25000) });
      if (r.ok) {
        // a page that exists but lost its anchor still counts as ok; anchors are checked by eye
        ok++; return;
      }
      if (r.status === 403 || r.status === 429 || r.status === 999) { blocked.push(`${r.status} ${u}`); return; }
      if (attempt === 1) bad.push(`${r.status} ${u}`);
    } catch (e) {
      if (attempt === 1) bad.push(`ERR ${u} (${e.cause?.code || e.name})`);
    }
  }
}

async function worker() { while (i < urls.length) await check(urls[i++]); }
await Promise.all(Array.from({ length: 8 }, worker));
console.log(`${ok}/${urls.length} sources answer`);
if (blocked.length) console.log(`\nrefused scripted access (check in a browser):\n${blocked.sort().join('\n')}`);
if (bad.length) { console.log(`\nbroken:\n${bad.sort().join('\n')}`); process.exitCode = 1; }
