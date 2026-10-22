// Builds an Artifact page body from dist/index.html (the publish step adds its own
// doctype/head/body skeleton) and prints the `files` map for dist/assets.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const [outPage = 'dist/artifact.html'] = process.argv.slice(2)
const html = readFileSync('dist/index.html', 'utf8')
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? ''
const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? ''
const keep = head
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l.startsWith('<title') || l.startsWith('<link rel="stylesheet"') || l.startsWith('<link rel="modulepreload"') || l.startsWith('<script'))
const page = [
  '<title>Domus Residence</title>',
  '<meta name="claude:viewport-fit-sides" content="cover">',
  ...keep.filter((l) => !l.startsWith('<title')),
  '<style>html,body{height:100%;background:#a9a39a}</style>',
  body.trim(),
].join('\n')
writeFileSync(outPage, page + '\n')
const files = Object.fromEntries(readdirSync('dist/assets').map((f) => [`assets/${f}`, join('dist/assets', f)]))
console.log(JSON.stringify(files, null, 2))
