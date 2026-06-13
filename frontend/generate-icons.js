/**
 * Generates PWA icons as SVG files (converted to PNG via sharp if available,
 * otherwise saves SVG with .png extension for basic compatibility).
 * Run: node generate-icons.js
 */
const fs = require("fs");
const path = require("path");

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function generateSVG(size) {
  const center = size / 2;
  const radius = size * 0.45;
  const starScale = size * 0.28;
  const fontSize = size * 0.22;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>
  <text x="${center}" y="${center + fontSize * 0.35}"
    font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold"
    fill="white" text-anchor="middle">₹AI</text>
</svg>`;
}

const iconsDir = path.join(__dirname, "public", "icons");
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

sizes.forEach((size) => {
  const svg = generateSVG(size);
  // Save as SVG first
  const svgPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`Generated: icon-${size}x${size}.svg`);
});

console.log("\nSVG icons generated in public/icons/");
console.log("Note: For production, convert SVGs to PNGs using a tool like:");
console.log("  npx sharp-cli --input public/icons/*.svg --output public/icons/");
