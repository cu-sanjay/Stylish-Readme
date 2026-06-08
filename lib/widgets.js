'use strict';

const dns = require('node:dns').promises;
const net = require('node:net');
const http = require('node:http');
const https = require('node:https');
const crypto = require('node:crypto');

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

// ----- Skyline keyframe configurations for procedural rendering -----
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpRGB(a, b, t) {
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t)
  ];
}

function rgb(c, a = 1) {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}

const SKYLINE_KEYS = [
  {
    t: 0.0,
    name: 'DAWN',
    skyTop: [38, 44, 86],
    skyHor: [247, 176, 128],
    sun: [255, 238, 206],
    glow: [255, 178, 120],
    wFar: [176, 150, 150],
    wNear: [34, 62, 84],
    foam: [255, 244, 234],
    sunH: 0.1,
    glit: 0.7,
    star: 0
  },
  {
    t: 0.28,
    name: 'MORNING',
    skyTop: [64, 134, 206],
    skyHor: [188, 222, 236],
    sun: [255, 255, 246],
    glow: [255, 250, 224],
    wFar: [120, 186, 196],
    wNear: [20, 92, 114],
    foam: [255, 255, 255],
    sunH: 0.55,
    glit: 0.5,
    star: 0
  },
  {
    t: 0.5,
    name: 'MIDDAY',
    skyTop: [58, 142, 214],
    skyHor: [176, 216, 230],
    sun: [255, 255, 248],
    glow: [255, 252, 232],
    wFar: [96, 178, 188],
    wNear: [16, 96, 120],
    foam: [255, 255, 255],
    sunH: 0.92,
    glit: 0.45,
    star: 0
  },
  {
    t: 0.68,
    name: 'GOLDEN HOUR',
    skyTop: [74, 92, 156],
    skyHor: [255, 202, 120],
    sun: [255, 236, 194],
    glow: [255, 168, 92],
    wFar: [206, 164, 118],
    wNear: [34, 78, 98],
    foam: [255, 244, 228],
    sunH: 0.3,
    glit: 0.95,
    star: 0
  },
  {
    t: 0.84,
    name: 'SUNSET',
    skyTop: [48, 38, 86],
    skyHor: [255, 108, 68],
    sun: [255, 206, 148],
    glow: [255, 92, 58],
    wFar: [188, 98, 84],
    wNear: [30, 42, 72],
    foam: [255, 222, 200],
    sunH: 0.06,
    glit: 1.0,
    star: 0.15
  },
  {
    t: 1.0,
    name: 'MOONLIT',
    skyTop: [8, 12, 30],
    skyHor: [34, 44, 82],
    sun: [228, 234, 255],
    glow: [140, 164, 216],
    wFar: [28, 42, 76],
    wNear: [6, 16, 32],
    foam: [196, 208, 234],
    sunH: 0.55,
    glit: 0.55,
    star: 1
  }
];

function seedRandom(seedVal) {
  const x = Math.sin(seedVal) * 10000;
  return x - Math.floor(x);
}

// Generate deterministic lists of stars, clouds, and birds once
const SKYLINE_STARS = [];
let randomSeed = 1234;
for (let i = 0; i < 60; i++) {
  SKYLINE_STARS.push({
    x: seedRandom(randomSeed++),
    y: seedRandom(randomSeed++) * 0.9,
    r: seedRandom(randomSeed++) * 1.1 + 0.3
  });
}

const SKYLINE_CLOUDS = [];
for (let i = 0; i < 5; i++) {
  SKYLINE_CLOUDS.push({
    x: seedRandom(randomSeed++),
    y: 0.05 + seedRandom(randomSeed++) * 0.16,
    w: 0.16 + seedRandom(randomSeed++) * 0.16
  });
}

const SKYLINE_BIRDS = [];
for (let i = 0; i < 3; i++) {
  SKYLINE_BIRDS.push({
    x: seedRandom(randomSeed++),
    y: 0.1 + seedRandom(randomSeed++) * 0.15,
    size: 7 + seedRandom(randomSeed++) * 4
  });
}

function getSkylinePalette(t) {
  let i = 0;
  while (i < SKYLINE_KEYS.length - 1 && t > SKYLINE_KEYS[i + 1].t) i++;
  const a = SKYLINE_KEYS[i];
  const b = SKYLINE_KEYS[Math.min(i + 1, SKYLINE_KEYS.length - 1)];
  const span = b.t - a.t || 1;
  const k = Math.max(0, Math.min(1, (t - a.t) / span));
  return {
    name: k < 0.5 ? a.name : b.name,
    skyTop: lerpRGB(a.skyTop, b.skyTop, k),
    skyHor: lerpRGB(a.skyHor, b.skyHor, k),
    sun: lerpRGB(a.sun, b.sun, k),
    glow: lerpRGB(a.glow, b.glow, k),
    wFar: lerpRGB(a.wFar, b.wFar, k),
    wNear: lerpRGB(a.wNear, b.wNear, k),
    foam: lerpRGB(a.foam, b.foam, k),
    sunH: lerp(a.sunH, b.sunH, k),
    glit: lerp(a.glit, b.glit, k),
    star: lerp(a.star, b.star, k)
  };
}

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
const SKILLS_PATHS = require('./skills-paths.json');

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

function skillIcon(code, x, y, size) {
  const s = SKILLS[code]; if (!s) return '';
  const inner = size * 0.62;
  const off = (size - inner) / 2;
  const paths = SKILLS_PATHS[code] || [];
  const iconNode = paths.length
    ? `<svg x="${off}" y="${off}" width="${inner}" height="${inner}" viewBox="0 0 24 24" fill="${s.dark ? '#1a1a1a' : '#ffffff'}">
        ${paths.map(p => `<path d="${escXml(p)}"/>`).join('')}
      </svg>`
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
      weekday: d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
      day: d.getUTCDate(),
      month: d.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }),
      year: d.getUTCFullYear()
    };
  }
}

function escXml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/**
 * Validates a hex color string (3 or 6 hex chars, with or without leading #).
 * Returns the normalized "#RGB" or "#RRGGBB" string, or null if invalid.
 * This strict regex prevents any SVG / CSS injection through color params.
 * @param {string|undefined} raw
 * @returns {string|null}
 */
