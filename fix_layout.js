const fs = require('fs');
let lay = fs.readFileSync('src/app/_layout.tsx', 'utf8');

lay = lay.replace('const { isDark } = useAppTheme();\n', '');

fs.writeFileSync('src/app/_layout.tsx', lay);
