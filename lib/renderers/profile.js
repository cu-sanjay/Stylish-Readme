'use strict';

const { theme, escXml, svgWrap, shadowFilter, initials, fetchAvatarDataUrl, fetchSkillIconDataUrl, skillIcon } = require('../helpers');
const { SKILLS } = require('../metadata');

async function render(p) {
  const th = theme(p.theme);
  const rx = p.radius;
  const border = p.borderColor ? `stroke="${p.borderColor}" stroke-width="2"` : (th.border ? `stroke="${th.fg}" stroke-width="2"` : '');
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

module.exports = { render };
