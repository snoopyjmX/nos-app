const fs = require('fs');
let idx = fs.readFileSync('src/app/(tabs)/index.tsx', 'utf8');
if (!idx.includes('useDockInset')) {
  idx = "import { useDockInset } from '@/lib/hooks/useDockInset';\n" + idx;
}
fs.writeFileSync('src/app/(tabs)/index.tsx', idx);

let msg = fs.readFileSync('src/app/(tabs)/messages.tsx', 'utf8');
msg = msg.replace(/<MessageList\n/g, '<MessageList\n              dockInset={dockInset}\n');
msg = msg.replace(/<MessageInput\n/g, '<MessageInput\n          dockInset={dockInset}\n');
fs.writeFileSync('src/app/(tabs)/messages.tsx', msg);
