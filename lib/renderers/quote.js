'use strict';

const { theme, escXml, svgWrap, shadowFilter } = require('../helpers');
const { QUOTE_SETS } = require('../metadata');

function pickQuote(category) {
  const list = QUOTE_SETS[category] || QUOTE_SETS.programming;
  const dayKey = Math.floor(Date.now() / 86400000);
  return list[dayKey % list.length];
}

function render(p) {
  const th = theme(p.theme);
  const rx = p.radius;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
  const quote = pickQuote(p.quoteCategory);
  const W = 440, H = 130;
  const words = quote.q.split(' ');
  const line1 = [], line2 = [];
  let len = 0;
  words.forEach(w => {
    if (len + w.length < 42) { line1.push(w); len += w.length + 1; }
    else line2.push(w);
  });
  return svgWrap(W, H, `
  <defs>${shadowFilter('sh', p.shadow)}</defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${th.bg}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
  <text x="20" y="38" fill="${th.fg}" font-size="44" font-weight="900" opacity="0.5" font-family="Fraunces, Georgia, serif">"</text>
  <text x="50" y="30" fill="${th.fg}" font-size="10" font-weight="700" letter-spacing="2" opacity="0.6">${escXml((p.label || 'Quote of the Day').toUpperCase())}</text>
  <text x="50" y="56" fill="${th.fg}" font-size="15" font-weight="500" font-style="italic" font-family="Fraunces, Georgia, serif">${escXml(line1.join(' '))}</text>
  ${line2.length ? `<text x="50" y="76" fill="${th.fg}" font-size="15" font-weight="500" font-style="italic" font-family="Fraunces, Georgia, serif">${escXml(line2.join(' '))}</text>` : ''}
  <line x1="50" y1="92" x2="100" y2="92" stroke="${th.fg}" stroke-width="2"/>
  <text x="50" y="108" fill="${th.fg}" font-size="11" font-weight="600" opacity="0.85">${escXml('— ' + quote.a)}</text>
  `, "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace");
}

module.exports = { render };
