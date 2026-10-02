const fs = require('fs');
let welcome = fs.readFileSync('src/app/(auth)/welcome.tsx', 'utf8');

const termsCode = `
          {/* Botões de Ação */}
          <View style={styles.actionContainer}>
            <Button
              onPress={() => router.push('/(auth)/login')}
              variant="primary"
            >
              Entrar na Minha Conta
            </Button>

            <Button
              onPress={() => router.push('/(auth)/register')}
              variant="ghost"
            >
              Criar Nosso Espaço
            </Button>
          </View>
          
          <View style={{ marginTop: 24, paddingHorizontal: 12 }}>
            <Text style={{ textAlign: 'center', fontSize: 13, color: colors.textSecondary, fontFamily: typography.fontFamily.regular }}>
              Ao continuar, você concorda com nossos{' '}
              <Text onPress={() => router.push('/terms')} style={{ color: colors.primary, fontFamily: typography.fontFamily.bold }}>Termos</Text> e{' '}
              <Text onPress={() => router.push('/privacy')} style={{ color: colors.primary, fontFamily: typography.fontFamily.bold }}>Política de Privacidade</Text>.
            </Text>
          </View>
`;

welcome = welcome.replace(/{\/\* Botões de Ação \*\/}[\s\S]*?<\/View>/, termsCode);

fs.writeFileSync('src/app/(auth)/welcome.tsx', welcome);
