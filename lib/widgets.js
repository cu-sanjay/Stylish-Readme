'use strict';

const dns = require('node:dns').promises;
const net = require('node:net');
const http = require('node:http');
const https = require('node:https');


function renderActivity(p) {
  const theme = THEMES[p.theme] || THEMES.classic;
  const isCompact = p.view === 'compact';
  const width = isCompact ? 340 : 480;
  const height = isCompact ? 64 : 160;
  
  let layoutContent = '';

  if (isCompact) {
    layoutContent = `
      <text x="16" y="28" fill="${theme.fg}" font-size="13" font-weight="700">Recent Activity</text>
      <text x="16" y="46" fill="${theme.fg}" opacity="0.6" font-size="11">Contributions</text>
      <rect x="110" y="36" width="210" height="10" rx="3" fill="${theme.fg}" opacity="0.15" />
      <rect x="110" y="36" width="150" height="10" rx="3" fill="${theme.fg}" />
    `;
  } else {
    layoutContent = `
      <text x="20" y="32" fill="${theme.fg}" font-size="14" font-weight="700">Activity Overview</text>
      <rect x="20" y="55" width="24" height="75" rx="3" fill="${theme.fg}" opacity="0.4" />
      <rect x="52" y="70" width="24" height="60" rx="3" fill="${theme.fg}" opacity="0.7" />
      <rect x="84" y="40" width="24" height="90" rx="3" fill="${theme.fg}" />
      <rect x="116" y="85" width="24" height="45" rx="3" fill="${theme.fg}" opacity="0.2" />
      <text x="20" y="148" fill="${theme.fg}" opacity="0.6" font-size="11">Mon</text>
      <text x="52" y="148" fill="${theme.fg}" opacity="0.6" font-size="11">Wed</text>
      <text x="84" y="148" fill="${theme.fg}" opacity="0.6" font-size="11">Fri</text>
      <text x="116" y="148" fill="${theme.fg}" opacity="0.6" font-size="11">Sun</text>
    `;
  }

  return svgWrap(width, height, `
    <rect width="100%" height="100%" fill="${theme.bg}" stroke="${theme.border ? theme.fg : 'none'}" stroke-width="1" rx="6"/>
    <style>text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; }</style>
    ${layoutContent}
  `);
}

const THEMES = {
  classic:  { bg:'#1a1a1a', fg:'#f4f1ea', border:false },
  paper:    { bg:'#f4f1ea', fg:'#1a1a1a', border:true  },
  terminal: { bg:'#0d1117', fg:'#7ee787', border:false },
  retro:    { bg:'#fbbf24', fg:'#1a1a1a', border:true  },
  ocean:    { bg:'#0c4a6e', fg:'#e0f2fe', border:false },
  crimson:  { bg:'#7f1d1d', fg:'#fef2f2', border:false },
  forest:   { bg:'#14532d', fg:'#ecfccb', border:false },
  ink:      { bg:'#f4f1ea', fg:'#1a1a1a', border:true  }
};

const TIMEZONES = {
  'UTC':                 'UTC · Coordinated Universal',
  'Asia/Kolkata':        'India · IST',
  'Europe/London':       'London · GMT/BST',
  'Europe/Paris':        'Paris · CET/CEST',
  'America/New_York':    'New York · EST/EDT',
  'America/Los_Angeles': 'Los Angeles · PST/PDT',
  'America/Chicago':     'Chicago · CST/CDT',
  'America/Sao_Paulo':   'São Paulo · BRT',
  'Europe/Berlin':       'Berlin · CET/CEST',
  'Europe/Moscow':       'Moscow · MSK',
  'Asia/Dubai':          'Dubai · GST',
  'Asia/Karachi':        'Karachi · PKT',
  'Asia/Dhaka':          'Dhaka · BST',
  'Asia/Bangkok':        'Bangkok · ICT',
  'Asia/Shanghai':       'Shanghai · CST',
  'Asia/Singapore':      'Singapore · SGT',
  'Asia/Tokyo':          'Tokyo · JST',
  'Australia/Sydney':    'Sydney · AEST/AEDT',
  'Pacific/Auckland':    'Auckland · NZST'
};


