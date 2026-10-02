const fs = require('fs');

function replaceAll(str, map) {
  let res = str;
  for (const [k, v] of Object.entries(map)) {
    res = res.split(k).join(v);
  }
  return res;
}

// 1. src/features/dates/utils/formatting.ts
const formattingTs = 'src/features/dates/utils/formatting.ts';
let fmt = fs.readFileSync(formattingTs, 'utf8');
if (!fmt.includes('import { THEME }')) {
  fmt = fmt.replace("import { CategoryOption } from '../types';", "import { CategoryOption } from '../types';\nimport { THEME } from '@/theme';\nconst colors = THEME.colors;");
  fmt = replaceAll(fmt, {
    "'#2B6CB0'": 'colors.catTravel',
    "'rgba(43, 108, 176, 0.12)'": 'colors.catTravelBg',
    "'#C53030'": 'colors.catDate',
    "'rgba(197, 48, 48, 0.12)'": 'colors.catDateBg',
    "'#8E7CE8'": 'colors.catCeleb',
    "'rgba(142, 124, 232, 0.15)'": 'colors.catCelebBg',
    "'rgba(142, 124, 232, 0.12)'": 'colors.catCelebBg',
    "'#DD6B20'": 'colors.catBday',
    "'rgba(221, 107, 32, 0.12)'": 'colors.catBdayBg',
    "'#4A5568'": 'colors.catOther',
    "'rgba(74, 85, 104, 0.12)'": 'colors.catOtherBg',
  });
  fs.writeFileSync(formattingTs, fmt);
}

// 2. src/features/home/components/HeroCard.tsx
const heroTsx = 'src/features/home/components/HeroCard.tsx';
if (fs.existsSync(heroTsx)) {
  let hero = fs.readFileSync(heroTsx, 'utf8');
  hero = replaceAll(hero, {
    "'rgba(15, 12, 28, 0.94)'": 'colors.overlayLight',
    "color: '#FFFFFF'": "color: colors.white",
  });
  fs.writeFileSync(heroTsx, hero);
}

// 3. src/features/memories/components/MemoryPreviewModal.tsx
const modalTsx = 'src/features/memories/components/MemoryPreviewModal.tsx';
if (fs.existsSync(modalTsx)) {
  let modal = fs.readFileSync(modalTsx, 'utf8');
  modal = replaceAll(modal, {
    "'rgba(0,0,0,0.85)'": "colors.overlayDark",
    "'rgba(0,0,0,0.5)'": "colors.overlayMedium",
    "'#FFFFFF'": "colors.white",
  });
  fs.writeFileSync(modalTsx, modal);
}

// 4. src/features/dates/components/CountdownDigits.tsx
const countTsx = 'src/features/dates/components/CountdownDigits.tsx';
if (fs.existsSync(countTsx)) {
  let count = fs.readFileSync(countTsx, 'utf8');
  count = replaceAll(count, {
    "'rgba(255, 255, 255, 0.08)'": "colors.countdownFillLight",
    "'rgba(124, 111, 224, 0.08)'": "colors.countdownFillDark",
  });
  fs.writeFileSync(countTsx, count);
}

