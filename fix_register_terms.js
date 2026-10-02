const fs = require('fs');
let reg = fs.readFileSync('src/app/(auth)/register.tsx', 'utf8');

reg = reg.replace(/const handleTerms = \(\) => {[\s\S]*?};/, '');
reg = reg.replace(/const handlePrivacy = \(\) => {[\s\S]*?};/, '');

fs.writeFileSync('src/app/(auth)/register.tsx', reg);
