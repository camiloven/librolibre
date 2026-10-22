import fs from 'fs';
import zlib from 'zlib';

function createSolidPNG(width, height, r, g, b, a = 255) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data: filter byte (0) + width * 4 bytes per scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      // Draw dark background (#0b0f19) with emerald green circular badge (#10b981)
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const radius = width * 0.42;

      if (dist <= radius) {
        // Emerald gradient badge
        const innerRatio = dist / radius;
        rawData[pxOffset] = Math.round(16 + (52 - 16) * (1 - innerRatio));     // R
        rawData[pxOffset + 1] = Math.round(185 + (211 - 185) * (1 - innerRatio)); // G
        rawData[pxOffset + 2] = Math.round(129 + (153 - 129) * (1 - innerRatio)); // B
        rawData[pxOffset + 3] = 255;
      } else {
        // Dark background
        rawData[pxOffset] = 11;
        rawData[pxOffset + 1] = 15;
        rawData[pxOffset + 2] = 25;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  // Deflate compressed IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeInt32BE(crc, 8 + len);
  return chunk;
}

// CRC32 implementation for PNG
function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }

  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/pwa-192x192.png', createSolidPNG(192, 192));
fs.writeFileSync('./public/pwa-512x512.png', createSolidPNG(512, 512));
fs.writeFileSync('./public/pwa-maskable-512x512.png', createSolidPNG(512, 512));
fs.writeFileSync('./public/apple-touch-icon.png', createSolidPNG(180, 180));

console.log('PWA PNG icons generated successfully in ./public');
