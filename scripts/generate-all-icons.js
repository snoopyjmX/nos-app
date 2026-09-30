const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 calculation table
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcData = chunk.slice(4, 8 + len);
  chunk.writeUInt32BE(crc32(crcData), 8 + len);
  return chunk;
}

function writeRgbaPng(width, height, rgbaBuffer) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  const stride = 1 + width * 4;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter None
    rgbaBuffer.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function decodePng(filePath) {
  const buf = fs.readFileSync(filePath);
  let pos = 8;
  const idats = [];
  let width = 0, height = 0;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(pos + 8);
      height = buf.readUInt32BE(pos + 12);
    } else if (type === 'IDAT') {
      idats.push(buf.slice(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idats));
  const bpp = 4;
  const stride = 1 + width * bpp;
  const out = Buffer.alloc(width * height * bpp);
  let prev = null;
  for (let y = 0; y < height; y++) {
    const filter = raw[y * stride];
    const row = raw.slice(y * stride + 1, (y + 1) * stride);
    const outRow = Buffer.alloc(width * bpp);
    for (let x = 0; x < width * bpp; x++) {
      const a = x >= bpp ? outRow[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = (prev && x >= bpp) ? prev[x - bpp] : 0;
      let v = row[x];
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        let pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        v = (v + pr) & 0xff;
      }
      outRow[x] = v;
    }
    outRow.copy(out, y * width * bpp);
    prev = outRow;
  }
  return { width, height, data: out };
}

function resizeBilinear(src, srcW, srcH, dstW, dstH) {
  const dst = Buffer.alloc(dstW * dstH * 4);
  const xRatio = (srcW - 1) / (dstW - 1);
  const yRatio = (srcH - 1) / (dstH - 1);
  for (let y = 0; y < dstH; y++) {
    const srcY = y * yRatio;
    const yFloor = Math.floor(srcY);
    const yCeil = Math.min(yFloor + 1, srcH - 1);
    const yWeight = srcY - yFloor;
    for (let x = 0; x < dstW; x++) {
      const srcX = x * xRatio;
      const xFloor = Math.floor(srcX);
      const xCeil = Math.min(xFloor + 1, srcW - 1);
      const xWeight = srcX - xFloor;

      const idx00 = (yFloor * srcW + xFloor) * 4;
      const idx10 = (yFloor * srcW + xCeil) * 4;
      const idx01 = (yCeil * srcW + xFloor) * 4;
      const idx11 = (yCeil * srcW + xCeil) * 4;

      const dstIdx = (y * dstW + x) * 4;
      for (let c = 0; c < 4; c++) {
        const top = src[idx00 + c] * (1 - xWeight) + src[idx10 + c] * xWeight;
        const bot = src[idx01 + c] * (1 - xWeight) + src[idx11 + c] * xWeight;
        dst[dstIdx + c] = Math.round(top * (1 - yWeight) + bot * yWeight);
      }
    }
  }
  return dst;
}

// Main execution
const decoded = decodePng(path.join(__dirname, '..', 'assets', 'favicon.png'));
const fWidth = decoded.width;
const src = decoded.data;

// Crop 104x104 tightly centered on the infinity symbol (center: 97, 109)
// This gives ~75% fill ratio, which matches native Apple HIG app icon specifications!
const C_SIZE = 104;
const startX = 45;
const startY = 57;
const card = Buffer.alloc(C_SIZE * C_SIZE * 4);

for (let cy = 0; cy < C_SIZE; cy++) {
  for (let cx = 0; cx < C_SIZE; cx++) {
    const sx = startX + cx;
    const sy = startY + cy;
    const srcIdx = (sy * fWidth + sx) * 4;
    const dstIdx = (cy * C_SIZE + cx) * 4;
    card[dstIdx] = src[srcIdx];
    card[dstIdx + 1] = src[srcIdx + 1];
    card[dstIdx + 2] = src[srcIdx + 2];
    card[dstIdx + 3] = 255; // 100% solid, fully opaque
  }
}

// Clean any corner pixel to ensure seamless frosted glass background
for (let cy = 0; cy < C_SIZE; cy++) {
  for (let cx = 0; cx < C_SIZE; cx++) {
    const dstIdx = (cy * C_SIZE + cx) * 4;
    if (cy > 95 && (cx > 95 || cx < 10)) {
      const r = card[dstIdx], g = card[dstIdx + 1], b = card[dstIdx + 2];
      if (r < 210 && g < 210 && b < 215 && (b - g < 15)) {
        card[dstIdx] = 228;
        card[dstIdx + 1] = 224;
        card[dstIdx + 2] = 236;
      }
    }
  }
}

// Generate all sizes across public and assets:
const sizes = [
  { path: 'assets/icon.png', size: 1024 },
  { path: 'public/apple-touch-icon-v5.png', size: 180 },
  { path: 'public/apple-touch-icon.png', size: 180 },
  { path: 'public/icon.png', size: 512 },
  { path: 'public/icon-192.png', size: 192 },
  { path: 'assets/splash-icon.png', size: 512 },
  { path: 'assets/android-icon-foreground.png', size: 512 },
  { path: 'assets/android-icon-background.png', size: 512 },
];

for (const item of sizes) {
  const targetPath = path.join(__dirname, '..', item.path);
  console.log(`Generating ${item.path} (${item.size}x${item.size})...`);
  const resized = resizeBilinear(card, C_SIZE, C_SIZE, item.size, item.size);
  const pngData = writeRgbaPng(item.size, item.size, resized);
  fs.writeFileSync(targetPath, pngData);
  console.log(`✓ Saved ${item.path} (${pngData.length} bytes)`);
}

console.log('All icons generated successfully with 100% full-bleed frosted glass!');
