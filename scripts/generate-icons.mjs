import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const svgPath = fileURLToPath(new URL('../public/icons/icon.svg', import.meta.url))
const outDir = fileURLToPath(new URL('../public/icons/', import.meta.url))

const targets = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]

for (const [name, size] of targets) {
  await sharp(svgPath, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(outDir + name)
  console.log(`generated ${name} (${size}x${size})`)
}