function parseHexColor(raw) {
  if (!raw) return null;
  const s = String(raw).trim().replace(/^#/, '');
  return /^([A-Fa-f0-9]{3}){1,2}$/.test(s) ? `#${s}` : null;
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
  const rx = p.radius;
  const bgFill = p.bgColor || th.bg;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
  const label = escXml((p.label || 'Local Time').toUpperCase()) + ' · ' + escXml(tzShort(p.timezone).toUpperCase());
  return svgWrap(W, H, `
  <defs>${shadowFilter('sh', p.shadow)}</defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${bgFill}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
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
  const rx = p.radius;
  const bgFill = p.bgColor || th.bg;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
  const W = 380, H = 110;
  const h12 = p.timeFormat === '12h';
  const h = h12 ? (parseInt(t.h, 10) % 12 || 12) : parseInt(t.h, 10);
  const hh = pad(h);
  const ampm = h12 ? (parseInt(t.h, 10) >= 12 ? 'PM' : 'AM') : '24H';
  return svgWrap(W, H, `
  <defs>${shadowFilter('sh', p.shadow)}</defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${bgFill}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
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
  const rx = p.radius;
  const bgFill = p.bgColor || th.bg;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
  const W = 260, H = 130;
  return svgWrap(W, H, `
  <defs>${shadowFilter('sh', p.shadow)}</defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${bgFill}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
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
  const rx = p.radius;
  const bgFill = p.bgColor || th.bg;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
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
  <defs>${shadowFilter('sh', p.shadow)}</defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${bgFill}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
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
  const rx = p.radius;
  const bgFill = p.bgColor || th.bg;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
  const code = (p.country || 'IN').toUpperCase();
  const name = COUNTRIES[code] || code;
  const W = 280, H = 100;
  return svgWrap(W, H, `
  <defs>${shadowFilter('sh', p.shadow)}</defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${bgFill}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
  ${flagSvg(code, 18, 34, 50, 33)}
  <text x="82" y="40" fill="${th.fg}" font-size="9" font-weight="700" letter-spacing="2" opacity="0.65">${escXml((p.label || 'Based In').toUpperCase())}</text>
  <text x="82" y="62" fill="${th.fg}" font-size="18" font-weight="700" font-family="Fraunces, Georgia, serif">${escXml(name)}</text>
  <text x="82" y="80" fill="${th.fg}" font-size="9" font-weight="700" letter-spacing="1" opacity="0.55">COUNTRY CODE · ${escXml(code)}</text>
  `);
}

function renderTimezone(p) {
  const t = getTzTime(p.timezone);
  const th = theme(p.theme);
  const rx = p.radius;
  const bgFill = p.bgColor || th.bg;
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
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${bgFill}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
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
  const rx = p.radius;
  const bgFill = p.bgColor || th.bg;
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
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${bgFill}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
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

function renderCountdown(p) {
  const th = theme(p.theme);
  const rx = p.radius;
  const bgFill = p.bgColor || th.bg;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');

  const targetStr = p.targetDate || '2026-12-31';
  const target = new Date(targetStr);
  const now = new Date();
  const diffMs = target - now;

  let days = 0, hours = 0;
  let statusText = "Event has passed! 🎉";

  if (diffMs > 0) {
    days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    statusText = `${days}d ${hours}h remaining`;
  }

  const W = 360, H = 110;
  const eventName = (p.eventName || 'Event').toUpperCase();

  return svgWrap(W, H, `
  <defs>${shadowFilter('sh', p.shadow)}</defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${bgFill}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
  <text x="20" y="34" fill="${th.fg}" font-size="9" font-weight="700" letter-spacing="2" opacity="0.65">COUNTDOWN TO</text>
  <text x="20" y="60" fill="${th.fg}" font-size="20" font-weight="800" font-family="Fraunces, Georgia, serif">${escXml(eventName)}</text>
  <text x="20" y="92" fill="${th.fg}" font-size="26" font-weight="700" font-family="'JetBrains Mono', ui-monospace, monospace">${escXml(statusText)}</text>
  `);
}

function renderMusic(p) {
  const th = theme(p.theme);
  const rx = p.radius;
  const bgFill = p.bgColor || th.bg;
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
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="${bgFill}" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
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

const AVATAR_MEMORY_CACHE = new Map();
const AVATAR_CACHE_TTL_SEC = 86400; // 24 hours

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

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function renderProfile(p) {
  const th = theme(p.theme);
  const rx = p.radius;
  const bgFill = p.bgColor || th.bg;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
  const W = 580, H = 320;

  const skillsRaw = (p.skills || 'HTML,CSS,JS,GIT,SQL,REACT,NODE,PYTHON').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  const validSkills = skillsRaw.filter(s => SKILLS[s]).slice(0, 12);

  const dataUrl = await fetchAvatarDataUrl(p.avatar);

  // Skill grid: 6 per row, up to 2 rows
  const iconSize = 30;
  const gap = 8;
  const skillsX = 220;
  const skillsY = 168;
  const skillNodes = validSkills.map((s, i) => {
    const col = i % 6, row = Math.floor(i / 6);
    return skillIcon(s, skillsX + col * (iconSize + gap), skillsY + row * (iconSize + gap), iconSize);
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
      <stop offset="0%" stop-color="${bgFill}"/>
      <stop offset="100%" stop-color="${bgFill}" stop-opacity="0.92"/>
    </linearGradient>
    <pattern id="dotsP" width="14" height="14" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="0.8" fill="${th.fg}" opacity="0.07"/>
    </pattern>
    ${shadowFilter('sh', p.shadow)}
  </defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="url(#profBg)" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="url(#dotsP)"/>

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

async function renderSkyline(p) {
  const W = 600;
  const H = p.skylineStyle === 'card' ? 340 : 220;
  const horizonY = H * 0.42;
  const oceanH = H - horizonY;
  const rx = p.radius;

  // 1. Calculate timeOfDay
  let timeOfDay = 0.6; // default GOLDEN HOUR
  let hours = 17;
  if (p.time !== undefined && p.time !== null && p.time !== '') {
    const tNum = parseFloat(p.time);
    if (!isNaN(tNum)) {
      if (tNum > 24) {
        timeOfDay = Math.max(0, Math.min(1.0, tNum / 1000));
        hours = 5 + timeOfDay * 18;
      } else {
        hours = Math.max(0, Math.min(24, tNum));
        if (hours >= 5 && hours <= 23) {
          timeOfDay = (hours - 5) / 18;
        } else {
          timeOfDay = 1.0; // Moonlit night
        }
      }
    }
  } else {
    // Determine time from timezone
    const t = getTzTime(p.timezone);
    const hr = parseInt(t.h, 10);
    const mn = parseInt(t.m, 10);
    hours = hr + mn / 60;
    if (hours >= 5 && hours <= 23) {
      timeOfDay = (hours - 5) / 18;
    } else {
      timeOfDay = 1.0; // Moonlit night
    }
  }

  const hh = Math.floor(hours) % 24;
  const mm = Math.floor((hours % 1) * 60);
  const timeStr = `${pad(hh)}:${pad(mm)}`;

  const P = getSkylinePalette(timeOfDay);

  // 2. Render background gradient and rects
  const sunX = W * 0.5;
  const sunY = horizonY - P.sunH * horizonY * 0.82;
  const glowR = Math.min(W, H) * 0.5;
  const sunR = Math.min(W, H) * 0.045;

  // Stars
  let starsSvg = '';
  if (P.star > 0.01) {
    starsSvg += `<g opacity="${P.star}">`;
    SKYLINE_STARS.forEach((s, idx) => {
      const cls = idx % 2 === 0 ? 'star' : 'star-delayed';
      starsSvg += `<circle class="${cls}" cx="${(s.x * W).toFixed(1)}" cy="${(s.y * horizonY).toFixed(1)}" r="${s.r.toFixed(2)}" fill="#ffffff"/>`;
    });
    starsSvg += `</g>`;
  }

  // Clouds
  let cloudsSvg = '';
  const cloudCol = rgb(lerpRGB(P.skyHor, [255, 255, 255], 0.25), 0.16);
  SKYLINE_CLOUDS.forEach((c) => {
    const cx = c.x * W;
    const cy = c.y * horizonY;
    const cw = c.w * W;
    for (let j = 0; j < 4; j++) {
      const rxVal = cw * (0.3 - j * 0.04);
      const ryVal = cw * 0.06;
      const ex = cx + j * cw * 0.22;
      const ey = cy + Math.sin(j) * 6;
      cloudsSvg += `<ellipse cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" rx="${rxVal.toFixed(1)}" ry="${ryVal.toFixed(1)}" fill="${cloudCol}"/>`;
    }
  });

  // Birds
  let birdsSvg = '';
  const birdCol = rgb(lerpRGB(P.skyTop, [0, 0, 0], 0.3), 0.5);
  SKYLINE_BIRDS.forEach((b, idx) => {
    const bx = b.x * W;
    const by = b.y * horizonY;
    const wing = Math.sin(idx * 1.5) * b.size * 0.4;
    birdsSvg += `<path class="bird" d="M ${(bx - b.size).toFixed(1)} ${(by + wing).toFixed(1)} Q ${bx.toFixed(1)} ${(by - b.size * 0.3).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)} Q ${bx.toFixed(1)} ${(by - b.size * 0.3).toFixed(1)} ${(bx + b.size).toFixed(1)} ${(by + wing).toFixed(1)}" stroke="${birdCol}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  });

  // Ocean swells
  let swellsSvg = '';
  const NUM_SWELLS = 16;
  const T_val = 1.2;
  for (let i = 0; i < NUM_SWELLS; i++) {
    const depth = i / (NUM_SWELLS - 1);
    const yTop = horizonY + Math.pow(depth, 1.9) * oceanH;
    const amp = lerp(0.6, 16, depth);
    const wlen = lerp(46, 260, depth);
    const speed = lerp(0.25, 0.9, depth);
    const phase = T_val * speed + i * 0.9;
    const col = rgb(lerpRGB(P.wFar, P.wNear, depth));

    let d = `M 0 ${H} L 0 ${yTop.toFixed(1)}`;
    for (let x = 0; x <= W; x += 15) {
      const y = yTop + Math.sin(x / wlen + phase) * amp + Math.sin(x / (wlen * 0.4) + phase * 1.6) * amp * 0.3;
      d += ` L ${x} ${y.toFixed(1)}`;
    }
    d += ` L ${W} ${H} Z`;
    swellsSvg += `<path d="${d}" fill="${col}"/>`;

    let dStroke = `M 0 ${(yTop + Math.sin(phase) * amp + Math.sin(phase * 1.6) * amp * 0.3).toFixed(1)}`;
    for (let x = 15; x <= W; x += 15) {
      const y = yTop + Math.sin(x / wlen + phase) * amp + Math.sin(x / (wlen * 0.4) + phase * 1.6) * amp * 0.3;
      dStroke += ` L ${x} ${y.toFixed(1)}`;
    }
    const strokeCol = rgb(lerpRGB(lerpRGB(P.wFar, P.wNear, depth), P.sun, 0.45));
    const opacity = lerp(0.05, 0.25, depth).toFixed(2);
    const strokeWidth = lerp(0.5, 1.8, depth).toFixed(1);
    swellsSvg += `<path d="${dStroke}" fill="none" stroke="${strokeCol}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`;

    if (depth > 0.62) {
      const foamA = (depth - 0.62) / 0.38;
      for (let x = 0; x <= W; x += 25) {
        const crest = Math.sin(x / wlen + phase);
        if (crest > 0.55) {
          const y = yTop + crest * amp + Math.sin(x / (wlen * 0.4) + phase * 1.6) * amp * 0.3;
          const foamOpacity = (foamA * 0.35).toFixed(2);
          swellsSvg += `<circle cx="${x}" cy="${(y - 1).toFixed(1)}" r="${lerp(1, 2.5, depth).toFixed(1)}" fill="${rgb(P.foam)}" opacity="${foamOpacity}"/>`;
        }
      }
    }
  }

  // Glitter
  let glitterSvg = '';
  let seed = 123;
  for (let i = 0; i < 60; i++) {
    const dy = seedRandom(seed++);
    const y = horizonY + Math.pow(dy, 1.5) * oceanH;
    const spread = lerp(6, W * 0.25, dy);
    const x = sunX + (seedRandom(seed++) - 0.5) * 2 * spread;
    const distFade = 1 - Math.min(1, Math.abs(x - sunX) / (spread + 1));
    const flick = 0.3 + seedRandom(seed++) * 0.7;
    const a = distFade * distFade * flick * P.glit * (1 - dy * 0.25);
    if (a < 0.02) continue;
    const len = 1 + seedRandom(seed++) * (2 + dy * 4);
    const hRect = 1 + dy;
    glitterSvg += `<rect x="${(x - len/2).toFixed(1)}" y="${y.toFixed(1)}" width="${len.toFixed(1)}" height="${hRect.toFixed(1)}" fill="${rgb(P.sun)}" opacity="${(a * 0.85).toFixed(2)}"/>`;
  }

  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : '';

  // Render overlay UI
  let overlaySvg = '';
  if (p.skylineStyle === 'banner') {
    const caption = p.label || 'Same sea — every hour a different blue.';
    overlaySvg = `
      <!-- UI HUD overlay -->
      <text x="40" y="44" fill="#ffffff" font-size="12" font-weight="700" letter-spacing="4" opacity="0.85">◑ TIDES</text>
      <text x="${W - 40}" y="36" text-anchor="end" fill="#ffffff" font-size="12" font-weight="500" letter-spacing="3" opacity="0.9">${escXml(P.name)}</text>
      <text x="${W - 40}" y="62" text-anchor="end" fill="#ffffff" font-family="Fraunces, Georgia, serif" font-size="26" font-variant-numeric="tabular-nums">${timeStr}</text>
      <text x="${W / 2}" y="${H - 40}" text-anchor="middle" fill="#ffffff" font-family="Fraunces, Georgia, serif" font-size="20" font-style="italic" opacity="0.95">${escXml(caption)}</text>
    `;
  } else {
    // Card style profile overlays
    const avatarCx = 120, avatarCy = 135, avatarR = 56;
    const dataUrl = await fetchAvatarDataUrl(p.avatar);
    const avatarBlock = dataUrl
      ? `<defs>
           <clipPath id="avClipSky"><circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}"/></clipPath>
         </defs>
         <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR + 4}" fill="#ffffff" opacity="0.15"/>
         <image href="${escXml(dataUrl)}" x="${avatarCx - avatarR}" y="${avatarCy - avatarR}" width="${avatarR*2}" height="${avatarR*2}" clip-path="url(#avClipSky)" preserveAspectRatio="xMidYMid slice"/>
         <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="none" stroke="#ffffff" stroke-width="2"/>`
      : `<circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR + 4}" fill="#ffffff" opacity="0.15"/>
         <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="#ffffff" opacity="0.18"/>
         <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="none" stroke="#ffffff" stroke-width="2"/>
         <text x="${avatarCx}" y="${avatarCy + 14}" text-anchor="middle" fill="#ffffff" font-size="38" font-weight="800" font-family="Fraunces, Georgia, serif">${escXml(initials(p.name))}</text>`;

    const bio = (p.bio || '').trim();
    const bioWords = bio.split(/\s+/);
    const bioLines = [];
    let line = '';
    for (const w of bioWords) {
      if ((line + ' ' + w).trim().length > 50) { bioLines.push(line.trim()); line = w; if (bioLines.length === 2) break; }
      else { line += ' ' + w; }
    }
    if (bioLines.length < 2 && line.trim()) bioLines.push(line.trim());

    const skillsRaw = (p.skills || 'HTML,CSS,JS,GIT,SQL,REACT,NODE,PYTHON').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const validSkills = skillsRaw.filter(s => SKILLS[s]).slice(0, 12);
    const iconSize = 28;
    const gap = 8;
    const skillsX = 240;
    const skillsY = 185;
    const skillNodes = validSkills.map((s, i) => {
      const col = i % 6, row = Math.floor(i / 6);
      return skillIcon(s, skillsX + col * (iconSize + gap), skillsY + row * (iconSize + gap), iconSize);
    }).join('');

    const handle = (p.handle || '').replace(/^@/, '').trim();

    overlaySvg = `
      <!-- Transparent Glass Panel -->
      <rect x="20" y="20" width="560" height="300" rx="12" ry="12" fill="rgba(10, 16, 28, 0.42)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1.2"/>
      
      <!-- Left side: Avatar + Role -->
      ${avatarBlock}
      <text x="${avatarCx}" y="${avatarCy + avatarR + 24}" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="700" letter-spacing="2" opacity="0.75">${escXml((p.role || 'Developer').toUpperCase())}</text>
      ${handle ? `<text x="${avatarCx}" y="${avatarCy + avatarR + 42}" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="600" opacity="0.9">@${escXml(handle)}</text>` : ''}
      
      <!-- Divider -->
      <line x1="220" y1="35" x2="220" y2="305" stroke="#ffffff" stroke-width="1" opacity="0.15"/>
      
      <!-- Right side: Bio & Info -->
      <text x="240" y="52" fill="#ffffff" font-size="9" font-weight="700" letter-spacing="2.5" opacity="0.6">HELLO, I'M</text>
      <text x="240" y="86" fill="#ffffff" font-size="28" font-weight="800" font-family="Fraunces, Georgia, serif">${escXml(p.name || 'Your Name')}</text>
      <line x1="240" y1="98" x2="290" y2="98" stroke="#ffffff" stroke-width="2" opacity="0.8"/>

      ${bioLines[0] ? `<text x="240" y="122" fill="#ffffff" font-size="11" font-weight="500" opacity="0.9">${escXml(bioLines[0])}</text>` : ''}
      ${bioLines[1] ? `<text x="240" y="140" fill="#ffffff" font-size="11" font-weight="500" opacity="0.9">${escXml(bioLines[1])}</text>` : ''}

      <!-- Skills -->
      <text x="240" y="172" fill="#ffffff" font-size="9" font-weight="700" letter-spacing="2.5" opacity="0.6">◆ SKILLS &amp; STACK</text>
      ${skillNodes}
      
      <!-- Time / Mood overlay top-right -->
      <text x="560" y="48" text-anchor="end" fill="#ffffff" font-size="9" font-weight="700" letter-spacing="2.5" opacity="0.6">${escXml(P.name)}</text>
      <text x="560" y="70" text-anchor="end" fill="#ffffff" font-family="Fraunces, Georgia, serif" font-size="18" opacity="0.85">${timeStr}</text>
    `;
  }

  const svgBody = `
    <defs>
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${rgb(P.skyTop)}"/>
        <stop offset="70%" stop-color="${rgb(lerpRGB(P.skyTop, P.skyHor, 0.55))}"/>
        <stop offset="100%" stop-color="${rgb(P.skyHor)}"/>
      </linearGradient>
      
      <radialGradient id="sunGlow" cx="${sunX}" cy="${sunY}" r="${glowR}" fx="${sunX}" fy="${sunY}" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${rgb(P.glow)}" stop-opacity="0.55"/>
        <stop offset="25%" stop-color="${rgb(P.glow)}" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="${rgb(P.glow)}" stop-opacity="0"/>
      </radialGradient>
      
      <radialGradient id="sunDisc" cx="${sunX}" cy="${sunY}" r="${sunR}" fx="${sunX}" fy="${sunY}" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="${rgb(P.sun)}" stop-opacity="1"/>
        <stop offset="70%" stop-color="${rgb(P.sun)}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="${rgb(P.sun)}" stop-opacity="0.2"/>
      </radialGradient>
      
      <linearGradient id="hazeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${rgb(P.skyHor)}" stop-opacity="0"/>
        <stop offset="50%" stop-color="${rgb(P.skyHor)}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="${rgb(P.wFar)}" stop-opacity="0"/>
      </linearGradient>
      
      <radialGradient id="skyVig" cx="50%" cy="55%" r="90%" fx="50%" fy="55%">
        <stop offset="0%" stop-color="rgba(0,0,0,0)" stop-opacity="0"/>
        <stop offset="100%" stop-color="rgba(0,0,8,0.34)" stop-opacity="1"/>
      </radialGradient>
      
      ${shadowFilter('sh', p.shadow)}
      
      <style>
        .star { animation: twinkle 3s infinite ease-in-out; }
        .star-delayed { animation: twinkle 3s infinite ease-in-out; animation-delay: 1.5s; }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .bird { animation: flap 6s infinite ease-in-out; }
        @keyframes flap {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
      </style>
    </defs>
    
    <!-- Outer Card Border & Background -->
    <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}" fill="#06080f" ${border} ${p.shadow ? 'filter="url(#sh)"' : ''}/>
    
    <!-- Clips for sky rendering inside rounded corners -->
    <g clip-path="url(#cardClip)">
      <defs>
        <clipPath id="cardClip"><rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${rx}" ry="${rx}"/></clipPath>
      </defs>
      
      <!-- Sky Fill -->
      <rect width="${W}" height="${(horizonY + 2).toFixed(1)}" fill="url(#skyGrad)"/>
      
      <!-- Stars -->
      ${starsSvg}
      
      <!-- Sun Glow -->
      <rect width="${W}" height="${(horizonY + oceanH * 0.4).toFixed(1)}" fill="url(#sunGlow)"/>
      
      <!-- Sun Disc -->
      <circle cx="${sunX}" cy="${sunY}" r="${sunR}" fill="url(#sunDisc)"/>
      
      <!-- Clouds -->
      ${cloudsSvg}
      
      <!-- Birds -->
      ${birdsSvg}
      
      <!-- Haze -->
      <rect y="${(horizonY - 40).toFixed(1)}" width="${W}" height="80" fill="url(#hazeGrad)"/>
      
      <!-- Ocean Swells -->
      ${swellsSvg}
      
      <!-- Glitter -->
      ${glitterSvg}
      
      <!-- Vignette -->
      <rect width="${W}" height="${H}" fill="url(#skyVig)"/>
      
      <!-- Overlays (Banner UI or Profile details) -->
      ${overlaySvg}
    </g>
  `;

  return svgWrap(W, H, svgBody);
}

function getMarkerColors(colName) {
  const defaultColor = { color: 'hsl(274, 27%, 88%)', darker: 'hsl(274, 27%, 68%)' };
  if (!colName) return defaultColor;
  const name = String(colName).toLowerCase().trim();
  const map = {
    red:     { color: 'hsl(13, 100%, 87%)', darker: 'hsl(13, 100%, 67%)' },
    orange:  { color: 'hsl(27, 98%, 84%)', darker: 'hsl(27, 98%, 64%)' },
    yellow:  { color: 'hsl(46, 83%, 80%)', darker: 'hsl(46, 83%, 60%)' },
    green:   { color: 'hsl(66, 45%, 79%)', darker: 'hsl(66, 45%, 59%)' },
    cyan:    { color: 'hsl(158, 47%, 83%)', darker: 'hsl(158, 47%, 63%)' },
    blue:    { color: 'hsl(199, 42%, 84%)', darker: 'hsl(199, 42%, 64%)' },
    purple:  { color: 'hsl(274, 27%, 88%)', darker: 'hsl(274, 27%, 68%)' },
    magenta: { color: 'hsl(345, 88%, 90%)', darker: 'hsl(345, 88%, 70%)' }
  };
  if (map[name]) return map[name];
  if (/^#[0-9A-Fa-f]{3,8}$/.test(name)) {
    return { color: name, darker: 'rgba(0,0,0,0.15)' };
  }
  return defaultColor;
}

function drawHighlightSvg(x, y, w, h, col) {
  const colors = getMarkerColors(col);
  return `
    <g filter="url(#marker-rough)">
      <!-- Main highlighter stroke -->
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2" ry="2" fill="${colors.color}" opacity="0.85" />
      <!-- Blob at the end -->
      <ellipse cx="${(x + w - 1).toFixed(1)}" cy="${(y + h/2).toFixed(1)}" rx="3" ry="${(h/2.3).toFixed(1)}" fill="${colors.darker}" opacity="0.45" transform="rotate(15, ${(x + w - 1).toFixed(1)}, ${(y + h/2).toFixed(1)})" />
    </g>
  `;
}

function parseHighlightedText(str, defaultColorName) {
  const regex = /<mark(?:\s+color=["']([^"']+)["']|\s+style=["']--color:\s*([^"';]+)["']|[^>]*?)>([\s\S]*?)<\/mark>/gi;
  const segments = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        text: str.substring(lastIndex, match.index),
        highlight: false
      });
    }
    const colorAttr = match[1] || match[2] || defaultColorName;
    segments.push({
      text: match[3],
      highlight: true,
      color: colorAttr
    });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < str.length) {
    segments.push({
      text: str.substring(lastIndex),
      highlight: false
    });
  }
  return segments;
}

