const fs = require('fs');

const files = [
  'src/app/(tabs)/index.tsx',
  'src/app/(tabs)/dates.tsx',
  'src/app/(tabs)/memories.tsx',
  'src/app/(tabs)/messages.tsx',
  'src/app/(tabs)/profile.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Add import if not present
  if (!content.includes('useDockInset')) {
    content = content.replace(
      "import { useSafeAreaInsets } from 'react-native-safe-area-context';",
      "import { useSafeAreaInsets } from 'react-native-safe-area-context';\nimport { useDockInset } from '@/lib/hooks/useDockInset';"
    );
  }

  // Find where useSafeAreaInsets is called and add dockInset
  if (!content.includes('const dockInset = useDockInset();')) {
    content = content.replace(
      'const insets = useSafeAreaInsets();',
      'const insets = useSafeAreaInsets();\n  const dockInset = useDockInset();'
    );
  }

  // Adjust paddingBottom in ScrollView / FlatList
  if (file.includes('index.tsx')) {
    content = content.replace(
      'contentContainerStyle={styles.scrollContent}',
      'contentContainerStyle={[styles.scrollContent, { paddingBottom: dockInset }]}'
    );
    // Optional: remove paddingBottom: 40 from styles, but it's fine to leave it overridden or remove it
    content = content.replace('paddingBottom: 40,', '');
  } else if (file.includes('dates.tsx') || file.includes('memories.tsx') || file.includes('profile.tsx')) {
    content = content.replace(
      'paddingBottom: tabBarPaddingBottom + 40,',
      'paddingBottom: dockInset,'
    );
    content = content.replace(
      'paddingBottom: tabBarPaddingBottom + 20,',
      'paddingBottom: dockInset,'
    );
  } else if (file.includes('messages.tsx')) {
    // In messages.tsx it's an inverted list, maybe padding?
    content = content.replace(
      'paddingBottom: tabBarPaddingBottom + 20,',
      'paddingBottom: dockInset,'
    );
    content = content.replace(
      'paddingBottom: tabBarPaddingBottom + 80,',
      'paddingBottom: dockInset,'
    );
  }

  fs.writeFileSync(file, content);
}
