/* ============================================================
   Lightweight SVG Chart Library  ★ Animated + Gradient
   ============================================================ */

/**
 * renderBarChart(containerEl, data, options)
 * data: [{ label, value, color? }]
 */
function renderBarChart(containerEl, data, opts = {}) {
  const W    = opts.width  || containerEl.clientWidth  || 400;
  const H    = opts.height || 200;
  const PAD  = { top: 24, right: 18, bottom: 38, left: 44 };
  const cW   = W - PAD.left - PAD.right;
  const cH   = H - PAD.top  - PAD.bottom;
  const max  = Math.max(...data.map(d => d.value), 1);
  const n    = data.length;
  const barW = Math.max(6, Math.floor((cW / n) * 0.6));

  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', H);
  svg.style.overflow = 'visible';

  /* ── Gradient defs ── */
  const defs = document.createElementNS(ns, 'defs');

  const grad = document.createElementNS(ns, 'linearGradient');
  grad.setAttribute('id', '_barG');
  grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
  grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
  const s1 = document.createElementNS(ns, 'stop');
  s1.setAttribute('offset', '0%');   s1.setAttribute('stop-color', '#818cf8');
  const s2 = document.createElementNS(ns, 'stop');
  s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#6366f1');
  grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad);

  const glowFilter = document.createElementNS(ns, 'filter');
  glowFilter.setAttribute('id', '_barGlow');
  const feGauss = document.createElementNS(ns, 'feGaussianBlur');
  feGauss.setAttribute('stdDeviation', '2'); feGauss.setAttribute('result', 'blur');
  const feMerge = document.createElementNS(ns, 'feMerge');
  const n1 = document.createElementNS(ns, 'feMergeNode'); n1.setAttribute('in', 'blur');
  const n2 = document.createElementNS(ns, 'feMergeNode'); n2.setAttribute('in', 'SourceGraphic');
  feMerge.appendChild(n1); feMerge.appendChild(n2);
  glowFilter.appendChild(feGauss); glowFilter.appendChild(feMerge);
  defs.appendChild(glowFilter);

  svg.appendChild(defs);

  const gridColor  = opts.gridColor  || 'rgba(99,102,241,.1)';
  const labelColor = opts.labelColor || '#64748b';
  const valColor   = opts.valColor   || '#6366f1';

  /* ── Background ── */
  const bg = document.createElementNS(ns, 'rect');
  bg.setAttribute('x', 0); bg.setAttribute('y', 0);
  bg.setAttribute('width', W); bg.setAttribute('height', H);
  bg.setAttribute('fill', 'transparent');
  svg.appendChild(bg);

  /* ── Grid lines ── */
  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + (cH / 4) * i;

    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', PAD.left); line.setAttribute('x2', PAD.left + cW);
    line.setAttribute('y1', y);        line.setAttribute('y2', y);
    line.setAttribute('stroke', gridColor);
    line.setAttribute('stroke-width', i === 4 ? '1.5' : '1');
    line.setAttribute('stroke-dasharray', i === 4 ? '' : '4 4');
    svg.appendChild(line);

    /* Y-axis label */
    const val = Math.round(max - (max / 4) * i);
    const lbl = document.createElementNS(ns, 'text');
    lbl.setAttribute('x', PAD.left - 8); lbl.setAttribute('y', y + 4);
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('font-size', '10'); lbl.setAttribute('fill', labelColor);
    lbl.setAttribute('font-weight', '600');
    lbl.setAttribute('font-family', '-apple-system,"Segoe UI",system-ui,sans-serif');
    lbl.textContent = opts.formatY ? opts.formatY(val) : val;
    svg.appendChild(lbl);
  }

  /* ── Bars ── */
  data.forEach((d, i) => {
    const x    = PAD.left + (cW / n) * i + ((cW / n) - barW) / 2;
    const bH   = Math.max(3, (d.value / max) * cH);
    const y    = PAD.top + cH - bH;
    const fill = d.color || 'url(#_barG)';

    /* Bar shadow (glow under bar) */
    const shadow = document.createElementNS(ns, 'rect');
    shadow.setAttribute('x', x + 2); shadow.setAttribute('y', y + bH - 4);
    shadow.setAttribute('width', barW - 4); shadow.setAttribute('height', 8);
    shadow.setAttribute('rx', 4);
    shadow.setAttribute('fill', 'rgba(99,102,241,.25)');
    shadow.setAttribute('filter', 'url(#_barGlow)');
    svg.appendChild(shadow);

    /* Actual bar */
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', barW); rect.setAttribute('height', bH);
    rect.setAttribute('rx', 6); rect.setAttribute('fill', fill);
    rect.setAttribute('opacity', '1');

    /* Grow-from-bottom animation via CSS */
    rect.style.transformOrigin = `${x + barW / 2}px ${PAD.top + cH}px`;
    rect.style.animation = `barGrow .6s cubic-bezier(.4,0,.2,1) ${i * .07}s both`;
    rect.style.cursor = 'pointer';

    rect.addEventListener('mouseenter', () => {
      rect.setAttribute('opacity', '.85');
      rect.setAttribute('filter', 'url(#_barGlow)');
    });
    rect.addEventListener('mouseleave', () => {
      rect.setAttribute('opacity', '1');
      rect.removeAttribute('filter');
    });

    svg.appendChild(rect);

    /* Value label on top */
    if (opts.showValues !== false) {
      const vl = document.createElementNS(ns, 'text');
      vl.setAttribute('x', x + barW / 2); vl.setAttribute('y', y - 6);
      vl.setAttribute('text-anchor', 'middle');
      vl.setAttribute('font-size', '10'); vl.setAttribute('fill', valColor);
      vl.setAttribute('font-weight', '800');
      vl.setAttribute('font-family', '-apple-system,"Segoe UI",system-ui,sans-serif');
      vl.style.animation = `fadeIn .4s ${i * .07 + .3}s both`;
      vl.textContent = opts.formatVal ? opts.formatVal(d.value) : d.value;
      svg.appendChild(vl);
    }

    /* X-axis label */
    const xl = document.createElementNS(ns, 'text');
    xl.setAttribute('x', x + barW / 2); xl.setAttribute('y', H - PAD.bottom + 16);
    xl.setAttribute('text-anchor', 'middle');
    xl.setAttribute('font-size', '10'); xl.setAttribute('fill', labelColor);
    xl.setAttribute('font-weight', '600');
    xl.setAttribute('font-family', '-apple-system,"Segoe UI",system-ui,sans-serif');
    xl.textContent = d.label.length > 6 ? d.label.slice(0, 5) + '…' : d.label;
    svg.appendChild(xl);
  });

  clearEl(containerEl);
  containerEl.appendChild(svg);
}

