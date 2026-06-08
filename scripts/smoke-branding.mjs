import fs from 'node:fs'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const indexHtml = fs.readFileSync('index.html', 'utf8')
const mainProcess = fs.readFileSync('electron/main.mjs', 'utf8')

const checks = [
  ['top-level productName is 墨引擎', packageJson.productName === '墨引擎'],
  ['builder productName is 墨引擎', packageJson.build?.productName === '墨引擎'],
  ['appId moved to ink-engine', packageJson.build?.appId === 'com.damon.ink-engine'],
  ['shortcutName is 墨引擎', packageJson.build?.nsis?.shortcutName === '墨引擎'],
  ['Windows icon configured', packageJson.build?.win?.icon === 'build/icon.ico'],
  ['build assets included', packageJson.build?.files?.includes('build/**/*')],
  ['HTML title is 墨引擎', indexHtml.includes('<title>墨引擎</title>')],
  ['main window title is 墨引擎', mainProcess.includes("appTitle: '\\u58a8\\u5f15\\u64ce 0.1.0'")],
  ['main window icon points at build/icon.png', mainProcess.includes("path.join(__dirname, '..', 'build', 'icon.png')")],
  ['PNG icon exists', fs.existsSync('build/icon.png')],
  ['ICO icon exists', fs.existsSync('build/icon.ico')],
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length > 0) {
  for (const [label] of failures) {
    console.error(`Branding smoke failed: ${label}`)
  }
  process.exit(1)
}

console.log('Branding smoke passed.')
