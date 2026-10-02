const sharp = require('sharp');
const fs = require('fs');

async function generate() {
  const input = 'docs/redesign/refs/logo app.png'; // Or whatever logo is right
  
  if (!fs.existsSync(input)) {
    console.warn("Input not found");
    return;
  }
  
  // Any icon 192, 512
  await sharp(input).resize(192, 192).toFile('public/icon-192-any.png');
  await sharp(input).resize(512, 512).toFile('public/icon-512-any.png');
  
  // Maskable icon 192, 512 (with padding for maskable)
  await sharp(input).resize(192, 192, { fit: 'contain', background: { r: 15, g: 13, b: 24, alpha: 1 } }).toFile('public/icon-192-maskable.png');
  await sharp(input).resize(512, 512, { fit: 'contain', background: { r: 15, g: 13, b: 24, alpha: 1 } }).toFile('public/icon-512-maskable.png');
  
  // apple-touch-icon 180x180
  await sharp(input).resize(180, 180).toFile('public/apple-touch-icon.png');
  
  console.log("Icons generated");
}
generate();
