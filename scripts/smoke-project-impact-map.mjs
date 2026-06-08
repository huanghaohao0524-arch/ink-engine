import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const types = readFileSync('src/vite-env.d.ts', 'utf8')
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

const checks = [
  ['impact map budget exists', main.includes('projectImpactMap: 1800')],
  ['impact map material is listed', main.includes("id: 'projectImpactMap'") && main.includes('project-impact-map.md')],
  ['impact map reader exists', main.includes('async function readProjectImpactMapMaterial')],
  ['project context reads impact map', main.includes('projectImpactMap: await readProjectImpactMapMaterial(bookPath)')],
  ['stable context exposes impact map', main.includes('## 全项目影响图') && main.includes('context.projectImpactMap')],
  ['impact map prompt builder exists', main.includes('function buildProjectImpactMapPrompt')],
  ['project update package returns impact map', (main.includes('impactMap: await generateProjectImpactMap') || (main.includes('const impactMap = await generateProjectImpactMap') && main.includes('impactMap,'))) && types.includes('impactMap?: ProjectImpactMap')],
  ['smart feedback returns impact map', main.includes('projectImpactMap') && types.includes('projectImpactMap?: ProjectImpactMap')],
  ['apply project update persists impact map', main.includes('persistProjectImpactMap') && main.includes('input.impactMap')],
  ['frontend carries impact map', app.includes('projectImpactMap?: ProjectImpactMap') && app.includes('projectImpactMap: generated.projectImpactMap')],
  ['frontend renders impact map', app.includes('className="project-impact-map-card"') && app.includes('全项目影响图')],
  ['package exposes smoke', pkg.scripts?.['smoke:project-impact-map'] === 'node scripts/smoke-project-impact-map.mjs'],
  ['core includes smoke', pkg.scripts?.['smoke:core']?.includes('smoke:project-impact-map')],
]

const failed = checks.filter(([, ok]) => !ok)

if (failed.length) {
  console.error('Project impact map smoke failed:')
  for (const [label] of failed) {
    console.error(`- ${label}`)
  }
  process.exit(1)
}

console.log('Project impact map smoke passed.')
