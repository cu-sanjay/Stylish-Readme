'use strict';

const THEMES = {
  classic:  { name: 'Classic', bg: '#1a1a1a', fg: '#f4f1ea', border: false },
  paper:    { name: 'Paper', bg: '#f4f1ea', fg: '#1a1a1a', border: true  },
  terminal: { name: 'Terminal', bg: '#0d1117', fg: '#7ee787', border: false },
  retro:    { name: 'Retro', bg: '#fbbf24', fg: '#1a1a1a', border: true  },
  ocean:    { name: 'Ocean', bg: '#0c4a6e', fg: '#e0f2fe', border: false },
  crimson:  { name: 'Crimson', bg: '#7f1d1d', fg: '#fef2f2', border: false },
  forest:   { name: 'Forest', bg: '#14532d', fg: '#ecfccb', border: false },
  ink:      { name: 'Ink', bg: '#f4f1ea', fg: '#1a1a1a', border: true  }
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

const COUNTRIES = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  PK: 'Pakistan',
  DE: 'Germany',
  FR: 'France',
  JP: 'Japan',
  CN: 'China',
  BR: 'Brazil',
  CA: 'Canada',
  AU: 'Australia',
  MX: 'Mexico',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  SE: 'Sweden',
  NO: 'Norway',
  KR: 'South Korea',
  TR: 'Turkey',
  AE: 'UAE',
  SG: 'Singapore',
  ZA: 'South Africa'
};

const SKILLS = {
  HTML:     { name: 'HTML5',      bg: '#E34F26', slug: 'html5',           dark: false },
  CSS:      { name: 'CSS3',       bg: '#1572B6', slug: 'css3',            dark: false },
  JS:       { name: 'JavaScript', bg: '#F7DF1E', slug: 'javascript',      dark: true  },
  TS:       { name: 'TypeScript', bg: '#3178C6', slug: 'typescript',      dark: false },
  REACT:    { name: 'React',      bg: '#20232A', slug: 'react',           dark: false },
  VUE:      { name: 'Vue.js',     bg: '#4FC08D', slug: 'vuedotjs',        dark: false },
  ANGULAR:  { name: 'Angular',    bg: '#DD0031', slug: 'angular',         dark: false },
  NODE:     { name: 'Node.js',    bg: '#339933', slug: 'nodedotjs',       dark: false },
  PYTHON:   { name: 'Python',     bg: '#3776AB', slug: 'python',          dark: false },
  JAVA:     { name: 'Java',       bg: '#ED8B00', slug: 'openjdk',         dark: false },
  CPP:      { name: 'C++',        bg: '#00599C', slug: 'cplusplus',       dark: false },
  GO:       { name: 'Go',         bg: '#00ADD8', slug: 'go',              dark: false },
  RUST:     { name: 'Rust',       bg: '#1a1a1a', slug: 'rust',            dark: false },
  GIT:      { name: 'Git',        bg: '#F05032', slug: 'git',             dark: false },
  GITHUB:   { name: 'GitHub',     bg: '#181717', slug: 'github',          dark: false },
  SQL:      { name: 'MySQL',      bg: '#4479A1', slug: 'mysql',           dark: false },
  MONGO:    { name: 'MongoDB',    bg: '#47A248', slug: 'mongodb',         dark: false },
  DOCKER:   { name: 'Docker',     bg: '#2496ED', slug: 'docker',          dark: false },
  AWS:      { name: 'AWS',        bg: '#232F3E', slug: 'amazonwebservices', dark: false },
  LINUX:    { name: 'Linux',      bg: '#FCC624', slug: 'linux',           dark: true  },
  TAILWIND: { name: 'Tailwind',   bg: '#06B6D4', slug: 'tailwindcss',     dark: false },
  SASS:     { name: 'Sass',       bg: '#CC6699', slug: 'sass',            dark: false },
  BOOTSTRAP:{ name: 'Bootstrap',  bg: '#7952B3', slug: 'bootstrap',       dark: false },
  FIGMA:    { name: 'Figma',      bg: '#1a1a1a', slug: 'figma',           dark: false }
};

