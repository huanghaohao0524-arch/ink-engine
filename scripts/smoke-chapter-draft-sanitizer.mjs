import fs from 'node:fs'

const main = fs.readFileSync('electron/main.mjs', 'utf8')

const checks = [
  ['chapter draft sanitizer exists', main.includes('function sanitizeChapterDraftContent')],
  ['chapter draft assertion exists', main.includes('function assertCleanChapterDraftContent')],
  ['sanitizer recognizes final draft heading', main.includes('最终正文候选|最终正文|正文候选|本章重写稿|续写正文|修订后正文')],
  ['sanitizer blocks task card heading', main.includes('本章任务卡|任务卡|自检报告')],
  ['initial draft is sanitized through word budget gate', main.includes("sourceLabel: 'initial draft'") && main.includes('async function enforceChapterWordBudget') && main.includes('assertCleanChapterDraftContent(content, sourceLabel)')],
  ['self-check revision is sanitized', main.includes("}), '\\u81ea\\u68c0\\u4fee\\u8ba2\\u7a3f')")],
  ['state gate revision is sanitized', main.includes("}), '\\u72b6\\u6001\\u95e8\\u7981\\u4fee\\u8ba2\\u7a3f')")],
  ['retry candidate is sanitized', main.includes("}), '\\u5355\\u6b65\\u91cd\\u8bd5\\u5019\\u9009')")],
  ['feedback rewrite is sanitized through word budget gate', main.includes("sourceLabel: '\\u53cd\\u9988\\u91cd\\u5199\\u7a3f'") && main.includes("reason: 'feedback rewrite must keep platform chapter length'")],
  ['apply writing candidate sanitizes before writing', main.includes("assertCleanChapterDraftContent(input.content, '\\u5e94\\u7528\\u6b63\\u6587\\u5019\\u9009')")],
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length > 0) {
  for (const [label] of failures) {
    console.error(`Chapter draft sanitizer smoke failed: ${label}`)
  }
  process.exit(1)
}

console.log('Chapter draft sanitizer smoke passed.')
