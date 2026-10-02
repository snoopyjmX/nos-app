const fs = require('fs');
let actions = fs.readFileSync('src/features/profile/components/AccountActions.tsx', 'utf8');

const newLinks = `      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
        <PressableScale onPress={() => router.push('/terms')}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: typography.fontFamily.medium, textDecorationLine: 'underline' }}>Termos</Text>
        </PressableScale>
        <PressableScale onPress={() => router.push('/privacy')}>
          <Text style={{ fontSize: 13, color: colors.textSecondary, fontFamily: typography.fontFamily.medium, textDecorationLine: 'underline' }}>Privacidade</Text>
        </PressableScale>
      </View>

      <Text style={[styles.footerNote, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>`;

actions = actions.replace("      <Text style={[styles.footerNote, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>", newLinks);

if (!actions.includes("import { useRouter }")) {
  actions = actions.replace("import { View, Text, StyleSheet } from 'react-native';", "import { View, Text, StyleSheet } from 'react-native';\nimport { useRouter } from 'expo-router';");
}
if (!actions.includes("const router = useRouter();")) {
  actions = actions.replace("  const { colors, typography, radii, spacing, isDark } = useTheme();", "  const { colors, typography, radii, spacing, isDark } = useTheme();\n  const router = useRouter();");
}

fs.writeFileSync('src/features/profile/components/AccountActions.tsx', actions);
