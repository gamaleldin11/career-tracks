// Builds the course website from everything in content/.
//
//     npm run build        (or: node site/build.js)
//
// content/ is the source of truth: edit it, re-run this.
// Output: dist/index.html (one page) and dist/figures/. dist/ is generated and
// not committed; Vercel rebuilds and deploys it on every push (see vercel.json).
//
// Markdown conventions the build understands
//   # Title                         first line of every module
//   ## F3.2 Closures 🟢 ⭐           numbered section, level badge, "asked often" star
//   > [!term] Closure               callout; types: focus say term note warning
//                                   story sota check lab mistake
//   | Question | Strong short answer |   a table with this header becomes flash cards
//   [[F3]] or [[F3.2]]              cross-reference to a module or a section
//
// The AI Engineer and Network tracks keep their original formats in
// content/ai-journey and content/connectivity-bootcamp; sources.js converts them.
const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const hljs = require('highlight.js');
const { MODULES, TRACKS, LEVEL } = require('../content/course');
const QUIZ = require('../content/quizzes');
const SOURCES = require('./sources');

// --strict (used by CI) turns any warning into a failed build
const STRICT = process.argv.includes('--strict');
let warnings = 0;
const warn = console.warn;
console.warn = (...args) => { warnings++; warn(...args); };

const HERE = __dirname;
const SRC = path.join(HERE, '..', 'content', 'modules');
const OUT = path.join(HERE, '..', 'dist');
const LEVEL_NAME = { E: 'Entry', M: 'Mid', S: 'Senior' };
const EMOJI = { '🟢': 'E', '🟡': 'M', '🔴': 'S' };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 48) || 'x';

const LANG_ALIAS = { cs: 'csharp', 'c#': 'csharp', js: 'javascript', ts: 'typescript', tsx: 'typescript', jsx: 'javascript', jsonc: 'json', sh: 'bash', shell: 'bash', ps: 'powershell', html: 'xml', py: 'python', yml: 'yaml' };
const md = new MarkdownIt({
  html: true,
  linkify: false,
  typographer: false,
  highlight(code, lang) {
    const l = LANG_ALIAS[lang] || lang;
    const label = esc(lang || 'text');
    let body;
    if (l && hljs.getLanguage(l)) body = hljs.highlight(code, { language: l, ignoreIllegals: true }).value;
    else body = esc(code);
    return `<pre class="code" data-lang="${label}"><code>${body}</code></pre>`;
  },
});
// External links open in a new tab.
const defaultLink = md.renderer.rules.link_open || ((t, i, o, e, s) => s.renderToken(t, i, o));
md.renderer.rules.link_open = (tokens, idx, opts, env, self) => {
  const href = tokens[idx].attrGet('href') || '';
  if (/^https?:/.test(href)) { tokens[idx].attrSet('target', '_blank'); tokens[idx].attrSet('rel', 'noopener'); }
  return defaultLink(tokens, idx, opts, env, self);
};
// Wrap tables so they scroll on phones instead of the page.
md.renderer.rules.table_open = () => '<div class="tablewrap"><table>\n';
md.renderer.rules.table_close = () => '</table></div>\n';

// ------------------------------------------------------------ helpers
function chip(lv) {
  return `<span class="lv lv-${lv}" title="${LEVEL_NAME[lv]}"><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>${LEVEL_NAME[lv]}</span>`;
}
const STAR = '<span class="star" title="Frequently asked">★ asked often</span>';

