'use strict';

const { theme, escXml, svgWrap, shadowFilter, musicPlatformGlyph } = require('../helpers');
const { MUSIC_PLATFORMS } = require('../metadata');

function render(p) {
  const th = theme(p.theme);
  const rx = p.radius;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
  const W = 420, H = 160;
  const status = (p.musicListen || 'Now Playing').toUpperCase();
  const platform = (p.musicPlatform || 'none').toLowerCase();
  const platformName = MUSIC_PLATFORMS[platform]?.name || '';
  const platformColor = MUSIC_PLATFORMS[platform]?.color || th.fg;

  // Album art square (gradient background with music note)
  const artSize = 88;
  const artX = 20, artY = 36;

  const barX = artX + artSize + 18;
  const barW = W - artX - artSize - 18 - 22;
  const playedW = barW * 0.5;
  const accent = platform === 'none' ? th.fg : platformColor;
  return svgWrap(W, H, `
  <defs>
    ${shadowFilter('sh', p.shadow)}
    <linearGradient id="art" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.45"/>
    </linearGradient>
  </defs>

  <!-- card background with subtle inner panel -->
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${th.bg}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
  <rect x="12" y="12" width="${W-24}" height="${H-24}" fill="none" stroke="${th.fg}" stroke-width="1" opacity="0.18"/>

  <!-- header strip -->
  <text x="22" y="28" fill="${th.fg}" font-size="9" font-weight="700" letter-spacing="2.5" opacity="0.7">${escXml(status)}</text>
  ${platform !== 'none' ? `
    <g transform="translate(${W-28-12},14)">
      ${musicPlatformGlyph(platform, 14, 14, 12, th.fg)}
    </g>
    <text x="${W-46}" y="28" text-anchor="end" fill="${th.fg}" font-size="8" font-weight="700" letter-spacing="2" opacity="0.65">${escXml(platformName.toUpperCase())}</text>
  ` : ''}

  <!-- static album art / disc -->
  <rect x="${artX}" y="${artY}" width="${artSize}" height="${artSize}" rx="6" fill="url(#art)"/>
  <circle cx="${artX + artSize/2}" cy="${artY + artSize/2}" r="${artSize*0.36}" fill="${th.bg}" opacity="0.55"/>
  <circle cx="${artX + artSize/2}" cy="${artY + artSize/2}" r="${artSize*0.36}" fill="none" stroke="${th.fg}" stroke-width="0.6" opacity="0.5"/>
  <circle cx="${artX + artSize/2}" cy="${artY + artSize/2}" r="${artSize*0.08}" fill="${th.fg}" opacity="0.7"/>
  <g transform="translate(${artX + artSize/2 - 6}, ${artY + artSize/2 - 14})" opacity="0.85">
    <ellipse cx="3" cy="14" rx="3.2" ry="2.4" fill="${th.fg}"/>
    <rect x="5.3" y="3" width="1.4" height="11" fill="${th.fg}"/>
    <path d="M5.3 3 Q11 4.5 11 9" stroke="${th.fg}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  </g>

  <!-- text block -->
  <text x="${barX}" y="64" fill="${th.fg}" font-size="16" font-weight="700" font-family="Fraunces, Georgia, serif">${escXml((p.musicSong || 'Untitled').slice(0, 26))}</text>
  <text x="${barX}" y="86" fill="${th.fg}" font-size="11" font-weight="500" opacity="0.75">${escXml((p.musicArtist || 'Unknown Artist').slice(0, 30))}</text>

  <!-- progress bar with static playhead dot -->
  <rect x="${barX}" y="118" width="${barW}" height="3" fill="${th.fg}" opacity="0.2" rx="1.5"/>
  <rect x="${barX}" y="118" width="${playedW}" height="3" fill="${accent}" rx="1.5"/>
  <circle cx="${barX + playedW}" cy="119.5" r="4" fill="${accent}"/>
  <circle cx="${barX + playedW}" cy="119.5" r="4" fill="none" stroke="${th.bg}" stroke-width="1.2" opacity="0.85"/>

  <!-- meta row -->
  <text x="${barX}" y="136" fill="${th.fg}" font-size="8" font-weight="700" letter-spacing="1" opacity="0.55">1:42</text>
  <text x="${W - 22}" y="136" text-anchor="end" fill="${th.fg}" font-size="8" font-weight="700" letter-spacing="1" opacity="0.55">3:24</text>
  `);
}

module.exports = { render };
