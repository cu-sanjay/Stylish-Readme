const {
  normalizeParams,
  getTzTime,
  escXml,
  validateBorderColor,
  parseHexColor,
  renderWidget
} = require('../lib/widgets');

describe('Widget helpers', () => {
  test('escXml escapes XML-sensitive characters and handles null/undefined', () => {
    expect(escXml('<>&"\'')).toBe('&lt;&gt;&amp;&quot;&apos;');
    expect(escXml(null)).toBe('');
    expect(escXml(undefined)).toBe('');
  });

  test('getTzTime returns UTC-based values for invalid timezones and valid values for UTC', () => {
    const utcNow = new Date();
    const expectedWeekday = utcNow.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const expectedMonth = utcNow.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
    const expectedHour = String(utcNow.getUTCHours()).padStart(2, '0');
    const expectedMinute = String(utcNow.getUTCMinutes()).padStart(2, '0');
    const expectedSecond = String(utcNow.getUTCSeconds()).padStart(2, '0');

    const valid = getTzTime('UTC');
    // Seconds can drift between snapshot calls; assert stable fields only.
    expect(valid.weekday).toBe(expectedWeekday);
    expect(valid.month).toBe(expectedMonth);
    expect(valid.h).toBe(expectedHour);
    expect(valid.m).toBe(expectedMinute);
    expect(valid.s).toMatch(/^\d{2}$/);

    const invalid = getTzTime('Mars/Phobos');
    expect(invalid.weekday).toBe(expectedWeekday);
    expect(invalid.month).toBe(expectedMonth);
    expect(invalid.h).toBe(expectedHour);
    expect(invalid.m).toBe(expectedMinute);
    expect(invalid.s).toMatch(/^\d{2}$/);
  });

  test('parseHexColor accepts valid hex strings and rejects invalid values', () => {
    expect(parseHexColor('#fff')).toBe('#fff');
    expect(parseHexColor('abcdef')).toBe('#abcdef');
    expect(parseHexColor('1234')).toBe(null);
    expect(parseHexColor('notcolor')).toBe(null);
  });

  test('validateBorderColor accepts CSS color names and hex color values only', () => {
    expect(validateBorderColor('red')).toBe('red');
    expect(validateBorderColor('#123abc')).toBe('#123abc');
    expect(validateBorderColor('invalid-color')).toBe('');
    expect(validateBorderColor('')).toBe('');
  });
});

describe('normalizeParams', () => {
  test('applies defaults and normalizes platform/musicPlatform values', () => {
    const params = normalizeParams({
      showSeconds: 'no',
      showDate: '0',
      showDay: 'false',
      shadow: '1',
      platform: 'GITHUB',
      musicPlatform: 'SPOTIFY',
      startDate: 'invalid-date',
      bgColor: 'not-a-color',
      borderColor: 'transparent'
    });

    expect(params.timezone).toBe('Asia/Kolkata');
    expect(params.theme).toBe('classic');
    expect(params.timeFormat).toBe('24h');
    expect(params.showSeconds).toBe(false);
    expect(params.showDate).toBe(false);
    expect(params.showDay).toBe(false);
    expect(params.shadow).toBe(true);
    expect(params.platform).toBe('github');
    expect(params.musicPlatform).toBe('spotify');
    expect(params.startDate).toBe('2024-01-01');
    expect(params.bgColor).toBe(null);
    expect(params.borderColor).toBe('transparent');
  });

  test('truncates long profile strings safely with ellipsis', () => {
    const params = normalizeParams({
      name: 'A'.repeat(32),
      role: 'B'.repeat(42),
      bio: 'C'.repeat(100)
    });

    expect(params.name).toMatch(/A{24}\.{3}$/);
    expect(params.role).toMatch(/B{30}\.{3}$/);
    expect(params.bio).toMatch(/C{70}\.{3}$/);
  });

  test('normalizes unsupported platforms to none and keeps valid ones', () => {
    expect(normalizeParams({ platform: 'unsupported', musicPlatform: 'unknown' }).platform).toBe('none');
    expect(normalizeParams({ platform: 'leetcode', musicPlatform: 'ytmusic' }).musicPlatform).toBe('ytmusic');
  });
});

