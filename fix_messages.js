const fs = require('fs');

const messagesTsx = 'src/app/(tabs)/messages.tsx';
let messages = fs.readFileSync(messagesTsx, 'utf8');

messages = messages.replace(
  "import { useTabBarHeight } from '@/lib/hooks/useTabBarHeight';",
  "import { useDockInset } from '@/lib/hooks/useDockInset';"
);
messages = messages.replace(
  "const { tabBarHeight } = useTabBarHeight();",
  "const dockInset = useDockInset();"
);
messages = messages.replace(
  "tabBarHeight={tabBarHeight}",
  "dockInset={dockInset}"
);

fs.writeFileSync(messagesTsx, messages);

const messageInputTsx = 'src/features/messages/components/MessageInput.tsx';
let input = fs.readFileSync(messageInputTsx, 'utf8');
input = input.replace('tabBarHeight: number;', 'dockInset: number;');
input = input.replace('tabBarHeight,', 'dockInset,');
input = input.replace('tabBarHeight + 10', 'dockInset');
fs.writeFileSync(messageInputTsx, input);

const messageListTsx = 'src/features/messages/components/MessageList.tsx';
let list = fs.readFileSync(messageListTsx, 'utf8');
if (!list.includes('dockInset: number;')) {
  list = list.replace('insets: any;', 'insets: any;\n  dockInset: number;');
  list = list.replace('insets,', 'insets,\n  dockInset,');
  list = list.replace('paddingBottom: 24,', 'paddingBottom: dockInset + 60,'); // padding input
}
fs.writeFileSync(messageListTsx, list);
