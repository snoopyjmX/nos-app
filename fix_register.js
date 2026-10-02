const fs = require('fs');
let reg = fs.readFileSync('src/app/(auth)/register.tsx', 'utf8');

const newHandlers = `
  const handleTerms = () => router.push('/terms');
  const handlePrivacy = () => router.push('/privacy');

  const handleRegister = async () => {`;

reg = reg.replace("  const handleRegister = async () => {", newHandlers);

fs.writeFileSync('src/app/(auth)/register.tsx', reg);
