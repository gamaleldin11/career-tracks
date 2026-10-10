// Step-figure check. With "npm run serve" running, paste into the browser console:
//   eval(await (await fetch('/qa/stepcheck.js')).text())
// For every step figure, reports text that overlaps at any step, including the overview (k = 0) and faint previews of later persistent parts.
(() => {
  const ONLY = window.__only || null;
  const arts = [...document.querySelectorAll('article.part[data-mod]')].filter(a => !ONLY || ONLY.includes(a.dataset.mod));
  const was = arts.map(a => a.hidden);
  arts.forEach(a => { a.hidden = false; });
  const parse = s => { const m = s.split('-'); return { a: +m[0], b: m.length > 1 ? +m[1] : Infinity }; };
  const out = [];
  for (const art of arts) {
    art.querySelectorAll('figure.dia.steps').forEach(f => {
      const N = f.querySelectorAll('.dia-steps li').length;
      const parts = [...f.querySelectorAll('svg [data-s]')].filter(e => !e.classList.contains('pk')).map(e => ({ el: e, ...parse(e.getAttribute('data-s')) }));
      const texts = [...f.querySelectorAll('svg text')].map(tx => ({ tx, b: tx.getBBox() })).filter(o => o.b.width > 0);
      for (let k = 0; k <= N; k++) {
        const state = o => {
          let st = 'vis';
          for (const p of parts.filter(p => p.el.contains(o.tx))) {
            const vis = k === 0 ? p.b >= N : (k >= p.a && k <= p.b);
            const later = k > 0 && !vis && k < p.a;
            if (!vis) { if (later && p.b === Infinity) { if (st === 'vis') st = 'off'; } else { st = 'gone'; break; } }
          }
          return st;
        };
        const shown = texts.map(o => ({ ...o, st: state(o) })).filter(o => o.st !== 'gone');
        for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) {
          const A = shown[i].b, B = shown[j].b;
          const ox = Math.min(A.x + A.width, B.x + B.width) - Math.max(A.x, B.x);
          const oy = Math.min(A.y + A.height, B.y + B.height) - Math.max(A.y, B.y);
          if (ox > 2 && oy > 3 && shown[i].tx.textContent !== shown[j].tx.textContent)
            out.push(`${art.dataset.mod} "${f.querySelector('svg').getAttribute('aria-label').slice(0, 30)}" step ${k}: ${shown[i].tx.textContent.slice(0, 25)}(${shown[i].st}) x ${shown[j].tx.textContent.slice(0, 25)}(${shown[j].st})`);
        }
      }
    });
  }
  arts.forEach((a, i) => { a.hidden = was[i]; });
  return [...new Set(out)];
})();
