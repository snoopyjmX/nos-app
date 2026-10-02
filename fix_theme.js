const fs = require('fs');
let txt = fs.readFileSync('src/app/(tabs)/profile.tsx', 'utf8');
txt = txt.replace(
  '{/* <ThemeSection\n              mode={mode}\n              setMode={setMode}\n            /> */}',
  '<ThemeSection\n              mode={mode}\n              setMode={setMode}\n            />'
);
fs.writeFileSync('src/app/(tabs)/profile.tsx', txt);
