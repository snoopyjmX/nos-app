const sharp = require('sharp');
const path = require('path');

async function processIcon() {
  const input = path.join(__dirname, 'assets', 'favicon.png');
  const output = path.join(__dirname, 'assets', 'icone-anel-transparente.png');
  
  try {
    const metadata = await sharp(input).metadata();
    const radius = Math.min(metadata.width, metadata.height) / 2;
    const circleSvg = `<svg><circle cx="${radius}" cy="${radius}" r="${radius - 1}" /></svg>`;
    
    await sharp(input)
      .composite([{
        input: Buffer.from(circleSvg),
        blend: 'dest-in'
      }])
      .png()
      .toFile(output);
    console.log('Criado icone-anel-transparente.png');
  } catch (err) {
    console.error('Erro ao processar imagem:', err);
  }
}

processIcon();
