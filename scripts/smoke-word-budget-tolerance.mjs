import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const failures = []

const boundsStart = main.indexOf('function getChapterWordBounds')
const boundsEnd = main.indexOf('\nfunction getPlatformWritingStrategy', boundsStart)
const boundsFn = boundsStart >= 0 && boundsEnd > boundsStart ? main.slice(boundsStart, boundsEnd) : ''

if (!main.includes('function getPlatformWordOvershootTolerance')) {
  failures.push('missing platform word overshoot tolerance helper')
}

if (!main.includes('Math.ceil(policy.max * 0.08)')) {
  failures.push('word budget tolerance should allow small percentage overrun')
}

if (!main.includes("platform === '\\u756a\\u8304' ? Math.max(180")) {
  failures.push('fanqie tolerance should not fail tiny 30-100 char overruns')
}

if (!main.includes('Math.max(3000, policy.max + overshootTolerance)')) {
  failures.push('word budget hard max should allow user-approved drafts within 3000 chars')
}

if (!boundsFn.includes('getPlatformWordOvershootTolerance(platform, policy)')) {
  failures.push('getChapterWordBounds should use platform tolerance helper')
}

if (!boundsFn.includes('hardMax: Math.max(3000, policy.max + overshootTolerance)')) {
  failures.push('hardMax should use the user-approved 3000 char ceiling floor')
}

if (pkg.scripts?.['smoke:word-budget-tolerance'] !== 'node scripts/smoke-word-budget-tolerance.mjs') {
  failures.push('package exposes smoke:word-budget-tolerance')
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Word budget tolerance smoke passed')
