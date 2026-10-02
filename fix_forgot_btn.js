const fs = require('fs');
let login = fs.readFileSync('src/app/(auth)/login.tsx', 'utf8');

login = login.replace(
  "forgotBtn: {\n    paddingVertical: 8,\n    paddingHorizontal: 4,\n  }",
  "forgotBtn: {\n    paddingVertical: 8,\n    paddingHorizontal: 4,\n    minHeight: 44,\n    minWidth: 44,\n    justifyContent: 'center',\n    alignItems: 'center',\n  }"
);

fs.writeFileSync('src/app/(auth)/login.tsx', login);
