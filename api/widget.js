'use strict';

const { renderWidget } = require('../lib/widgets');

// ── Avatar URL Validator ─────────────────────────────────────────────────────
function isValidAvatarUrl(str) {
  if (!str || typeof str !== 'string' || str.trim() === '') return false;
  try {
    const parsed = new URL(str.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

const FALLBACK_AVATAR = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#bdbdbd"/><circle cx="50" cy="36" r="18" fill="#f5f5f5"/><ellipse cx="50" cy="84" rx="27" ry="19" fill="#f5f5f5"/></svg>`).toString('base64')}`;
/**
 * Cache-Control policy matrix keyed by widget type.
 *
 * Rationale:
 *   - time / clock / timezone : Highly dynamic — current time changes every second.
 *                                60 s max-age keeps clocks fresh without hammering the origin.
 *   - date                    : Changes once per day; 1-hour cache is safe.
 *   - music                   : Static mock data; 5-minute cache balances freshness and load.
 *   - streak / quote / word / profile: Daily-changing or mostly-static data; 1-hour cache is appropriate.
 *   - flag                    : Country data never changes; 24-hour cache maximises CDN hits.
 */
const CACHE_POLICIES = {
  // Real-time widgets — refresh every 60 seconds
  time: 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
  clock: 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
  timezone: 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
  skyline: 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',

  // Weather data - refresh every 30 minutes to avoid hitting API rate limits
  weather: 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=600',

  // Daily-change widgets — refresh every hour

  date: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  quote: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  word: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  streak: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  profile: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',

  date: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  quote: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  streak: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  profile: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  marker: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  glass: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  countdown: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  marketplace: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',

  youtube: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  heatmap: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  // Static mock content — refresh every 5 minutes
  music: 'public, max-age=300, s-maxage=300, stale-while-revalidate=120',

  // Fully static content — refresh every 24 hours
  flag: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
};

/** Default fallback for any future widget types not yet in CACHE_POLICIES. */
const DEFAULT_CACHE = 'public, max-age=60, s-maxage=60, stale-while-revalidate=30';

/**
 * Returns the appropriate Cache-Control header value for a given widget type.
 * @param {string} type - The widget type string (e.g. 'time', 'flag', 'profile').
 * @returns {string} A valid Cache-Control header value.
 */
function getCacheHeader(type) {
  return CACHE_POLICIES[(type || '').toLowerCase()] || DEFAULT_CACHE;
}

// ── Marketplace Handler ──────────────────────────────────────────────────────
function escXml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

const PLATFORMS = {
  producthunt: { label: 'Product Hunt', color: '#ff6154' },
  chrome: { label: 'Chrome', color: '#4285f4' }
};

function handleMarketplace(req, res) {
  const { platform, id } = req.query;

  if (!platform || !id) {
    return res.status(400).send(`<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="320" height="80"><rect width="320" height="80" rx="12" fill="#1a1a1a"/><text x="20" y="45" font-size="13" fill="#f4f1ea" font-family="monospace">Missing: platform and id are required.</text></svg>`);
  }

  const platformKey = String(platform || '').toLowerCase();
  const match = PLATFORMS[platformKey];

  const label = match ? match.label : 'Marketplace';
  const color = match ? match.color : '#4A90E2';

  const safeId = decodeURIComponent(String(id || '')).slice(0, 40);
  const title = `${label}: ${escXml(safeId)}`;

  const svg = `
<svg width="320" height="80" xmlns="http://www.w3.org/2000/svg">
  <rect width="320" height="80" rx="12" fill="${color}"/>
  <text x="20" y="45" font-size="16" fill="white" font-family="monospace">${title}</text>
</svg>
  `;

  return svg;
}

module.exports = async (req, res) => {
  try {
    const q = req.query || {};
    const type = q.type || 'time';

    // Handle marketplace separately
    if (type === 'marketplace') {
      const marketplaceSvg = handleMarketplace(req, res);
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      res.setHeader('Cache-Control', getCacheHeader(type));
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send(marketplaceSvg);
    }

    // Extract and validate avatar if present
    const avatar = q.avatar || '';
    const avatarSrc = isValidAvatarUrl(avatar) ? avatar.trim() : FALLBACK_AVATAR;

    // Pass avatar to the renderer
    const queryWithAvatar = { ...q, avatar: avatarSrc };

    const svg = await renderWidget(type, queryWithAvatar);

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', getCacheHeader(type));
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.status(200).send(svg);
  } catch (err) {
    // no-store prevents GitHub's Camo proxy from caching broken error SVGs,
    // ensuring users always see a fresh attempt on their next profile visit.
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.end(`<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="320" height="60"><rect width="320" height="60" fill="#7f1d1d"/><text x="16" y="36" fill="#fff" font-family="monospace" font-size="12">Render error: ${String(err && err.message || err).replace(/[<>&]/g, '')}</text></svg>`);
  }
};
