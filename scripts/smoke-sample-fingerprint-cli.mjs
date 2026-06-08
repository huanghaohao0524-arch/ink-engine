import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const scriptPath = path.join(root, 'scripts', 'analyze-sample-fingerprints-cli.mjs')
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ink-sample-fingerprint-'))
const libraryPath = path.join(tmpRoot, '写作样本库')
const bundlePath = path.join(tmpRoot, 'software', 'writing-fingerprints')
const samplePath = path.join(libraryPath, '原文样本', '网游')

fs.mkdirSync(samplePath, { recursive: true })

const chapter = (index) => [
  `第${index}章 隐藏任务`,
  '系统提示：你触发了隐藏任务，经验值开始结算。',
  '主角看了一眼面板，等级没有立刻提升，但技能栏亮起新的冷却标记。',
  '旁边玩家压低声音：“他刚才是不是拿到了首杀公告？”',
  'NPC没有回答，只把一枚旧徽章放到桌面。',
  '世界频道忽然刷新，所有人都看见了那个名字。',
].join('\n\n')

fs.writeFileSync(path.join(samplePath, '网游测试样本.txt'), Array.from({ length: 24 }, (_, index) => chapter(index + 1)).join('\n\n'), 'utf8')

execFileSync(process.execPath, [scriptPath, '--library', libraryPath, '--bundle', bundlePath], { cwd: root, stdio: 'pipe' })

const centralFingerprintFile = path.join(libraryPath, '题材指纹', '网游.md')
const bundledFingerprintFile = path.join(bundlePath, '题材指纹', '网游.md')
const indexFile = path.join(libraryPath, '题材指纹', 'genre-index.json')
const centralFingerprint = fs.readFileSync(centralFingerprintFile, 'utf8')
const bundledFingerprint = fs.readFileSync(bundledFingerprintFile, 'utf8')
const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'))
const group = index.genres?.[0]

const checks = [
  ['cli script exists', fs.existsSync(scriptPath)],
  ['central fingerprint output exists', fs.existsSync(centralFingerprintFile)],
  ['software bundle output exists', fs.existsSync(bundledFingerprintFile)],
  ['central index output exists', fs.existsSync(indexFile)],
  ['boundary is explicit', centralFingerprint.includes('不保存原文章节') && centralFingerprint.includes('不把样本原文带入生成上下文')],
  ['fingerprint is genre only', centralFingerprint.includes('# 网游 题材写作指纹')],
  ['genre signal is extracted', centralFingerprint.includes('网游信号密度') && centralFingerprint.includes('系统、任务、经验、等级')],
  ['source prose is not copied', !centralFingerprint.includes('NPC没有回答，只把一枚旧徽章放到桌面。')],
  ['software bundle receives only fingerprint mirror', bundledFingerprint === centralFingerprint],
  ['index records one genre', index.genres?.length === 1 && group.genre === '网游'],
  ['index records signal label', group.signalLabel === '网游信号'],
  ['chapter splitter detects multiple chapters', group.chapterCount >= 20],
  ['utf8 text is not misdecoded', group.sourceFiles?.[0]?.name === '网游测试样本.txt'],
  ['low chapter samples are gated out', fs.readFileSync(scriptPath, 'utf8').includes('minSampleChapters')],
  ['package exposes cli smoke', pkg.scripts?.['smoke:sample-fingerprint-cli'] === 'node scripts/smoke-sample-fingerprint-cli.mjs'],
  ['core smoke includes cli smoke', pkg.scripts?.['smoke:core']?.includes('smoke:sample-fingerprint-cli')],
]

const failures = checks.filter(([, ok]) => !ok).map(([name]) => name)

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('Sample fingerprint CLI smoke passed')
