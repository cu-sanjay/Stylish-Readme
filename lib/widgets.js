'use strict';

const metadata = require('./metadata');
const helpers = require('./helpers');

// Import individual renderers
const renderers = {
  time:     require('./renderers/time'),
  clock:    require('./renderers/clock'),
  date:     require('./renderers/date'),
  quote:    require('./renderers/quote'),
  flag:     require('./renderers/flag'),
  timezone: require('./renderers/timezone'),
  streak:   require('./renderers/streak'),
  music:    require('./renderers/music'),
  profile:  require('./renderers/profile')
};

function normalizeParams(q) {
  // Configurable limits for Profile Card fields
  const MAX_LENGTHS = {
    name: 24,
    role: 30,
    bio: 70
  };

  // Helper utility to truncate strings defensively
  const truncateStr = (str, max) => {
    if (!str) return '';
    const stringVal = String(str).trim();
    return stringVal.length > max ? stringVal.slice(0, max) + '...' : stringVal;
  };

  // Pre-process and normalize platform values to lowercase safely
  const parsedPlatform = q.platform ? String(q.platform).trim().toLowerCase() : 'none';
  const validPlatforms = ['none', 'leetcode', 'gfg', 'hackerrank', 'codeforces', 'codechef', 'atcoder', 'hackerearth', 'github'];
  const finalPlatform = validPlatforms.includes(parsedPlatform) ? parsedPlatform : 'none';

  // Pre-process and normalize musicPlatform values to lowercase safely
  const parsedMusicPlatform = q.musicPlatform ? String(q.musicPlatform).trim().toLowerCase() : 'none';
  const validMusicPlatforms = ['none', 'spotify', 'ytmusic', 'applemusic', 'soundcloud'];
  const finalMusicPlatform = validMusicPlatforms.includes(parsedMusicPlatform) ? parsedMusicPlatform : 'none';

  return {
    timezone:      q.timezone || 'Asia/Kolkata',
    theme:         q.theme || 'classic',
    timeFormat:    q.timeFormat || '24h',
    showSeconds:   helpers.normalizeBool(q.showSeconds, true),
    showDate:      helpers.normalizeBool(q.showDate, true),
    showDay:       helpers.normalizeBool(q.showDay, true),
    label:         q.label || '',
    radius:        Math.min(24, Math.max(0, parseInt(q.radius, 10) || 0)),
    shadow:        helpers.normalizeBool(q.shadow, false),
    borderColor:   q.borderColor || '',
    country:       q.country || 'IN',
    quoteCategory: q.quoteCategory || 'programming',
    clockStyle:    q.clockStyle || 'digital',
    startDate:     q.startDate || '2024-01-01',
    unit:          q.unit || 'days',
    customLabel:   q.customLabel || 'Coding Streak',
    platform:      finalPlatform,
    musicSong:     q.musicSong || 'Tum Hi Ho',
    musicArtist:   q.musicArtist || 'Arijit Singh',
    musicGenre:    q.musicGenre || 'Bollywood',
    musicListen:   q.musicListen || 'Now Playing',
    musicPlatform: finalMusicPlatform,
    avatar:        q.avatar || '',
    
    // Target fields wrapped securely with truncation defense hooks:
    name:          truncateStr(q.name || 'Your Name', MAX_LENGTHS.name),
    role:          truncateStr(q.role || 'Developer', MAX_LENGTHS.role),
    bio:           truncateStr(q.bio || 'Building cool things with code. Open-source enthusiast.', MAX_LENGTHS.bio),
    
    skills:        q.skills || 'HTML,CSS,JS,GIT,SQL,REACT,NODE,PYTHON',
    handle:        q.handle || ''
  };
}

async function renderWidget(type, query) {
  const p = normalizeParams(query || {});
  const typeLower = (type || '').toLowerCase();
  const renderer = renderers[typeLower];
  if (renderer) {
    return await renderer.render(p);
  }
  return helpers.svgWrap(320, 60, `
    <rect x="1" y="1" width="318" height="58" fill="#1a1a1a" stroke="#c8402c" stroke-width="2"/>
    <text x="20" y="36" fill="#f4f1ea" font-size="13" font-weight="700">Unknown widget: ${helpers.escXml(type)}</text>
  `);
}

module.exports = {
  renderWidget,
  THEMES:           metadata.THEMES,
  TIMEZONES:        metadata.TIMEZONES,
  COUNTRIES:        metadata.COUNTRIES,
  FLAGS:            helpers.FLAGS,
  SKILLS:           metadata.SKILLS,
  CODING_PLATFORMS: metadata.CODING_PLATFORMS,
  MUSIC_PLATFORMS:  metadata.MUSIC_PLATFORMS,
  flagSvg:          helpers.flagSvg,
  skillIcon:        helpers.skillIcon,
  platformBadge:    helpers.platformBadge
};
