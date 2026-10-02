const fs = require('fs');
let tabbar = fs.readFileSync('src/components/layout/TabBar.tsx', 'utf8');

tabbar = tabbar.replace(
  "height: Platform.OS === 'web' ? `calc(env(safe-area-inset-bottom, 0px) + ${DOCK_HEIGHT + 36}px)` : DOCK_HEIGHT + (bottomPosition as number) + 16,",
  "height: (Platform.OS === 'web' ? `calc(env(safe-area-inset-bottom, 0px) + ${DOCK_HEIGHT + 36}px)` : DOCK_HEIGHT + (bottomPosition as number) + 16) as any,"
);
fs.writeFileSync('src/components/layout/TabBar.tsx', tabbar);
