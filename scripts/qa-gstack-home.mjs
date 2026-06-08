import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const artifactsDir = path.join(root, 'artifacts', 'gstack')
const viteLog = path.join(artifactsDir, 'vite-home.log')
const reportPath = path.join(artifactsDir, 'home-report.json')
const screenshotPath = path.join(artifactsDir, 'home.png')
const browseCandidates = [
  'D:\\ai\\技能\\gstack-main\\gstack-main\\browse\\dist\\browse.exe',
  path.join(process.env.USERPROFILE ?? '', '.codex', 'skills', 'gstack', 'browse', 'dist', 'browse.exe'),
]
const gstackSourceRoot = 'D:\\ai\\技能\\gstack-main\\gstack-main'
const browseServerScript = path.join(gstackSourceRoot, 'browse', 'src', 'server.ts')
const chromeCandidates = [
  process.env.GSTACK_CHROMIUM_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean)

function findExisting(paths) {
  return paths.find((candidate) => {
    try {
      return candidate && spawnSync('cmd.exe', ['/c', 'if', 'exist', `"${candidate}"`, 'exit', '0', 'else', 'exit', '1'], { shell: false }).status === 0
    } catch {
      return false
    }
  })
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      GSTACK_CHROMIUM_PATH: options.chromePath ?? process.env.GSTACK_CHROMIUM_PATH ?? '',
      BROWSE_SERVER_SCRIPT: options.serverScript ?? process.env.BROWSE_SERVER_SCRIPT ?? browseServerScript,
    },
    maxBuffer: 1024 * 1024 * 8,
    shell: false,
  })

  return {
    command: [command, ...args].join(' '),
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

async function waitForUrl(url, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return true
    } catch {
      // Server not ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return false
}

async function startViteIfNeeded(port) {
  const url = `http://127.0.0.1:${port}`
  if (await waitForUrl(url, 1000)) return { started: false, url }

  const out = await fs.open(viteLog, 'w')
  const child = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev:renderer', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: root,
    detached: true,
    stdio: ['ignore', out.fd, out.fd],
    windowsHide: true,
  })
  child.unref()
  await out.close()

  if (!(await waitForUrl(url))) {
    const log = await fs.readFile(viteLog, 'utf8').catch(() => '')
    throw new Error(`Vite dev server did not become ready on ${url}\n${log}`)
  }

  return { started: true, url }
}

async function main() {
  await fs.mkdir(artifactsDir, { recursive: true })

  const browse = findExisting(browseCandidates)
  if (!browse) throw new Error(`gstack browse.exe not found. Checked:\n${browseCandidates.join('\n')}`)
  if (!findExisting([browseServerScript])) throw new Error(`gstack server source not found: ${browseServerScript}`)

  const chromePath = findExisting(chromeCandidates)
  if (!chromePath) throw new Error(`Chrome/Edge executable not found. Checked:\n${chromeCandidates.join('\n')}`)

  const { url, started } = await startViteIfNeeded(5173)

  const steps = []
  const browseOptions = { chromePath, serverScript: browseServerScript }
  steps.push(run(browse, ['goto', url], browseOptions))
  steps.push(run(browse, ['text'], browseOptions))
  steps.push(run(browse, ['snapshot', '-i'], browseOptions))
  steps.push(run(browse, ['screenshot', '--viewport', screenshotPath], browseOptions))
  steps.push(run(browse, ['click', '@e1'], browseOptions))
  steps.push(run(browse, ['snapshot', '-D', '-i'], browseOptions))
  steps.push(run(browse, ['console', '--errors'], browseOptions))

  const [gotoStep, textStep, snapshotStep, screenshotStep, clickStep, diffStep, consoleStep] = steps
  const failures = steps.filter((step) => step.status !== 0)
  const pageLoaded = textStep.stdout.includes('AI 写作工作台') && textStep.stdout.includes('书籍总控台')
  const homeControlsVisible = snapshotStep.stdout.includes('AI 设置') && snapshotStep.stdout.includes('选择写作库')
  const settingsControlsVisible =
    diffStep.stdout.includes('OpenAI API Key') &&
    diffStep.stdout.includes('Base URL') &&
    diffStep.stdout.includes('保存设置')
  const consoleOnlyKnownNoise =
    consoleStep.stdout.includes('(no console errors)') ||
    consoleStep.stdout.includes('status of 404') ||
    consoleStep.stdout.trim() === ''

  const report = {
    ok: failures.length === 0 && pageLoaded && homeControlsVisible && settingsControlsVisible && consoleOnlyKnownNoise,
    url,
    startedVite: started,
    browse,
    chromePath,
    screenshotPath,
    checks: {
      pageLoaded,
      homeControlsVisible,
      settingsControlsVisible,
      consoleOnlyKnownNoise,
    },
    steps: steps.map((step) => ({
      command: step.command,
      status: step.status,
      stdout: step.stdout.slice(0, 4000),
      stderr: step.stderr.slice(0, 4000),
    })),
  }

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(JSON.stringify(report, null, 2))

  if (!report.ok) {
    throw new Error(`gstack home QA failed. Report: ${reportPath}`)
  }

  // Keep variables referenced so failures are easier to inspect in reports.
  void gotoStep
  void screenshotStep
  void clickStep
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