const CODING_PLATFORMS = {
  none:        { name: 'None',          bg: 'transparent', fg: 'transparent', label: '' },
  leetcode:    { name: 'LeetCode',      bg: '#FFA116', fg: '#1a1a1a', label: 'LC' },
  gfg:         { name: 'GeeksforGeeks', bg: '#2F8D46', fg: '#fff',    label: 'GfG' },
  hackerrank:  { name: 'HackerRank',    bg: '#00EA64', fg: '#0d1117', label: 'HR' },
  codeforces:  { name: 'Codeforces',    bg: '#1F8ACB', fg: '#fff',    label: 'CF' },
  codechef:    { name: 'CodeChef',      bg: '#5B4638', fg: '#fff',    label: 'CC' },
  atcoder:     { name: 'AtCoder',       bg: '#222222', fg: '#fff',    label: 'AC' },
  hackerearth: { name: 'HackerEarth',   bg: '#2C3454', fg: '#3686FF', label: 'HE' },
  github:      { name: 'GitHub',        bg: '#181717', fg: '#fff',    label: 'GH' }
};

const MUSIC_PLATFORMS = {
  none:       { name: 'None',          color: null },
  spotify:    { name: 'Spotify',       color: '#1DB954' },
  ytmusic:    { name: 'YouTube Music', color: '#FF0000' },
  applemusic: { name: 'Apple Music',   color: '#FA243C' },
  soundcloud: { name: 'SoundCloud',    color: '#FF7700' }
};

const WIDGETS = [
  { id: 'time',     label: 'Time Badge',      icon: 'clock' },
  { id: 'clock',    label: 'Digital Clock',   icon: 'watch' },
  { id: 'date',     label: 'Date Stamp',      icon: 'calendar' },
  { id: 'quote',    label: 'Daily Quote',     icon: 'quote' },
  { id: 'flag',     label: 'Country Flag',    icon: 'flag' },
  { id: 'timezone', label: 'Timezone Banner', icon: 'globe' },
  { id: 'streak',   label: 'Coding Streak',   icon: 'flame' },
  { id: 'music',    label: 'Now Playing',     icon: 'music' },
  { id: 'profile',  label: 'Profile Card',    icon: 'contact' }
];

const SONGS = [
  { title: 'Tum Hi Ho', artist: 'Arijit Singh', year: '2013', genre: 'Bollywood' },
  { title: 'Tera Intezaar', artist: 'Rahat Fateh Ali Khan', year: '2014', genre: 'Bollywood' },
  { title: 'Chaleya', artist: 'Arijit Singh', year: '2022', genre: 'Bollywood' },
  { title: 'Kabira', artist: 'Arijit Singh', year: '2012', genre: 'Bollywood' },
  { title: 'Khiladi', artist: 'Honey Singh', year: '2013', genre: 'Bollywood' },
  { title: 'Shape of You', artist: 'Ed Sheeran', year: '2017', genre: 'Bollywood' },
  { title: 'Blinding Lights', artist: 'The Weeknd', year: '2019', genre: 'Hollywood' },
  { title: 'Levitating', artist: 'Dua Lipa', year: '2020', genre: 'Hollywood' },
  { title: 'Anti-Hero', artist: 'Taylor Swift', year: '2022', genre: 'Hollywood' },
  { title: 'As It Was', artist: 'Harry Styles', year: '2022', genre: 'Hollywood' },
  { title: 'Heat Waves', artist: 'Glass Animals', year: '2020', genre: 'Hollywood' },
  { title: 'Bohemian Rhapsody', artist: 'Queen', year: '1975', genre: 'Hollywood' },
  { title: 'Imagine', artist: 'John Lennon', year: '1971', genre: 'Hollywood' },
  { title: 'Smells Like Teen Spirit', artist: 'Nirvana', year: '1991', genre: 'Hollywood' }
];

