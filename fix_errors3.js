const fs = require('fs');

// Fix login ActivityIndicator
let login = fs.readFileSync('src/app/(auth)/login.tsx', 'utf8');
if (!login.includes('ActivityIndicator,')) {
  login = login.replace('import { View,', 'import { View,\n  ActivityIndicator,');
}
// wait, the previous replace was probably overwritten or didn't work.
if (!login.includes('ActivityIndicator')) {
    login = login.replace('Text,', 'Text,\n  ActivityIndicator,');
}
fs.writeFileSync('src/app/(auth)/login.tsx', login);

// Fix layout segments
let lay = fs.readFileSync('src/app/_layout.tsx', 'utf8');
lay = lay.replace(
  "const isResetPassword = segments[1] === 'reset-password';",
  "const isResetPassword = segments.includes('reset-password');"
);
fs.writeFileSync('src/app/_layout.tsx', lay);

