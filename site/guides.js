// Study guides (/guides): four short versions of every track, separate from the handbook.
//   summary   — the whole track on a few screens
//   entry     — only what an entry-level (junior) role expects
//   mid       — only what a mid-level role adds on top
//   interview — questions with model answers
// Each one is content/guides/<track>/<version>.md. Every claim carries a link to a primary
// source (official docs, standards, RFCs, original papers); the build warns, and --strict
// fails, on any paragraph, list item or table row without one. `npm run check-guide-links`
// confirms that every cited URL still answers.
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');

const VERSIONS = [
  ['summary', 'Super summary', 'v1', 'The whole track on a few screens.'],
  ['entry', 'Entry level', 'v2', 'Only what an entry-level role expects you to know.'],
  ['mid', 'Mid level', 'v3', 'Only what a mid-level role adds on top of entry level.'],
  ['interview', 'Interview prep', 'v4', 'Likely questions with short model answers.'],
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function build(OUT, tokens, TRACKS) {
  const SRC = path.join(__dirname, '..', 'content', 'guides');
  const tpl = fs.readFileSync(path.join(__dirname, 'template_guides.html'), 'utf8');
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
  const dir = path.join(OUT, 'guides');
  fs.mkdirSync(dir, { recursive: true });
  const allUrls = new Map();
  let pages = 0;

  const has = (t, v) => fs.existsSync(path.join(SRC, t, v + '.md'));
  const trackNav = (cur, ver) => TRACKS.filter((t) => has(t.id, ver)).map((t) =>
    `<a href="/guides/${t.id}/${ver}"${t.id === cur ? ' aria-current="page"' : ''}>${esc(t.name.replace(' & Connectivity', ''))}</a>`).join('');
  const verNav = (track, cur) => VERSIONS.filter(([v]) => has(track, v)).map(([v, name, tag]) =>
    `<a href="/guides/${track}/${v}"${v === cur ? ' aria-current="page"' : ''}><b>${tag}</b> ${esc(name)}</a>`).join('');

  for (const T of TRACKS) {
    fs.mkdirSync(path.join(dir, T.id), { recursive: true });
    for (const [v, vname, tag, vblurb] of VERSIONS) {
      const file = path.join(SRC, T.id, v + '.md');
      if (!fs.existsSync(file)) continue;   // not written yet: the index shows it as in progress
      const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
      let body = md.render(text);

      // every claim needs a source: check paragraphs, list items and table rows
      const blocks = body.match(/<(p|li|tr)>[\s\S]*?<\/\1>/g) || [];
      for (const b of blocks) {
        if (/^<tr>\s*<th/.test(b)) continue;            // table header row
        if (/^<li>\s*<(p|ul|ol)>/.test(b)) continue;     // a wrapper item; its paragraphs are checked themselves
        if (b.startsWith('<p><em>') ) continue;          // italic lead-in lines are framing, not claims
        if (!/href="https?:\/\//.test(b)) {
          const plain = b.replace(/<[^>]+>/g, '').trim().slice(0, 70);
          console.warn(`guides: ${T.id}/${v}: no source on "${plain}…"`);
        }
      }

      // collect the sources in order of first use
      const urls = new Map();
      body = body.replace(/<a href="(https?:\/\/[^"]+)">([\s\S]*?)<\/a>/g, (all, href, label) => {
        if (!urls.has(href)) urls.set(href, label.replace(/<[^>]+>/g, ''));
        allUrls.set(href, `${T.id}/${v}`);
        return `<a href="${href}" target="_blank" rel="noopener">${label}</a>`;
      });
      const sources = [...urls].map(([u, label]) => {
        let host = u; try { host = new URL(u).hostname.replace(/^www\./, ''); } catch (e) { console.warn(`guides: bad URL ${u}`); }
        return `<li><a href="${esc(u)}" target="_blank" rel="noopener">${label}</a> <span class="host">${esc(host)}</span></li>`;
      }).join('\n');
      const h1 = (text.match(/^# (.+)$/m) || [, `${T.name}: ${vname}`])[1];
      const page = tpl
        .replace('{{TOKENS}}', () => tokens)
        .replace(/{{TITLE}}/g, () => esc(h1.replace(/\*\*/g, '')))
        .replace('{{DESC}}', () => esc(`${T.name} — ${vname}: ${vblurb}`))
        .replace('{{TRACKNAV}}', () => trackNav(T.id, v))
        .replace('{{VERNAV}}', () => verNav(T.id, v))
        .replace('{{VBLURB}}', () => `<span class="vtag">${tag}</span> ${esc(vblurb)}`)
        .replace('{{BODY}}', () => body.replace(/<h1>[\s\S]*?<\/h1>/, ''))
        .replace('{{H1}}', () => esc(h1))
        .replace('{{COUNT}}', () => String(urls.size))
        .replace('{{SOURCES}}', () => sources);
      fs.writeFileSync(path.join(dir, T.id, v + '.html'), page);
      pages++;
    }
  }

  // index: a track × version grid
  const rows = TRACKS.map((T) => `<tr><th scope="row"><b>${esc(T.name)}</b><span>${esc(T.blurb)}</span></th>` +
    VERSIONS.map(([v, name, tag]) => has(T.id, v) ? `<td><a href="/guides/${T.id}/${v}"><b>${tag}</b> ${esc(name)}</a></td>` : `<td class="soon"><b>${tag}</b> in progress</td>`).join('') + '</tr>').join('\n');
  const head = VERSIONS.map(([, name, tag, blurb]) => `<th scope="col"><b>${tag} · ${esc(name)}</b><span>${esc(blurb)}</span></th>`).join('');
  const index = tpl
    .replace('{{TOKENS}}', () => tokens)
    .replace(/{{TITLE}}/g, 'Study guides')
    .replace('{{DESC}}', 'Four short versions of every Career Tracks course: a super summary, entry level, mid level and interview prep, each cited to primary sources.')
    .replace('{{TRACKNAV}}', '')
    .replace('{{VERNAV}}', '')
    .replace('{{VBLURB}}', 'Four short versions of every track, separate from the handbook. Every claim links to a primary source: official documentation, a standard or RFC, or the original paper.')
    .replace('{{H1}}', 'Study guides')
    .replace('{{BODY}}', () => `<div class="grid-wrap"><table class="grid"><thead><tr><th scope="col">Track</th>${head}</tr></thead><tbody>\n${rows}\n</tbody></table></div>`)
    .replace('{{COUNT}}', String(allUrls.size))
    .replace('{{SOURCES}}', '');
  fs.writeFileSync(path.join(dir, 'index.html'), index);
  fs.writeFileSync(path.join(dir, 'sources.json'), JSON.stringify([...allUrls.keys()].sort(), null, 1));
  return { pages, sources: allUrls.size };
}

module.exports = { build, VERSIONS };
