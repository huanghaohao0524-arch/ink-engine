import fs from 'node:fs/promises'

const main = await fs.readFile('electron/main.mjs', 'utf8')

const checks = [
  {
    name: 'chapter function taxonomy exists',
    ok: main.includes('function buildChapterFunctionTaxonomy') &&
      main.includes('升级/能力兑现章') &&
      main.includes('阻碍升级章') &&
      main.includes('伏笔埋设/回收章'),
  },
  {
    name: 'chapter progress seed tracks chapter function ledger',
    ok: main.includes('## 章节功能账本') &&
      main.includes('最近三章功能') &&
      main.includes('下一章功能建议'),
  },
  {
    name: 'task card must decide chapter function before drafting',
    ok: main.includes('## 章节功能判定规则') &&
      main.includes('## 本章功能判定') &&
      main.includes('主功能') &&
      main.includes('功能交付物'),
  },
  {
    name: 'draft prompt executes chapter function contract',
    ok: main.includes('章节功能合同') &&
      main.includes('正文必须兑现任务卡中的主功能'),
  },
  {
    name: 'self check blocks incomplete chapter function',
    ok: main.includes('本章功能是否完成') &&
      main.includes('功能未完成') &&
      main.includes('本章功能结果'),
  },
  {
    name: 'auto revision reacts to function failure and stagnation',
    ok: main.includes('功能未完成') &&
      main.includes('原地踏步') &&
      main.includes('只重复上一章'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('Chapter function state smoke failed')
}
