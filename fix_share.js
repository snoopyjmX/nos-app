const fs = require('fs');
let txt = fs.readFileSync('src/app/onboarding.tsx', 'utf8');
txt = txt.replace(
  '${inviteCode}',
  '${inviteCode?.replace(/(\\w{5})(?=\\w)/g, "$1-")}'
);
fs.writeFileSync('src/app/onboarding.tsx', txt);
