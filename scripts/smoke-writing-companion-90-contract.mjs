import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const types = readFileSync('src/vite-env.d.ts', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const checks = [
  ['90 contract builder exists', main.includes('function buildWritingCompanion90Contract')],
  ['chat prompt uses contract', main.includes('buildProjectChatPrompt') && main.includes("buildWritingCompanion90Contract({ mode: 'chat'")],
  ['project update prompt uses contract', main.includes('buildProjectUpdatePatchPrompt') && main.includes("buildWritingCompanion90Contract({ mode: 'project-update'")],
  ['repair prompt uses contract', main.includes('buildProjectRepairPatchPrompt') && main.includes("buildWritingCompanion90Contract({ mode: 'project-repair'")],
  ['chapter execution contract embeds 90 contract', main.includes('buildChapterExecutionContract') && main.includes("buildWritingCompanion90Contract({ mode: 'chapter-writing'")],
  ['outline prompt embeds 90 contract', main.includes('buildOutlinePrompt') && main.includes("buildWritingCompanion90Contract({ mode: 'outline'")],
  ['next chapter flow returns quality summary', main.includes('companion90Summary: buildCompanion90FlowSummary') && types.includes('companion90Summary?: Companion90FlowSummary')],
  ['frontend surfaces next chapter 90 summary', app.includes('companion90Summary: generated.draft.companion90Summary') && app.includes('companion90-summary-card')],
  ['hard gate warnings mention 90 contract', main.includes('90% 写作搭档合同未通过')],
  ['package exposes smoke', pkg.scripts?.['smoke:writing-companion-90'] === 'node scripts/smoke-writing-companion-90-contract.mjs'],
  ['core includes smoke', pkg.scripts?.['smoke:core']?.includes('smoke:writing-companion-90')],
]

const failed = checks.filter(([, ok]) => !ok)

if (failed.length) {
  console.error('Writing companion 90 contract smoke failed:')
  for (const [label] of failed) {
    console.error(`- ${label}`)
  }
  process.exit(1)
}

console.log('Writing companion 90 contract smoke passed.')
