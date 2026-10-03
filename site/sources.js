// Imports the two courses that keep their original formats:
//
//   content/ai-journey/parts/*.md                         AI Journey (Obsidian Markdown)
//   content/connectivity-bootcamp/connectivity-bootcamp.html   Bootcamp (one hand-written page)
//
// The files are never modified. The AI parts are rewritten into this course's
// Markdown conventions in memory; the bootcamp page is cut into modules and sections.
// New topics should be plain Markdown in content/modules and need no importer.
const fs = require('fs');
const path = require('path');
const katex = require('katex');

const CONTENT = path.resolve(__dirname, '..', 'content');
const AI_DIR = path.join(CONTENT, 'ai-journey', 'parts');
const AI_FIGURES = path.join(CONTENT, 'ai-journey', 'figures');
const NET_FILE = path.join(CONTENT, 'connectivity-bootcamp', 'connectivity-bootcamp.html');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&\w+;/g, '').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 48) || 'x';
const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// ================================================================ AI Journey
// "06" → "AI6", "08B" → "AI8B"
const aiId = (key) => 'AI' + key.replace(/^0(?=\d)/, '');

// Rewrite text outside inline code and outside existing Markdown links.
function mapProse(line, fn) {
  return line.split(/(`[^`]*`|!?\[[^\]]*\]\([^)]*\))/).map((part, i) => (i % 2 ? part : fn(part))).join('');
}

function aiRefs(s) {
  return s
    // §16.1–16.5 → two links
    .replace(/§(\d+B?)\.(\d+)–(\d+B?)\.(\d+)/g, (a, m1, s1, m2, s2) => `[[AI${m1}.${s1}]]–[[AI${m2}.${s2}]]`)
    // §4.10.3 → link to §AI4.10, keep the sub-number visible
    .replace(/§(\d+B?)\.(\d+)\.(\d+)/g, (a, m, s1, s2) => `<a class="xref" href="#s-AI${m}.${s1}">§AI${m}.${s1}.${s2}</a>`)
    .replace(/§(\d+B?)\.(\d+)/g, (a, m, s1) => `[[AI${m}.${s1}]]`)
    // Part 16 / Parts 7–11
    .replace(/\bParts (\d+B?)–(\d+B?)\b/g, (a, m1, m2) => `Parts [${m1}](#m-AI${m1})–[${m2}](#m-AI${m2})`)
    .replace(/\bPart (\d+B?)\b/g, (a, m) => `[Part ${m}](#m-AI${m.replace(/^0(?=\d)/, '')})`);
}

function renderMath(tex) {
  try {
    return katex.renderToString(tex.trim(), { output: 'mathml', displayMode: true, throwOnError: true });
  } catch (e) {
    console.warn('math failed:', e.message);
    return `<pre class="code" data-lang="tex"><code>${esc(tex)}</code></pre>`;
  }
}

function adaptAi(text) {
  text = text.replace(/\r\n/g, '\n');
  // display maths first ($$ … $$ may span lines)
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (a, tex) => `\n\n<div class="math">${renderMath(tex)}</div>\n\n`);
  const lines = text.split('\n');
  const out = [];
  let inFence = false; let marker = '';
  for (let i = 0; i < lines.length; i++) {
    let l = lines[i];
    const fm = l.match(/^\s*(```+|~~~+)/);
    if (fm) {
      if (!inFence) { inFence = true; marker = fm[1][0]; } else if (fm[1][0] === marker) inFence = false;
      out.push(l); continue;
    }
    if (inFence) { out.push(l); continue; }

    if (/^<!--.*-->\s*$/.test(l)) continue;                              // <!-- nav --> markers
    if (/^\*\*Legend:\*\*/.test(l)) continue;                            // the site has its own legend
    if (/^>\s*\[!example\]\s*🧭/.test(l)) {                              // Previous/Next block → site pager
      while (i + 1 < lines.length && /^>/.test(lines[i + 1])) i++;
      while (out.length && /^\s*(---)?\s*$/.test(out[out.length - 1])) out.pop();
      out.push('');
      continue;
    }
    const h1 = l.match(/^#\s+Part\s+\d+B?\s+—\s+(.+)$/);
    if (h1) { out.push('# ' + h1[1]); continue; }
    const h2 = l.match(/^##\s+(\d+B?)\.(\d+)\s+(.*)$/);
    if (h2) { out.push(`## AI${h2[1]}.${h2[2]} ${h2[3]}`); continue; }

    // Obsidian callout headers → this course's callout types
    const co = l.match(/^>\s*\[!(\w+)\]([+-]?)\s*(.*)$/);
    if (co) {
      const [, type, fold, title] = co;
      const t = type.toLowerCase();
      if (t === 'tip' && /Interview focus/.test(title)) { out.push('> [!focus]'); continue; }
      if (t === 'quote' && /Say it/.test(title)) { out.push('> [!say]'); continue; }
      if (t === 'info' && /^📖/.test(title)) { out.push('> [!book] ' + aiRefs(title.replace(/^📖\s*/, ''))); continue; }
      if (t === 'abstract') { out.push(`> [!map]${fold || '-'} ${title.replace(/^🗺️\s*/, '')}`); continue; }
      if (t === 'check') { out.push('## Key takeaways', '', '> [!check]'); continue; }
      const mapped = { info: 'note', success: 'sota' }[t] || t;
      out.push(`> [!${mapped}]${fold} ${mapProse(title, aiRefs)}`);
      continue;
    }
    l = l.replace(/\]\((\d+B?)_[^)#\s]*\.md(?:#[^)]*)?\)/g, (a, key) => `](#m-${aiId(key)})`);
    out.push(mapProse(l, aiRefs));
  }
  return out.join('\n');
}

function loadAiModule(file) {
  return adaptAi(fs.readFileSync(path.join(AI_DIR, file), 'utf8'));
}

function copyAiFigures(destDir) {
  if (!fs.existsSync(AI_FIGURES)) { console.warn('AI figures folder not found'); return 0; }
  fs.mkdirSync(destDir, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(AI_FIGURES)) {
    if (!/\.png$/i.test(f)) continue;
    const src = path.join(AI_FIGURES, f); const dst = path.join(destDir, f);
    const s = fs.statSync(src);
    if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < s.mtimeMs) fs.copyFileSync(src, dst);
    n++;
  }
  return n;
}

// ================================================================ Bootcamp
const VOID = new Set(['br', 'img', 'input', 'hr', 'meta', 'link', 'source', 'wbr', 'col', 'area', 'base', 'embed', 'param', 'track']);
const TAG = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;

// Split an HTML fragment into its top-level nodes: { tag, cls, html } (tag '' = text).
function topNodes(html) {
  const nodes = []; let depth = 0; let start = 0; let open = null; let m;
  TAG.lastIndex = 0;
  while ((m = TAG.exec(html))) {
    if (!m[2]) continue; // comment
    const closing = m[1] === '/'; const name = m[2].toLowerCase();
    const self = VOID.has(name) || /\/\s*$/.test(m[3]);
    if (!closing) {
      if (depth === 0) {
        if (m.index > start) nodes.push({ tag: '', html: html.slice(start, m.index) });
        if (self) { nodes.push({ tag: name, cls: attr(m[3], 'class'), html: m[0] }); start = TAG.lastIndex; continue; }
        open = { tag: name, cls: attr(m[3], 'class'), at: m.index };
      }
      if (!self) depth++;
    } else {
      depth--;
      if (depth === 0 && open) {
        nodes.push({ tag: open.tag, cls: open.cls, html: html.slice(open.at, TAG.lastIndex) });
        open = null; start = TAG.lastIndex;
      }
    }
  }
  if (start < html.length) nodes.push({ tag: '', html: html.slice(start) });
  return nodes;
}
function attr(attrs, name) {
  const m = attrs.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? m[1] : '';
}
const inner = (html) => html.replace(/^<[^>]+>/, '').replace(/<\/[^>]+>\s*$/, '');

const usedIds = new Set();
function uniqueId(base) { let id = base; while (usedIds.has(id)) id += 'x'; usedIds.add(id); return id; }

// Bootcamp markup → this site's components.
function restyle(html, modId, terms) {
  return html
    .replace(/<div class="tw">/g, '<div class="tablewrap">')
    .replace(/<figure>/g, '<figure class="dia">')
    .replace(/<pre>/g, '<pre class="code" data-lang="">')
    .replace(/<dl class="gl">/g, '<dl class="ngl">')
    .replace(/<div class="note warn">/g, '<div class="co co-warning">')
    .replace(/<div class="note"( id="[^"]*")?>/g, '<div class="co co-note"$1>')
    .replace(/<a href="#m(\d+)">/g, '<a class="xref" href="#m-N$1">')
    .replace(/<div class="term"><b class="t">([\s\S]*?)<\/b>([\s\S]*?)<\/div>/g, (a, term, body) => {
      const id = uniqueId(`g-n-${slug(term)}`);
      terms.push({ term: stripTags(term), html: body, mod: modId, href: id });
      return `<div class="co co-term" id="${id}"><div class="co-title">${term}</div>${body}</div>`;
    });
}

// Level 1 = core (Entry), Level 2 deep dives (Mid), Levels 3–4 expert and frontier (Senior).
function deepLevel(tag) {
  if (/^Level 2/.test(tag)) return 'M';
  if (/^Level [34]/.test(tag)) return 'S';
  return 'M'; // command compendia: working knowledge beyond the core
}

function loadBootcamp() {
  const page = fs.readFileSync(NET_FILE, 'utf8').replace(/\r\n/g, '\n');
  const hero = (page.match(/<div class="hero">([\s\S]*?)\n<\/div>/) || [])[1] || '';
  const heroLede = (hero.match(/<p class="lede">([\s\S]*?)<\/p>/) || [])[1] || '';
  const mods = {};
  const terms = [];
  const re = /<section class="mod" id="m(\d+)">([\s\S]*?)<\/section>/g;
  let m;
  while ((m = re.exec(page))) {
    const n = m[1]; const id = 'N' + n;
    const nodes = topNodes(m[2]);
    let title = ''; let lede = '';
    const sections = [{ head: null, num: '', lv: '', html: '' }];
    const cur = () => sections[sections.length - 1];
    for (const nd of nodes) {
      if (nd.tag === 'div' && nd.cls === 'eyebrow') continue;
      if (nd.tag === 'h2' && !title) { title = stripTags(inner(nd.html)).trim(); continue; }
      if (nd.tag === 'p' && nd.cls === 'goal' && !lede) { lede = inner(nd.html).trim(); continue; }
      if (nd.tag === 'h3') {
        const h = inner(nd.html).trim();
        const num = (stripTags(h).match(/^(\d+\.\d+)\s+/) || [])[1];
        sections.push({ head: num ? h.replace(/^\s*\d+\.\d+\s+/, '') : h, num: num ? 'N' + num : '', lv: num ? 'E' : '', html: '' });
        continue;
      }
      if (nd.tag === 'div' && nd.cls === 'qhead') {
        const h = (nd.html.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || 'Interview questions';
        const btn = (nd.html.match(/<button[^>]*>[\s\S]*?<\/button>/) || [''])[0].replace('<button ', '<button type="button" class="qa-all" ');
        sections.push({ head: h.replace(/\s+—\s+Module\s+\d+$/, ''), num: '', lv: '', html: btn ? `<div class="qhead">${btn}</div>` : '' });
        continue;
      }
      if (nd.tag === 'div' && /^deep\b/.test(nd.cls)) {
        const tag = stripTags((nd.html.match(/<span class="dtag">([\s\S]*?)<\/span>/) || [])[1] || 'Deep dive');
        const head = tag.replace(/^Level \d+\s*·\s*/, '').replace(/\s*—\s*foundation → state of the art$/, '');
        const body = nd.html.replace(/<span class="dtag">[\s\S]*?<\/span>\s*/, '');
        sections.push({ head: head, num: '', lv: deepLevel(tag), tier: tag, html: body });
        continue;
      }
      cur().html += nd.html;
    }
    for (const s of sections) s.html = restyle(s.html, id, terms);
    if (n === '0' && heroLede) sections[0].html = `<p>${heroLede}</p>` + sections[0].html;
    // the glossary module: every <dt> becomes a glossary entry too
    if (n === '16') {
      for (const s of sections) {
        s.html = s.html.replace(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g, (a, dt, dd) => {
          const hid = uniqueId(`g-n-${slug(dt)}`);
          terms.push({ term: stripTags(dt), html: `<p>${dd}</p>`, mod: id, href: hid });
          return `<dt id="${hid}">${dt}</dt><dd>${dd}</dd>`;
        });
      }
    }
    mods[id] = { title, lede, sections };
  }
  return { mods, terms };
}

module.exports = { loadAiModule, copyAiFigures, loadBootcamp, AI_DIR, NET_FILE };
