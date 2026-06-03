'use strict';

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

module.exports = { FLAGS };
