'use strict';

const { getTzTime, theme, tzShort, escXml, svgWrap, shadowFilter, pad } = require('../helpers');

function render(p) {
  const t = getTzTime(p.timezone);
  const th = theme(p.theme);
  const rx = p.radius;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
  const W = 380, H = 110;
  const h12 = p.timeFormat === '12h';
  const h = h12 ? (parseInt(t.h, 10) % 12 || 12) : parseInt(t.h, 10);
  const hh = pad(h);
  const ampm = h12 ? (parseInt(t.h, 10) >= 12 ? 'PM' : 'AM') : '24H';
  return svgWrap(W, H, `
  <defs>${shadowFilter('sh', p.shadow)}</defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${th.bg}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
  <text x="20" y="28" fill="${th.fg}" font-size="10" font-weight="700" letter-spacing="3" opacity="0.6">${escXml((p.label || 'Digital Clock').toUpperCase())}</text>
  <g transform="translate(20,45)">
    <rect x="0" y="0" width="60" height="50" fill="none" stroke="${th.fg}" stroke-width="1.5" opacity="0.4"/>
    <text x="30" y="38" text-anchor="middle" fill="${th.fg}" font-size="32" font-weight="700">${hh}</text>
    <text x="75" y="38" fill="${th.fg}" font-size="28" font-weight="700">:</text>
    <rect x="90" y="0" width="60" height="50" fill="none" stroke="${th.fg}" stroke-width="1.5" opacity="0.4"/>
    <text x="120" y="38" text-anchor="middle" fill="${th.fg}" font-size="32" font-weight="700">${t.m}</text>
    ${p.showSeconds ? `
    <text x="165" y="38" fill="${th.fg}" font-size="28" font-weight="700" opacity="0.7">:</text>
    <rect x="180" y="0" width="60" height="50" fill="none" stroke="${th.fg}" stroke-width="1.5" opacity="0.4"/>
    <text x="210" y="38" text-anchor="middle" fill="${th.fg}" font-size="32" font-weight="700" opacity="0.7">${t.s}</text>
    ` : ''}
    <text x="260" y="20" fill="${th.fg}" font-size="10" font-weight="700" letter-spacing="1" opacity="0.6">${escXml(tzShort(p.timezone).toUpperCase())}</text>
    <text x="260" y="38" fill="${th.fg}" font-size="14" font-weight="700">${ampm}</text>
  </g>
  `);
}

module.exports = { render };