function renderSegmentedText(text, defaultColor, fontSize, yCoord, className, marginX, initialXOffset) {
  const charWidth = fontSize * 0.6; 
  const highlightH = fontSize * 1.35;
  const highlightYOffset = fontSize * 0.95;
  
  const hasTags = /<mark/i.test(text);
  let segments;
  if (hasTags) {
    segments = parseHighlightedText(text, defaultColor);
  } else {
    segments = [{
      text: text,
      highlight: className === 'm-title',
      color: defaultColor
    }];
  }

  let highlightsSvg = '';
  let textSpansSvg = '';
  let currentX = marginX + initialXOffset;

  segments.forEach(seg => {
    const segWidth = seg.text.length * charWidth;
    if (seg.highlight && seg.text.trim().length > 0) {
      highlightsSvg += drawHighlightSvg(currentX - 2, yCoord - highlightYOffset, segWidth + 4, highlightH, seg.color || defaultColor);
    }
    textSpansSvg += `<tspan x="${currentX.toFixed(1)}" font-weight="${seg.highlight ? '800' : (className === 'm-title' ? '800' : '500')}">${escXml(seg.text)}</tspan>`;
    currentX += segWidth;
  });

  return {
    highlights: highlightsSvg,
    text: `<text y="${yCoord}" class="${className}">${textSpansSvg}</text>`
  };
}