describe('renderWidget', () => {
  test('renders a time widget SVG and includes expected text elements', async () => {
    const xml = await renderWidget('time', { timezone: 'UTC', label: 'Local Time' });
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('<text');
    expect(xml).toContain('Local Time'.toUpperCase());
  });

  test('returns sanitized unknown widget error output', async () => {
    const xml = await renderWidget('<evil>', {});
    expect(xml).toContain('Unknown widget: &lt;evil&gt;');
    expect(xml).not.toContain('<evil>');
  });

  test('renders skyline widget in banner style and overrides time correctly', async () => {
    const xml = await renderWidget('skyline', {
      skylineStyle: 'banner',
      time: '680',
      label: 'Ocean View Test'
    });
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('◑ TIDES');
    expect(xml).toContain('Ocean View Test');
    expect(xml).toContain('GOLDEN HOUR');
    expect(xml).toContain('17:14'); // 5 + 0.68 * 18 = 17.24 = 17:14
  });

  test('renders skyline widget in card style with profile data', async () => {
    const xml = await renderWidget('skyline', {
      skylineStyle: 'card',
      name: 'Skyline Dev',
      role: 'Backend Architect',
      bio: 'Procedural graphics designer',
      skills: 'HTML,CSS,JS,REACT',
      time: '1000'
    });
    expect(xml).toContain('Skyline Dev');
    expect(xml).toContain('BACKEND ARCHITECT');
    expect(xml).toContain('Procedural graphics designer');
    expect(xml).toContain('◆ SKILLS &amp; STACK');
    expect(xml).toContain('MOONLIT');
  });

  test('renders marker widget in banner style', async () => {
    const xml = await renderWidget('marker', {
      markerStyle: 'banner',
      markerColor: 'green',
      label: 'Nice marker highlight'
    });
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('Nice marker highlight');
    expect(xml).toContain('marker-rough');
    expect(xml).toContain('hsl(66, 45%, 79%)');
  });

  test('renders marker widget in card style with profile data', async () => {
    const xml = await renderWidget('marker', {
      markerStyle: 'card',
      markerColor: 'purple',
      name: 'Christian Alder',
      role: 'Front-End Designer',
      bio: 'Styling up HTML elements with CSS & SVG filters.',
      skills: 'HTML,CSS,JS'
    });
    expect(xml).toContain('Christian Alder');
    expect(xml).toContain('FRONT-END DESIGNER');
    expect(xml).toContain('Styling up HTML elements');
    expect(xml).toContain('◆ SKILLS &amp; STACK');
    expect(xml).toContain('marker-rough');
    expect(xml).toContain('hsl(274, 27%, 88%)');
  });

  test('renders marker widget in card style with custom HTML highlight tags', async () => {
    const xml = await renderWidget('marker', {
      markerStyle: 'card',
      markerColor: 'purple',
      name: 'Sanjay',
      bio: 'I love building <mark color="orange">cool projects</mark> and writing <mark color="cyan">clean code</mark>.',
      skills: 'HTML,CSS,JS'
    });
    expect(xml).toContain('Sanjay');
    expect(xml).not.toContain('<mark');
    expect(xml).not.toContain('</mark>');
    expect(xml).toContain('cool projects');
    expect(xml).toContain('clean code');
  });

  test('renders glass widget in banner style', async () => {
    const xml = await renderWidget('glass', {
      glassStyle: 'banner',
      glassColor: 'liquid',
      label: 'Liquid Glass Test',
      bio: 'Metaball refraction theme.'
    });
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('Liquid Glass Test');
    expect(xml).toContain('Metaball refraction theme.');
    expect(xml).toContain('goo_');
    expect(xml).toContain('refract_');
  });

  test('renders glass widget in card style with profile data', async () => {
    const xml = await renderWidget('glass', {
      glassStyle: 'card',
      glassColor: 'coral',
      name: 'Glass Sanjay',
      role: 'Liquid Developer',
      bio: 'Gooey glass refraction card.',
      skills: 'HTML,CSS,JS'
    });
    expect(xml).toContain('Glass Sanjay');
    expect(xml).toContain('LIQUID DEVELOPER');
    expect(xml).toContain('Gooey glass refraction card.');
    expect(xml).toContain('◆ SKILLS &amp; STACK');
    expect(xml).toContain('goo_');
  });

  test('renders a countdown widget SVG', async () => {
    const xml = await renderWidget('countdown', { eventName: 'Graduation', targetDate: '2026-05-15' });
    expect(xml).toContain('COUNTDOWN TO');
    expect(xml).toContain('GRADUATION');
  });

  test('renders youtube widget missing id error', async () => {
    const xml = await renderWidget('youtube', {});
    expect(xml).toContain('YouTube Widget: Missing videoId or playlistId');
  });

  test('renders youtube widget with videoId (success path)', async () => {
    // This test actually performs a real fetch to YouTube OEmbed API
    const xml = await renderWidget('youtube', { videoId: 'dQw4w9WgXcQ' });
    expect(xml).toContain('YOUTUBE');
    expect(xml).toContain('Rick Astley');
    expect(xml).toContain('image href="data:image/');
  });

  test('renders extension widget with defaults and custom fields', async () => {
    const xml = await renderWidget('extension', {
      extensionName: 'My Awesome Extension',
      extensionPlatform: 'chrome',
      extensionId: 'abc123xyz'
    });
    expect(xml).toContain('ADD TO CHROME');
    expect(xml).toContain('My Awesome Extension');
    expect(xml).toContain('Available in Chrome Web Store');
    expect(xml).toContain('https://chromewebstore.google.com/detail/abc123xyz');
    expect(xml).toContain('M12 0C8.21 0');
  });

  test('renders extension widget for firefox and edge correctly', async () => {
    const edgeXml = await renderWidget('extension', {
      extensionName: 'Edge Extension',
      extensionPlatform: 'edge',
      extensionId: 'edge-id'
    });
    expect(edgeXml).toContain('ADD TO EDGE');
    expect(edgeXml).toContain('https://microsoftedge.microsoft.com/addons/detail/edge-id');

    const firefoxXml = await renderWidget('extension', {
      extensionName: 'Firefox Addon',
      extensionPlatform: 'firefox',
      extensionId: 'firefox-slug'
    });
    expect(firefoxXml).toContain('ADD TO FIREFOX');
    expect(firefoxXml).toContain('https://addons.mozilla.org/en-US/firefox/addon/firefox-slug');
  });
});

