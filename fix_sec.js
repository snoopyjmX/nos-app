const fs = require('fs');
let txt = fs.readFileSync('src/features/profile/components/SecuritySection.tsx', 'utf8');
txt = txt.replace(
  "        \n    </View>\n  );\n}",
  "      </View>\n    </View>\n  );\n}"
);
fs.writeFileSync('src/features/profile/components/SecuritySection.tsx', txt);