const QUOTES = [
  { q: 'Programs must be written for people to read, and only incidentally for machines to execute.', a: 'Harold Abelson' },
  { q: 'First, solve the problem. Then, write the code.', a: 'John Johnson' },
  { q: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', a: 'Martin Fowler' },
  { q: 'Deleted code is debugged code.', a: 'Jeff Sickel' },
  { q: 'Make it work, make it right, make it fast.', a: 'Kent Beck' },
  { q: 'The best error message is the one that never shows up.', a: 'Thomas Fuchs' },
  { q: 'Code is like humor. When you have to explain it, it is bad.', a: 'Cory House' },
  { q: 'Simplicity is the soul of efficiency.', a: 'Austin Freeman' }
];

const QUOTE_SETS = {
  programming: [
    { q: 'Simplicity is the soul of efficiency.', a: 'Austin Freeman' },
    { q: 'Code is like humor. When you have to explain it, it is bad.', a: 'Cory House' },
    { q: 'Make it work, make it right, make it fast.', a: 'Kent Beck' },
    { q: 'The best error message is the one that never shows up.', a: 'Thomas Fuchs' },
    { q: 'Programs must be written for people to read.', a: 'Harold Abelson' },
    { q: 'First, solve the problem. Then, write the code.', a: 'John Johnson' },
    { q: 'Any fool can write code a computer can understand.', a: 'Martin Fowler' },
    { q: 'Deleted code is debugged code.', a: 'Jeff Sickel' },
    { q: 'Talk is cheap. Show me the code.', a: 'Linus Torvalds' },
    { q: 'Premature optimization is the root of all evil.', a: 'Donald Knuth' }
  ],
  motivation: [
    { q: 'The only way to do great work is to love what you do.', a: 'Steve Jobs' },
    { q: 'Success is not final, failure is not fatal.', a: 'Winston Churchill' },
    { q: 'Believe you can and you are halfway there.', a: 'Theodore Roosevelt' },
    { q: 'It always seems impossible until it is done.', a: 'Nelson Mandela' },
    { q: 'Do not watch the clock. Do what it does. Keep going.', a: 'Sam Levenson' },
    { q: 'The future depends on what you do today.', a: 'Mahatma Gandhi' },
    { q: 'Dream big. Start small. Act now.', a: 'Robin Sharma' }
  ],
  wisdom: [
    { q: 'Knowing yourself is the beginning of all wisdom.', a: 'Aristotle' },
    { q: 'The only true wisdom is in knowing you know nothing.', a: 'Socrates' },
    { q: 'In the middle of difficulty lies opportunity.', a: 'Albert Einstein' },
    { q: 'Patience is bitter, but its fruit is sweet.', a: 'Aristotle' },
    { q: 'A journey of a thousand miles begins with a single step.', a: 'Lao Tzu' },
    { q: 'He who knows others is wise; he who knows himself is enlightened.', a: 'Lao Tzu' }
  ]
};
QUOTE_SETS.random = [].concat(QUOTE_SETS.programming, QUOTE_SETS.motivation, QUOTE_SETS.wisdom);

const PRESETS = [
  { title: 'Tokyo Time', w: 'time', overrides: { timezone: 'Asia/Tokyo', theme: 'terminal', label: 'Tokyo' } },
  { title: 'New York Clock', w: 'clock', overrides: { timezone: 'America/New_York', theme: 'paper', label: 'Eastern' } },
  { title: 'Daily Quote', w: 'quote', overrides: { theme: 'crimson', label: 'Today' } },
  { title: 'London Date', w: 'date', overrides: { theme: 'retro', timezone: 'Europe/London', label: 'Today' } },
  { title: 'NYC Timezone', w: 'timezone', overrides: { theme: 'ocean', timezone: 'America/New_York' } },
  { title: 'India Flag', w: 'flag', overrides: { country: 'IN', theme: 'forest', label: 'From' } },
  { title: 'Dev Streak · LeetCode', w: 'streak', overrides: { theme: 'forest', unit: 'days', customLabel: 'Coding Streak', platform: 'leetcode' } },
  { title: 'Now Playing · Spotify', w: 'music', overrides: { theme: 'forest', musicSong: 'Anti-Hero', musicArtist: 'Taylor Swift', musicPlatform: 'spotify', musicListen: 'Now Playing' } },
  { title: 'Profile Card', w: 'profile', overrides: { theme: 'paper', name: 'Sanjay', role: 'Full-Stack Developer', bio: 'Building cool things with code n coffee.', skills: 'HTML,JS,REACT,NODE,PYTHON,GIT,SQL', handle: 'cu-sanjay', avatar: 'https://pluspng.com/img-png/coder-png-coder-png-file-354.png' } }
];

const WIDGET_PARAMS = {
  time:     ['timezone', 'theme', 'timeFormat', 'showSeconds', 'showDate', 'showDay', 'label'],
  clock:    ['timezone', 'theme', 'timeFormat', 'showSeconds', 'label'],
  date:     ['timezone', 'theme', 'label'],
  quote:    ['theme', 'quoteCategory', 'label'],
  flag:     ['country', 'theme', 'label'],
  timezone: ['timezone', 'theme', 'timeFormat'],
  streak:   ['startDate', 'unit', 'theme', 'customLabel', 'platform'],
  music:    ['musicSong', 'musicArtist', 'musicListen', 'musicPlatform', 'theme'],
  profile:  ['avatar', 'name', 'role', 'bio', 'skills', 'handle', 'theme']
};

module.exports = {
  THEMES,
  TIMEZONES,
  COUNTRIES,
  SKILLS,
  CODING_PLATFORMS,
  MUSIC_PLATFORMS,
  WIDGETS,
  SONGS,
  QUOTES,
  QUOTE_SETS,
  PRESETS,
  WIDGET_PARAMS
};
