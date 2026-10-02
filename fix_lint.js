const { execSync } = require('child_process');

// A simple script to try to fix unused vars by replacing them or running eslint --fix
try {
  execSync('npx eslint --fix src/', { stdio: 'inherit' });
} catch (err) {}
