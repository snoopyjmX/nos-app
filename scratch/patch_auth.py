import re

def update_file(path, is_login):
    with open(path, 'r') as f:
        content = f.read()

    # 1. Add Image import
    content = content.replace("import {\n  View,\n  Text,\n  TextInput,", "import {\n  View,\n  Text,\n  TextInput,\n  Image,")

    # 2. Add Logo to Header
    header_brand = """          {/* Header Brand */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/favicon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandTitle, { color: themeTokens.textPrimary }]}>nós.</Text>
            <Text style={[styles.brandSubtitle, { color: themeTokens.textSecondary }]}>"""
    
    if is_login:
        header_brand += "Um espaço só nosso</Text>\n          </View>"
        content = re.sub(
            r'\{\/\*\s*Header Brand\s*\*\/\}\s*<View style=\{styles\.header\}>\s*<Text.*?>nós\.</Text>\s*<Text.*?>Um espaço só nosso</Text>\s*</View>',
            header_brand,
            content,
            flags=re.DOTALL
        )
    else:
        header_brand += "Crie seu perfil</Text>\n          </View>"
        content = re.sub(
            r'\{\/\*\s*Header Brand\s*\*\/\}\s*<View style=\{styles\.header\}>\s*<Text.*?>nós\.</Text>\s*<Text.*?>Crie seu perfil</Text>\s*</View>',
            header_brand,
            content,
            flags=re.DOTALL
        )

    # 3. Add styles
    style_addition = """  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
    shadowColor: '#5B4294',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  logoImage: {
    width: 80,
    height: 80,
  },"""
    
    content = re.sub(
        r'  header: \{\s*alignItems: \'center\',\s*marginBottom: 48,\s*\},',
        style_addition,
        content
    )

    with open(path, 'w') as f:
        f.write(content)

update_file('app/(auth)/login.tsx', True)
update_file('app/(auth)/register.tsx', False)
