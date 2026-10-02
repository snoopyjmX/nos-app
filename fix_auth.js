const fs = require('fs');

// 1. Modify supabase.ts
let sb = fs.readFileSync('src/lib/core/supabase.ts', 'utf8');
sb = sb.replace('detectSessionInUrl: false,', 'detectSessionInUrl: true,');
fs.writeFileSync('src/lib/core/supabase.ts', sb);

// 2. Modify AuthContext.tsx
let ac = fs.readFileSync('src/lib/context/AuthContext.tsx', 'utf8');
ac = ac.replace(
  '(_event, currentSession) => {',
  `(_event, currentSession) => {
        if (_event === 'PASSWORD_RECOVERY') {
          router.replace('/(auth)/reset-password');
        }`
);
fs.writeFileSync('src/lib/context/AuthContext.tsx', ac);

// 3. Modify _layout.tsx
let lay = fs.readFileSync('src/app/_layout.tsx', 'utf8');
lay = lay.replace(
  'const inAuthGroup = segments[0] === \'(auth)\';',
  'const inAuthGroup = segments[0] === \'(auth)\';\n    const isResetPassword = segments[1] === \'reset-password\';'
);
lay = lay.replace(
  'if (!session && !inAuthGroup) {',
  'if (!session && !inAuthGroup && !isResetPassword) {'
);
fs.writeFileSync('src/app/_layout.tsx', lay);

