const fs = require('fs');
let txt = fs.readFileSync('src/theme/colors.ts', 'utf8');

const additionalLight = `
    border: '#EFECFC',
    catTravel: '#2B6CB0',
    catTravelBg: 'rgba(43, 108, 176, 0.12)',
    catDate: '#C53030',
    catDateBg: 'rgba(197, 48, 48, 0.12)',
    catCeleb: '#8E7CE8',
    catCelebBg: 'rgba(142, 124, 232, 0.15)',
    catBday: '#DD6B20',
    catBdayBg: 'rgba(221, 107, 32, 0.12)',
    catOther: '#4A5568',
    catOtherBg: 'rgba(74, 85, 104, 0.12)',
    overlayDark: 'rgba(0,0,0,0.85)',
    overlayMedium: 'rgba(0,0,0,0.50)',
    overlayLight: 'rgba(15, 12, 28, 0.94)',
    countdownFillLight: 'rgba(255, 255, 255, 0.08)',
    countdownFillDark: 'rgba(124, 111, 224, 0.08)',
    white: '#FFFFFF',
`;

const additionalDark = `
    border: '#2A2545',
    catTravel: '#2B6CB0',
    catTravelBg: 'rgba(43, 108, 176, 0.12)',
    catDate: '#C53030',
    catDateBg: 'rgba(197, 48, 48, 0.12)',
    catCeleb: '#8E7CE8',
    catCelebBg: 'rgba(142, 124, 232, 0.15)',
    catBday: '#DD6B20',
    catBdayBg: 'rgba(221, 107, 32, 0.12)',
    catOther: '#4A5568',
    catOtherBg: 'rgba(74, 85, 104, 0.12)',
    overlayDark: 'rgba(0,0,0,0.85)',
    overlayMedium: 'rgba(0,0,0,0.50)',
    overlayLight: 'rgba(15, 12, 28, 0.94)',
    countdownFillLight: 'rgba(255, 255, 255, 0.08)',
    countdownFillDark: 'rgba(124, 111, 224, 0.08)',
    white: '#FFFFFF',
`;

txt = txt.replace("    border: '#EFECFC',", additionalLight);
txt = txt.replace("    border: '#2A2545',", additionalDark);
fs.writeFileSync('src/theme/colors.ts', txt);