function generateActivityWidget(username, view = 'compact', themeName = 'classic') {
  // Grab the colors based on the theme the user chooses
  const theme = THEMES[themeName] || THEMES.classic;
  
  // Set the box size based on Compact vs Full view
  const width = view === 'compact' ? 400 : 500;
  const height = view === 'compact' ? 90 : 200;
  
  let graphicContent = '';

  if (view === 'compact') {
    // Compact View: Just a clean, minimalist bar representing activity
    graphicContent = `
      <text x="20" y="35" fill="${theme.fg}" font-size="14" font-weight="bold">@${username}'s Activity</text>
      <text x="20" y="60" fill="${theme.fg}" opacity="0.7" font-size="12">Recent Contributions</text>
      <rect x="160" y="48" width="210" height="12" rx="4" fill="${theme.fg}" opacity="0.2" />
      <rect x="160" y="48" width="140" height="12" rx="4" fill="${theme.fg}" />
    `;
  } else {
    // Full View: A minimalist row of activity blocks (a heat-map or bar chart)
    graphicContent = `
      <text x="20" y="35" fill="${theme.fg}" font-size="16" font-weight="bold">@${username}'s Activity</text>
      <rect x="20" y="60" width="30" height="80" rx="3" fill="${theme.fg}" opacity="0.3" />
      <rect x="60" y="60" width="30" height="50" rx="3" fill="${theme.fg}" opacity="0.5" />
      <rect x="100" y="60" width="30" height="90" rx="3" fill="${theme.fg}" />
      <rect x="140" y="60" width="30" height="40" rx="3" fill="${theme.fg}" opacity="0.2" />
      <rect x="180" y="60" width="30" height="75" rx="3" fill="${theme.fg}" opacity="0.8" />
    `;
  }

  // Wrap everything inside a valid, clean SVG container
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <style>
        text { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
      </style>
      <rect width="100%" height="100%" fill="${theme.bg}" rx="6" stroke="${theme.border ? theme.fg : 'none'}" stroke-width="1"/>
      ${graphicContent}
    </svg>
  `;
}

const COUNTRIES = {
  IN:'India', US:'United States', GB:'United Kingdom', PK:'Pakistan',
  DE:'Germany', FR:'France', JP:'Japan', CN:'China', BR:'Brazil',
  CA:'Canada', AU:'Australia', MX:'Mexico', IT:'Italy', ES:'Spain',
  NL:'Netherlands', SE:'Sweden', NO:'Norway', KR:'South Korea',
  TR:'Turkey', AE:'UAE', SG:'Singapore', ZA:'South Africa'
};

const QUOTE_SETS = {
  programming: [
    { q:'Simplicity is the soul of efficiency.', a:'Austin Freeman' },
    { q:'Code is like humor. When you have to explain it, it is bad.', a:'Cory House' },
    { q:'Make it work, make it right, make it fast.', a:'Kent Beck' },
    { q:'The best error message is the one that never shows up.', a:'Thomas Fuchs' },
    { q:'Programs must be written for people to read.', a:'Harold Abelson' },
    { q:'First, solve the problem. Then, write the code.', a:'John Johnson' },
    { q:'Any fool can write code a computer can understand.', a:'Martin Fowler' },
    { q:'Deleted code is debugged code.', a:'Jeff Sickel' },
    { q:'Talk is cheap. Show me the code.', a:'Linus Torvalds' },
    { q:'Premature optimization is the root of all evil.', a:'Donald Knuth' }
  ],
  motivation: [
    { q:'The only way to do great work is to love what you do.', a:'Steve Jobs' },
    { q:'Success is not final, failure is not fatal.', a:'Winston Churchill' },
    { q:'Believe you can and you are halfway there.', a:'Theodore Roosevelt' },
    { q:'It always seems impossible until it is done.', a:'Nelson Mandela' },
    { q:'Do not watch the clock. Do what it does. Keep going.', a:'Sam Levenson' },
    { q:'The future depends on what you do today.', a:'Mahatma Gandhi' },
    { q:'Dream big. Start small. Act now.', a:'Robin Sharma' }
  ],
  wisdom: [
    { q:'Knowing yourself is the beginning of all wisdom.', a:'Aristotle' },
    { q:'The only true wisdom is in knowing you know nothing.', a:'Socrates' },
    { q:'In the middle of difficulty lies opportunity.', a:'Albert Einstein' },
    { q:'Patience is bitter, but its fruit is sweet.', a:'Aristotle' },
    { q:'A journey of a thousand miles begins with a single step.', a:'Lao Tzu' },
    { q:'He who knows others is wise; he who knows himself is enlightened.', a:'Lao Tzu' }
  ]
};
QUOTE_SETS.random = [].concat(QUOTE_SETS.programming, QUOTE_SETS.motivation, QUOTE_SETS.wisdom);

// ----- Country flag SVG fragments (viewBox 60x40) -----
const FLAGS = {
  IN: `<rect width="60" height="40" fill="#fff"/>
       <rect width="60" height="13.33" y="0" fill="#FF9933"/>
       <rect width="60" height="13.34" y="26.66" fill="#138808"/>
       <circle cx="30" cy="20" r="4.4" fill="none" stroke="#000080" stroke-width="0.7"/>
       <circle cx="30" cy="20" r="0.9" fill="#000080"/>`,
  US: (() => {
    let stripes = '';
    for (let i = 0; i < 13; i++) {
      stripes += `<rect width="60" height="3.08" y="${i*3.08}" fill="${i%2===0?'#B22234':'#fff'}"/>`;
    }
    let stars = '';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        const xs = 2.2 + c*3.6 + (r%2)*1.8;
        const ys = 2.2 + r*3.4;
        if (xs < 23 && ys < 17) stars += `<circle cx="${xs}" cy="${ys}" r="0.55" fill="#fff"/>`;
      }
    }
    return `${stripes}<rect width="24" height="16.6" fill="#3C3B6E"/>${stars}`;
  })(),
  GB: `<rect width="60" height="40" fill="#012169"/>
       <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" stroke-width="6"/>
       <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" stroke-width="2.5"/>
       <rect x="25" width="10" height="40" fill="#fff"/>
       <rect y="15" width="60" height="10" fill="#fff"/>
       <rect x="27" width="6" height="40" fill="#C8102E"/>
       <rect y="17" width="60" height="6" fill="#C8102E"/>`,
  PK: `<rect width="60" height="40" fill="#01411C"/>
       <rect width="15" height="40" fill="#fff"/>
       <circle cx="38" cy="20" r="8" fill="#fff"/>
       <circle cx="40" cy="19" r="7" fill="#01411C"/>
       <polygon points="44,15 45,18 48,18 45.5,20 46.5,23 44,21 41.5,23 42.5,20 40,18 43,18" fill="#fff"/>`,
  DE: `<rect width="60" height="13.33" y="0" fill="#000"/>
       <rect width="60" height="13.33" y="13.33" fill="#DD0000"/>
       <rect width="60" height="13.34" y="26.66" fill="#FFCE00"/>`,
  FR: `<rect width="20" height="40" x="0" fill="#0055A4"/>
       <rect width="20" height="40" x="20" fill="#fff"/>
       <rect width="20" height="40" x="40" fill="#EF4135"/>`,
  JP: `<rect width="60" height="40" fill="#fff"/>
       <circle cx="30" cy="20" r="11" fill="#BC002D"/>`,
  CN: `<rect width="60" height="40" fill="#DE2910"/>
       <polygon points="12,8 13.5,12.5 18,12.5 14.4,15.2 15.8,19.7 12,17 8.2,19.7 9.6,15.2 6,12.5 10.5,12.5" fill="#FFDE00"/>
       <circle cx="22" cy="5" r="0.9" fill="#FFDE00"/>
       <circle cx="25" cy="8" r="0.9" fill="#FFDE00"/>
       <circle cx="25" cy="12" r="0.9" fill="#FFDE00"/>
       <circle cx="22" cy="15" r="0.9" fill="#FFDE00"/>`,
  BR: `<rect width="60" height="40" fill="#009C3B"/>
       <polygon points="30,5 55,20 30,35 5,20" fill="#FFDF00"/>
       <circle cx="30" cy="20" r="7.5" fill="#002776"/>
       <path d="M22,18 Q30,14 38,18" stroke="#fff" stroke-width="1" fill="none"/>`,
  CA: `<rect width="15" height="40" x="0" fill="#FF0000"/>
       <rect width="30" height="40" x="15" fill="#fff"/>
       <rect width="15" height="40" x="45" fill="#FF0000"/>
       <polygon points="30,12 31.5,16 35,15 33,18.5 36,20 33,21.5 35,25 31.5,24 30,28 28.5,24 25,25 27,21.5 24,20 27,18.5 25,15 28.5,16" fill="#FF0000"/>`,
  AU: `<rect width="60" height="40" fill="#012169"/>
       <rect width="30" height="20" fill="#012169"/>
       <path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" stroke-width="3"/>
       <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" stroke-width="1.2"/>
       <rect x="13" width="4" height="20" fill="#fff"/>
       <rect y="8" width="30" height="4" fill="#fff"/>
       <rect x="14" width="2" height="20" fill="#C8102E"/>
       <rect y="9" width="30" height="2" fill="#C8102E"/>
       <polygon points="15,28 15.7,30 17.7,30 16.1,31.2 16.7,33.2 15,32 13.3,33.2 13.9,31.2 12.3,30 14.3,30" fill="#fff"/>
       <polygon points="45,10 45.5,11.5 47,11.5 45.7,12.5 46.2,14 45,13 43.8,14 44.3,12.5 43,11.5 44.5,11.5" fill="#fff"/>
       <polygon points="50,22 50.5,23.5 52,23.5 50.7,24.5 51.2,26 50,25 48.8,26 49.3,24.5 48,23.5 49.5,23.5" fill="#fff"/>`,
  MX: `<rect width="20" height="40" x="0" fill="#006847"/>
       <rect width="20" height="40" x="20" fill="#fff"/>
       <rect width="20" height="40" x="40" fill="#CE1126"/>
       <circle cx="30" cy="20" r="4" fill="none" stroke="#8B4513" stroke-width="0.8"/>`,
  IT: `<rect width="20" height="40" x="0" fill="#009246"/>
       <rect width="20" height="40" x="20" fill="#fff"/>
       <rect width="20" height="40" x="40" fill="#CE2B37"/>`,
  ES: `<rect width="60" height="10" y="0" fill="#AA151B"/>
       <rect width="60" height="20" y="10" fill="#F1BF00"/>
       <rect width="60" height="10" y="30" fill="#AA151B"/>`,
  NL: `<rect width="60" height="13.33" y="0" fill="#AE1C28"/>
       <rect width="60" height="13.33" y="13.33" fill="#fff"/>
       <rect width="60" height="13.34" y="26.66" fill="#21468B"/>`,
  SE: `<rect width="60" height="40" fill="#006AA7"/>
       <rect x="18" width="6" height="40" fill="#FECC00"/>
       <rect y="17" width="60" height="6" fill="#FECC00"/>`,
  NO: `<rect width="60" height="40" fill="#EF2B2D"/>
       <rect x="17" width="8" height="40" fill="#fff"/>
       <rect y="16" width="60" height="8" fill="#fff"/>
       <rect x="19" width="4" height="40" fill="#002868"/>
       <rect y="18" width="60" height="4" fill="#002868"/>`,
  KR: `<rect width="60" height="40" fill="#fff"/>
       <circle cx="30" cy="20" r="8" fill="#CD2E3A"/>
       <path d="M30,12 A4,4 0 0,1 30,20 A4,4 0 0,0 30,28 A8,8 0 0,1 30,12Z" fill="#0047A0"/>
       <g stroke="#000" stroke-width="0.5">
         <line x1="14" y1="10" x2="18" y2="14"/>
         <line x1="42" y1="10" x2="46" y2="14"/>
         <line x1="14" y1="30" x2="18" y2="26"/>
         <line x1="42" y1="30" x2="46" y2="26"/>
       </g>`,
  TR: `<rect width="60" height="40" fill="#E30A17"/>
       <circle cx="22" cy="20" r="7" fill="#fff"/>
       <circle cx="24" cy="20" r="6" fill="#E30A17"/>
       <polygon points="32,16 33.5,19 36.5,19 34,21 35,24 32,22.5 29,24 30,21 27.5,19 30.5,19" fill="#fff"/>`,
  AE: `<rect width="60" height="40" fill="#fff"/>
       <rect width="60" height="13.33" y="0" fill="#00732F"/>
       <rect width="60" height="13.34" y="26.66" fill="#000"/>
       <rect width="15" height="40" x="0" fill="#FF0000"/>`,
  SG: `<rect width="60" height="20" y="0" fill="#EF3340"/>
       <rect width="60" height="20" y="20" fill="#fff"/>
       <circle cx="14" cy="10" r="6" fill="#fff"/>
       <circle cx="16" cy="10" r="5" fill="#EF3340"/>
       <g fill="#fff">
         <polygon points="20,5 20.4,6.2 21.6,6.2 20.6,7 21,8.2 20,7.5 19,8.2 19.4,7 18.4,6.2 19.6,6.2"/>
         <polygon points="24,8 24.4,9.2 25.6,9.2 24.6,10 25,11.2 24,10.5 23,11.2 23.4,10 22.4,9.2 23.6,9.2"/>
         <polygon points="28,5 28.4,6.2 29.6,6.2 28.6,7 29,8.2 28,7.5 27,8.2 27.4,7 26.4,6.2 27.6,6.2"/>
       </g>`,
  ZA: `<rect width="60" height="40" fill="#007A4D"/>
       <polygon points="0,0 22,20 0,40" fill="#000"/>
       <polygon points="0,0 22,20 60,20 60,0" fill="#DE3831"/>
       <polygon points="0,40 22,20 60,20 60,40" fill="#002395"/>
       <polygon points="0,5 18,20 0,35" fill="#FFB612"/>
       <polygon points="0,9 14,20 0,31" fill="#000"/>
       <rect x="22" y="14" width="38" height="12" fill="#fff"/>
       <rect x="22" y="16" width="38" height="8" fill="#007A4D"/>`
};

function flagSvg(code, x, y, w, h) {
  const inner = FLAGS[code] || FLAGS.IN;
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 60 40" preserveAspectRatio="xMidYMid meet">
    <rect width="60" height="40" fill="#eee"/>
    ${inner}
    <rect width="60" height="40" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="0.6"/>
  </svg>`;
}

// ----- Skill icons (24x24 viewBox, brand-colored badges) -----
const SKILLS = {
  HTML:    { name:'HTML5',      bg:'#E34F26', slug:'html5',           dark:false },
  CSS:     { name:'CSS3',       bg:'#1572B6', slug:'css3',            dark:false },
  JS:      { name:'JavaScript', bg:'#F7DF1E', slug:'javascript',      dark:true  },
  TS:      { name:'TypeScript', bg:'#3178C6', slug:'typescript',      dark:false },
  REACT:   { name:'React',      bg:'#20232A', slug:'react',           dark:false },
  VUE:     { name:'Vue.js',     bg:'#4FC08D', slug:'vuedotjs',        dark:false },
  ANGULAR: { name:'Angular',    bg:'#DD0031', slug:'angular',         dark:false },
  NODE:    { name:'Node.js',    bg:'#339933', slug:'nodedotjs',       dark:false },
  PYTHON:  { name:'Python',     bg:'#3776AB', slug:'python',          dark:false },
  JAVA:    { name:'Java',       bg:'#ED8B00', slug:'openjdk',         dark:false },
  CPP:     { name:'C++',        bg:'#00599C', slug:'cplusplus',       dark:false },
  GO:      { name:'Go',         bg:'#00ADD8', slug:'go',              dark:false },
  RUST:    { name:'Rust',       bg:'#1a1a1a', slug:'rust',            dark:false },
  GIT:     { name:'Git',        bg:'#F05032', slug:'git',             dark:false },
  GITHUB:  { name:'GitHub',     bg:'#181717', slug:'github',          dark:false },
  SQL:     { name:'MySQL',      bg:'#4479A1', slug:'mysql',           dark:false },
  MONGO:   { name:'MongoDB',    bg:'#47A248', slug:'mongodb',         dark:false },
  DOCKER:  { name:'Docker',     bg:'#2496ED', slug:'docker',          dark:false },
  AWS:     { name:'AWS',        bg:'#232F3E', slug:'amazonwebservices', dark:false },
  LINUX:   { name:'Linux',      bg:'#FCC624', slug:'linux',           dark:true  },
  TAILWIND:{ name:'Tailwind',   bg:'#06B6D4', slug:'tailwindcss',     dark:false },
  SASS:    { name:'Sass',       bg:'#CC6699', slug:'sass',            dark:false },
  BOOTSTRAP:{ name:'Bootstrap', bg:'#7952B3', slug:'bootstrap',       dark:false },
  FIGMA:   { name:'Figma',      bg:'#1a1a1a', slug:'figma',           dark:false }
};

const SKILL_ICON_CACHE = new Map();

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
  const s = SKILLS[code]; if (!s) return '';
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

// ----- Coding platforms (32x32 stylized badges) -----
const CODING_PLATFORMS = {
  none:        { name:'None',          bg:'transparent', fg:'transparent', label:'' },
  leetcode:    { name:'LeetCode',      bg:'#FFA116', fg:'#1a1a1a', label:'LC' },
  gfg:         { name:'GeeksforGeeks', bg:'#2F8D46', fg:'#fff',    label:'GfG' },
  hackerrank:  { name:'HackerRank',    bg:'#00EA64', fg:'#0d1117', label:'HR' },
  codeforces:  { name:'Codeforces',    bg:'#1F8ACB', fg:'#fff',    label:'CF' },
  codechef:    { name:'CodeChef',      bg:'#5B4638', fg:'#fff',    label:'CC' },
  atcoder:     { name:'AtCoder',       bg:'#222222', fg:'#fff',    label:'AC' },
  hackerearth: { name:'HackerEarth',   bg:'#2C3454', fg:'#3686FF', label:'HE' },
  github:      { name:'GitHub',        bg:'#181717', fg:'#fff',    label:'GH' }
};

function platformBadge(code, x, y, size) {
  const p = CODING_PLATFORMS[code]; if (!p || code === 'none') return '';
  const labelSize = p.label.length >= 3 ? size * 0.32 : (p.label.length === 2 ? size * 0.42 : size * 0.55);
  return `<g transform="translate(${x},${y})">
    <rect width="${size}" height="${size}" rx="${size*0.22}" fill="${p.bg}"/>
    <text x="${size/2}" y="${size/2 + labelSize*0.36}" text-anchor="middle"
      font-family="'JetBrains Mono', ui-monospace, monospace" font-size="${labelSize.toFixed(1)}"
      font-weight="800" fill="${p.fg}">${escXml(p.label)}</text>
  </g>`;
}

// ----- Music streaming platforms -----
const MUSIC_PLATFORMS = {
  none:       { name:'None' },
  spotify:    { name:'Spotify',       color:'#1DB954' },
  ytmusic:    { name:'YouTube Music', color:'#FF0000' },
  applemusic: { name:'Apple Music',   color:'#FA243C' },
  soundcloud: { name:'SoundCloud',    color:'#FF7700' }
};

function musicPlatformGlyph(code, cx, cy, r, fg) {
  if (!code || code === 'none') return '';
  const c = MUSIC_PLATFORMS[code]?.color || fg;
  const inner = (() => {
    switch (code) {
      case 'spotify':
        // green disc with 3 stacked sound waves
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

// ===== Generic helpers =====
function pad(n) { return String(n).padStart(2, '0'); }

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

function theme(id) { return THEMES[id] || THEMES.classic; }
function tzShort(tz) { return (tz || '').split('/').pop().replace(/_/g, ' '); }

function svgWrap(width, height, body, fontFamily) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${fontFamily || "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace"}">
${body}
</svg>`;
}

// ===== Renderers =====
function renderTime(p) {
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
  const border = th.border ? `stroke="${th.fg}" stroke-width="2"` : '';
  const label = escXml((p.label || 'Local Time').toUpperCase()) + ' · ' + escXml(tzShort(p.timezone).toUpperCase());
  return svgWrap(W, H, `
  <rect x="1" y="1" width="${W-2}" height="${H-2}" fill="${th.bg}" ${border}/>
  <text x="20" y="28" fill="${th.fg}" font-size="10" font-weight="700" letter-spacing="2" opacity="0.7">${label}</text>
  <text x="20" y="70" fill="${th.fg}" font-size="42" font-weight="700" letter-spacing="-1">${escXml(timeStr)}<tspan font-size="20" opacity="0.7">${escXml(suffix)}</tspan></text>
  ${(p.showDate || p.showDay) ? `<line x1="20" y1="88" x2="${W-20}" y2="88" stroke="${th.fg}" stroke-width="1" opacity="0.3"/>` : ''}
  ${p.showDay ? `<text x="20" y="110" fill="${th.fg}" font-size="12" font-weight="600" opacity="0.85">${escXml(t.weekday)}</text>` : ''}
  ${p.showDate ? `<text x="${W-20}" y="110" text-anchor="end" fill="${th.fg}" font-size="12" font-weight="600" opacity="0.85">${escXml(t.day + ' ' + t.month + ' ' + t.year)}</text>` : ''}
  `);
}

function renderClock(p) {
  const t = getTzTime(p.timezone);
  const th = theme(p.theme);
  const border = th.border ? `stroke="${th.fg}" stroke-width="2"` : '';
  const W = 380, H = 110;
  const h12 = p.timeFormat === '12h';
  const h = h12 ? (parseInt(t.h, 10) % 12 || 12) : parseInt(t.h, 10);
  const hh = pad(h);
  const ampm = h12 ? (parseInt(t.h, 10) >= 12 ? 'PM' : 'AM') : '24H';
  return svgWrap(W, H, `
  <rect x="1" y="1" width="${W-2}" height="${H-2}" fill="${th.bg}" ${border}/>
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

function renderDate(p) {
  const t = getTzTime(p.timezone);
  const th = theme(p.theme);
  const border = th.border ? `stroke="${th.fg}" stroke-width="2"` : '';
  const W = 260, H = 130;
  return svgWrap(W, H, `
  <rect x="1" y="1" width="${W-2}" height="${H-2}" fill="${th.bg}" ${border}/>
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

function pickQuote(category) {
  const list = QUOTE_SETS[category] || QUOTE_SETS.programming;
  const dayKey = Math.floor(Date.now() / 86400000);
  return list[dayKey % list.length];
}

function renderQuote(p) {
  const th = theme(p.theme);
  const border = th.border ? `stroke="${th.fg}" stroke-width="2"` : '';
  const quote = pickQuote(p.quoteCategory);
  const W = 440, H = 130;
  const words = quote.q.split(' ');
  const line1 = [], line2 = [];
  let len = 0;
  words.forEach(w => {
    if (len + w.length < 42) { line1.push(w); len += w.length + 1; }
    else line2.push(w);
  });
  return svgWrap(W, H, `
  <rect x="1" y="1" width="${W-2}" height="${H-2}" fill="${th.bg}" ${border}/>
  <text x="20" y="38" fill="${th.fg}" font-size="44" font-weight="900" opacity="0.5" font-family="Fraunces, Georgia, serif">"</text>
  <text x="50" y="30" fill="${th.fg}" font-size="10" font-weight="700" letter-spacing="2" opacity="0.6">${escXml((p.label || 'Quote of the Day').toUpperCase())}</text>
  <text x="50" y="56" fill="${th.fg}" font-size="15" font-weight="500" font-style="italic" font-family="Fraunces, Georgia, serif">${escXml(line1.join(' '))}</text>
  ${line2.length ? `<text x="50" y="76" fill="${th.fg}" font-size="15" font-weight="500" font-style="italic" font-family="Fraunces, Georgia, serif">${escXml(line2.join(' '))}</text>` : ''}
  <line x1="50" y1="92" x2="100" y2="92" stroke="${th.fg}" stroke-width="2"/>
  <text x="50" y="108" fill="${th.fg}" font-size="11" font-weight="600" opacity="0.85">${escXml('— ' + quote.a)}</text>
  `, "'JetBrains Mono', ui-monospace, Menlo, Consolas, monospace");
}

function renderFlag(p) {
  const th = theme(p.theme);
  const code = (p.country || 'IN').toUpperCase();
  const name = COUNTRIES[code] || code;
  const border = th.border ? `stroke="${th.fg}" stroke-width="2"` : '';
  const W = 280, H = 100;
  // Flag vertically centered with text block (texts at y=38, 62, 80 → center ~58)
  return svgWrap(W, H, `
  <rect x="1" y="1" width="${W-2}" height="${H-2}" fill="${th.bg}" ${border}/>
  ${flagSvg(code, 18, 34, 50, 33)}
  <text x="82" y="40" fill="${th.fg}" font-size="9" font-weight="700" letter-spacing="2" opacity="0.65">${escXml((p.label || 'Based In').toUpperCase())}</text>
  <text x="82" y="62" fill="${th.fg}" font-size="18" font-weight="700" font-family="Fraunces, Georgia, serif">${escXml(name)}</text>
  <text x="82" y="80" fill="${th.fg}" font-size="9" font-weight="700" letter-spacing="1" opacity="0.55">COUNTRY CODE · ${escXml(code)}</text>
  `);
}

function renderTimezone(p) {
  const t = getTzTime(p.timezone);
  const th = theme(p.theme);
  const border = th.border ? `stroke="${th.fg}" stroke-width="2"` : '';
  const W = 460, H = 90;
  let timeStr;
  if (p.timeFormat === '12h') {
    let h = parseInt(t.h, 10); const sf = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    timeStr = `${pad(h)}:${t.m} ${sf}`;
  } else { timeStr = `${t.h}:${t.m}`; }
  const tzLabel = TIMEZONES[p.timezone] || p.timezone || '';
  return svgWrap(W, H, `
  <rect x="1" y="1" width="${W-2}" height="${H-2}" fill="${th.bg}" ${border}/>
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

function renderStreak(p) {
  const th = theme(p.theme);
  const border = th.border ? `stroke="${th.fg}" stroke-width="2"` : '';
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
  <rect x="1" y="1" width="${W-2}" height="${H-2}" fill="${th.bg}" ${border}/>
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

function renderMusic(p) {
  const th = theme(p.theme);
  const border = th.border ? `stroke="${th.fg}" stroke-width="2"` : '';
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
    <linearGradient id="art" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0.45"/>
    </linearGradient>
  </defs>

  <!-- card background with subtle inner panel -->
  <rect x="1" y="1" width="${W-2}" height="${H-2}" fill="${th.bg}" ${border}/>
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

// ----- Profile Card (all-in-one) -----
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

async function fetchAvatarDataUrl(url, timeoutMs) {
  if (!url) return null;
  const MAX = 600 * 1024;
  const T = timeoutMs || 4000;
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    let u;
    try { u = new URL(current); } catch { return null; }
    if (!/^https?:$/.test(u.protocol)) return null;
    const ip = await resolvePublic(u.hostname);
    if (!ip) return null;
    const r = await fetchOnce(u, ip, T, MAX);
    if (!r) return null;
    if (r.redirect) { current = new URL(r.redirect, u).toString(); continue; }
    if (r.buf) return dataUrlFromBuffer(r.buf, r.ct);
    return null;
  }
  return null;
}

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function renderProfile(p) {
  const th = theme(p.theme);
  const border = th.border ? `stroke="${th.fg}" stroke-width="2"` : '';
  const W = 580, H = 320;

  const skillsRaw = (p.skills || 'HTML,CSS,JS,GIT,SQL,REACT,NODE,PYTHON').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  const validSkills = skillsRaw.filter(s => SKILLS[s]).slice(0, 12);

  const [dataUrl, ...iconUrls] = await Promise.all([
    fetchAvatarDataUrl(p.avatar),
    ...validSkills.map(code => fetchSkillIconDataUrl(SKILLS[code].slug, !!SKILLS[code].dark))
  ]);

  // Skill grid: 6 per row, up to 2 rows
  const iconSize = 30;
  const gap = 8;
  const skillsX = 220;
  const skillsY = 168;
  const skillNodes = validSkills.map((s, i) => {
    const col = i % 6, row = Math.floor(i / 6);
    return skillIcon(s, skillsX + col * (iconSize + gap), skillsY + row * (iconSize + gap), iconSize, iconUrls[i]);
  }).join('');

  const avatarCx = 110, avatarCy = 145, avatarR = 62;
  const avatarBlock = dataUrl
    ? `<defs>
         <clipPath id="avClip"><circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}"/></clipPath>
       </defs>
       <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR + 4}" fill="${th.fg}" opacity="0.12"/>
       <image href="${escXml(dataUrl)}" x="${avatarCx - avatarR}" y="${avatarCy - avatarR}" width="${avatarR*2}" height="${avatarR*2}" clip-path="url(#avClip)" preserveAspectRatio="xMidYMid slice"/>
       <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="none" stroke="${th.fg}" stroke-width="2.5"/>`
    : `<circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR + 4}" fill="${th.fg}" opacity="0.12"/>
       <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="${th.fg}" opacity="0.18"/>
       <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="none" stroke="${th.fg}" stroke-width="2.5"/>
       <text x="${avatarCx}" y="${avatarCy + 16}" text-anchor="middle" fill="${th.fg}" font-size="42" font-weight="800" font-family="Fraunces, Georgia, serif">${escXml(initials(p.name))}</text>`;

  // Bio: wrap to 2 lines (max 60 chars / line)
  const bio = (p.bio || '').trim();
  const bioWords = bio.split(/\s+/);
  const bioLines = [];
  let line = '';
  for (const w of bioWords) {
    if ((line + ' ' + w).trim().length > 56) { bioLines.push(line.trim()); line = w; if (bioLines.length === 2) break; }
    else { line += ' ' + w; }
  }
  if (bioLines.length < 2 && line.trim()) bioLines.push(line.trim());

  const handle = (p.handle || '').replace(/^@/, '').trim();

  return svgWrap(W, H, `
  <defs>
    <linearGradient id="profBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${th.bg}"/>
      <stop offset="100%" stop-color="${th.bg}" stop-opacity="0.92"/>
    </linearGradient>
    <pattern id="dotsP" width="14" height="14" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="0.8" fill="${th.fg}" opacity="0.07"/>
    </pattern>
  </defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" fill="url(#profBg)" ${border}/>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" fill="url(#dotsP)"/>

  <!-- left panel: avatar -->
  <rect x="14" y="20" width="200" height="${H-40}" fill="${th.fg}" opacity="0.05"/>
  ${avatarBlock}
  <text x="${avatarCx}" y="${avatarCy + avatarR + 26}" text-anchor="middle" fill="${th.fg}" font-size="9" font-weight="700" letter-spacing="2" opacity="0.65">${escXml((p.role || 'Developer').toUpperCase())}</text>
  ${handle ? `<text x="${avatarCx}" y="${avatarCy + avatarR + 44}" text-anchor="middle" fill="${th.fg}" font-size="10" font-weight="600" opacity="0.85">@${escXml(handle)}</text>` : ''}

  <!-- divider -->
  <line x1="214" y1="20" x2="214" y2="${H-20}" stroke="${th.fg}" stroke-width="1" opacity="0.2"/>

  <!-- right: name + bio -->
  <text x="232" y="48" fill="${th.fg}" font-size="9" font-weight="700" letter-spacing="2.5" opacity="0.55">HELLO, I'M</text>
  <text x="232" y="84" fill="${th.fg}" font-size="28" font-weight="800" font-family="Fraunces, Georgia, serif">${escXml(p.name || 'Your Name')}</text>
  <line x1="232" y1="96" x2="280" y2="96" stroke="${th.fg}" stroke-width="2"/>

  ${bioLines[0] ? `<text x="232" y="120" fill="${th.fg}" font-size="11" font-weight="500" opacity="0.85">${escXml(bioLines[0])}</text>` : ''}
  ${bioLines[1] ? `<text x="232" y="138" fill="${th.fg}" font-size="11" font-weight="500" opacity="0.85">${escXml(bioLines[1])}</text>` : ''}

  <!-- skills section -->
  <text x="220" y="${skillsY - 8}" fill="${th.fg}" font-size="9" font-weight="700" letter-spacing="2.5" opacity="0.55">◆ SKILLS &amp; STACK</text>
  ${skillNodes}
  `);
}

function normalizeBool(v, def) {
  if (v === undefined || v === null || v === '') return def;
  if (v === true || v === '1' || v === 'true' || v === 'on' || v === 'yes') return true;
  if (v === false || v === '0' || v === 'false' || v === 'off' || v === 'no') return false;
  return def;
}

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

  // Keeping previously implemented case-insensitive platform changes intact:
  // 1. Pre-process and normalize platform values to lowercase safely
  const parsedPlatform = q.platform ? String(q.platform).trim().toLowerCase() : 'none';
  const validPlatforms = ['none', 'leetcode', 'gfg', 'hackerrank', 'codeforces', 'codechef', 'atcoder', 'hackerearth', 'github'];
  const finalPlatform = validPlatforms.includes(parsedPlatform) ? parsedPlatform : 'none';

  // 2. Pre-process and normalize musicPlatform values to lowercase safely
  const parsedMusicPlatform = q.musicPlatform ? String(q.musicPlatform).trim().toLowerCase() : 'none';
  const validMusicPlatforms = ['none', 'spotify', 'ytmusic', 'applemusic', 'soundcloud'];
  const finalMusicPlatform = validMusicPlatforms.includes(parsedMusicPlatform) ? parsedMusicPlatform : 'none';

  return {
    timezone:    q.timezone || 'Asia/Kolkata',
    theme:       q.theme || 'classic',
    timeFormat:  q.timeFormat || '24h',
    showSeconds: normalizeBool(q.showSeconds, true),
    showDate:    normalizeBool(q.showDate, true),
    showDay:     normalizeBool(q.showDay, true),
    label:       q.label || '',
    country:     q.country || 'IN',
    quoteCategory: q.quoteCategory || 'programming',
    clockStyle:  q.clockStyle || 'digital',
    startDate:   q.startDate || '2024-01-01',
    unit:        q.unit || 'days',
    customLabel: q.customLabel || 'Coding Streak',
    platform:    finalPlatform,
    musicSong:   q.musicSong || 'Tum Hi Ho',
    musicArtist: q.musicArtist || 'Arijit Singh',
    musicGenre:  q.musicGenre || 'Bollywood',
    musicListen: q.musicListen || 'Now Playing',
    musicPlatform: finalMusicPlatform,
    avatar:      q.avatar || '',
    
    // Target fields wrapped securely with truncation defense hooks:
    name:        truncateStr(q.name || 'Your Name', MAX_LENGTHS.name),
    role:        truncateStr(q.role || 'Developer', MAX_LENGTHS.role),
    bio:         truncateStr(q.bio || 'Building cool things with code. Open-source enthusiast.', MAX_LENGTHS.bio),
    
    skills:      q.skills || 'HTML,CSS,JS,GIT,SQL,REACT,NODE,PYTHON',
    handle:      q.handle || ''
  };
}

async function renderWidget(type, query) {
  const p = normalizeParams(query || {});
  switch ((type || '').toLowerCase()) {
    case 'time':     return renderTime(p);
    case 'clock':    return renderClock(p);
    case 'date':     return renderDate(p);
    case 'quote':    return renderQuote(p);
    case 'flag':     return renderFlag(p);
    case 'activity':    return renderActivity(p);
    case 'timezone': return renderTimezone(p);
    case 'streak':   return renderStreak(p);
    case 'music':    return renderMusic(p);
    case 'profile':  return await renderProfile(p);
    case 'activity': return renderActivity(params);
    default:
      return svgWrap(320, 60, `
        <rect x="1" y="1" width="318" height="58" fill="#1a1a1a" stroke="#c8402c" stroke-width="2"/>
        <text x="20" y="36" fill="#f4f1ea" font-size="13" font-weight="700">Unknown widget: ${escXml(type)}</text>
      `);
  }
}
function renderActivity(params) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60"><text x="10" y="30" fill="white">Activity Coming Soon!</text></svg>`;}
module.exports = {
  renderWidget,
  renderActivity,
  THEMES, TIMEZONES, COUNTRIES, FLAGS, SKILLS, CODING_PLATFORMS, MUSIC_PLATFORMS,
  flagSvg, skillIcon, platformBadge,
  
}

// lib/widgets.js

/**
 * Generates the Retro Activity Badge SVG string based on dynamic configurations
 */
export function renderActivityBadge({ 
    customLabel = 'Local Time', 
    theme = 'classic', 
    showSeconds = true,
    timeString = '00:00:00',
    streak = '0 Days',
    listening = 'Not playing anything'
}) {
    // Basic Retro Theme Matrix
    const themes = {
        classic: { bg: '#F4F0E6', text: '#000000', secondary: '#555555', accent: '#000000' },
        dark: { bg: '#1A1A1A', text: '#FFFFFF', secondary: '#AAAAAA', accent: '#FFFFFF' },
        // Add your other color schemes here to match your frontend palette
    };

    const currentTheme = themes[theme] || themes.classic;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140" viewBox="0 0 400 140" fill="none">
        <style>
            .header { font: bold 13px 'Courier New', monospace; fill: ${currentTheme.text}; }
            .stat-label { font: bold 11px 'Courier New', monospace; fill: ${currentTheme.secondary}; }
            .stat-value { font: 11px 'Courier New', monospace; fill: ${currentTheme.text}; }
            .subtext { font: italic 10px 'Courier New', monospace; fill: ${currentTheme.secondary}; }
        </style>
        
        <rect x="2" y="2" width="396" height="136" fill="${currentTheme.bg}" stroke="${currentTheme.accent}" stroke-width="2"/>
        <rect x="6" y="6" width="388" height="128" fill="none" stroke="${currentTheme.accent}" stroke-width="1" stroke-dasharray="4 2"/>
        
        <text x="16" y="28" class="header">● ${customLabel.toUpperCase()}</text>
        <text x="384" y="28" class="header" text-anchor="end">${timeString}</text>
        <line x1="12" y1="38" x2="388" y2="38" stroke="${currentTheme.accent}" stroke-width="1.5"/>
        
        <g transform="translate(16, 48)">
            <rect x="0" y="0" width="64" height="64" fill="none" stroke="${currentTheme.accent}" stroke-width="1.5"/>
            <rect x="8" y="8" width="48" height="48" fill="${currentTheme.accent}"/>
        </g>
        
        <g transform="translate(96, 48)">
            <text x="0" y="14" class="stat-label">STATUS:</text>
            <text x="60" y="14" class="stat-value">Building...</text>
            
            <text x="0" y="34" class="stat-label">STREAK:</text>
            <text x="60" y="34" class="stat-value">${streak}</text>
            
            <text x="0" y="54" class="stat-label">LISTENING:</text>
            <text x="80" y="54" class="stat-value">${listening}</text>
        </g>
        
        <line x1="12" y1="122" x2="388" y2="122" stroke="${currentTheme.accent}" stroke-width="1" stroke-dasharray="2 2"/>
        <text x="16" y="132" class="subtext">UPDATES LIVE</text>
    </svg>`;
}
