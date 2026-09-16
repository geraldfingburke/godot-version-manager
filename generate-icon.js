const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

async function generateCascadingLogo() {
  const godotSvgContent = fs.readFileSync(path.join(__dirname, 'Godot_icon.svg'), 'utf8');

  // Strip xml declaration and wrapping <svg> tag to embed inner elements inside defs
  const innerSvg = godotSvgContent
    .replace(/<\?xml[\s\S]*?<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '');

  const cascadingSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg
   xmlns="http://www.w3.org/2000/svg"
   xmlns:xlink="http://www.w3.org/1999/xlink"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   xmlns:dc="http://purl.org/dc/elements/1.1/"
   xmlns:cc="http://creativecommons.org/ns#"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   viewBox="0 0 1350 1350"
   width="1350"
   height="1350">
  <defs>
    <g id="godot-single-logo">
      ${innerSvg}
    </g>
  </defs>
  <!-- Logo 1 (Back, Top-Left) -->
  <use href="#godot-single-logo" transform="translate(0, 0) scale(0.80)" opacity="0.45" />
  <!-- Logo 2 (Middle) -->
  <use href="#godot-single-logo" transform="translate(130, 130) scale(0.80)" opacity="0.75" />
  <!-- Logo 3 (Front, Bottom-Right) -->
  <use href="#godot-single-logo" transform="translate(260, 260) scale(0.80)" opacity="1.0" />
</svg>`;

  const svgPath = path.join(__dirname, 'cascading_logo.svg');
  const publicSvgPath = path.join(__dirname, 'src/renderer/public/cascading_logo.svg');
  const buildIconPath = path.join(__dirname, 'build/icon.png');

  fs.writeFileSync(svgPath, cascadingSvg);
  fs.ensureDirSync(path.join(__dirname, 'src/renderer/public'));
  fs.writeFileSync(publicSvgPath, cascadingSvg);

  fs.ensureDirSync(path.join(__dirname, 'build'));
  await sharp(Buffer.from(cascadingSvg))
    .resize(512, 512)
    .png()
    .toFile(buildIconPath);

  console.log('Successfully generated cascading_logo.svg and build/icon.png!');
}

generateCascadingLogo().catch(err => {
  console.error('Error generating logo:', err);
  process.exit(1);
});
