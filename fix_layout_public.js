const fs = require('fs');
let lay = fs.readFileSync('src/app/_layout.tsx', 'utf8');

lay = lay.replace(
  "const isResetPassword = segments.includes('reset-password');",
  "const isResetPassword = segments.includes('reset-password');\n    const isPublicRoute = segments.includes('terms') || segments.includes('privacy');"
);

lay = lay.replace(
  "if (!session && !inAuthGroup && !isResetPassword) {",
  "if (!session && !inAuthGroup && !isResetPassword && !isPublicRoute) {"
);

fs.writeFileSync('src/app/_layout.tsx', lay);
