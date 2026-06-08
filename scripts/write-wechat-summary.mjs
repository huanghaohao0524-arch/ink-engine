import fs from 'node:fs/promises'
import path from 'node:path'

const desktopSummaryPath = path.resolve('C:/Users/damon/Desktop/墨引擎-微信总结.txt')
const growthReportPath = path.resolve('build/writing-fingerprints/latest-growth-report.json')
const discoveryPath = path.resolve('build/writing-fingerprints/discovered-book-candidates.json')

async function main() {
  const growth = JSON.parse(await fs.readFile(growthReportPath, 'utf8'))
  const discovery = JSON.parse(await fs.readFile(discoveryPath, 'utf8'))

  const lines = [
    '墨引擎样本扩容进度汇总',
    '',
    `当前大题材目标：${growth.genreTargetSampleCount}本`,
    `当前子题材目标：${growth.subgenreTargetSampleCount}本`,
    '',
    '当前样本进度：',
  ]

  for (const genre of growth.genres) {
    lines.push(`- ${genre.genre}：现有${genre.currentSampleCount}本，距目标还差${genre.remainingToGenreTarget}本`)
  }

  lines.push('')
  lines.push('当前已建立的大题材：网游、都市、玄幻、悬疑、古言')
  lines.push('当前已建立的能力：')
  lines.push('- 多题材一键采样')
  lines.push('- 子题材目标追踪')
  lines.push('- 指纹自动重建')
  lines.push('- 候选书目自动发现')
  lines.push('- 增长报告自动输出')
  lines.push('')
  lines.push('候选发现情况：')

  for (const genre of discovery.genres) {
    lines.push(`- ${genre.genre}：本轮新发现候选${genre.discoveredCount}本`)
  }

  lines.push('')
  lines.push('当前判断：')
  lines.push('1. 样本工厂已经搭起来了，不再是纯手工补书单。')
  lines.push('2. 现在最大瓶颈不在脚本结构，而在候选筛选质量和书源命中率。')
  lines.push('3. 下一步要继续做的是：清洗候选池、批量转成可采样书单、继续往1000本目标推进。')
  lines.push('')
  lines.push('补充说明：我这边已经继续扩容，不会停在当前进度。')

  await fs.writeFile(desktopSummaryPath, `${lines.join('\n')}\n`, 'utf8')
  console.log(desktopSummaryPath)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
