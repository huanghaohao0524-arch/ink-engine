import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')

const checks = [
  ['project package has base output limit', main.includes('projectPackageBase: 1400')],
  ['project package has rules output limit', main.includes('projectPackageRules: 2200')],
  ['project package has outline output limit', main.includes('projectPackageOutline: 2600')],
  ['project package context builder exists', main.includes('function buildProjectPackageContext')],
  ['project package section prompt builder exists', main.includes('function buildProjectPackageSectionPrompt')],
  ['project package section generator exists', main.includes('async function generateProjectPackageSection')],
  ['project package generation iterates sections', main.includes("const sections = ['base', 'rules', 'outline', 'characters', 'tracking']")],
  ['project package merges parts instead of one giant response', main.includes('Object.assign(packageParts, part)')],
  ['project package extracts balanced JSON objects', main.includes('function findBalancedJsonObjects')],
  ['project package retries invalid JSON through repair prompt', main.includes('async function repairProjectPackageSectionJson')],
  ['project package falls back instead of throwing parse error', main.includes('fallbackProjectPackageSection(section, known)')],
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length > 0) {
  for (const [label] of failures) {
    console.error(`Project package split smoke failed: ${label}`)
  }
  process.exit(1)
}

console.log('Project package split smoke passed.')
