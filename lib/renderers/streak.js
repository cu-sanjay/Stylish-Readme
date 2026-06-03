'use strict';

const { theme, escXml, svgWrap, shadowFilter, platformBadge } = require('../helpers');
const { CODING_PLATFORMS } = require('../metadata');

function render(p) {
  const th = theme(p.theme);
  const rx = p.radius;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
  const startStr = p.startDate || '2024-01-01';
  const start = new Date(startStr);
  const now = new Date();
  let count, unit = (p.unit || 'days').toLowerCase();
  const diffMs = now - start;
  if (unit === 'days') count = Math.max(0, Math.floor(diffMs / 86400000));
  else if (unit === 'weeks') count = Math.max(0, Math.floor(diffMs / (86400000 * 7)));
  else if (unit === 'months') count = Math.max(0, Math.floor(diffMs / (86400000 * 30)));
  else { unit = 'years'; count = Math.max(0, Math.floor(diffMs / (86400000 * 365))); }

  const platform = (p.platform || 'none').toLowerCase();
  const hasPlatform = platform !== 'none' && CODING_PLATFORMS[platform];
  const W = hasPlatform ? 360 : 320, H = 110;
  const label = (p.customLabel || 'Coding Streak').toUpperCase();
  const platformName = hasPlatform ? CODING_PLATFORMS[platform].name : '';
  return svgWrap(W, H, `
  <defs>${shadowFilter('sh', p.shadow)}</defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${th.bg}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
  <text x="20" y="32" fill="${th.fg}" font-size="9" font-weight="700" letter-spacing="2" opacity="0.65">${escXml(label)}</text>
  <text x="20" y="76" fill="${th.fg}" font-size="44" font-weight="900" font-family="Fraunces, Georgia, serif">${count}</text>
  <text x="${20 + String(count).length * 25 + 10}" y="72" fill="${th.fg}" font-size="16" font-weight="600" opacity="0.85">${escXml(unit)}</text>
  <text x="20" y="96" fill="${th.fg}" font-size="9" font-weight="600" letter-spacing="1" opacity="0.55">SINCE ${escXml(start.toDateString().toUpperCase())}</text>
  ${hasPlatform ? `
    ${platformBadge(platform, W-58, 22, 38)}
    <text x="${W-39}" y="76" text-anchor="middle" fill="${th.fg}" font-size="8" font-weight="700" letter-spacing="1" opacity="0.7">${escXml(platformName.toUpperCase())}</text>
  ` : ''}
  `);
}

module.exports = { render };