// Split Markdown into lines while knowing which lines sit inside code fences.
function fenceMask(lines) {
  let inFence = false; let marker = '';
  return lines.map((l) => {
    const m = l.match(/^\s*(```+|~~~+)/);
    if (m) {
      if (!inFence) { inFence = true; marker = m[1][0]; return true; }
      if (m[1][0] === marker) { inFence = false; return true; }
    }
    return inFence;
  });
}

const CALLOUT_LABEL = {
  focus: 'Interview focus', say: 'Say it in the interview', term: '', note: 'Note', warning: 'Watch out',
  story: 'From your own work', sota: 'State of the art, 2026', check: 'Key takeaways', lab: 'Try it',
  mistake: 'Common mistake', tip: 'Tip', book: 'Book', map: 'Section map', question: 'Question', example: 'Example',
};

// "> [!type] title" blocks → <div class="co co-type"> with Markdown inside.
function convertCallouts(text, terms, modId) {
  const lines = text.split('\n');
  const mask = fenceMask(lines);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = !mask[i] && lines[i].match(/^>\s*\[!(\w+)\]([+-]?)\s*(.*)$/);
    if (!m) { out.push(lines[i]); continue; }
    const type = m[1].toLowerCase();
    const fold = m[2];
    const title = m[3].trim();
    const body = [];
    while (i + 1 < lines.length && /^>/.test(lines[i + 1])) { i++; body.push(lines[i].replace(/^>\s?/, '')); }
    // In focus cards each "**Label:**" line is its own paragraph.
    const src = type === 'focus' ? body.map((l) => (/^\*\*/.test(l) ? '\n' + l : l)).join('\n') : body.join('\n');
    const inner = md.render(src);
    const label = title || CALLOUT_LABEL[type] || type;
    if (type === 'term') terms.push({ term: title, html: inner, mod: modId });
    const titleHtml = md.renderInline(label);
    const cls = type === 'term' ? 'co co-term' : `co co-${type}`;
    const id = type === 'term' ? ` id="g-${slug(title)}"` : '';
    // "> [!type]- title" folds the callout (closed); "+" folds it open
    if (fold) out.push('', `<details class="${cls}"${fold === '+' ? ' open' : ''}><summary class="co-title">${titleHtml}</summary>${inner}</details>`, '');
    else out.push('', `<div class="${cls}"${id}><div class="co-title">${titleHtml}</div>${inner}</div>`, '');
  }
  return out.join('\n');
}

// A table whose header is "Question | Strong short answer" becomes flash cards.
function convertFlash(text) {
  const lines = text.split('\n');
  const mask = fenceMask(lines);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!mask[i] && /^\|\s*Question\s*\|\s*Strong short answer\s*\|/.test(lines[i])) {
      i++; // separator row
      const cards = [];
      while (i + 1 < lines.length && /^\|/.test(lines[i + 1])) {
        i++;
        const cells = lines[i].replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
        cards.push(`<details class="flash"><summary>${md.renderInline(cells[0])}</summary><div class="ans">${md.renderInline(cells[1] || '')}</div></details>`);
      }
      out.push('', `<div class="deck">${cards.join('')}</div>`, '');
    } else out.push(lines[i]);
  }
  return out.join('\n');
}

// ------------------------------------------------------------ pass 1: read
const mods = [];
const sectionIndex = {}; // "F3.2" → section id
const terms = [];
const aiFiles = fs.existsSync(SOURCES.AI_DIR) ? fs.readdirSync(SOURCES.AI_DIR).filter((f) => /\.md$/.test(f)) : [];
const net = fs.existsSync(SOURCES.NET_FILE) ? SOURCES.loadBootcamp() : { mods: {}, terms: [] };
for (const [id, meta] of Object.entries(MODULES)) {
  if (meta.net) {
    const N = net.mods[id];
    if (!N) { console.warn('missing bootcamp module', id); continue; }
    mods.push({ id, meta, title: N.title || meta.short, lede: N.lede, pre: N.sections });
    continue;
  }
  let text;
  if (meta.ai) {
    const f = aiFiles.find((x) => x.startsWith(meta.ai + '_'));
    if (!f) { console.warn('missing AI part', meta.ai); continue; }
    text = SOURCES.loadAiModule(f);
  } else {
    const file = path.join(SRC, meta.file);
    if (!fs.existsSync(file)) { console.warn('missing', meta.file); continue; }
    text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  }
  const h1 = text.match(/^#\s+(.+)$/m);
  const title = h1 ? h1[1].trim() : meta.short;
  if (h1) text = text.replace(h1[0], '');
  mods.push({ id, meta, title, text });
}
terms.push(...net.terms);

// ------------------------------------------------------------ consistency checks
// Adding a topic means: a file in content/modules, an entry in MODULES, a place
// in at least one track. These warnings catch whichever step was missed.
{
  const registered = new Set(Object.values(MODULES).map((m) => m.file).filter(Boolean));
  for (const f of fs.readdirSync(SRC).filter((x) => x.endsWith('.md'))) {
    if (!registered.has(f)) console.warn(`not in MODULES (content/course.js): content/modules/${f}`);
  }
  const onTrack = new Set(TRACKS.flatMap((t) => t.stages.flatMap((s) => s[1])));
  for (const id of Object.keys(MODULES)) if (id !== '00' && !onTrack.has(id)) console.warn(`module ${id} is on no track`);
  for (const id of onTrack) if (!MODULES[id]) console.warn(`a track lists unknown module ${id}`);
  const ids = TRACKS.map((t) => t.id);
  if (new Set(ids).size !== ids.length) console.warn('two tracks share an id');
  for (const t of TRACKS) if (!(QUIZ[t.id] || []).length) console.warn(`track ${t.id} has no self-test questions (content/quizzes.js)`);
}

// <p><img> <em>caption</em></p> → a figure that opens full size
const figures = (html) => html.replace(/<p><img src="([^"]+)" alt="([^"]*)"\s*\/?>\s*(?:<em>([\s\S]*?)<\/em>)?\s*<\/p>/g,
  (a, src, alt, cap) => `<figure class="pic"><a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="${alt}" loading="lazy"></a><figcaption>${cap || alt}</figcaption></figure>`);

// Pre-rendered sections (the bootcamp) → the same section markup as Markdown modules
function renderPrebuilt(M) {
  const used = new Set();
  return M.pre.map((s) => {
    let body = s.html.replace(/<h([34])>([\s\S]*?)<\/h\1>/g, (all, n, inner) => {
      let hid = `${M.id}-${slug(inner.replace(/&amp;/g, '&'))}`; while (used.has(hid)) hid += 'x'; used.add(hid);
      return `<h${n} id="${hid}">${inner}</h${n}>`;
    });
    if (!s.head) return `<section class="sec intro" data-level="">${body}</section>`;
    const plainTitle = s.head.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
    let sid = s.num ? `s-${s.num}` : `${M.id}-${slug(plainTitle)}`;
    while (used.has(sid)) sid += 'x'; used.add(sid);
    if (s.num) sectionIndex[s.num] = sid;
    M.sections.push({ id: sid, num: s.num, title: s.head, lv: s.lv, asked: false });
    const tags = s.lv ? `<span class="tags">${chip(s.lv)}</span>` : '';
    const h2 = `<h2>${s.num ? `<span class="num">§${esc(s.num)}</span>` : ''}<span class="ttl">${s.head}</span>${tags}</h2>`;
    const plain = (h2 + body).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    search.push({ id: sid, m: M.id, n: s.num, t: plainTitle, x: plain.slice(0, 1600) });
    return `<section class="sec${s.tier ? ' tier' : ''}" id="${sid}" data-level="${s.lv}">${h2}${body}</section>`;
  }).join('\n');
}

// ------------------------------------------------------------ pass 2: render
const search = [];
for (const M of mods) {
  if (M.pre) {
    M.sections = [];
    M.html = renderPrebuilt(M);
    search.push({ id: `m-${M.id}`, m: M.id, n: '', t: M.title, x: (M.lede || '').replace(/<[^>]+>/g, ' ').slice(0, 600) });
    continue;
  }
  let text = convertFlash(convertCallouts(M.text, terms, M.id));
  const lines = text.split('\n');
  const mask = fenceMask(lines);
  const chunks = [{ head: null, lines: [] }];
  lines.forEach((l, i) => {
    if (!mask[i] && /^##\s+/.test(l)) chunks.push({ head: l.replace(/^##\s+/, ''), lines: [] });
    else chunks[chunks.length - 1].lines.push(l);
  });
  M.sections = [];
  const used = new Set();
  M.html = chunks.map((c, ci) => {
    let body = figures(md.render(c.lines.join('\n')));
    // h3/h4 ids for deep links
    body = body.replace(/<h([34])>(.*?)<\/h\1>/g, (all, n, inner) => {
      let hid = `${M.id}-${slug(inner)}`; while (used.has(hid)) hid += 'x'; used.add(hid);
      return `<h${n} id="${hid}">${inner}</h${n}>`;
    });
    if (!c.head) return `<section class="sec intro" data-level="">${body}</section>`;
    const raw = c.head;
    const num = (raw.match(/^([A-Z]{0,2}\d+B?(?:\.\d+)?)\s+/) || [])[1] || '';
    const lv = Object.keys(EMOJI).filter((e) => raw.includes(e)).map((e) => EMOJI[e])[0] || '';
    const asked = raw.includes('⭐');
    const clean = raw.replace(/^([A-Z]{0,2}\d+B?(?:\.\d+)?)\s+/, '').replace(/\s*(🟢|🟡|🔴|⭐)/g, '').trim();
    let sid = num ? `s-${num}` : `${M.id}-${slug(clean)}`;
    while (used.has(sid)) sid += 'x'; used.add(sid);
    if (num) sectionIndex[num] = sid;
    const isCheck = /^Key takeaways/i.test(clean);
    M.sections.push({ id: sid, num, title: clean, lv, asked });
    const tags = (lv || asked) ? `<span class="tags">${lv ? chip(lv) : ''}${asked ? STAR : ''}</span>` : '';
    const h2 = `<h2>${num ? `<span class="num">§${esc(num)}</span>` : ''}<span class="ttl">${md.renderInline(clean)}</span>${tags}</h2>`;
    const plain = (h2 + body).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    search.push({ id: sid, m: M.id, n: num, t: clean.replace(/[`*]/g, ''), x: plain.slice(0, 1600) });
    return `<section class="sec${isCheck ? ' takeaways' : ''}" id="${sid}" data-level="${lv}">${h2}${body}</section>`;
  }).join('\n');
  // the intro is searchable under the module title
  search.push({ id: `m-${M.id}`, m: M.id, n: '', t: M.title, x: M.html.slice(0, 3000).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 600) });
}

