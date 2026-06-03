'use strict';

const { getTzTime, theme, tzShort, escXml, svgWrap, shadowFilter, pad } = require('../helpers');

function render(p) {
  const t = getTzTime(p.timezone);
  const th = theme(p.theme);
  let timeStr, suffix = '';
  if (p.timeFormat === '12h') {
    let h = parseInt(t.h, 10);
    suffix = h >= 12 ? ' PM' : ' AM';
    h = h % 12 || 12;
    timeStr = `${pad(h)}:${t.m}${p.showSeconds ? ':' + t.s : ''}`;
  } else {
    timeStr = `${t.h}:${t.m}${p.showSeconds ? ':' + t.s : ''}`;
  }
  const W = 320, H = (p.showDate || p.showDay) ? 140 : 90;
  const rx = p.radius;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
  const label = escXml((p.label || 'Local Time').toUpperCase()) + ' · ' + escXml(tzShort(p.timezone).toUpperCase());
  return svgWrap(W, H, `
  <defs>${shadowFilter('sh', p.shadow)}</defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${th.bg}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
  <text x="20" y="28" fill="${th.fg}" font-size="10" font-weight="700" letter-spacing="2" opacity="0.7">${label}</text>
  <text x="20" y="70" fill="${th.fg}" font-size="42" font-weight="700" letter-spacing="-1">${escXml(timeStr)}<tspan font-size="20" opacity="0.7">${escXml(suffix)}</tspan></text>
  ${(p.showDate || p.showDay) ? `<line x1="20" y1="88" x2="${W-20}" y2="88" stroke="${th.fg}" stroke-width="1" opacity="0.3"/>` : ''}
  ${p.showDay ? `<text x="20" y="110" fill="${th.fg}" font-size="12" font-weight="600" opacity="0.85">${escXml(t.weekday)}</text>` : ''}
  ${p.showDate ? `<text x="${W-20}" y="110" text-anchor="end" fill="${th.fg}" font-size="12" font-weight="600" opacity="0.85">${escXml(t.day + ' ' + t.month + ' ' + t.year)}</text>` : ''}
  `);
}

module.exports = { render };
