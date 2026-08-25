import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Precision SVG matching the user's uploaded logo exactly
const svgContent = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="redGrad" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#FF1124"/>
      <stop offset="70%" stop-color="#ED0015"/>
      <stop offset="100%" stop-color="#D60012"/>
    </radialGradient>
    
    <linearGradient id="innerShadowGrad" x1="20%" y1="20%" x2="85%" y2="85%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.18"/>
      <stop offset="40%" stop-color="#000000" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>

    <linearGradient id="foldGrad" x1="30%" y1="40%" x2="90%" y2="80%">
      <stop offset="0%" stop-color="#E1E6EB"/>
      <stop offset="50%" stop-color="#CBD5E1"/>
      <stop offset="100%" stop-color="#94A3B8"/>
    </linearGradient>
    
    <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Red Squircle Base -->
  <rect x="16" y="16" width="480" height="480" rx="140" fill="url(#redGrad)"/>

  <!-- Logo Mark (Centered Origami Play Button) -->
  <g filter="url(#softGlow)">
    <!-- Base White Origami Polygon -->
    <path d="M 200 135
             C 186 135 176 146 176 160
             L 176 340
             C 176 354 187 365 201 365
             L 315 365
             C 345 365 365 342 355 315
             C 352 308 348 301 342 294
             L 242 162
             C 232 145 218 135 200 135 Z"
          fill="#FFFFFF" />

    <!-- Left Vertical Stem Pill -->
    <rect x="176" y="145" width="56" height="210" rx="28" fill="#FFFFFF" />

    <!-- Origami Flap Fold (Curved Inner Shading) -->
    <path d="M 224 220
             C 224 260 250 320 345 340
             C 358 335 362 322 354 312
             L 242 165
             C 230 152 224 165 224 185 Z"
          fill="url(#foldGrad)"
          opacity="0.9" />

    <!-- Top White Cap & Crisp Edge -->
    <path d="M 202 135
             C 188 135 176 146 176 160
             L 176 330
             L 224 330
             L 224 180
             C 224 160 238 145 255 162
             L 346 295
             C 353 304 355 312 354 316
             L 236 150
             C 226 138 214 135 202 135 Z"
          fill="#FFFFFF" />
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.join(process.cwd(), 'public');
  
  // 1. Write icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent.trim());
  console.log('Written icon.svg');

  // 2. Generate icon-512.png
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Generated icon-512.png');

  // 3. Generate icon-192.png
  await sharp(Buffer.from(svgContent))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  // 4. Generate apple-touch-icon.png (180x180)
  await sharp(Buffer.from(svgContent))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 5. Generate favicon (32x32 png / ico compatible)
  await sharp(Buffer.from(svgContent))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Generated favicon.ico');

  // 6. Generate nexttube-logo.png
  const logoBannerSvg = `
  <svg width="600" height="200" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="redGrad2" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stop-color="#FF1124"/>
        <stop offset="70%" stop-color="#ED0015"/>
        <stop offset="100%" stop-color="#D60012"/>
      </radialGradient>
      <linearGradient id="foldGrad2" x1="30%" y1="40%" x2="90%" y2="80%">
        <stop offset="0%" stop-color="#E1E6EB"/>
        <stop offset="50%" stop-color="#CBD5E1"/>
        <stop offset="100%" stop-color="#94A3B8"/>
      </linearGradient>
    </defs>
    
    <!-- Icon Box -->
    <rect x="25" y="25" width="150" height="150" rx="44" fill="url(#redGrad2)"/>
    
    <g transform="translate(-30, -32) scale(0.68)">
      <path d="M 200 135 C 186 135 176 146 176 160 L 176 340 C 176 354 187 365 201 365 L 315 365 C 345 365 365 342 355 315 C 352 308 348 301 342 294 L 242 162 C 232 145 218 135 200 135 Z" fill="#FFFFFF" />
      <rect x="176" y="145" width="56" height="210" rx="28" fill="#FFFFFF" />
      <path d="M 224 220 C 224 260 250 320 345 340 C 358 335 362 322 354 312 L 242 165 C 230 152 224 165 224 185 Z" fill="url(#foldGrad2)" opacity="0.9" />
    </g>

    <!-- Text -->
    <text x="200" y="126" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="76" letter-spacing="-1.5">
      <tspan fill="#FFFFFF">Next</tspan><tspan fill="#FF1E27">Tube</tspan>
    </text>
  </svg>
  `;
  await sharp(Buffer.from(logoBannerSvg))
    .resize(600, 200)
    .png()
    .toFile(path.join(publicDir, 'nexttube-logo.png'));
  console.log('Generated nexttube-logo.png');
}

generate().catch(console.error);
