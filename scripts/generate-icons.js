const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcIcon = path.join(root, 'src', 'assets', 'icon.png');
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');

const androidSizes = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function generate() {
  if (!fs.existsSync(srcIcon)) {
    console.error('Source icon not found at', srcIcon);
    process.exit(1);
  }

  for (const item of androidSizes) {
    const dir = path.join(androidRes, item.folder);
    ensureDir(dir);
    const outPath = path.join(dir, 'ic_launcher.png');
    const outRound = path.join(dir, 'ic_launcher_round.png');

    await sharp(srcIcon).resize(item.size, item.size).toFile(outPath);
    await sharp(srcIcon).resize(item.size, item.size).toFile(outRound);
    console.log('Wrote', outPath);
  }

  // notification icon (small) - use mdpi 24px
  const drawableDir = path.join(androidRes, 'drawable');
  ensureDir(drawableDir);
  const notifOut = path.join(drawableDir, 'ic_notification.png');
  await sharp(srcIcon).resize(24, 24).toFile(notifOut);
  console.log('Wrote', notifOut);

  // Also write a Play Store sized image
  const playOut = path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-playstore.png');
  await sharp(srcIcon).resize(512, 512).toFile(playOut);
  console.log('Wrote', playOut);

  console.log('Icon generation complete. Rebuild the app to see changes.');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
