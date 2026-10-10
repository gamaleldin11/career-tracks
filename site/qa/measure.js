// Layout check for diagrams. With "npm run serve" running, paste into the browser console:
//   await document.fonts.ready; window.__only = null; eval(await (await fetch('/qa/measure.js')).text())
// It reports SVG text that leaves its viewBox or overlaps other text, for every diagram in every module (or only ids in window.__only).
(() => {
  const ONLY = window.__only || null; // e.g. ['S1','F3']
  const arts = [...document.querySelectorAll('article.part[data-mod]')].filter(a => !ONLY || ONLY.includes(a.dataset.mod));
  const was = arts.map(a => a.hidden);
  arts.forEach(a => { a.hidden = false; });
  const out = [];
  for (const a of arts) {
    a.querySelectorAll('figure.dia').forEach((fig, fi) => {
      fig.querySelectorAll('section.sec.filtered').forEach(() => {});
      const svg = fig.querySelector('svg'); if (!svg) return;
      const vb = svg.viewBox.baseVal;
      const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('.pk') && !t.querySelector('animate') && !(t.parentElement && t.parentElement.querySelector(':scope > animate')));
      const boxes = texts.map(t => {
        let b; try { b = t.getBBox(); } catch (e) { return null; }
        // map through transforms of ancestors inside the svg
        const m = t.getCTM && svg.getCTM ? svg.getCTM().inverse().multiply(t.getCTM()) : null;
        let x0 = b.x, y0 = b.y, x1 = b.x + b.width, y1 = b.y + b.height;
        if (m) { const p = (x, y) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; [x0, y0] = p(x0, y0); [x1, y1] = p(x1, y1); }
        const grp = t.closest('[data-s]');
        return { t, x0: Math.min(x0, x1), x1: Math.max(x0, x1), y0: Math.min(y0, y1), y1: Math.max(y0, y1), s: grp ? grp.getAttribute('data-s') : '' };
      });
      const tag = `${a.dataset.mod} fig${fi + 1}`;
      boxes.forEach(b => {
        if (!b || (b.x1 - b.x0) === 0) return;
        if (b.x0 < vb.x - 1 || b.x1 > vb.x + vb.width + 1 || b.y0 < vb.y - 1 || b.y1 > vb.y + vb.height + 1)
          out.push(`${tag} OUT [${b.x0.toFixed(0)}..${b.x1.toFixed(0)} x ${b.y0.toFixed(0)}..${b.y1.toFixed(0)} in ${vb.width}x${vb.height}] ${b.t.textContent.slice(0, 50)}`);
      });
      const together = (p, q) => {
        if (!p.s || !q.s) return true;
        const r = s => { const m = s.match(/^(\d+)(?:-(\d+))?$/); return [+m[1], m[2] ? +m[2] : 99]; };
        const [a1, b1] = r(p.s), [a2, b2] = r(q.s);
        return a1 <= b2 && a2 <= b1;
      };
      // text spilling out of the smallest rectangle that contains its centre
      const rects = [...svg.querySelectorAll('rect')].filter(r => !r.closest('.pk')).map(r => {
        let b; try { b = r.getBBox(); } catch (e) { return null; }
        const m = svg.getCTM().inverse().multiply(r.getCTM());
        const grp = r.closest('[data-s]');
        return { x0: m.a * b.x + m.e, y0: m.d * b.y + m.f, x1: m.a * (b.x + b.width) + m.e, y1: m.d * (b.y + b.height) + m.f, s: grp ? grp.getAttribute('data-s') : '' };
      }).filter(r => r && r.x1 - r.x0 > 4 && r.y1 - r.y0 > 4);
      boxes.forEach(b => {
        if (!b || (b.x1 - b.x0) === 0) return;
        const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
        const host = rects.filter(r => cx >= r.x0 && cx <= r.x1 && cy >= r.y0 && cy <= r.y1 && together(b, r))
          .sort((p, q) => (p.x1 - p.x0) * (p.y1 - p.y0) - (q.x1 - q.x0) * (q.y1 - q.y0))[0];
        if (host && (b.x0 < host.x0 - 1 || b.x1 > host.x1 + 1))
          out.push(`${tag} SPILL "${b.t.textContent.slice(0, 40)}" [${b.x0.toFixed(0)}..${b.x1.toFixed(0)}] box [${host.x0.toFixed(0)}..${host.x1.toFixed(0)}]`);
      });
      // overlaps between texts that can be visible together
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const p = boxes[i], q = boxes[j]; if (!p || !q) continue;
        const w = Math.min(p.x1, q.x1) - Math.max(p.x0, q.x0), h = Math.min(p.y1, q.y1) - Math.max(p.y0, q.y0);
        if (w > 2 && h > 3 && together(p, q))
          out.push(`${tag} OVERLAP "${p.t.textContent.slice(0, 30)}" × "${q.t.textContent.slice(0, 30)}"`);
      }
    });
  }
  arts.forEach((a, i) => { a.hidden = was[i]; });
  return out.length ? out : ['no problems'];
})()
