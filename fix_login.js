const fs = require('fs');
let login = fs.readFileSync('src/app/(auth)/login.tsx', 'utf8');

login = login.replace(
  "import { useRouter } from 'expo-router';",
  "import { useRouter } from 'expo-router';\nimport * as Linking from 'expo-linking';"
);

login = login.replace(
  "const [loading, setLoading] = useState(false);",
  "const [loading, setLoading] = useState(false);\n  const [loadingReset, setLoadingReset] = useState(false);\n  const [resetCooldown, setResetCooldown] = useState(0);\n\n  useEffect(() => {\n    if (resetCooldown > 0) {\n      const timer = setTimeout(() => setResetCooldown(resetCooldown - 1), 1000);\n      return () => clearTimeout(timer);\n    }\n  }, [resetCooldown]);"
);

login = login.replace(
  "import React, { useState } from 'react';",
  "import React, { useState, useEffect } from 'react';"
);

const handleForgot = `  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Atenção', 'Digite seu e-mail');
      return;
    }
    if (resetCooldown > 0) return;

    setLoadingReset(true);
    const redirectTo = Platform.OS === 'web' 
      ? \`\${window.location.origin}/reset-password\`
      : Linking.createURL('/reset-password');

    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setLoadingReset(false);
    setResetCooldown(60);
    Alert.alert('Recuperar Senha', 'Se esse e-mail tiver uma conta, enviaremos um link para criar uma nova senha.');
  };`;

login = login.replace(
  /const handleForgotPassword = \(\) => {[\s\S]*?};/,
  handleForgot
);

login = login.replace(
  '<Text style={[styles.forgotText, { color: colors.primary, fontFamily: typography.fontFamily.bold }]}>Esqueci a senha</Text>',
  '{loadingReset ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.forgotText, { color: resetCooldown > 0 ? colors.textSecondary : colors.primary, fontFamily: typography.fontFamily.bold }]}>{resetCooldown > 0 ? `Aguarde ${resetCooldown}s` : \'Esqueci a senha\'}</Text>}'
);

login = login.replace(
  "  Pressable,\n} from 'react-native';",
  "  Pressable,\n  ActivityIndicator,\n} from 'react-native';"
);

fs.writeFileSync('src/app/(auth)/login.tsx', login);

