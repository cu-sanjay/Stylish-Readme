'use strict';

const dns = require('node:dns').promises;
const net = require('node:net');
const http = require('node:http');
const https = require('node:https');
const crypto = require('node:crypto');

const metadata = require('./metadata');
const { FLAGS } = require('./flags');

// Cache settings for avatar images
const AVATAR_MEMORY_CACHE = new Map();
const AVATAR_CACHE_TTL_SEC = 86400; // 24 hours
const SKILL_ICON_CACHE = new Map();

function pad(n) {
  return String(n).padStart(2, '0');
}

function getTzTime(tz) {
  try {
    const d = new Date();
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const parts = fmt.formatToParts(d);
    const get = t => parts.find(p => p.type === t)?.value;
    return {
      h: get('hour') === '24' ? '00' : get('hour'),
      m: get('minute'),
      s: get('second'),
      weekday: get('weekday'),
      day: get('day'),
      month: get('month'),
      year: get('year')
    };
  } catch (e) {
    const d = new Date();
    return {
      h: pad(d.getUTCHours()), m: pad(d.getUTCMinutes()), s: pad(d.getUTCSeconds()),
      weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
      day: d.getUTCDate(),
      month: d.toLocaleDateString('en-US', { month: 'long' }),
      year: d.getUTCFullYear()
    };
  }
}

function escXml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// In the original, themes is themed lookup helper
function theme(id) {
  return metadata.THEMES[id] || metadata.THEMES.classic;
}

function tzShort(tz) {
  return (tz || '').split('/').pop().replace(/_/g, ' ');
}

function svgWrap(width, height, body, fontFamily) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${fontFamily || "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace"}">
${body}
</svg>`;
}

function shadowFilter(id, shadow) {
  if (!shadow) return '';
  return `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%">
    <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.35)"/>
  </filter>`;
}

function normalizeBool(v, def) {
  if (v === undefined || v === null || v === '') return def;
  if (v === true || v === '1' || v === 'true' || v === 'on' || v === 'yes') return true;
  if (v === false || v === '0' || v === 'false' || v === 'off' || v === 'no') return false;
  return def;
}

function flagSvg(code, x, y, w, h) {
  const inner = FLAGS[code] || FLAGS.IN;
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 60 40" preserveAspectRatio="xMidYMid meet">
    <rect width="60" height="40" fill="#eee"/>
    ${inner}
    <rect width="60" height="40" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="0.6"/>
  </svg>`;
}

async function fetchSkillIconDataUrl(slug, dark) {
  const color = dark ? '1a1a1a' : 'ffffff';
  const key = `${slug}/${color}`;
  if (SKILL_ICON_CACHE.has(key)) return SKILL_ICON_CACHE.get(key);
  const url = `https://cdn.simpleicons.org/${encodeURIComponent(slug)}/${color}`;
  const dataUrl = await fetchAvatarDataUrl(url, 3000);
  if (dataUrl) SKILL_ICON_CACHE.set(key, dataUrl);
  return dataUrl;
}

function skillIcon(code, x, y, size, dataUrl) {
  const s = metadata.SKILLS[code]; if (!s) return '';
  const inner = size * 0.62;
  const off = (size - inner) / 2;
  const iconNode = dataUrl
    ? `<image href="${escXml(dataUrl)}" x="${off}" y="${off}" width="${inner}" height="${inner}"/>`
    : `<text x="${size/2}" y="${size/2 + size*0.18}" text-anchor="middle"
        font-family="'JetBrains Mono', ui-monospace, monospace" font-size="${(size*0.42).toFixed(1)}"
        font-weight="800" fill="${s.dark ? '#1a1a1a' : '#ffffff'}">${escXml(s.name.slice(0,2).toUpperCase())}</text>`;
  return `<g transform="translate(${x},${y})">
    <rect width="${size}" height="${size}" rx="${size*0.2}" fill="${s.bg}"/>
    <rect width="${size}" height="${size}" rx="${size*0.2}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.6"/>
    ${iconNode}
  </g>`;
}

function platformBadge(code, x, y, size) {
  const p = metadata.CODING_PLATFORMS[code]; if (!p || code === 'none') return '';
  const labelSize = p.label.length >= 3 ? size * 0.32 : (p.label.length === 2 ? size * 0.42 : size * 0.55);
  return `<g transform="translate(${x},${y})">
    <rect width="${size}" height="${size}" rx="${size*0.22}" fill="${p.bg}"/>
    <text x="${size/2}" y="${size/2 + labelSize*0.36}" text-anchor="middle"
      font-family="'JetBrains Mono', ui-monospace, monospace" font-size="${labelSize.toFixed(1)}"
      font-weight="800" fill="${p.fg}">${escXml(p.label)}</text>
  </g>`;
}

