const fs = require('fs');

// 1. Fix TabBar.tsx
let tabbar = fs.readFileSync('src/components/layout/TabBar.tsx', 'utf8');
tabbar = tabbar.replace(
  "const bottomPosition = insets.bottom > 0 ? insets.bottom + 4 : 20;",
  "const bottomPosition = Platform.OS === 'web' ? 'calc(env(safe-area-inset-bottom, 0px) + 20px)' : (insets.bottom > 0 ? insets.bottom + 4 : 20);"
);

// We need to type-cast bottom to any for the web calc
tabbar = tabbar.replace(
  "bottom: bottomPosition,",
  "bottom: bottomPosition as any,"
);

// The LinearGradient height needs bottomPosition which is now a string!
// DOCK_HEIGHT + bottomPosition + 16
tabbar = tabbar.replace(
  "height: DOCK_HEIGHT + bottomPosition + 16,",
  "height: Platform.OS === 'web' ? `calc(env(safe-area-inset-bottom, 0px) + ${DOCK_HEIGHT + 36}px)` : DOCK_HEIGHT + (bottomPosition as number) + 16,"
);
fs.writeFileSync('src/components/layout/TabBar.tsx', tabbar);

// 2. Fix Screen.tsx
let screen = fs.readFileSync('src/components/ui/Screen.tsx', 'utf8');
screen = screen.replace(
  "paddingTop: Platform.OS === 'web' ? 'env(safe-area-inset-top)' : insets.top,",
  "paddingTop: Platform.OS === 'web' ? 'env(safe-area-inset-top, 0px)' : insets.top,"
);
// Typecast paddingTop
screen = screen.replace(
  "paddingTop: Platform.OS === 'web'",
  "paddingTop: (Platform.OS === 'web'"
);
screen = screen.replace(
  "0px)' : insets.top,",
  "0px)' : insets.top) as any,"
);
fs.writeFileSync('src/components/ui/Screen.tsx', screen);

// 3. Fix useDockInset
let dock = fs.readFileSync('src/lib/hooks/useDockInset.ts', 'utf8');
// For useDockInset, we return a number for ScrollView padding. 
// ScrollView paddingBottom doesn't work well with CSS calc().
// But if insets.bottom is 0 on web, we should fallback to a safe 34 if it's iOS PWA.
// Actually, we can check user agent if we really want, but let's just make it big enough.
// The user says minimum 140. 140 is already big enough for 34px bottom inset! (64 + 20 + 34 + 24 = 142).
// So let's just make the minimum 150 to be safe.
dock = dock.replace(
  "return Math.max(calculated, 140);",
  "return Math.max(calculated, 150);"
);
fs.writeFileSync('src/lib/hooks/useDockInset.ts', dock);