// ------------------------------------------------------------ pass 3: links
const modIds = new Set(mods.map((m) => m.id));
const titleOf = Object.fromEntries(mods.map((m) => [m.id, m.meta.short]));
const linkXrefs = (html, M) => html.replace(/\[\[([A-Z]{0,2}\d+B?)(?:\.(\d+))?\]\]/g, (all, mod, sec) => {
    if (sec) {
      const sid = sectionIndex[`${mod}.${sec}`];
      if (sid) return `<a class="xref" href="#${sid}">§${mod}.${sec}</a>`;
    }
    if (modIds.has(mod)) return `<a class="xref" href="#m-${mod}">${mod} · ${esc(titleOf[mod])}</a>`;
    console.warn(`unresolved link ${all} in ${M.id}`);
    return all;
  });
for (const M of mods) {
  // never turn [[…]] inside code (Python's df[['a', 'b']]) into links
  M.html = M.html.split(/(<pre[\s\S]*?<\/pre>|<code>[\s\S]*?<\/code>)/).map((part, i) => (i % 2 ? part : linkXrefs(part, M))).join('');
}
// links like #m-AI6 or #s-AI6.3 written by the importers must point somewhere
const allIds = new Set([...mods.map((m) => `m-${m.id}`), ...Object.values(sectionIndex)]);
for (const M of mods) {
  for (const [, href] of M.html.matchAll(/href="#((?:m|s)-[^"]+)"/g)) if (!allIds.has(href)) console.warn(`dead link #${href} in ${M.id}`);
}

