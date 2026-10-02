const fs = require('fs');

// Fix messages.tsx duplicates
let msgTsx = fs.readFileSync('src/app/(tabs)/messages.tsx', 'utf8');
const lines = msgTsx.split('\n');
const uniqueLines = [];
let dockInsetCount = 0;
let importDockInsetCount = 0;
for (let line of lines) {
  if (line.includes('import { useDockInset }')) {
    if (importDockInsetCount === 0) uniqueLines.push(line);
    importDockInsetCount++;
  } else if (line.includes('const dockInset = useDockInset();')) {
    if (dockInsetCount === 0) uniqueLines.push(line);
    dockInsetCount++;
  } else if (line.includes('dockInset={dockInset}') && (line.includes('MessagesSkeleton') || line.includes('MessagesHeader'))) {
    // remove it from skeleton and header
    uniqueLines.push(line.replace('dockInset={dockInset}', ''));
  } else {
    uniqueLines.push(line);
  }
}
fs.writeFileSync('src/app/(tabs)/messages.tsx', uniqueLines.join('\n'));

// Fix index.tsx dockInset not defined?
// wait, I put dockInset={dockInset} in index.tsx? 
let idxTsx = fs.readFileSync('src/app/(tabs)/index.tsx', 'utf8');
if (!idxTsx.includes('const dockInset = useDockInset();')) {
  idxTsx = idxTsx.replace('const insets = useSafeAreaInsets();', 'const insets = useSafeAreaInsets();\n  const dockInset = useDockInset();');
}
fs.writeFileSync('src/app/(tabs)/index.tsx', idxTsx);


// theme.ts: where is THEME exported?
// Wait, maybe the colors from theme.ts were added to src/theme/index.ts ?
// Let's check what is in src/theme/index.ts