/**
 * renderLineChart(containerEl, data, options)
 * data: [{ label, value }]
 */
function renderLineChart(containerEl, data, opts = {}) {
  const W   = opts.width  || containerEl.clientWidth || 400;
  const H   = opts.height || 180;
  const PAD = { top: 22, right: 18, bottom: 32, left: 44 };
  const cW  = W - PAD.left - PAD.right;
  const cH  = H - PAD.top  - PAD.bottom;
  const max = Math.max(...data.map(d => d.value), 1);
  const n   = data.length;
  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', H);

  const defs = document.createElementNS(ns, 'defs');

  /* Area gradient */
  const areaGrad = document.createElementNS(ns, 'linearGradient');
  areaGrad.setAttribute('id', '_areaG');
  areaGrad.setAttribute('x1','0%'); areaGrad.setAttribute('y1','0%');
  areaGrad.setAttribute('x2','0%'); areaGrad.setAttribute('y2','100%');
  const as1 = document.createElementNS(ns, 'stop');
  as1.setAttribute('offset','0%'); as1.setAttribute('stop-color','rgba(99,102,241,.25)');
  const as2 = document.createElementNS(ns, 'stop');
  as2.setAttribute('offset','100%'); as2.setAttribute('stop-color','rgba(99,102,241,.02)');
  areaGrad.appendChild(as1); areaGrad.appendChild(as2);
  defs.appendChild(areaGrad);
  svg.appendChild(defs);

  const labelColor = opts.labelColor || '#64748b';
  const lineColor  = opts.color      || '#6366f1';
  const gridColor  = opts.gridColor  || 'rgba(99,102,241,.1)';

  /* Grid lines */
  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + (cH / 4) * i;
    const gl = document.createElementNS(ns, 'line');
    gl.setAttribute('x1', PAD.left); gl.setAttribute('x2', PAD.left + cW);
    gl.setAttribute('y1', y);        gl.setAttribute('y2', y);
    gl.setAttribute('stroke', gridColor); gl.setAttribute('stroke-width', '1');
    gl.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(gl);

    const val = Math.round(max - (max / 4) * i);
    const lbl = document.createElementNS(ns, 'text');
    lbl.setAttribute('x', PAD.left - 8); lbl.setAttribute('y', y + 4);
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('font-size', '10'); lbl.setAttribute('fill', labelColor);
    lbl.setAttribute('font-weight', '600');
    lbl.textContent = opts.formatY ? opts.formatY(val) : val;
    svg.appendChild(lbl);
  }

  const pts = data.map((d, i) => {
    const x = PAD.left + (cW / (n - 1 || 1)) * i;
    const y = PAD.top + cH - (d.value / max) * cH;
    return { x, y, label: d.label };
  });

  /* Area fill */
  const area = document.createElementNS(ns, 'polygon');
  const areaPoints = [
    `${PAD.left},${PAD.top + cH}`,
    ...pts.map(p => `${p.x},${p.y}`),
    `${PAD.left + cW},${PAD.top + cH}`,
  ].join(' ');
  area.setAttribute('points', areaPoints);
  area.setAttribute('fill', 'url(#_areaG)');
  svg.appendChild(area);

  /* Line */
  const polyline = document.createElementNS(ns, 'polyline');
  polyline.setAttribute('points', pts.map(p => `${p.x},${p.y}`).join(' '));
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', lineColor);
  polyline.setAttribute('stroke-width', '2.5');
  polyline.setAttribute('stroke-linejoin', 'round');
  polyline.setAttribute('stroke-linecap', 'round');
  svg.appendChild(polyline);

  /* Dots + labels */
  pts.forEach((p, i) => {
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', p.x); circle.setAttribute('cy', p.y);
    circle.setAttribute('r', 4.5);
    circle.setAttribute('fill', lineColor);
    circle.setAttribute('stroke', '#fff'); circle.setAttribute('stroke-width', '2');
    circle.style.animation = `bounceIn .4s ${i * .07}s both`;
    svg.appendChild(circle);

    if (i % Math.ceil(n / 7) === 0) {
      const xl = document.createElementNS(ns, 'text');
      xl.setAttribute('x', p.x); xl.setAttribute('y', H - PAD.bottom + 14);
      xl.setAttribute('text-anchor', 'middle');
      xl.setAttribute('font-size', '10'); xl.setAttribute('fill', labelColor);
      xl.setAttribute('font-weight', '600');
      xl.textContent = p.label;
      svg.appendChild(xl);
    }
  });

  clearEl(containerEl);
  containerEl.appendChild(svg);
}