function musicPlatformGlyph(code, cx, cy, r, fg) {
  if (!code || code === 'none') return '';
  const c = metadata.MUSIC_PLATFORMS[code]?.color || fg;
  const inner = (() => {
    switch (code) {
      case 'spotify':
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>
                <path d="M${cx-r*0.55},${cy-r*0.25} Q${cx},${cy-r*0.55} ${cx+r*0.55},${cy-r*0.05}" stroke="#fff" stroke-width="${r*0.18}" fill="none" stroke-linecap="round"/>
                <path d="M${cx-r*0.45},${cy+r*0.05} Q${cx},${cy-r*0.2} ${cx+r*0.45},${cy+r*0.2}" stroke="#fff" stroke-width="${r*0.16}" fill="none" stroke-linecap="round"/>
                <path d="M${cx-r*0.35},${cy+r*0.32} Q${cx},${cy+r*0.15} ${cx+r*0.35},${cy+r*0.42}" stroke="#fff" stroke-width="${r*0.14}" fill="none" stroke-linecap="round"/>`;
      case 'ytmusic':
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>
                <circle cx="${cx}" cy="${cy}" r="${r*0.65}" fill="none" stroke="#fff" stroke-width="${r*0.12}"/>
                <polygon points="${cx-r*0.22},${cy-r*0.32} ${cx-r*0.22},${cy+r*0.32} ${cx+r*0.36},${cy}" fill="#fff"/>`;
      case 'applemusic':
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>
                <path d="M${cx-r*0.4},${cy+r*0.45} L${cx-r*0.4},${cy-r*0.45} L${cx+r*0.4},${cy-r*0.55} L${cx+r*0.4},${cy+r*0.25}" stroke="#fff" stroke-width="${r*0.16}" fill="none" stroke-linejoin="round"/>
                <ellipse cx="${cx-r*0.4}" cy="${cy+r*0.45}" rx="${r*0.18}" ry="${r*0.13}" fill="#fff"/>
                <ellipse cx="${cx+r*0.4}" cy="${cy+r*0.25}" rx="${r*0.18}" ry="${r*0.13}" fill="#fff"/>`;
      case 'soundcloud':
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}"/>
                <g stroke="#fff" stroke-width="${r*0.12}" stroke-linecap="round">
                  <line x1="${cx-r*0.55}" y1="${cy+r*0.18}" x2="${cx-r*0.55}" y2="${cy-r*0.18}"/>
                  <line x1="${cx-r*0.32}" y1="${cy+r*0.32}" x2="${cx-r*0.32}" y2="${cy-r*0.32}"/>
                  <line x1="${cx-r*0.08}" y1="${cy+r*0.42}" x2="${cx-r*0.08}" y2="${cy-r*0.42}"/>
                  <line x1="${cx+r*0.18}" y1="${cy+r*0.4}" x2="${cx+r*0.18}" y2="${cy-r*0.32}"/>
                  <line x1="${cx+r*0.42}" y1="${cy+r*0.36}" x2="${cx+r*0.42}" y2="${cy-r*0.18}"/>
                </g>`;
    }
    return '';
  })();
  return inner;
}

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function dataUrlFromBuffer(buf, contentType) {
  return `data:${contentType || 'image/png'};base64,${Buffer.from(buf).toString('base64')}`;
}

function isPublicIp(ip) {
  if (!ip) return false;
  const v = net.isIP(ip);
  if (v === 4) {
    const p = ip.split('.').map(n => parseInt(n, 10));
    if (p.some(n => Number.isNaN(n) || n < 0 || n > 255)) return false;
    if (p[0] === 10) return false;
    if (p[0] === 127) return false;
    if (p[0] === 0) return false;
    if (p[0] === 169 && p[1] === 254) return false;
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return false;
    if (p[0] === 192 && p[1] === 168) return false;
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return false;
    if (p[0] >= 224) return false;
    return true;
  }
  if (v === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return false;
    if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return false;
    if (lower.startsWith('::ffff:')) return isPublicIp(lower.slice(7));
    return true;
  }
  return false;
}

async function resolvePublic(host) {
  if (net.isIP(host)) return isPublicIp(host) ? host : null;
  try {
    const addrs = await dns.lookup(host, { all: true, verbatim: true });
    if (!addrs || !addrs.length) return null;
    for (const a of addrs) if (!isPublicIp(a.address)) return null;
    return addrs[0].address;
  } catch { return null; }
}

function fetchOnce(urlObj, ip, timeoutMs, maxBytes) {
  return new Promise((resolve) => {
    const lib = urlObj.protocol === 'https:' ? https : http;
    const port = urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80);
    const opts = {
      method: 'GET',
      host: ip,
      port,
      path: (urlObj.pathname || '/') + (urlObj.search || ''),
      headers: { Host: urlObj.hostname, 'User-Agent': 'StylishReadme/1.0', Accept: 'image/*' },
      servername: urlObj.hostname,
      timeout: timeoutMs
    };
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };
    const req = lib.request(opts, (res) => {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume();
        return done({ redirect: res.headers.location });
      }
      if (status < 200 || status >= 300) { res.resume(); return done(null); }
      const ct = (res.headers['content-type'] || '').split(';')[0].trim();
      if (ct && !ct.startsWith('image/')) { res.resume(); return done(null); }
      const cl = parseInt(res.headers['content-length'] || '0', 10);
      if (cl && cl > maxBytes) { res.resume(); return done(null); }
      const chunks = [];
      let total = 0;
      res.on('data', (c) => {
        total += c.length;
        if (total > maxBytes) { req.destroy(); return done(null); }
        chunks.push(c);
      });
      res.on('end', () => done({ buf: Buffer.concat(chunks), ct: ct || 'image/png' }));
      res.on('error', () => done(null));
    });
    req.on('timeout', () => { req.destroy(); done(null); });
    req.on('error', () => done(null));
    req.end();
  });
}

