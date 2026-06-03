'use strict';

const { theme, escXml, svgWrap, shadowFilter, flagSvg } = require('../helpers');
const { COUNTRIES } = require('../metadata');

function render(p) {
  const th = theme(p.theme);
  const rx = p.radius;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
  const code = (p.country || 'IN').toUpperCase();
  const name = COUNTRIES[code] || code;
  const W = 280, H = 100;
  return svgWrap(W, H, `
  <defs>${shadowFilter('sh', p.shadow)}</defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${th.bg}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
  ${flagSvg(code, 18, 34, 50, 33)}
  <text x="82" y="40" fill="${th.fg}" font-size="9" font-weight="700" letter-spacing="2" opacity="0.65">${escXml((p.label || 'Based In').toUpperCase())}</text>
  <text x="82" y="62" fill="${th.fg}" font-size="18" font-weight="700" font-family="Fraunces, Georgia, serif">${escXml(name)}</text>
  <text x="82" y="80" fill="${th.fg}" font-size="9" font-weight="700" letter-spacing="1" opacity="0.55">COUNTRY CODE · ${escXml(code)}</text>
  `);
}

module.exports = { render };