function getWordSegments(text, defaultColor) {
  const segments = parseHighlightedText(text, defaultColor);
  const wordSegments = [];
  segments.forEach(seg => {
    const parts = seg.text.split(/(\s+)/);
    parts.forEach(p => {
      if (p.length > 0) {
        wordSegments.push({
          text: p,
          highlight: seg.highlight,
          color: seg.color
        });
      }
    });
  });
  return wordSegments;
}

function wrapSegmentsToLines(wordSegments, maxChars) {
  const lines = [];
  let currentLine = [];
  let currentLen = 0;
  
  wordSegments.forEach(ws => {
    const isSpace = /^\s+$/.test(ws.text);
    const segmentLen = ws.text.length;
    
    if (isSpace) {
      if (currentLen > 0 && currentLen + segmentLen <= maxChars) {
        currentLine.push(ws);
        currentLen += segmentLen;
      }
      return;
    }
    
    if (currentLen > 0 && currentLen + segmentLen > maxChars) {
      while (currentLine.length > 0 && /^\s+$/.test(currentLine[currentLine.length - 1].text)) {
        const last = currentLine.pop();
        currentLen -= last.text.length;
      }
      lines.push(currentLine);
      currentLine = [ws];
      currentLen = segmentLen;
    } else {
      currentLine.push(ws);
      currentLen += segmentLen;
    }
  });
  
  if (currentLine.length > 0) {
    while (currentLine.length > 0 && /^\s+$/.test(currentLine[currentLine.length - 1].text)) {
      currentLine.pop();
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
  }
  
  return lines;
}

function mergeConsecutiveSegments(segments) {
  if (segments.length === 0) return [];
  const merged = [];
  let current = { ...segments[0] };
  for (let i = 1; i < segments.length; i++) {
    const next = segments[i];
    if (current.highlight === next.highlight && current.color === next.color) {
      current.text += next.text;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
}

function renderSegments(segments, defaultColor, fontSize, yCoord, className, marginX, initialXOffset) {
  const mergedSegments = mergeConsecutiveSegments(segments);
  const charWidth = fontSize * 0.6; 
  const highlightH = fontSize * 1.35;
  const highlightYOffset = fontSize * 0.95;

  let highlightsSvg = '';
  let textSpansSvg = '';
  let currentX = marginX + initialXOffset;

  mergedSegments.forEach(seg => {
    const segWidth = seg.text.length * charWidth;
    if (seg.highlight && seg.text.trim().length > 0) {
      highlightsSvg += drawHighlightSvg(currentX - 2, yCoord - highlightYOffset, segWidth + 4, highlightH, seg.color || defaultColor);
    }
    textSpansSvg += `<tspan x="${currentX.toFixed(1)}" font-weight="${seg.highlight ? '800' : (className === 'm-title' ? '800' : '500')}">${escXml(seg.text)}</tspan>`;
    currentX += segWidth;
  });

  return {
    highlights: highlightsSvg,
    text: `<text y="${yCoord}" class="${className}">${textSpansSvg}</text>`
  };
}

async function renderMarker(p) {
  const isCard = p.markerStyle === 'card';
  const W = 600;
  const H = isCard ? 340 : 200;
  const rx = p.radius || 10;
  const col = p.markerColor || 'purple';

  const uid = 'm_' + Math.random().toString(36).slice(2, 7);

  // Ruled lines and vertical margin line
  let ruledLines = '';
  const startY = 32;
  const lineGap = 24;
  const marginX = isCard ? 190 : 50;

  for (let y = startY; y < H; y += lineGap) {
    ruledLines += `<line x1="${marginX}" y1="${y}" x2="${W}" y2="${y}" stroke="#c0d0e8" stroke-width="0.8" />`;
  }

  // Displacement filter and styles
  const filterAndStyle = `
    <defs>
      <filter id="marker-rough" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04 0.08" numOctaves="4" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <clipPath id="cardClipMarker_${uid}">
        <rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="${rx}" ry="${rx}" />
      </clipPath>
      <style>
        .m-title { font-family: 'DM Mono', 'JetBrains Mono', monospace; font-size: 26px; font-weight: 800; fill: #111111; }
        .m-subtitle { font-family: 'DM Mono', 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; fill: #333333; }
        .m-role { font-family: 'DM Mono', 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; fill: #444444; letter-spacing: 1.5px; }
        .m-handle { font-family: 'DM Mono', 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; fill: #222222; }
        .m-body { font-family: 'DM Mono', 'JetBrains Mono', monospace; font-size: 12px; font-weight: 500; fill: #333333; }
        .m-header { font-family: 'DM Mono', 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; fill: #555555; letter-spacing: 2.5px; }
      </style>
      ${shadowFilter('sh', p.shadow)}
    </defs>
  `;

  let innerContent = '';

  if (!isCard) {
    // BANNER LAYOUT
    const titleText = p.label || p.name || 'HELLO, WORLD!';
    const subText = p.bio || p.role || 'Highlighter & sketchbook theme.';
    
    const titleRender = renderSegmentedText(titleText, col, 26, 81, 'm-title', marginX, 30);
    const subRender = renderSegmentedText(subText, col, 14, 123, 'm-subtitle', marginX, 30);

    innerContent = `
      <!-- Ruled lines pattern -->
      ${ruledLines}
      <line x1="${marginX}" y1="4" x2="${marginX}" y2="${H - 4}" stroke="#f0a0a0" stroke-width="1.2" />

      <!-- Highlights -->
      ${titleRender.highlights}
      ${subRender.highlights}

      <!-- Text elements -->
      ${titleRender.text}
      ${subRender.text}

      <!-- Sketchy star decoration in top-right -->
      <path d="M 520,30 L 525,45 L 540,45 L 528,55 L 533,70 L 520,60 L 507,70 L 512,55 L 500,45 L 515,45 Z" fill="none" stroke="#888888" stroke-width="1.5" filter="url(#marker-rough)" opacity="0.6" transform="rotate(15 520 50)"/>
    `;
  } else {
    // CARD LAYOUT (PROFILE CARD)
    const avatarCx = 95, avatarCy = 110, avatarR = 50;
    const dataUrl = await fetchAvatarDataUrl(p.avatar);
    
    const avatarBlock = dataUrl
      ? `<defs>
           <clipPath id="avClipMarker_${uid}"><rect x="${avatarCx - avatarR}" y="${avatarCy - avatarR}" width="${avatarR*2}" height="${avatarR*2}"/></clipPath>
         </defs>
         <image href="${escXml(dataUrl)}" x="${avatarCx - avatarR}" y="${avatarCy - avatarR}" width="${avatarR*2}" height="${avatarR*2}" clip-path="url(#avClipMarker_${uid})" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect x="${avatarCx - avatarR}" y="${avatarCy - avatarR}" width="${avatarR*2}" height="${avatarR*2}" fill="#e8e5e0"/>
         <text x="${avatarCx}" y="${avatarCy + 10}" text-anchor="middle" fill="#555555" font-size="28" font-weight="800" font-family="'DM Mono', monospace">${escXml(initials(p.name))}</text>`;

    const handle = (p.handle || '').replace(/^@/, '').trim();
    
    // Bio lines sitting on ruled lines (lines are y=128, 152, 176)
    const bio = (p.bio || '').trim();
    const bioWordSegments = getWordSegments(bio, col);
    const bioLinesSegments = wrapSegmentsToLines(bioWordSegments, 36).slice(0, 2);

    // Skills
    const skillsRaw = (p.skills || 'HTML,CSS,JS,GIT,SQL,REACT,NODE,PYTHON').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const validSkills = skillsRaw.filter(s => SKILLS[s]).slice(0, 8);
    const iconSize = 26;
    const gap = 6;
    const skillsX = marginX + 25;
    const skillsY = 245;
    const skillNodes = validSkills.map((s, i) => {
      const colIdx = i % 8;
      return skillIcon(s, skillsX + colIdx * (iconSize + gap), skillsY, iconSize);
    }).join('');

    const nameText = p.name || 'Your Name';
    
    const nameRender = renderSegmentedText(nameText, col, 28, 81, 'm-title', marginX, 25);
    const bioLine1Render = bioLinesSegments[0] ? renderSegments(bioLinesSegments[0], col, 12, 122, 'm-body', marginX, 25) : { highlights: '', text: '' };
    const bioLine2Render = bioLinesSegments[1] ? renderSegments(bioLinesSegments[1], col, 12, 146, 'm-body', marginX, 25) : { highlights: '', text: '' };

    innerContent = `
      <!-- Ruled lines pattern -->
      ${ruledLines}
      <line x1="${marginX}" y1="4" x2="${marginX}" y2="${H - 4}" stroke="#f0a0a0" stroke-width="1.2" />

      <!-- Left Panel: Polaroid Avatar Frame -->
      <g filter="url(#marker-rough)" transform="rotate(-3 95 120)">
        <!-- Polaroid border background -->
        <rect x="40" y="45" width="110" height="130" fill="#ffffff" stroke="#555555" stroke-width="1.2" />
        <!-- Actual avatar -->
        ${avatarBlock}
        <!-- Polaroid border outline on top of avatar -->
        <rect x="45" y="50" width="100" height="100" fill="none" stroke="#555555" stroke-width="1.2" />
      </g>
      <!-- Washi tape on Polaroid top -->
      <rect x="75" y="26" width="40" height="15" fill="${getMarkerColors(col).color}" opacity="0.65" transform="rotate(-12 95 33)" filter="url(#marker-rough)" />

      <!-- Left Panel metadata -->
      <text x="${avatarCx}" y="212" text-anchor="middle" class="m-role">${escXml((p.role || 'Developer').toUpperCase())}</text>
      ${handle ? `<text x="${avatarCx}" y="230" text-anchor="middle" class="m-handle">@${escXml(handle)}</text>` : ''}

      <!-- Sketchy smiley doodle in bottom-left corner -->
      <g stroke="#999999" stroke-width="1.5" fill="none" opacity="0.5" filter="url(#marker-rough)" transform="translate(80, 255) scale(0.9)">
        <circle cx="15" cy="15" r="12"/>
        <circle cx="11" cy="11" r="1" fill="#999999"/>
        <circle cx="19" cy="11" r="1" fill="#999999"/>
        <path d="M 10,17 Q 15,21 20,17"/>
      </g>

      <!-- Right Panel: Name & Highlights -->
      <text x="${marginX + 25}" y="48" class="m-header">HELLO, I'M</text>
      ${nameRender.highlights}
      <g style="font-family: Georgia, serif;">
        ${nameRender.text}
      </g>

      <!-- Bio lines aligned to ruled page lines (baselines at 122, 146, 170) -->
      ${bioLine1Render.highlights}
      ${bioLine1Render.text}
      ${bioLine2Render.highlights}
      ${bioLine2Render.text}

      <!-- Skills Section -->
      <text x="${marginX + 25}" y="222" class="m-header">◆ SKILLS &amp; STACK</text>
      <rect x="${marginX + 25}" y="226" width="120" height="4" fill="${getMarkerColors(col).color}" opacity="0.75" filter="url(#marker-rough)" />
      ${skillNodes}
    `;
  }

  const svgBody = `
    ${filterAndStyle}
    <!-- Sketchy cream card background -->
    <rect x="4" y="4" width="${W - 8}" height="${H - 8}" rx="${rx}" ry="${rx}" fill="#faf8f5" stroke="#333333" stroke-width="2" filter="url(#marker-rough)" ${p.shadow ? 'filter="url(#sh)"' : ''}/>
    
    <g clip-path="url(#cardClipMarker_${uid})">
      ${innerContent}
    </g>
  `;

  return svgWrap(W, H, svgBody);
}

const GLASS_THEMES = {
  liquid: {
    bgGrad: `
      <linearGradient id="glassBgGrad_\${uid}" x1="0%" y1="0%" x2="60%" y2="100%">
        <stop offset="0%" stop-color="#1a3fa0" />
        <stop offset="35%" stop-color="#2d6fd4" />
        <stop offset="70%" stop-color="#5b8cdb" />
        <stop offset="100%" stop-color="#e8dbc8" />
      </linearGradient>
    `,
    tint: '#8cdbeb',
    tintOpacity: 0.15,
    accent: '#8cdbeb',
    waves: ['#5b8cdb', '#8cdbeb'],
    titleColor: '#ffffff',
    textColor: '#e0e8ff',
    cardPanelColor: 'rgba(255,255,255,0.06)'
  },
  coral: {
    bgGrad: `
      <linearGradient id="glassBgGrad_\${uid}" x1="0%" y1="0%" x2="60%" y2="100%">
        <stop offset="0%" stop-color="#301040" />
        <stop offset="35%" stop-color="#8c3399" />
        <stop offset="70%" stop-color="#ff7a5a" />
        <stop offset="100%" stop-color="#ffe4d6" />
      </linearGradient>
    `,
    tint: '#ff9e85',
    tintOpacity: 0.15,
    accent: '#ff7a5a',
    waves: ['#ff7a5a', '#ffd085'],
    titleColor: '#ffffff',
    textColor: '#ffe0db',
    cardPanelColor: 'rgba(255,255,255,0.06)'
  },
  emerald: {
    bgGrad: `
      <linearGradient id="glassBgGrad_\${uid}" x1="0%" y1="0%" x2="60%" y2="100%">
        <stop offset="0%" stop-color="#0b3c5d" />
        <stop offset="35%" stop-color="#187498" />
        <stop offset="70%" stop-color="#62d2a2" />
        <stop offset="100%" stop-color="#e6f9f0" />
      </linearGradient>
    `,
    tint: '#a3f3d2',
    tintOpacity: 0.15,
    accent: '#62d2a2',
    waves: ['#62d2a2', '#a3f3d2'],
    titleColor: '#ffffff',
    textColor: '#e1fbf0',
    cardPanelColor: 'rgba(255,255,255,0.06)'
  },
  aurora: {
    bgGrad: `
      <linearGradient id="glassBgGrad_\${uid}" x1="0%" y1="0%" x2="60%" y2="100%">
        <stop offset="0%" stop-color="#111019" />
        <stop offset="35%" stop-color="#095a55" />
        <stop offset="70%" stop-color="#3c1053" />
        <stop offset="100%" stop-color="#0d0b21" />
      </linearGradient>
    `,
    tint: '#a6ff85',
    tintOpacity: 0.12,
    accent: '#39ff14',
    waves: ['#39ff14', '#bd00ff'],
    titleColor: '#ffffff',
    textColor: '#f0e0ff',
    cardPanelColor: 'rgba(255,255,255,0.04)'
  }
};

function getGlassTheme(themeName, uid) {
  const defaultTheme = GLASS_THEMES.liquid;
  if (!themeName) return defaultTheme;
  const name = String(themeName).toLowerCase().trim();
  if (GLASS_THEMES[name]) return GLASS_THEMES[name];

  if (/^#[0-9A-Fa-f]{3,8}$/.test(name)) {
    return {
      bgGrad: `
        <linearGradient id="glassBgGrad_${uid}" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stop-color="#0d0d12" />
          <stop offset="50%" stop-color="${name}" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.2" />
        </linearGradient>
      `,
      tint: name,
      tintOpacity: 0.15,
      accent: name,
      waves: [name, '#ffffff'],
      titleColor: '#ffffff',
      textColor: '#e0e0e0',
      cardPanelColor: 'rgba(255,255,255,0.05)'
    };
  }
  return defaultTheme;
}

async function renderGlass(p) {
  const isCard = p.glassStyle === 'card';
  const W = 600;
  const H = isCard ? 340 : 200;
  const rx = p.radius || 10;
  const col = p.glassColor || 'liquid';

  const uid = 'gl_' + Math.random().toString(36).slice(2, 7);
  const theme = getGlassTheme(col, uid);

  let contentBlock = '';

  if (!isCard) {
    // BANNER LAYOUT
    const titleText = p.label || p.name || 'HELLO, WORLD!';
    const subText = p.bio || p.role || 'Liquid Glass Metaballs Theme';
    
    contentBlock = `
      <text x="300" y="85" text-anchor="middle" class="g-title">${escXml(titleText)}</text>
      <text x="300" y="130" text-anchor="middle" class="g-subtitle">${escXml(subText)}</text>
    `;
  } else {
    // CARD LAYOUT (PROFILE CARD)
    const avatarCx = 105, avatarCy = 140, avatarR = 45;
    const dataUrl = await fetchAvatarDataUrl(p.avatar);
    
    const avatarBlock = dataUrl
      ? `<defs>
           <clipPath id="avClipGlass_${uid}"><circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}"/></clipPath>
         </defs>
         <image href="${escXml(dataUrl)}" x="${avatarCx - avatarR}" y="${avatarCy - avatarR}" width="${avatarR*2}" height="${avatarR*2}" clip-path="url(#avClipGlass_${uid})" preserveAspectRatio="xMidYMid slice"/>`
      : `<circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="rgba(255,255,255,0.1)"/>
         <text x="${avatarCx}" y="${avatarCy + 8}" text-anchor="middle" fill="#ffffff" font-size="24" font-weight="700" font-family="'Space Grotesk', sans-serif">${escXml(initials(p.name))}</text>`;

    const handle = (p.handle || '').replace(/^@/, '').trim();
    
    const bio = (p.bio || '').trim();
    const bioWords = bio.split(/\s+/g);
    const bioLines = [];
    let currentLine = '';
    for (const w of bioWords) {
      if ((currentLine + ' ' + w).trim().length > 34) {
        bioLines.push(currentLine.trim());
        currentLine = w;
        if (bioLines.length === 2) break;
      } else {
        currentLine += ' ' + w;
      }
    }
    if (bioLines.length < 2 && currentLine.trim()) bioLines.push(currentLine.trim());

    const skillsRaw = (p.skills || 'HTML,CSS,JS,GIT,SQL,REACT,NODE,PYTHON').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    const validSkills = skillsRaw.filter(s => SKILLS[s]).slice(0, 8);
    const iconSize = 26;
    const gap = 6;
    const skillsX = 185;
    const skillsY = 232;
    const skillNodes = validSkills.map((s, i) => {
      const colIdx = i % 8;
      return skillIcon(s, skillsX + colIdx * (iconSize + gap), skillsY, iconSize);
    }).join('');

    contentBlock = `
      <!-- Glassmorphic panel -->
      <rect x="25" y="25" width="550" height="290" rx="15" ry="15" fill="${theme.cardPanelColor}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
      
      <!-- Avatar with glowing border -->
      ${avatarBlock}
      <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="none" stroke="${theme.accent}" stroke-width="2.5" opacity="0.8" />
      
      <!-- Role & Handle -->
      <text x="${avatarCx}" y="210" text-anchor="middle" class="g-role">${escXml((p.role || 'Developer').toUpperCase())}</text>
      ${handle ? `<text x="${avatarCx}" y="232" text-anchor="middle" class="g-handle">@${escXml(handle)}</text>` : ''}
      
      <!-- Name, Bio, Skills -->
      <text x="185" y="65" class="g-header">HELLO, I'M</text>
      <text x="185" y="100" class="g-title">${escXml(p.name || 'Your Name')}</text>
      
      ${bioLines[0] ? `<text x="185" y="140" class="g-body">${escXml(bioLines[0])}</text>` : ''}
      ${bioLines[1] ? `<text x="185" y="162" class="g-body">${escXml(bioLines[1])}</text>` : ''}
      
      <text x="185" y="215" class="g-header">◆ SKILLS &amp; STACK</text>
      <g>
        ${skillNodes}
      </g>
    `;
  }

  const filterAndStyle = `
    <defs>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700&amp;family=Space+Grotesk:wght@500;700&amp;display=swap');
        .g-title { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; fill: ${theme.titleColor}; }
        .g-subtitle { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 500; fill: ${theme.textColor}; opacity: 0.8; }
        .g-header { font-family: 'Space Grotesk', sans-serif; font-size: 9px; font-weight: 700; fill: ${theme.accent}; letter-spacing: 2.5px; text-transform: uppercase; }
        .g-body { font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; fill: ${theme.textColor}; opacity: 0.85; }
        .g-role { font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700; fill: ${theme.accent}; letter-spacing: 1.5px; text-transform: uppercase; }
        .g-handle { font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 500; fill: ${theme.textColor}; opacity: 0.7; }
        .g-wave { animation: float-wave_${uid} 15s infinite ease-in-out; transform-origin: center; }
        @keyframes float-wave_${uid} {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(25px, -20px) scale(1.05); }
        }
      </style>
      ${theme.bgGrad}
      <!-- Gooey filter for metaballs -->
      <filter id="goo_${uid}">
        <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur" />
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -9" result="goo" />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
      <!-- Refraction displacement map -->
      <filter id="refract_${uid}" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <!-- Soft blur filter for specular highlights -->
      <filter id="softBlur_${uid}">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <!-- Outer card clip path -->
      <clipPath id="cardClipGlass_${uid}">
        <rect x="0" y="0" width="${W}" height="${H}" rx="${rx}" ry="${rx}" />
      </clipPath>
      <!-- Clip path for the gooey glass metaballs -->
      <clipPath id="glassClip_${uid}">
        <g filter="url(#goo_${uid})">
          <g>
            <animateTransform attributeName="transform" type="translate" values="0,0; 30,20; -15,30; 0,0" dur="14s" repeatCount="indefinite" />
            <circle cx="240" cy="90" r="45" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="translate" values="0,0; -45,25; 20,-20; 0,0" dur="18s" repeatCount="indefinite" />
            <circle cx="430" cy="150" r="55" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="translate" values="0,0; 25,-25; -20,15; 0,0" dur="12s" repeatCount="indefinite" />
            <circle cx="150" cy="180" r="35" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="translate" values="0,0; -15,35; 25,-15; 0,0" dur="16s" repeatCount="indefinite" />
            <circle cx="480" cy="80" r="42" />
          </g>
        </g>
      </clipPath>
    </defs>
  `;

  const svgBody = `
    ${filterAndStyle}
    <g clip-path="url(#cardClipGlass_${uid})">
      <!-- Background canvas fill -->
      <rect width="${W}" height="${H}" fill="url(#glassBgGrad_${uid})" />
      
      <!-- Floating waves -->
      <circle cx="520" cy="50" r="130" fill="${theme.waves[0]}" opacity="0.32" class="g-wave" filter="url(#softBlur_${uid})" />
      <circle cx="80" cy="270" r="170" fill="${theme.waves[1]}" opacity="0.25" class="g-wave" filter="url(#softBlur_${uid})" />
      
      <!-- Normal (Background) Content layer -->
      <g id="content_${uid}">
        ${contentBlock}
      </g>
      
      <!-- Refracted (Glass Clip) layer -->
      <g clip-path="url(#glassClip_${uid})">
        <!-- Displace background and text inside glass to simulate refraction -->
        <rect width="${W}" height="${H}" fill="url(#glassBgGrad_${uid})" />
        <circle cx="520" cy="50" r="130" fill="${theme.waves[0]}" opacity="0.32" class="g-wave" filter="url(#softBlur_${uid})" />
        <circle cx="80" cy="270" r="170" fill="${theme.waves[1]}" opacity="0.25" class="g-wave" filter="url(#softBlur_${uid})" />
        <use href="#content_${uid}" filter="url(#refract_${uid})" />
        
        <!-- Glass Tint fill overlay -->
        <rect width="${W}" height="${H}" fill="${theme.tint}" opacity="${theme.tintOpacity}" />
      </g>
      
      <!-- Gooey Glass White Borders outline -->
      <g filter="url(#goo_${uid})" opacity="0.26">
        <g fill="none" stroke="#ffffff" stroke-width="2">
          <g>
            <animateTransform attributeName="transform" type="translate" values="0,0; 30,20; -15,30; 0,0" dur="14s" repeatCount="indefinite" />
            <circle cx="240" cy="90" r="45" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="translate" values="0,0; -45,25; 20,-20; 0,0" dur="18s" repeatCount="indefinite" />
            <circle cx="430" cy="150" r="55" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="translate" values="0,0; 25,-25; -20,15; 0,0" dur="12s" repeatCount="indefinite" />
            <circle cx="150" cy="180" r="35" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="translate" values="0,0; -15,35; 25,-15; 0,0" dur="16s" repeatCount="indefinite" />
            <circle cx="480" cy="80" r="42" />
          </g>
        </g>
      </g>
      
      <!-- Specular Highlights (glass reflections moving in sync) -->
      <g opacity="0.85">
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0; 30,20; -15,30; 0,0" dur="14s" repeatCount="indefinite" />
          <circle cx="225" cy="75" r="7" fill="#ffffff" opacity="0.45" filter="url(#softBlur_${uid})" />
        </g>
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0; -45,25; 20,-20; 0,0" dur="18s" repeatCount="indefinite" />
          <circle cx="410" cy="130" r="9" fill="#ffffff" opacity="0.45" filter="url(#softBlur_${uid})" />
        </g>
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0; 25,-25; -20,15; 0,0" dur="12s" repeatCount="indefinite" />
          <circle cx="138" cy="168" r="5" fill="#ffffff" opacity="0.45" filter="url(#softBlur_${uid})" />
        </g>
        <g>
          <animateTransform attributeName="transform" type="translate" values="0,0; -15,35; 25,-15; 0,0" dur="16s" repeatCount="indefinite" />
          <circle cx="466" cy="66" r="7" fill="#ffffff" opacity="0.45" filter="url(#softBlur_${uid})" />
        </g>
      </g>
    </g>
  `;

  return svgWrap(W, H, svgBody);
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

const CSS_COLOR_NAMES = new Set([
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
  'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue',
  'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen', 'darkgrey', 'darkkhaki', 'darkmagenta',
  'darkolivegreen', 'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen',
  'darkslateblue', 'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet',
  'deeppink', 'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue', 'firebrick', 'floralwhite',
  'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray', 'green',
  'greenyellow', 'grey', 'honeydew', 'hotpink', 'indianred', 'indigo', 'ivory', 'khaki',
  'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral',
  'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightgrey', 'lightpink',
  'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightslategrey',
  'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon',
  'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen',
  'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue',
  'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab',
  'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise',
  'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple',
  'rebeccapurple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown',
  'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey',
  'snow', 'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'transparent',
  'turquoise', 'violet', 'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen'
]);

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{3,4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;

function validateBorderColor(color) {
  if (!color) return '';
  const trimmed = String(color).trim();
  if (CSS_COLOR_NAMES.has(trimmed.toLowerCase()) || HEX_COLOR_REGEX.test(trimmed)) {
    return trimmed;
  }
  return '';
}

function normalizeParams(q) {
 // Configurable limits for Profile Card fields
  const MAX_LENGTHS = {
    name: 24,
    role: 30,
    bio: 70
  };

  // Helper utility to truncate strings defensively, ignoring HTML markup tags
  const truncateHtml = (str, maxVisible) => {
    if (!str) return '';
    const stringVal = String(str).trim();
    
    // Parse tag segments and text segments
    const regex = /<mark(?:\s+color=["']([^"']+)["']|\s+style=["']--color:\s*([^"';]+)["']|[^>]*?)>([\s\S]*?)<\/mark>/gi;
    const segments = [];
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(stringVal)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          text: stringVal.substring(lastIndex, match.index),
          isTag: false
        });
      }
      segments.push({
        text: match[3],
        isTag: true,
        tagStart: match[0].substring(0, match[0].indexOf(match[3])),
        tagEnd: '</mark>'
      });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < stringVal.length) {
      segments.push({
        text: stringVal.substring(lastIndex),
        isTag: false
      });
    }
    
    let visibleLen = 0;
    let result = '';
    let truncated = false;
    
    for (const seg of segments) {
      if (visibleLen + seg.text.length > maxVisible) {
        const allowed = maxVisible - visibleLen;
        const truncatedText = seg.text.substring(0, allowed);
        if (seg.isTag) {
          result += seg.tagStart + truncatedText + seg.tagEnd;
        } else {
          result += truncatedText;
        }
        truncated = true;
        break;
      } else {
        if (seg.isTag) {
          result += seg.tagStart + seg.text + seg.tagEnd;
        } else {
          result += seg.text;
        }
        visibleLen += seg.text.length;
      }
    }
    
    if (truncated) {
      result = result.trim() + '...';
    }
    return result;
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
    skylineStyle: q.skylineStyle || 'banner',
    markerStyle: q.markerStyle || 'banner',
    markerColor: q.markerColor || 'purple',
    glassStyle:  q.glassStyle || 'banner',
    glassColor:  q.glassColor || 'liquid',
    time:         q.time !== undefined && q.time !== null ? String(q.time).trim() : '',
    showSeconds: normalizeBool(q.showSeconds, true),
    showDate:    normalizeBool(q.showDate, true),
    showDay:     normalizeBool(q.showDay, true),
    label:       q.label || '',
    radius:      Math.min(24, Math.max(0, parseInt(q.radius, 10) || 0)),
    shadow:      normalizeBool(q.shadow, false),
    // bgColor: validated hex override for SVG background fill; null = use theme default
    bgColor:     parseHexColor(q.bgColor),
    // borderColor: accepts CSS named colors OR hex (via PR #34's validateBorderColor); empty = use theme default
    borderColor: validateBorderColor(q.borderColor),
    country:     q.country || 'IN',
    quoteCategory: q.quoteCategory || 'programming',
    clockStyle:  q.clockStyle || 'digital',
    startDate:   (() => {
      const raw = q.startDate || '2024-01-01';
      return isNaN(new Date(raw).getTime()) ? '2024-01-01' : raw;
    })(),
    unit:        q.unit || 'days',
    customLabel: q.customLabel || 'Coding Streak',
    platform:    finalPlatform,
    musicSong:   q.musicSong || 'Tum Hi Ho',
    musicArtist: q.musicArtist || 'Arijit Singh',
    musicGenre:  q.musicGenre || 'Bollywood',
    musicListen: q.musicListen || 'Now Playing',
    musicPlatform: finalMusicPlatform,
    avatar:      q.avatar || '',

    eventName:   truncateStr(q.eventName || 'Hacktoberfest', 24),
    targetDate:  q.targetDate || '2026-12-31',

    // Target fields wrapped securely with truncation defense hooks:
    name:        truncateHtml(q.name || 'Your Name', MAX_LENGTHS.name),
    role:        truncateHtml(q.role || 'Developer', MAX_LENGTHS.role),
    bio:         truncateHtml(q.bio || 'Building cool things with code. Open-source enthusiast.', MAX_LENGTHS.bio),

    skills:      q.skills || 'HTML,CSS,JS,GIT,SQL,REACT,NODE,PYTHON',
    handle:      q.handle || '',
    bookPlatform: q.bookPlatform || 'goodreads',
    bookUsername: q.bookUsername || '',
    bookStatus:   q.bookStatus || 'currently-reading'
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
    case 'timezone': return renderTimezone(p);
    case 'streak':   return renderStreak(p);
    case 'music':    return renderMusic(p);
    case 'profile':  return await renderProfile(p);
    case 'skyline':  return await renderSkyline(p);
    case 'marker':   return await renderMarker(p);
    case 'glass':    return await renderGlass(p);
    case 'countdown': return renderCountdown(p);
    case 'book':     return await renderBook(p);
    default:
      return svgWrap(320, 60, `
        <rect x="1" y="1" width="318" height="58" fill="#1a1a1a" stroke="#c8402c" stroke-width="2"/>
        <text x="20" y="36" fill="#f4f1ea" font-size="13" font-weight="700">Unknown widget: ${escXml(type)}</text>
      `);
  }
}

function fetchText(urlStr) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const lib = u.protocol === 'https:' ? require('node:https') : require('node:http');
      const req = lib.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(fetchText(new URL(res.headers.location, urlStr).toString()));
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', () => resolve(null));
      req.setTimeout(5000, () => { req.destroy(); resolve(null); });
    } catch {
      resolve(null);
    }
  });
}

