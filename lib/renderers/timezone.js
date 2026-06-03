'use strict';

const { getTzTime, theme, tzShort, escXml, svgWrap, shadowFilter, pad } = require('../helpers');
const { TIMEZONES } = require('../metadata');

function render(p) {
  const t = getTzTime(p.timezone);
  const th = theme(p.theme);
  const rx = p.radius;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
  const W = 460, H = 90;
  let timeStr;
  if (p.timeFormat === '12h') {
    let h = parseInt(t.h, 10); const sf = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    timeStr = `${pad(h)}:${t.m} ${sf}`;
  } else { timeStr = `${t.h}:${t.m}`; }
  const tzLabel = TIMEZONES[p.timezone] || p.timezone || '';
  return svgWrap(W, H, `
  <defs>${shadowFilter('sh', p.shadow)}</defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${th.bg}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
  <circle cx="45" cy="45" r="22" fill="none" stroke="${th.fg}" stroke-width="2"/>
  <circle cx="45" cy="45" r="2" fill="${th.fg}"/>
  <line x1="45" y1="45" x2="45" y2="30" stroke="${th.fg}" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="45" y1="45" x2="56" y2="45" stroke="${th.fg}" stroke-width="2" stroke-linecap="round"/>
  <text x="85" y="30" fill="${th.fg}" font-size="9" font-weight="700" letter-spacing="2" opacity="0.65">TIMEZONE BANNER</text>
  <text x="85" y="52" fill="${th.fg}" font-size="20" font-weight="700" font-family="Fraunces, Georgia, serif">${escXml(timeStr)}</text>
  <text x="85" y="70" fill="${th.fg}" font-size="10" font-weight="600" opacity="0.75">${escXml(tzLabel)}</text>
  <text x="${W-20}" y="30" text-anchor="end" fill="${th.fg}" font-size="9" font-weight="700" opacity="0.65">${escXml(String(t.weekday).slice(0,3).toUpperCase())}</text>
  <text x="${W-20}" y="52" text-anchor="end" fill="${th.fg}" font-size="16" font-weight="700" font-family="Fraunces, Georgia, serif">${t.day}</text>
  <text x="${W-20}" y="70" text-anchor="end" fill="${th.fg}" font-size="10" font-weight="600" opacity="0.75">${escXml(t.month)}</text>
  `);
}

module.exports = { render };
