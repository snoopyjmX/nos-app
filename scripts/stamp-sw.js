// Carimba o CACHE_NAME do service worker publicado com um identificador único por build.
// Assim o sw.js muda byte a byte a cada deploy: o navegador instala o novo worker e o
// `activate` apaga os caches antigos. Roda DEPOIS do `expo export`, sobre `dist/sw.js`,
// para não alterar `public/sw.js` (versionado) a cada build local.
const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'dist', 'sw.js');
const pattern = /const CACHE_NAME = '[^']*';/;

if (!fs.existsSync(target)) {
  console.error(`stamp-sw: ${target} não encontrado. Rode "expo export -p web" antes.`);
  process.exit(1);
}

const source = fs.readFileSync(target, 'utf8');
if (!pattern.test(source)) {
  console.error('stamp-sw: linha "const CACHE_NAME = \'...\';" não encontrada em dist/sw.js.');
  process.exit(1);
}

const buildId = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || Date.now().toString(36);
const cacheName = `nos-static-${buildId}`;

fs.writeFileSync(target, source.replace(pattern, `const CACHE_NAME = '${cacheName}';`));
console.log(`stamp-sw: CACHE_NAME = ${cacheName}`);