/**
 * renderDonutChart(containerEl, segments, opts)
 * segments: [{ label, value, color }]
 */
function renderDonutChart(containerEl, segments, opts = {}) {
  const SIZE  = opts.size   || 160;
  const R     = SIZE / 2;
  const r     = opts.innerR || R * 0.58;
  const ns    = 'http://www.w3.org/2000/svg';
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const svg   = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svg.setAttribute('width', SIZE); svg.setAttribute('height', SIZE);

  let startAngle = -Math.PI / 2;
  for (const seg of segments) {
    const angle   = (seg.value / total) * Math.PI * 2;
    const x1 = R + R * Math.cos(startAngle);
    const y1 = R + R * Math.sin(startAngle);
    const x2 = R + R * Math.cos(startAngle + angle);
    const y2 = R + R * Math.sin(startAngle + angle);
    const xi1 = R + r * Math.cos(startAngle);
    const yi1 = R + r * Math.sin(startAngle);
    const xi2 = R + r * Math.cos(startAngle + angle);
    const yi2 = R + r * Math.sin(startAngle + angle);
    const large = angle > Math.PI ? 1 : 0;

    const path = document.createElementNS(ns, 'path');
    const d = [
      `M ${x1} ${y1}`,
      `A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`,
      `L ${xi2} ${yi2}`,
      `A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1}`,
      'Z',
    ].join(' ');
    path.setAttribute('d', d);
    path.setAttribute('fill', seg.color || '#6366f1');
    path.style.transition = 'opacity .2s, filter .2s';
    path.style.cursor = 'pointer';
    path.addEventListener('mouseenter', () => { path.style.filter = 'brightness(1.15)'; });
    path.addEventListener('mouseleave', () => { path.style.filter = ''; });
    svg.appendChild(path);
    startAngle += angle;
  }

  /* Center label */
  if (opts.centerText) {
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', R); t.setAttribute('y', R + 7);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-size', opts.centerFontSize || '22');
    t.setAttribute('font-weight', '900');
    t.setAttribute('fill', opts.centerColor || '#1a202c');
    t.setAttribute('font-family', '-apple-system,"Segoe UI",system-ui,sans-serif');
    t.textContent = opts.centerText;
    svg.appendChild(t);
  }
  if (opts.centerSub) {
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', R); t.setAttribute('y', R + 22);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-size', '11');
    t.setAttribute('fill', '#64748b');
    t.setAttribute('font-weight', '600');
    t.textContent = opts.centerSub;
    svg.appendChild(t);
  }

  clearEl(containerEl);
  containerEl.appendChild(svg);
}
