const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, "public", "icons");
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

function makeSVG(size) {
  const c = size / 2;
  const f = Math.round(size * 0.28);
  const rx = Math.round(size * 0.22);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${rx}" fill="url(#g)"/>
  <text x="${c}" y="${Math.round(c + f * 0.38)}" font-family="Arial,sans-serif"
    font-size="${f}" font-weight="bold" fill="white" text-anchor="middle">SS</text>
</svg>`;
}

async function run() {
  for (const s of sizes) {
    const buf = Buffer.from(makeSVG(s));
    await sharp(buf).png().toFile(path.join(iconsDir, `icon-${s}x${s}.png`));
    console.log(`icon-${s}x${s}.png`);
  }
  console.log("Done.");
}

run().catch(console.error);
