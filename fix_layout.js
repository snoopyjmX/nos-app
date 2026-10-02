const fs = require('fs');
let lay = fs.readFileSync('src/app/_layout.tsx', 'utf8');

lay = lay.replace(
  '} else if (session && inAuthGroup) {',
  '} else if (session && inAuthGroup && !isResetPassword) {'
);
fs.writeFileSync('src/app/_layout.tsx', lay);
