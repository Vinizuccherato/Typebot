// Usage: node scripts/shot.mjs <url> <out.png> [width] [height] [waitMs]
// Headless Chromium with SwiftShader WebGL so the R3F scene renders.
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
let playwright
try {
  playwright = require('playwright')
} catch {
  playwright = require(`${process.execPath.replace(/bin\/node$/, '')}lib/node_modules/playwright`)
}
const [url = 'http://localhost:5173', out = '.qa/shot.png', w = '1600', h = '900', wait = '3500'] = process.argv.slice(2)
const browser = await playwright.chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 })
const logs = []
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(+wait)
await page.screenshot({ path: out })
console.log(`saved ${out}`)
if (logs.length) console.log(logs.slice(0, 30).join('\n'))
await browser.close()
