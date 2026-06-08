import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const names = {
  outline: '\u5927\u7eb2',
}

function normalizeMeaningfulContent(content) {
  return String(content ?? '')
    .replace(/^#.*$/gm, '')
    .replace(/[-*_>`#\s]/g, '')
    .trim()
}

function isMeaningfulMarkdown(content) {
  return normalizeMeaningfulContent(content).length >= 12
}

const bookPath = await fs.mkdtemp(path.join(os.tmpdir(), 'ai-writing-material-'))
await fs.mkdir(path.join(bookPath, names.outline), { recursive: true })

const template = ['# 第一卷卷纲', '', '## 本卷目标', '', '## 主要冲突', '', '## 阶段性爽点', '', '## 章节推进'].join('\n')
const realOutline = ['# 第一卷卷纲', '', '主角在前三章发现道遥子的百年功力不是馈赠，而是追杀名单的钥匙。第一卷目标是让主角从被动逃亡转为主动设局。'].join('\n')

await fs.writeFile(path.join(bookPath, names.outline, 'volume-001.md'), template, 'utf8')
const templateReady = isMeaningfulMarkdown(template)

await fs.writeFile(path.join(bookPath, names.outline, 'volume-001.md'), realOutline, 'utf8')
const realReady = isMeaningfulMarkdown(realOutline)

console.log(JSON.stringify({ bookPath, templateReady, realReady }, null, 2))

if (templateReady || !realReady) {
  throw new Error('Material readiness smoke failed')
}
