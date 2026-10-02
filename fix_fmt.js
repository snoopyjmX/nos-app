const fs = require('fs');
let txt = fs.readFileSync('src/features/dates/utils/formatting.ts', 'utf8');

txt = txt.replace("import { THEME } from '@/theme';", "import { colors as themeColors } from '@/theme/colors';");
txt = txt.replace("const colors = THEME.colors;", "const colors = themeColors.light;");

fs.writeFileSync('src/features/dates/utils/formatting.ts', txt);