async function fetchBook(username, status) {
  if (!username) return null;
  const shelf = status || 'currently-reading';
  const xml = await fetchText(`https://www.goodreads.com/review/list_rss/${username}?shelf=${shelf}`);
  if (!xml) return null;

  const itemMatch = xml.match(/<item>([\\s\\S]*?)<\\/item>/);
  if (!itemMatch) return null;
  const item = itemMatch[1];

  const titleMatch = item.match(/<title><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/title>/) || item.match(/<title>([\\s\\S]*?)<\\/title>/);
  const authorMatch = item.match(/<author_name><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/author_name>/) || item.match(/<author_name>([\\s\\S]*?)<\\/author_name>/);
  const imgMatch = item.match(/<book_image_url><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/book_image_url>/) || item.match(/<book_image_url>([\\s\\S]*?)<\\/book_image_url>/);

  if (!titleMatch) return null;

  const title = titleMatch[1].trim();
  const author = authorMatch ? authorMatch[1].trim() : 'Unknown';
  let imageUrl = imgMatch ? imgMatch[1].trim() : '';
  
  if (imageUrl && imageUrl.startsWith('http:')) {
    imageUrl = imageUrl.replace('http:', 'https:');
  }

  let coverB64 = '';
  if (imageUrl) {
    coverB64 = await fetchAvatarDataUrl(imageUrl, 3000);
  }

  return { title, author, cover: coverB64 };
}