function getAvatarCacheKey(url) {
  const hash = crypto.createHash('sha256').update(url).digest('hex');
  return `avatar:${hash}`;
}

function kvRequest(commandArr) {
  return new Promise((resolve, reject) => {
    const urlStr = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    if (!urlStr || !token) {
      return reject(new Error('Vercel KV credentials missing'));
    }
    let u;
    try {
      u = new URL(urlStr);
    } catch (err) {
      return reject(err);
    }
    const lib = u.protocol === 'https:' ? https : http;
    const port = u.port || (u.protocol === 'https:' ? 443 : 80);
    const bodyData = JSON.stringify(commandArr);
    const opts = {
      method: 'POST',
      host: u.hostname,
      port,
      path: (u.pathname || '/') + (u.search || ''),
      headers: {
        'Host': u.hostname,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyData)
      },
      servername: u.hostname,
      timeout: 2000 // Cap KV latency to 2s
    };
    
    let settled = false;
    const done = (err, data) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve(data);
    };
    
    const req = lib.request(opts, (res) => {
      const status = res.statusCode || 0;
      let respData = '';
      res.on('data', (chunk) => {
        respData += chunk;
      });
      res.on('end', () => {
        if (status < 200 || status >= 300) {
          return done(new Error(`KV REST API responded with status ${status}: ${respData}`));
        }
        try {
          const parsed = JSON.parse(respData);
          done(null, parsed);
        } catch (e) {
          done(e);
        }
      });
      res.on('error', (err) => done(err));
    });
    
    req.on('timeout', () => {
      req.destroy();
      done(new Error('KV REST API request timed out'));
    });
    req.on('error', (err) => done(err));
    
    req.write(bodyData);
    req.end();
  });
}

async function fetchAvatarDataUrl(url, timeoutMs) {
  if (!url) return null;
  
  const cacheKey = getAvatarCacheKey(url);
  const now = Date.now();
  
  // 1. Check local in-memory cache
  if (AVATAR_MEMORY_CACHE.has(cacheKey)) {
    const cached = AVATAR_MEMORY_CACHE.get(cacheKey);
    if (cached.expiresAt > now) {
      return cached.value;
    } else {
      AVATAR_MEMORY_CACHE.delete(cacheKey);
    }
  }
  
  // 2. Check Vercel KV REST API
  let kvValue = null;
  try {
    const res = await kvRequest(['GET', cacheKey]);
    if (res && res.result) {
      kvValue = res.result;
    }
  } catch (err) {
    // Ignore KV get errors
  }
  
  if (kvValue) {
    AVATAR_MEMORY_CACHE.set(cacheKey, {
      value: kvValue,
      expiresAt: now + AVATAR_CACHE_TTL_SEC * 1000
    });
    return kvValue;
  }
  
  // 3. Fetch from remote URL
  const MAX = 600 * 1024;
  const T = timeoutMs || 4000;
  let current = url;
  let fetchedDataUrl = null;
  
  for (let hop = 0; hop < 4; hop++) {
    let u;
    try { u = new URL(current); } catch { break; }
    if (!/^https?:$/.test(u.protocol)) break;
    const ip = await resolvePublic(u.hostname);
    if (!ip) break;
    const r = await fetchOnce(u, ip, T, MAX);
    if (!r) break;
    if (r.redirect) { current = new URL(r.redirect, u).toString(); continue; }
    if (r.buf) {
      fetchedDataUrl = dataUrlFromBuffer(r.buf, r.ct);
      break;
    }
    break;
  }
  
  if (fetchedDataUrl) {
    // 4. Save to caches
    AVATAR_MEMORY_CACHE.set(cacheKey, {
      value: fetchedDataUrl,
      expiresAt: now + AVATAR_CACHE_TTL_SEC * 1000
    });
    
    // Save to KV store asynchronously
    kvRequest(['SET', cacheKey, fetchedDataUrl, 'EX', AVATAR_CACHE_TTL_SEC]).catch(() => {
      // Ignore KV write errors
    });
  }
  
  return fetchedDataUrl;
}

module.exports = {
  pad,
  getTzTime,
  escXml,
  theme,
  tzShort,
  svgWrap,
  shadowFilter,
  normalizeBool,
  flagSvg,
  fetchSkillIconDataUrl,
  skillIcon,
  platformBadge,
  musicPlatformGlyph,
  initials,
  fetchAvatarDataUrl,
  FLAGS
};
