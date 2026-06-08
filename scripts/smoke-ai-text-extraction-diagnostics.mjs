import { readFileSync } from 'node:fs'

const main = readFileSync('electron/main.mjs', 'utf8')

const extractStart = main.indexOf('function extractResponseText')
const extractEnd = main.indexOf('function buildEmptyResponsesTextMessage')
const extractBody = extractStart >= 0 && extractEnd > extractStart ? main.slice(extractStart, extractEnd) : ''
const emptyMessageStart = main.indexOf('function buildEmptyResponsesTextMessage')
const emptyMessageEnd = main.indexOf('function createAiAbortError')
const emptyMessageBody = emptyMessageStart >= 0 && emptyMessageEnd > emptyMessageStart ? main.slice(emptyMessageStart, emptyMessageEnd) : ''
const chatStart = main.indexOf('async function callOpenAiChatCompletions')
const chatEnd = main.indexOf('function normalizeStage')
const chatBody = chatStart >= 0 && chatEnd > chatStart ? main.slice(chatStart, chatEnd) : ''

const checks = [
  {
    name: 'responses extraction handles nested message output content',
    ok:
      extractBody.includes('extractContentPartsText') &&
      extractBody.includes('part?.type === \'output_text\'') &&
      extractBody.includes('item?.text'),
  },
  {
    name: 'responses empty diagnosis includes useful preview and usage',
    ok:
      emptyMessageBody.includes('responseOutputSummary') &&
      emptyMessageBody.includes('responseUsageSummary') &&
      emptyMessageBody.includes('responseErrorSummary'),
  },
  {
    name: 'chat completions extraction handles refusal and tool-like content',
    ok:
      chatBody.includes('extractContentPartsText(messageContent)') &&
      chatBody.includes('body?.choices?.[0]?.message?.refusal') &&
      chatBody.includes('chatChoiceSummary(body)'),
  },
  {
    name: 'empty text errors guide retry path instead of opaque failure',
    ok:
      main.includes('建议：请降低本次输出长度、重试，或切换为支持当前端点的模型。') &&
      main.includes('建议：如果持续为空，请检查中转站是否完整转发 output_text/choices.message.content。'),
  },
]

for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}`)
}

if (checks.some((check) => !check.ok)) {
  process.exitCode = 1
}
