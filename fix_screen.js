const fs = require('fs');
let screen = fs.readFileSync('src/components/ui/Screen.tsx', 'utf8');

screen = screen.replace(
  "paddingTop: insets.top,",
  "paddingTop: Platform.OS === 'web' ? 'env(safe-area-inset-top)' : insets.top,"
);

// We need to import Platform
if (!screen.includes('Platform,')) {
  screen = screen.replace("import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';", "import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';");
}

// Remove paddingBottom: tabBarHeight
screen = screen.replace(
  "paddingBottom: tabBarHeight,",
  "// paddingBottom is handled by useDockInset() in ScrollViews to avoid double padding"
);

fs.writeFileSync('src/components/ui/Screen.tsx', screen);
