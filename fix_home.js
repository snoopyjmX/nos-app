const fs = require('fs');
let txt = fs.readFileSync('src/app/(tabs)/index.tsx', 'utf8');

if (!txt.includes('const dockInset = useDockInset();')) {
  txt = txt.replace('const router = useRouter();', 'const router = useRouter();\n  const dockInset = useDockInset();');
}
fs.writeFileSync('src/app/(tabs)/index.tsx', txt);
