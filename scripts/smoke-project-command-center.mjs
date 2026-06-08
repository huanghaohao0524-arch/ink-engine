import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const styles = readFileSync('src/styles.css', 'utf8')

const appContracts = [
  'buildProjectCommandCenter',
  'groupKnowledgeMaterials',
  'buildChapterRouteSteps',
  'project-command-center',
  'knowledge-board',
  'chapter-route',
]

const styleContracts = [
  '.project-command-center',
  '.command-metric-grid',
  '.knowledge-board',
  '.knowledge-lane',
  '.chapter-route',
  '.route-step',
]

const missing = [
  ...appContracts.filter((contract) => !app.includes(contract)),
  ...styleContracts.filter((contract) => !styles.includes(contract)),
]

if (missing.length > 0) {
  throw new Error(`Missing project command center contracts: ${missing.join(', ')}`)
}

console.log('smoke-project-command-center passed')
