const fs = require('fs');

const path = 'src/app/onboarding.tsx';
let txt = fs.readFileSync(path, 'utf8');

// Handle formatting of generated code on display
txt = txt.replace(
  "<Text style={styles.codeText}>{inviteCode}</Text>",
  "<Text style={styles.codeText}>{inviteCode?.replace(/(\\w{5})(?=\\w)/g, '$1-')}</Text>"
);

// Error message
txt = txt.replace(
  "'Não foi possível vincular este código. Verifique se digitou corretamente ou se o convite já foi utilizado.'",
  "'Código inválido ou expirado'"
);

// Handle input formatting
txt = txt.replace(
  "onChangeText={setInputCode}",
  "onChangeText={(text) => {\n                const clean = text.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '');\n                let formatted = clean;\n                if (clean.length > 5) {\n                  formatted = clean.slice(0, 5) + '-' + clean.slice(5, 10);\n                }\n                setInputCode(formatted);\n              }}\n              maxLength={11}"
);

fs.writeFileSync(path, txt);

