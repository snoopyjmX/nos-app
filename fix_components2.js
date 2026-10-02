const fs = require('fs');

const heroTsx = 'src/features/home/components/HeroCard.tsx';
let hero = fs.readFileSync(heroTsx, 'utf8');
hero = hero.replace("color: colors.white,", ""); // remove from styles
hero = hero.replace("style={styles.heroName}", "style={[styles.heroName, { color: colors.white }]}");
fs.writeFileSync(heroTsx, hero);

const memTsx = 'src/features/memories/components/MemoryPreviewModal.tsx';
let mem = fs.readFileSync(memTsx, 'utf8');
mem = mem.replace(/color: colors\.white,/g, "");
mem = mem.replace("style={styles.previewDate}", "style={[styles.previewDate, { color: colors.white }]}");
mem = mem.replace("style={styles.previewActionLabel}", "style={[styles.previewActionLabel, { color: colors.white }]}");
fs.writeFileSync(memTsx, mem);

// Messages: dockInset is still passed to Skeleton and Header.
let msg = fs.readFileSync('src/app/(tabs)/messages.tsx', 'utf8');
msg = msg.replace(/dockInset=\{dockInset\}\s*\/>/g, '/>');
msg = msg.replace(/dockInset=\{dockInset\}\s*\n/g, '');
fs.writeFileSync('src/app/(tabs)/messages.tsx', msg);