async function renderBook(p) {
  const theme = themeObj(p.theme);
  const borderStyle = theme.border ? `stroke="${theme.fg}" stroke-width="2"` : '';
  const username = p.bookUsername;
  const status = p.bookStatus || 'currently-reading';

  const bookData = await fetchBook(username, status);
  
  const statusLabel = status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const title = bookData ? escXml(truncateStr(bookData.title, 40)) : 'No book found';
  const author = bookData ? escXml(truncateStr(bookData.author, 30)) : 'Or invalid username';

  const defaultCover = `<svg viewBox="0 0 24 24" width="60" height="90" fill="none" stroke="${theme.fg}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`;
  
  const coverSvg = bookData && bookData.cover 
    ? `<image href="${bookData.cover}" x="15" y="20" width="60" height="90" preserveAspectRatio="xMidYMid slice" clip-path="url(#coverClip)"/>` 
    : `<g transform="translate(15, 20)">${defaultCover}</g>`;

  return svgWrap(340, 130, `
    <defs>
      <clipPath id="coverClip">
        <rect x="15" y="20" width="60" height="90" rx="4" ry="4"/>
      </clipPath>
    </defs>
    <rect x="1" y="1" width="338" height="128" rx="${p.radius||0}" ry="${p.radius||0}" fill="${p.bgColor||theme.bg}" ${borderStyle}/>
    ${coverSvg}
    <text x="90" y="35" fill="${theme.fg}" font-size="10" font-weight="700" letter-spacing="2" opacity="0.65" font-family="'JetBrains Mono',monospace">${escXml(statusLabel).toUpperCase()}</text>
    <text x="90" y="65" fill="${theme.fg}" font-size="18" font-weight="800" font-family="Fraunces,serif">${title}</text>
    <text x="90" y="85" fill="${theme.fg}" font-size="13" font-weight="500" opacity="0.8">${author}</text>
  `);
}

module.exports = {
  renderWidget,
  normalizeParams,
  getTzTime,
  escXml,
  parseHexColor,
  validateBorderColor,
  normalizeBool,
  THEMES, TIMEZONES, COUNTRIES, FLAGS, SKILLS, CODING_PLATFORMS, MUSIC_PLATFORMS,
  flagSvg, skillIcon, platformBadge
};
