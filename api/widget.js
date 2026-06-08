'use strict';

const { renderWidget } = require('../lib/widgets');

/**
 * Cache-Control policy matrix keyed by widget type.
 *
 * Rationale:
 *   - time / clock / timezone : Highly dynamic — current time changes every second.
 *                                60 s max-age keeps clocks fresh without hammering the origin.
 *   - date                    : Changes once per day; 1-hour cache is safe.
 *   - music                   : Static mock data; 5-minute cache balances freshness and load.
 *   - streak / quote / profile: Daily-changing or mostly-static data; 1-hour cache is appropriate.
 *   - flag                    : Country data never changes; 24-hour cache maximises CDN hits.
 */
const CACHE_POLICIES = {
  // Weather data - refresh every 30 minutes to avoid hitting API rate limits
  weather:  'public, max-age=1800, s-maxage=1800, stale-while-revalidate=600',

  // Reading status - refresh every hour
  book:     'public, max-age=3600, s-maxage=3600, stale-while-revalidate=1200',
  
  // Real-time widgets — refresh every 60 seconds
  time:     'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
  clock:    'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
  timezone: 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
  skyline:  'public, max-age=60, s-maxage=60, stale-while-revalidate=30',

  // Daily-change widgets — refresh every hour
  date:      'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  quote:     'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  streak:    'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  profile:   'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  marker:    'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  glass:     'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',
  countdown: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600',

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

module.exports = async (req, res) => {
  try {
    const q = req.query || {};
    const type = q.type || 'time';

    const svg = await renderWidget(type, q);

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', getCacheHeader(type));
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.status(200).send(svg);
  } catch (err) {
    // no-store prevents GitHub's Camo proxy from caching broken error SVGs,
    // ensuring users always see a fresh attempt on their next profile visit.
    res.setHeader('Cache-Control', 'no-store');
    res.status(500).setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.end(`<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="320" height="60"><rect width="320" height="60" fill="#7f1d1d"/><text x="16" y="36" fill="#fff" font-family="monospace" font-size="12">Render error: ${String(err && err.message || err).replace(/[<>&]/g,'')}</text></svg>`);
  }
};
