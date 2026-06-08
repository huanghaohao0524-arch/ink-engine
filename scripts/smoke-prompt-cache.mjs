import fs from 'node:fs/promises'

const main = await fs.readFile('electron/main.mjs', 'utf8')

function getFunctionBody(name) {
  const start = main.indexOf(`function ${name}`)
  if (start < 0) {
    return ''
  }

  const nextFunction = main.indexOf('\nfunction ', start + 1)
  return main.slice(start, nextFunction < 0 ? main.length : nextFunction)
}

const promptNames = [
  'buildChapterTaskCardPrompt',
  'buildChapterDraftPrompt',
  'buildChapterSelfCheckPrompt',
  'buildChapterSelfCheckRevisionPrompt',
]

const promptChecks = promptNames.map((name) => {
  const body = getFunctionBody(name)
  const compilerIndex = body.indexOf('const compiledContext = compileChapterWritingContext(context)')
  const stableIndex = body.indexOf('buildChapterStableContext({ book, context: compiledContext })')
  const taskIndex = body.indexOf("'# 当前任务'")
  const dynamicIndex = body.indexOf('buildChapterDynamicContext({ selectedChapter, context: compiledContext })')

  return {
    name: `${name} keeps stable context before dynamic task`,
    ok: compilerIndex >= 0 && stableIndex > compilerIndex && taskIndex > stableIndex && dynamicIndex > taskIndex,
  }
})

const cacheKeyCalls = (main.match(/promptCacheKey,/g) ?? []).length

const checks = [
  {
    name: 'book writing cache key helper exists',
    ok: main.includes("createPromptCacheKey('book-writing-v2', bookPath)"),
  },
  {
    name: 'chapter stable context contains reusable project materials',
    ok: main.includes('function buildChapterStableContext') &&
      main.includes("'# 项目稳定上下文'") &&
      main.includes("'## 平台规则'") &&
      main.includes("'## 题材规则'") &&
      main.includes("'## 总纲'") &&
      main.includes("'## 卷纲'"),
  },
  {
    name: 'chapter dynamic context is separated from reusable prefix',
    ok: main.includes('function buildChapterDynamicContext') &&
      main.includes("'# 当前章节动态上下文'") &&
      main.includes('context.currentChapter'),
  },
  ...promptChecks,
  {
    name: 'chapter ai chain passes prompt cache key to model calls',
    ok: cacheKeyCalls >= 5 && main.includes('const promptCacheKey = createBookWritingPromptCacheKey(input.bookPath)'),
  },
]

console.log(JSON.stringify({ checks }, null, 2))

if (checks.some((check) => !check.ok)) {
  throw new Error('Prompt cache smoke failed')
}
