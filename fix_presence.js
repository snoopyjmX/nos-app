const fs = require('fs');

const securityTsx = 'src/features/profile/components/SecuritySection.tsx';
let sec = fs.readFileSync(securityTsx, 'utf8');

sec = sec.replace(/<View style=\{\[styles\.securityDivider, \{ backgroundColor: colors\.border \}\]\} \/>\s*<View style=\{styles\.securityRow\}>\s*<View[\s\S]*?<\/View>\s*<\/View>/g, function(match) {
  if (match.includes('Status de Presença')) {
    return '';
  }
  return match;
});
sec = sec.replace('const [showPresence, setShowPresence] = useState(true);', '');
sec = sec.replace("import React, { useState } from 'react';", "import React from 'react';");
sec = sec.replace("Switch,", "");
fs.writeFileSync(securityTsx, sec);

const messagesTsx = 'src/app/(tabs)/messages.tsx';
let msgs = fs.readFileSync(messagesTsx, 'utf8');
msgs = msgs.replace("const presenceText = 'Online agora'; // Presença opcional exibida", "");
msgs = msgs.replace("presenceText={presenceText}", "");
fs.writeFileSync(messagesTsx, msgs);

const msgsHeader = 'src/features/messages/components/MessagesHeader.tsx';
let header = fs.readFileSync(msgsHeader, 'utf8');
header = header.replace("presenceText?: string;", "");
header = header.replace("presenceText }:", "}:");
header = header.replace("{presenceText || 'Bilhetes carinhosos'}", "'Bilhetes carinhosos'");
fs.writeFileSync(msgsHeader, header);

