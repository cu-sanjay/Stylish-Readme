'use strict';

const { getTzTime, theme, tzShort, escXml, svgWrap, shadowFilter } = require('../helpers');

function render(p) {
  const t = getTzTime(p.timezone);
  const th = theme(p.theme);
  const rx = p.radius;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
  const W = 260, H = 130;
  return svgWrap(W, H, `
  <defs>${shadowFilter('sh', p.shadow)}</defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${th.bg}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
  <rect x="20" y="20" width="60" height="90" fill="none" stroke="${th.fg}" stroke-width="2"/>
  <rect x="20" y="20" width="60" height="18" fill="${th.fg}"/>
  <text x="50" y="33" text-anchor="middle" fill="${th.bg}" font-size="10" font-weight="700" letter-spacing="1">${escXml(String(t.month).slice(0,3).toUpperCase())}</text>
  <text x="50" y="78" text-anchor="middle" fill="${th.fg}" font-size="36" font-weight="700" font-family="Fraunces, Georgia, serif">${t.day}</text>
  <text x="50" y="100" text-anchor="middle" fill="${th.fg}" font-size="9" font-weight="700" letter-spacing="1" opacity="0.7">${t.year}</text>
  <text x="100" y="40" fill="${th.fg}" font-size="10" font-weight="700" letter-spacing="2" opacity="0.6">${escXml((p.label || 'Today').toUpperCase())}</text>
  <text x="100" y="65" fill="${th.fg}" font-size="20" font-weight="700" font-family="Fraunces, Georgia, serif">${escXml(t.weekday)}</text>
  <text x="100" y="95" fill="${th.fg}" font-size="11" font-weight="500" opacity="0.7">${escXml(t.month + ' ' + t.day)}</text>
  <text x="100" y="110" fill="${th.fg}" font-size="8" font-weight="700" letter-spacing="1" opacity="0.55">${escXml(tzShort(p.timezone).toUpperCase())}</text>
  `);
}

module.exports = { render };
