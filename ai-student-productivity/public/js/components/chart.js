/* ============================================================
   Lightweight SVG Chart Library (no external deps)
   ============================================================ */

/**
 * renderBarChart(containerEl, data, options)
 * data: [{ label, value, color? }]
 */
function renderBarChart(containerEl, data, opts = {}) {
  const W    = opts.width  || containerEl.clientWidth  || 400;
  const H    = opts.height || 180;
  const PAD  = { top: 20, right: 16, bottom: 36, left: 40 };
  const cW   = W - PAD.left - PAD.right;
  const cH   = H - PAD.top  - PAD.bottom;
  const max  = Math.max(...data.map(d => d.value), 1);
  const n    = data.length;
  const barW = Math.max(4, (cW / n) - 6);

  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + (cH / 4) * i;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', PAD.left); line.setAttribute('x2', PAD.left + cW);
    line.setAttribute('y1', y);        line.setAttribute('y2', y);
    line.setAttribute('stroke', '#e2e8f0'); line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
    // Y-axis label
    const lbl = document.createElementNS(ns, 'text');
    const val = Math.round(max - (max / 4) * i);
    lbl.setAttribute('x', PAD.left - 6); lbl.setAttribute('y', y + 4);
    lbl.setAttribute('text-anchor', 'end');
    lbl.setAttribute('font-size', '10'); lbl.setAttribute('fill', '#718096');
    lbl.textContent = opts.formatY ? opts.formatY(val) : val;
    svg.appendChild(lbl);
  }

  data.forEach((d, i) => {
    const x    = PAD.left + (cW / n) * i + (cW / n - barW) / 2;
    const bH   = Math.max(2, (d.value / max) * cH);
    const y    = PAD.top + cH - bH;
    const fill = d.color || opts.color || '#3b82d4';

    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', barW); rect.setAttribute('height', bH);
    rect.setAttribute('rx', 4); rect.setAttribute('fill', fill);
    rect.setAttribute('opacity', '0.85');
    rect.style.transition = 'opacity .2s';
    rect.addEventListener('mouseenter', () => rect.setAttribute('opacity', '1'));
    rect.addEventListener('mouseleave', () => rect.setAttribute('opacity', '0.85'));
    svg.appendChild(rect);

    // Value label on top
    if (opts.showValues !== false) {
      const vl = document.createElementNS(ns, 'text');
      vl.setAttribute('x', x + barW / 2); vl.setAttribute('y', y - 4);
      vl.setAttribute('text-anchor', 'middle');
      vl.setAttribute('font-size', '9'); vl.setAttribute('fill', '#475569'); vl.setAttribute('font-weight', '600');
      vl.textContent = opts.formatVal ? opts.formatVal(d.value) : d.value;
      svg.appendChild(vl);
    }

    // X-axis label
    const xl = document.createElementNS(ns, 'text');
    xl.setAttribute('x', x + barW / 2); xl.setAttribute('y', H - PAD.bottom + 14);
    xl.setAttribute('text-anchor', 'middle');
    xl.setAttribute('font-size', '9'); xl.setAttribute('fill', '#718096');
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
  const H   = opts.height || 160;
  const PAD = { top: 20, right: 16, bottom: 30, left: 40 };
  const cW  = W - PAD.left - PAD.right;
  const cH  = H - PAD.top  - PAD.bottom;
  const max = Math.max(...data.map(d => d.value), 1);
  const n   = data.length;
  const ns  = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W); svg.setAttribute('height', H);

  const pts = data.map((d, i) => {
    const x = PAD.left + (cW / (n - 1 || 1)) * i;
    const y = PAD.top + cH - (d.value / max) * cH;
    return `${x},${y}`;
  });

  // Area fill
  const area = document.createElementNS(ns, 'polygon');
  const areaPoints = [
    `${PAD.left},${PAD.top + cH}`,
    ...pts,
    `${PAD.left + cW},${PAD.top + cH}`,
  ].join(' ');
  area.setAttribute('points', areaPoints);
  area.setAttribute('fill', opts.areaColor || 'rgba(59,130,212,0.12)');
  svg.appendChild(area);

  // Line
  const polyline = document.createElementNS(ns, 'polyline');
  polyline.setAttribute('points', pts.join(' '));
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', opts.color || '#3b82d4');
  polyline.setAttribute('stroke-width', '2.5');
  polyline.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(polyline);

  // Dots + labels
  data.forEach((d, i) => {
    const x = PAD.left + (cW / (n - 1 || 1)) * i;
    const y = PAD.top + cH - (d.value / max) * cH;
    const circle = document.createElementNS(ns, 'circle');
    circle.setAttribute('cx', x); circle.setAttribute('cy', y);
    circle.setAttribute('r', 4); circle.setAttribute('fill', opts.color || '#3b82d4');
    circle.setAttribute('stroke', '#fff'); circle.setAttribute('stroke-width', '2');
    svg.appendChild(circle);

    if (i % Math.ceil(n / 7) === 0) {
      const xl = document.createElementNS(ns, 'text');
      xl.setAttribute('x', x); xl.setAttribute('y', H - PAD.bottom + 14);
      xl.setAttribute('text-anchor', 'middle');
      xl.setAttribute('font-size', '9'); xl.setAttribute('fill', '#718096');
      xl.textContent = d.label;
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
  const SIZE  = opts.size || 140;
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
    path.setAttribute('fill', seg.color || '#3b82d4');
    svg.appendChild(path);
    startAngle += angle;
  }

  // Center label
  if (opts.centerText) {
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', R); t.setAttribute('y', R + 6);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-size', opts.centerFontSize || '20');
    t.setAttribute('font-weight', '800');
    t.setAttribute('fill', opts.centerColor || '#1a202c');
    t.textContent = opts.centerText;
    svg.appendChild(t);
  }
  if (opts.centerSub) {
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', R); t.setAttribute('y', R + 20);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-size', '10');
    t.setAttribute('fill', '#718096');
    t.textContent = opts.centerSub;
    svg.appendChild(t);
  }

  clearEl(containerEl);
  containerEl.appendChild(svg);
}