// ------------------------------------------------------------ glossary
terms.sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
const seenTerms = new Set();
const glossary = terms.filter((t) => {
  const k = t.term.toLowerCase(); if (seenTerms.has(k)) return false; seenTerms.add(k); return true;
}).map((t) => `<div class="gl-item" data-letter="${esc(t.term[0].toUpperCase())}"><dt><a href="#${t.href || `g-${slug(t.term)}`}">${t.href ? esc(t.term) : md.renderInline(t.term)}</a> <small>${t.mod}</small></dt><dd>${t.html}</dd></div>`).join('');

// ------------------------------------------------------------ quiz pages
for (const [tid, qs] of Object.entries(QUIZ)) for (const it of qs) {
  const ok = it.ref.includes('.') ? sectionIndex[it.ref] : modIds.has(it.ref);
  if (!ok) console.warn(`quiz ${tid}: unknown ref ${it.ref}`);
  if (!(it.a >= 0 && it.a < it.c.length)) console.warn(`quiz ${tid}: bad answer index in "${it.q}"`);
}
const quizPages = TRACKS.map((tr) => {
  const qs = QUIZ[tr.id] || [];
  return `<article class="part page" id="quiz-${tr.id}" data-page="quiz-${tr.id}" hidden>
<header class="part-head"><div class="eyebrow"><span class="pnum">Self-test</span><span class="track-lbl">${esc(tr.name)}</span></div>
<h1>${esc(tr.name)} self-test</h1><p class="lede">${qs.length} questions drawn from every module on this track. Answer them all, then grade. Every answer explains itself and points at the section to reread.</p></header>
<div class="quiz" data-track="${tr.id}"><script type="application/json">${JSON.stringify(qs).replace(/</g, '\\u003c')}</script></div></article>`;
}).join('\n');

