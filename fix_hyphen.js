const fs = require('fs');
let txt = fs.readFileSync('src/app/onboarding.tsx', 'utf8');
txt = txt.replace(
  'const formattedCode = inputCode.trim().toUpperCase();',
  'const formattedCode = inputCode.trim().toUpperCase().replace(/-/g, "");'
);
// Also the texts mentioning 6 dígitos
txt = txt.replace(/6 dígitos/g, 'código');
fs.writeFileSync('src/app/onboarding.tsx', txt);
