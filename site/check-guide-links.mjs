// Checks every source cited in the study guides (dist/guides/sources.json, written by the build).
// Usage: npm run build && npm run check-guide-links [-- --only fe]
// Prints each URL that does not answer 2xx after redirects. Some publishers answer 403 to
// scripts but work in a browser; those are listed separately to check by hand.
import fs from 'node:fs';

const urls = JSON.parse(fs.readFileSync(new URL('../dist/guides/sources.json', import.meta.url), 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const bad = [], blocked = [], moved = [];
let i = 0, ok = 0;

const dois = [];
async function check(u) {
  // DOIs: publishers often refuse scripts, so ask Crossref whether the DOI exists and what it is
  const doi = u.match(/^https:\/\/doi\.org\/(.+)$/);
  if (doi) {
    for (let tries = 0; tries < 5; tries++) {
      try {
        const r = await fetch(`https://api.crossref.org/works/${doi[1]}`, { signal: AbortSignal.timeout(25000) });
        if (r.ok) { const m = (await r.json()).message; dois.push(`${doi[1]}  ${m.title?.[0]} (${m.issued?.['date-parts']?.[0]?.[0]})`); ok++; return; }
        if (r.status === 429) { await new Promise((res) => setTimeout(res, 1500 * (tries + 1))); continue; }   // rate limited: wait and retry
        bad.push(`${r.status} ${u} (not in Crossref)`); return;
      } catch (e) { if (tries === 4) { bad.push(`ERR ${u} (Crossref: ${e.name})`); return; } }
    }
    bad.push(`429 ${u} (Crossref kept rate-limiting)`); return;
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(u, { redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,*/*', 'accept-language': 'en-US,en;q=0.9' }, signal: AbortSignal.timeout(25000) });
      if (r.ok) {
        // a page that exists but lost its anchor still counts as ok; anchors are checked by eye
        const norm = (x) => x.split('#')[0].split('?')[0].replace(/\/$/, '').toLowerCase();
        if (norm(r.url) !== norm(u)) moved.push(`${u}\n    -> ${r.url}`);
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
if (dois.length && process.argv.includes('--dois')) console.log(`\nDOIs (title from Crossref):\n${dois.sort().join('\n')}`);
if (moved.length && process.argv.includes('--moved')) console.log(`\nredirected (update to the final URL if it is the same page):\n${moved.sort().join('\n')}`);
if (blocked.length) console.log(`\nrefused scripted access (check in a browser):\n${blocked.sort().join('\n')}`);
if (bad.length) { console.log(`\nbroken:\n${bad.sort().join('\n')}`); process.exitCode = 1; }