// ------------------------------------------------------------ assemble
const articles = mods.map((M) => {
  const lv = LEVEL[M.id];
  const toc = M.sections.map((s) => `<li class="lvl-${s.lv || 'x'}"><a href="#${s.id}"><span class="tn">${esc(s.num || (/^Key takeaways/i.test(s.title) ? '✓' : '·'))}</span><span class="tt">${md.renderInline(s.title)}</span></a></li>`).join('');
  return `<article class="part" id="m-${M.id}" data-mod="${M.id}" hidden>
<header class="part-head"><div class="path-meter" aria-hidden="true"><i></i></div>
<div class="eyebrow"><span class="step"></span><span class="pnum">Module ${M.id === '00' ? '00' : M.id}</span><span class="track-lbl"></span>${lv ? `<span class="tested">Tested up to ${chip(lv)}</span>` : ''}</div>
<h1>${M.pre ? M.title : md.renderInline(M.title)}</h1>${M.lede ? `<p class="lede">${M.lede}</p>` : ''}
<div class="part-actions">${M.id === '00' ? '' : `<button type="button" class="mark-done" data-mod="${M.id}">Mark as done</button>`}<span class="also"></span><span class="hidden-note" hidden></span></div></header>
<div class="part-body">${M.html}</div>
<nav class="pager"></nav>
<template class="toc-tpl"><ol>${toc}</ol></template></article>`;
}).join('\n');

const glossaryPage = `<article class="part page" id="glossary" data-page="glossary" hidden>
<header class="part-head"><div class="eyebrow"><span class="pnum">Reference</span></div><h1>Glossary</h1>
<p class="lede">Every term defined anywhere in the course, A to Z. The small code after each term is the module that teaches it.</p>
<input type="search" id="glq" class="glq" placeholder="Filter terms" aria-label="Filter glossary terms"></header>
<dl class="gl">${glossary}</dl></article>`;

const head = fs.readFileSync(path.join(HERE, 'template_head.html'), 'utf8');
const bodyTpl = fs.readFileSync(path.join(HERE, 'template_body.html'), 'utf8');
const data = {
  tracks: TRACKS.map((t) => ({ id: t.id, name: t.name, blurb: t.blurb, stages: t.stages })),
  titles: Object.fromEntries(mods.map((m) => [m.id, m.meta.short])),
  levels: LEVEL,
};
for (const s of search) s.x = s.x.replace(/\[\[([A-Z]{0,2}\d+B?(?:\.\d+)?)\]\]/g, '§$1');
const body = bodyTpl
  .replace('{{ARTICLES}}', () => articles + '\n' + glossaryPage + '\n' + quizPages)
  .replace('{{SEARCH}}', () => JSON.stringify(search).replace(/</g, '\\u003c'))
  .replace('{{DATA}}', () => JSON.stringify(data).replace(/</g, '\\u003c'));

const html = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${head}\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), html);
const figs = SOURCES.copyAiFigures(path.join(OUT, 'figures'));
const sizeMb = (Buffer.byteLength(html) / 1e6).toFixed(2);
console.log(`built ${mods.length} modules, ${search.length} sections, ${terms.length} terms, ${figs} figures, dist/index.html ${sizeMb} MB`);
if (warnings) {
  console.log(`${warnings} warning${warnings > 1 ? 's' : ''}`);
  if (STRICT) process.exit(1);
}
