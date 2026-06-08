import { app, BrowserWindow, dialog, ipcMain, net, session, shell } from 'electron'
import Store from 'electron-store'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetch as undiciFetch, ProxyAgent } from 'undici'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
let mainWindow = null
const aiRequestControllers = new Map()
const aiProxyAgents = new Map()

const aiOutputLimits = {
  planningQuestion: 1200,
  projectPackageBase: 1400,
  projectPackageRules: 2200,
  projectPackageOutline: 2600,
  projectPackageCharacters: 2600,
  projectPackageTracking: 1200,
  projectUpdateTarget: 500,
  projectUpdatePatch: 2200,
  materialPatch: 1200,
  volumeOutlinePatch: 2400,
  chapterOutlinePatch: 1200,
  chapterTaskCard: 1200,
  chapterSelfCheck: 1000,
  chapterFinalSync: 900,
  chapterSelfCheckRevision: 3600,
  naturalProseCalibration: 3600,
  readerSimulation: 800,
  chapterFeedbackPackage: 5200,
  checkChapter: 1800,
  checkSync: 2200,
  testConnection: 512,
}

const projectUpdateMaxMaterials = 3
const aiCallLogs = []
const aiCallLogLimit = 80
const memoryGovernanceMaxLength = 24000
const authorizedSourceDefaultUrl = 'https://wget.la/https://raw.githubusercontent.com/XIU2/Yuedu/master/shuyuan'
const contextBudget = {
  platformFit: 1400,
  genreRules: 1800,
  coreSetting: 2200,
  mainCharacter: 1600,
  supportingCharacters: 1400,
  minorCharacters: 900,
  overallOutline: 2400,
  goldenFirstThree: 1200,
  volumeOutline: 1800,
  chapterOutline: 1800,
  tracking: 1200,
  storyState: 1800,
  chapterProgress: 1800,
  chapterMemory: 2200,
  structuredState: 2200,
  futurePlan: 1800,
  memoryGovernance: 1800,
  projectRepairLog: 1800,
  editorialReview: 1600,
  bookStrategyReview: 1600,
  projectImpactMap: 1800,
  styleSample: 1200,
  humanWritingFingerprint: 1600,
  samplePoolFingerprints: 1800,
  previousChapter: 1800,
  currentChapter: 2200,
}

const names = {
  appTitle: '\u58a8\u5f15\u64ce 0.1.0',
  chooseLibraryTitle: '\u9009\u62e9\u5199\u4f5c\u5e93\u76ee\u5f55',
  manuscript: '\u6b63\u6587',
  settings: '\u8bbe\u5b9a',
  characters: '\u89d2\u8272',
  outline: '\u5927\u7eb2',
  tracking: '\u8ffd\u8e2a',
  exportDir: '\u5bfc\u51fa',
  sampleLibrary: '拆书样本',
  sampleFingerprintLibrary: '样本指纹库',
  humanWritingFingerprint: 'human-writing-fingerprint.md',
  authorizedSourceIndex: 'authorized-source-index.json',
  unset: '\u672a\u8bbe\u7f6e',
  pendingTask: '\u5f85\u786e\u5b9a\u4e0b\u4e00\u6b65',
  noObviousRisk: '\u6682\u65e0\u660e\u663e\u98ce\u9669',
  unorganizedRisk: '\u672a\u6574\u7406\u4e3a\u6807\u51c6\u9879\u76ee',
}

const contextLabels = {
  platformFit: '\u5e73\u53f0\u89c4\u5219',
  genreRules: '\u9898\u6750\u89c4\u5219',
  coreSetting: '\u6838\u5fc3\u8bbe\u5b9a',
  characterCards: '\u89d2\u8272\u5361',
  mainCharacter: '\u4e3b\u89d2\u5361',
  supportingCharacters: '\u914d\u89d2\u5361',
  minorCharacters: '\u9f99\u5957\u8bb0\u5f55',
  overallOutline: '\u603b\u7eb2',
  volumeOutline: '\u5377\u7eb2',
  chapterOutline: '\u672c\u7ae0\u7ec6\u7eb2',
  previousChapter: '\u4e0a\u4e00\u7ae0',
  tracking: '\u8ffd\u8e2a\u8868',
  ready: '\u53ef\u5199\uff1a\u4e0a\u4e0b\u6587\u5df2\u9f50\uff0c\u53ef\u4ee5\u6309\u4f9d\u636e\u751f\u6210\u6216\u7eed\u5199\u6b63\u6587',
  missingChapterOutline: '\u7f3a\u5f53\u524d\u7ae0\u8282\u7ec6\u7eb2\uff1a\u5efa\u8bae\u5148\u751f\u6210\u7ec6\u7eb2\uff0c\u518d\u5199\u6b63\u6587',
  missingVolumeOutline: '\u7f3a\u5377\u7eb2\uff1a\u5f53\u524d\u7ae0\u8282\u53ea\u80fd\u6309\u603b\u7eb2\u5199\uff0c\u5bb9\u6613\u53d1\u6563',
  incompleteSetup: '\u7acb\u9879\u672a\u5b8c\u6210\uff1a\u4e0d\u5efa\u8bae\u76f4\u63a5\u5199\u6b63\u6587',
  actionWrite: '\u6309\u4f9d\u636e\u7eed\u5199',
  actionChapterOutline: '\u5148\u751f\u6210\u672c\u7ae0\u7ec6\u7eb2',
  actionVolumeOutline: '\u5148\u751f\u6210\u5377\u7eb2',
  actionSetup: '\u56de\u5230\u7acb\u9879\u8865\u5168',
  exists: '\u5df2\u8bfb\u53d6',
  missing: '\u7f3a\u5931',
  firstChapter: '\u7b2c\u4e00\u7ae0\u65e0\u9700\u4e0a\u4e00\u7ae0',
}

const platformProfiles = {
  '\u8d77\u70b9': {
    position: '\u7537\u9891\u4ed8\u8d39\u9605\u8bfb\u4e0e\u957f\u7bc7 IP \u5b75\u5316\u5e73\u53f0\uff0c\u6838\u5fc3\u770b\u91cd\u957f\u671f\u8ffd\u8bfb\u3001\u8ba2\u9605\u6f5c\u529b\u3001\u4e16\u754c\u89c2\u53ef\u4fe1\u5ea6\u3001\u6210\u957f\u627f\u8bfa\u548c\u957f\u7ebf\u723d\u70b9\u7d2f\u79ef\u3002',
    readers: '\u6210\u719f\u7537\u9891\u6df1\u5ea6\u8bfb\u8005\u4e3a\u4e3b\uff0c\u53ef\u4ee5\u63a5\u53d7\u9002\u91cf\u94fa\u57ab\uff0c\u4f46\u8981\u80fd\u770b\u5230\u6210\u957f\u903b\u8f91\u3001\u91d1\u624b\u6307\u56de\u62a5\u3001\u6743\u529b/\u80fd\u529b/\u5730\u4f4d\u4e0a\u5347\u548c\u4e16\u754c\u6301\u7eed\u6269\u5c55\u3002\u4e0d\u5bb9\u5fcd\u5f31\u6210\u957f\u3001\u5f31\u91d1\u624b\u6307\u3001\u65e0\u7d2f\u79ef\u5355\u5143\u5267\u548c\u4e3b\u89d2\u957f\u671f\u88ab\u52a8\u3002',
    content: '\u6ce8\u91cd\u4e16\u754c\u89c2\u3001\u5347\u7ea7\u4f53\u7cfb\u3001\u957f\u7ebf\u60ac\u5ff5\u548c\u6210\u957f\u56de\u62a5\u3002\u5f00\u7bc7\u8981\u5728 300 \u5b57\u5185\u7ed9\u51fa\u4e3b\u89d2\u548c\u7206\u70b9\uff0c1000 \u5b57\u5185\u7ed9\u51fa\u6838\u5fc3\u51b2\u7a81\u548c\u91d1\u624b\u6307\u89c4\u5219\uff1b\u524d\u4e09\u7ae0\u5b8c\u6210\u4e00\u4e2a\u5c0f\u95ed\u73af\uff0c\u5c55\u793a\u5371\u673a\u3001\u89c4\u5219\u3001\u4e3b\u89d2\u593a\u56de\u4e3b\u52a8\u6743\u548c\u66f4\u5927\u68cb\u76d8\u3002\u65b0\u4e66\u671f\u5355\u7ae0\u5efa\u8bae 2100-2300 \u5b57\uff0c\u6bcf\u7ae0\u81f3\u5c11\u6709\u4e00\u4e2a\u771f\u63a8\u8fdb\u3001\u4e00\u4e2a\u4e3b\u89d2\u884c\u52a8\u3001\u4e00\u4e2a\u65b0\u723d\u70b9/\u6709\u7528\u4fe1\u606f\u548c\u4e00\u4e2a\u7ae0\u672b\u94a9\u5b50\u3002\u5e38\u89c1\u9898\u6750\u5305\u62ec\u7384\u5e7b\u3001\u4ed9\u4fa0\u3001\u90fd\u5e02\u5f02\u80fd\u3001\u79d1\u5e7b\u3001\u8bf8\u5929\u3001\u5386\u53f2\u3001\u6e38\u620f\u3001\u60ac\u7591\u52a0\u5347\u7ea7\u7b49\u3002',
  },
  '\u756a\u8304': {
    position: '\u514d\u8d39\u9605\u8bfb\u6d41\u91cf\u5e73\u53f0\uff0c\u7b97\u6cd5\u63a8\u8350\u9a71\u52a8\uff0c\u6838\u5fc3\u770b\u70b9\u662f\u70b9\u51fb\u3001\u524d\u4e09\u7ae0\u5b8c\u8bfb\u3001\u8ffd\u66f4\u548c\u4f4e\u95e8\u69db\u60c5\u7eea\u6e05\u6670\u5ea6\u3002',
    readers: '\u5927\u4f17\u5316\u3001\u788e\u7247\u5316\u9605\u8bfb\u7528\u6237\u4e3a\u4e3b\uff0c\u5bf9\u9898\u6750\u5305\u5bb9\u5ea6\u9ad8\uff0c\u4f46\u8010\u5fc3\u4f4e\uff0c\u9700\u8981\u5f00\u573a\u7acb\u523b\u660e\u767d\u4e3b\u89d2\u662f\u8c01\u3001\u53d7\u4ec0\u4e48\u538b\u8feb\u3001\u6709\u4ec0\u4e48\u5916\u6302/\u673a\u4f1a\u3001\u9a6c\u4e0a\u80fd\u5f97\u5230\u4ec0\u4e48\u53cd\u8f6c\u548c\u60c5\u7eea\u56de\u62a5\u3002',
    content: '\u5f3a\u94a9\u5b50\u3001\u5f3a\u60c5\u7eea\u3001\u5feb\u53cd\u8f6c\u3001\u4f4e\u95e8\u69db\u3001\u8111\u6d1e\u5f00\u573a\u4f18\u5148\u3002\u6807\u9898\u548c\u7b80\u4ecb\u8981\u76f4\u63a5\u53ef\u70b9\uff0c\u7b2c\u4e00\u7ae0\u5fc5\u987b\u7acb\u523b\u629b\u51fa\u51b2\u7a81\uff0c\u91d1\u624b\u6307\u6216\u6838\u5fc3\u723d\u70b9\u8981\u65e9\u51fa\u73b0\u3002\u65b0\u4e66\u671f\u5355\u7ae0\u5efa\u8bae 1800-2200 \u5b57\uff0c\u524d 10 \u7ae0\u8282\u594f\u5bc6\u96c6\uff0c\u6bcf\u7ae0\u90fd\u8981\u6709\u660e\u663e\u94a9\u5b50\u3002\u5e38\u89c1\u5931\u8d25\u662f\u6162\u70ed\u4e16\u754c\u89c2\u3001\u8fc7\u65e9\u5927\u6bb5\u8bbe\u5b9a\u3001\u4e3b\u89d2\u88ab\u52a8\u542c\u8bf4\u660e\u3001\u6807\u9898\u6587\u827a\u62bd\u8c61\u3002\u5e38\u89c1\u9898\u6750\u5305\u62ec\u90fd\u5e02\u8111\u6d1e\u3001\u7cfb\u7edf\u3001\u91cd\u751f\u3001\u5e74\u4ee3\u3001\u73b0\u8a00\u723d\u6587\u3001\u60ac\u7591\u89c4\u5219\u602a\u8c08\u3001\u79cd\u7530\u3001\u723d\u6587\u5feb\u8282\u594f\u53d8\u4f53\u3002',
  },
  '\u4e03\u732b': {
    position: '\u7a33\u5065\u578b\u514d\u8d39\u9605\u8bfb\u5e73\u53f0\uff0c\u514d\u8d39\u4f46\u4e0d\u4f4e\u8d28\uff0c\u723d\u6587\u4f46\u6709\u5e95\u7ebf\uff0c\u6d41\u91cf\u4f46\u91cd\u7a33\u5b9a\u3002',
    readers: '30-50 \u5c81\u6210\u719f\u7528\u6237\u4e3a\u4e3b\uff0c\u7537\u5973\u9891\u90fd\u5927\uff1b\u534e\u4e1c\u3001\u4e00\u7ebf/\u65b0\u4e00\u7ebf\u4e0e\u4e0b\u6c89\u5e02\u573a\u5e76\u91cd\uff1b\u559c\u6b22\u788e\u7247\u9605\u8bfb\u3001\u5f3a\u60c5\u7eea\u3001\u5feb\u8282\u594f\u3001\u5373\u65f6\u6ee1\u8db3\u3002',
    content: '\u65b0\u5a92\u4f53\u98ce\u723d\u6587\uff1a\u5feb\u8282\u594f\u3001\u5f3a\u723d\u611f\u3001\u5f3a\u60c5\u7eea\u3001\u4f4e\u95e8\u69db\u3001\u77ed\u903b\u8f91\u94fe\u6761\u723d\u70b9\u8f93\u51fa\uff1b\u4eba\u8bbe\u8981\u9c9c\u660e\u8ba8\u559c\uff0c\u4e3b\u89d2\u667a\u5546\u5728\u7ebf\u3001\u884c\u52a8\u529b\u5f3a\uff1b\u6bcf\u7ae0\u9700\u6709\u51b2\u7a81\u3001\u94a9\u5b50\u548c\u723d\u70b9\uff1b\u8bed\u8a00\u76f4\u767d\u901a\u4fd7\uff0c\u907f\u514d\u6587\u827a\u6666\u6da9\uff1b\u901a\u5e38\u767e\u4e07\u5b57\u4ee5\u4e0a\u3002',
  },
  '\u664b\u6c5f': {
    position: '\u5973\u6027\u5411\u5782\u76f4\u793e\u533a + IP \u5b75\u5316\u5723\u5730\uff0c\u4ee5\u201c\u7231\u4e0e\u68a6\u60f3\u201d\u4e3a\u6838\u5fc3\uff0c\u5c0f\u4f17\u4f46\u9ad8\u7aef\uff0c\u4ed8\u8d39\u4f46\u5fe0\u8bda\uff0c\u521b\u65b0\u4f46\u4e25\u683c\u3002',
    readers: '18-35 \u5c81\u9ad8\u77e5\u5e74\u8f7b\u5973\u6027\u4e3a\u4e3b\uff0c\u4e00\u7ebf\u57ce\u5e02\u548c\u6d77\u5916\u7528\u6237\u6bd4\u91cd\u9ad8\uff1b\u4ed8\u8d39\u610f\u613f\u5f3a\uff0c\u8bc4\u8bba\u3001\u957f\u8bc4\u3001\u6253\u8d4f\u548c\u7c89\u4e1d\u4e92\u52a8\u5f3a\uff1b\u91cd\u89c6\u4eba\u8bbe\u3001\u6587\u7b14\u3001\u60c5\u611f\u5171\u9e23\u548c\u4ef7\u503c\u89c2\u3002',
    content: '\u53cd\u5957\u8def + \u5f3a\u4eba\u8bbe + \u60c5\u611f\u7ec6\u817b + \u4ef7\u503c\u89c2\u8f93\u51fa\uff1b\u4eba\u8bbe\u5f80\u5f80\u5927\u4e8e\u5267\u60c5\uff0c\u60c5\u611f\u6d53\u5ea6\u9ad8\uff0c\u8bb2\u7a76\u62c9\u626f\u611f\u548c\u5bbf\u547d\u611f\uff1b\u62d2\u7edd\u604b\u7231\u8111\u3001\u96cc\u7ade\u548c\u7c97\u7cd9\u76f4\u767d\uff1b\u504f\u6587\u5b66\u6027\u8868\u8fbe\uff1b\u7bc7\u5e45\u901a\u5e38 30-100 \u4e07\u5b57\u3002',
  },
}

const platformWordPolicies = {
  '\u8d77\u70b9': {
    min: 2200,
    target: 2400,
    max: 2600,
    rule: '\u8d77\u70b9\u65b0\u4e66\u671f\u8981\u7ed9\u8db3\u4e16\u754c\u89c2\u3001\u6210\u957f\u56de\u62a5\u548c\u957f\u7ebf\u94a9\u5b50\uff0c\u5355\u7ae0\u4e0d\u5b9c\u8fc7\u77ed\u3002',
  },
  '\u756a\u8304': {
    min: 1800,
    target: 2000,
    max: 2200,
    rule: '\u756a\u8304\u65b0\u4e66\u671f\u8981\u77ed\u3001\u5feb\u3001\u5bc6\uff0c\u5148\u4fdd\u8bc1\u94a9\u5b50\u548c\u5b8c\u8bfb\uff0c\u4e0d\u8981\u5355\u7ae0\u5199\u592a\u80a5\u3002',
  },
  '\u4e03\u732b': {
    min: 2000,
    target: 2200,
    max: 2400,
    rule: '\u4e03\u732b\u504f\u7a33\u5b9a\u65b0\u5a92\u4f53\u98ce\uff0c\u5355\u7ae0\u9700\u8981\u6709\u51b2\u7a81\u3001\u723d\u70b9\u548c\u94a9\u5b50\uff0c\u4f46\u4e0d\u5b9c\u62d6\u957f\u3002',
  },
  '\u664b\u6c5f': {
    min: 2500,
    target: 3000,
    max: 3500,
    rule: '\u664b\u6c5f\u66f4\u91cd\u4eba\u8bbe\u3001\u60c5\u611f\u6d53\u5ea6\u548c\u6587\u7b14\u5b8c\u6574\u5ea6\uff0c\u7ae0\u8282\u53ef\u6bd4\u514d\u8d39\u5e73\u53f0\u66f4\u9971\u6ee1\u3002',
  },
  default: {
    min: 2000,
    target: 2200,
    max: 2400,
    rule: '\u9ed8\u8ba4\u6309\u901a\u7528\u7f51\u6587\u8282\u594f\u6267\u884c\uff0c\u4fdd\u8bc1\u4e00\u7ae0\u4e00\u4e2a\u660e\u786e\u63a8\u8fdb\u3002',
  },
}

function getPlatformWordPolicy(platform) {
  return platformWordPolicies[platform] || platformWordPolicies.default
}

function formatPlatformWordRule(platform) {
  const policy = getPlatformWordPolicy(platform)
  return `${policy.min}-${policy.max} 字，默认目标 ${policy.target} 字。${policy.rule}`
}

function resolveTargetWordsForBook(configOrBook = {}, explicitTarget) {
  if (Number.isFinite(explicitTarget) && explicitTarget > 0) {
    return Math.round(explicitTarget)
  }

  const platform = typeof configOrBook.platform === 'string' ? configOrBook.platform : ''
  const policy = getPlatformWordPolicy(platform)
  return policy.target
}

function buildChapterWordRequirement(book, selectedChapter) {
  const policy = getPlatformWordPolicy(book?.platform)
  const target = resolveTargetWordsForBook(book, selectedChapter?.targetWords)
  return [
    '# 本章字数硬约束',
    `- 目标平台：${book?.platform || names.unset}`,
    `- 本章目标字数：${target} 字`,
    `- 可接受范围：${policy.min}-${policy.max} 字`,
    `- 平台规则：${policy.rule}`,
    '- 正文必须贴近本章目标字数，不要明显低于下限，也不要为了凑字注水超过上限。',
  ].join('\n')
}

function estimateDraftMaxOutputTokens(book, selectedChapter) {
  const bounds = getChapterWordBounds(book, selectedChapter)
  const platform = typeof book?.platform === 'string' ? book.platform : ''
  const multiplier = platform === '\u756a\u8304' ? 1.18 : platform === '\u664b\u6c5f' ? 1.32 : 1.25
  return Math.max(1800, Math.min(5200, Math.ceil(bounds.max * multiplier)))
}

function getPlatformWordOvershootTolerance(platform, policy) {
  const percentTolerance = Math.ceil(policy.max * 0.08)
  return platform === '\u756a\u8304' ? Math.max(180, percentTolerance)
    : platform === '\u664b\u6c5f' ? Math.max(320, percentTolerance)
      : Math.max(220, percentTolerance)
}

function getChapterWordBounds(book, selectedChapter) {
  const policy = getPlatformWordPolicy(book?.platform)
  const target = resolveTargetWordsForBook(book, selectedChapter?.targetWords)
  const platform = typeof book?.platform === 'string' ? book.platform : ''
  const overshootTolerance = getPlatformWordOvershootTolerance(platform, policy)
  return {
    platform,
    min: policy.min,
    target,
    max: policy.max,
    hardMax: Math.max(3000, policy.max + overshootTolerance),
    rule: policy.rule,
  }
}

function getPlatformWritingStrategy(platform) {
  const strategies = {
    '\u756a\u8304': {
      minVolumeChapters: 24,
      targetVolumeChapters: 30,
      maxSceneBeats: 4,
      maxPlotEvents: 2,
      volumeRule: '免费流量平台，卷纲要拆成短促、密集、强钩子的连续小闭环；材料多时优先增加章节节点，不能把多个爽点硬塞进一章。',
      chapterRule: '单章以 3-4 个强事件节拍为宜：开场冲突、外挂/机会反馈、反转或爽点、章末钩子。',
      budgetRevisionRule: '番茄新书期短、快、密更重要；超长时优先断在最强钩子，把后续材料留给下一章。',
    },
    '\u8d77\u70b9': {
      minVolumeChapters: 24,
      targetVolumeChapters: 32,
      maxSceneBeats: 5,
      maxPlotEvents: 3,
      volumeRule: '付费男频平台，卷纲要保留长期成长线、世界观扩展和订阅承诺；可以更有层次，但每章仍需一个清晰推进单位。',
      chapterRule: '单章可承载 4-5 个节拍：目标/压力、主角行动、信息或收益、后果、长线钩子。',
      budgetRevisionRule: '起点可以保留必要世界观和成长逻辑；超长时压掉重复解释和氛围铺陈，保留升级收益、主角主动性和长线承诺。',
    },
    '\u4e03\u732b': {
      minVolumeChapters: 24,
      targetVolumeChapters: 30,
      maxSceneBeats: 4,
      maxPlotEvents: 2,
      volumeRule: '稳健型免费阅读平台，卷纲要稳定释放冲突、情绪和爽点；章节推进温和但不能拖，避免工作室式注水。',
      chapterRule: '单章通常承载 3-4 个直白有效的节拍：困境、行动、情绪回报、钩子。',
      budgetRevisionRule: '七猫重稳定和可读性；超长时压掉支线闲笔和重复情绪，保留强情绪、爽点、清晰冲突和章末牵引。',
    },
    '\u664b\u6c5f': {
      minVolumeChapters: 14,
      targetVolumeChapters: 20,
      maxSceneBeats: 5,
      maxPlotEvents: 2,
      volumeRule: '女性向垂直社区，卷纲要围绕人设、关系张力、事业线或价值观推进；章节数可少于免费平台，但不能把完整情感弧压进一章。',
      chapterRule: '单章可承载 4-5 个细腻节拍，但重大剧情事件不宜超过 2 个；重在关系变化、人物选择和情绪余波。',
      budgetRevisionRule: '晋江重人设和情感连续性；超长时压掉重复心理解释和过密事件，保留关系变化、人物声线、情绪转折和价值观表达。',
    },
    default: {
      minVolumeChapters: 20,
      targetVolumeChapters: 28,
      maxSceneBeats: 4,
      maxPlotEvents: 2,
      volumeRule: '该平台暂无内置调性。应先补齐平台核心品牌定位、读者画像、内容风格与题材偏好，再决定卷纲密度；临时按通用连载节奏执行。',
      chapterRule: '未知平台临时按一章一个主推进、一处冲突/收益、一枚章末钩子处理，避免把多章材料压进一章。',
      budgetRevisionRule: '未知平台只做通用压缩：保留主线事实、人物动机、类型信号和章末钩子，删掉重复解释和注水段落。',
      needsPlatformResearch: true,
    },
  }
  return strategies[platform] || strategies.default
}

function getPlatformOutlinePolicy(platform) {
  return getPlatformWritingStrategy(platform)
}

function buildPlatformOutlinePlanningRule({ book, selectedChapter, mode }) {
  const wordBounds = getChapterWordBounds(book, selectedChapter)
  const outlinePolicy = getPlatformWritingStrategy(book?.platform)
  const isVolume = mode === 'volume'

  return [
    '# Platform pacing and outline density contract',
    `- Platform: ${book?.platform || names.unset}`,
    `- Chapter word range: ${wordBounds.min}-${wordBounds.max}; target ${wordBounds.target}; hard max ${wordBounds.hardMax}.`,
    `- Volume rule: ${outlinePolicy.volumeRule}`,
    `- Chapter rule: ${outlinePolicy.chapterRule}`,
    outlinePolicy.needsPlatformResearch
      ? '- This platform has no built-in playbook yet. Before commercial use, research and store its brand position, reader profile, content style, genre preference, and chapter rhythm.'
      : '',
    isVolume
      ? `- Volume outline must not force an early ending. Plan at least ${outlinePolicy.minVolumeChapters} chapter nodes; target around ${outlinePolicy.targetVolumeChapters} nodes for the first volume unless the user explicitly asks for fewer.`
      : `- Chapter outline must fit one chapter only: at most ${outlinePolicy.maxSceneBeats} scene beats and ${outlinePolicy.maxPlotEvents} major plot events.`,
    isVolume
      ? '- If the arc contains more material, expand the chapter table instead of compressing multiple payoffs into one chapter.'
      : '- If the volume node is too large, choose only the current chapter slice and move the rest to "next chapter carry-over".',
    '- Every chapter node should have one main function, one conflict/pressure point, one payoff or information change, and one ending hook.',
    '- Do not use chapter count as a cage. Use it as a density guard: more plot means more chapters, not longer chapters.',
  ].join('\n')
}

function buildChapterWordBudgetRevisionPrompt({ book, selectedChapter, content, reason }) {
  const bounds = getChapterWordBounds(book, selectedChapter)
  const strategy = getPlatformWritingStrategy(book?.platform)
  return [
    'You are a Chinese web-novel serial editor.',
    'Task: revise the draft so it fits the platform chapter length budget.',
    'Only output the revised Chinese chapter prose. Do not output analysis, report, task card, headings other than the chapter title, or markdown fences.',
    '',
    '# Hard word budget',
    `- Platform: ${book?.platform || names.unset}`,
    `- Target: ${bounds.target} Chinese chars/words`,
    `- Acceptable range: ${bounds.min}-${bounds.max}`,
    `- Hard maximum: ${bounds.hardMax}`,
    `- Current count: ${countTextWords(content)}`,
    `- Reason: ${reason}`,
    '',
    '# Revision rules',
    '- If the draft is too long, cut explanation, repeated inner monologue, duplicated reactions, and setup recaps first.',
    '- Keep the chapter title, main plot facts, key genre signals, character motivation, payoff, and ending hook.',
    `- Platform-specific compression rule: ${strategy.budgetRevisionRule}`,
    '- Do not add new plot events just to reach length.',
    '- If there is too much material, stop at the strongest chapter-ending hook and leave later material out.',
    '',
    '# Draft to revise',
    content,
  ].join('\n')
}

async function enforceChapterWordBudget({ detail, book, selectedChapter, content, promptCacheKey, signal, sourceLabel = '\u6b63\u6587\u5019\u9009', reason = '', speedMode = 'guarded' }) {
  const cleanContent = assertCleanChapterDraftContent(content, sourceLabel)
  const activeBook = book || detail?.book
  const activeChapter = selectedChapter || detail?.selectedChapter
  const bounds = getChapterWordBounds(activeBook, activeChapter)
  const wordCount = countTextWords(cleanContent)

  if (wordCount <= bounds.hardMax) {
    return cleanContent
  }

  const revised = await callOpenAiTextPreferStream({
    input: buildChapterWordBudgetRevisionPrompt({
      book: activeBook,
      selectedChapter: activeChapter,
      content: cleanContent,
      reason: reason || `${sourceLabel} exceeded ${bounds.hardMax}; current ${wordCount}`,
    }),
    temperature: 0.25,
    maxOutputTokens: estimateDraftMaxOutputTokens(activeBook, activeChapter),
    reasoningEffort: normalizeWritingSpeedMode(speedMode) === 'polish' ? 'medium' : 'low',
    promptCacheKey,
    signal,
  })
  const revisedClean = assertCleanChapterDraftContent(revised, `${sourceLabel}\u5b57\u6570\u538b\u7f29\u7a3f`)
  const revisedCount = countTextWords(revisedClean)

  if (revisedCount > bounds.hardMax) {
    throw new Error(`${sourceLabel}\u8d85\u51fa\u5e73\u53f0\u5b57\u6570\u4e0a\u9650\uff1a${revisedCount}/${bounds.hardMax}\uff0c\u8bf7\u7f29\u77ed\u672c\u7ae0\u6216\u62c6\u5230\u4e0b\u4e00\u7ae0`)
  }

  return revisedClean
}

function getPlatformProfile(platform) {
  return platformProfiles[platform] || null
}

function formatPlatformProfile(platform) {
  const profile = getPlatformProfile(platform)

  if (!profile) {
    return '\u6682\u65e0\u4e13\u95e8\u5e73\u53f0\u9884\u8bbe\uff0c\u8bf7\u6839\u636e\u7528\u6237\u95ee\u7b54\u81ea\u884c\u5224\u65ad\u8c03\u6027\u3002'
  }

  return [
    `# ${platform}\u5e73\u53f0\u8c03\u6027`,
    `## \u6838\u5fc3\u54c1\u724c\u5b9a\u4f4d\n${profile.position}`,
    `## \u7528\u6237\u7fa4\u4f53\u753b\u50cf\n${profile.readers}`,
    `## \u5185\u5bb9\u98ce\u683c\u4e0e\u9898\u6750\u504f\u597d\n${profile.content}`,
  ].join('\n')
}

function formatPlatformFitSeed(platform) {
  const profile = getPlatformProfile(platform)

  if (!profile) {
    return [
      '# \u5e73\u53f0\u9002\u914d\u8bf4\u660e',
      '',
      `- \u76ee\u6807\u5e73\u53f0\uff1a${platform}`,
      '- \u7ae0\u8282\u5b57\u6570\u89c4\u5219\uff1a\u5f85\u8865\u5168',
      '- \u5f00\u5c40\u8282\u594f\uff1a\u5f85\u8865\u5168',
      '- \u5e38\u89c1\u5931\u8d25\u6a21\u5f0f\uff1a\u5f85\u8865\u5168',
    ].join('\n')
  }

  return [
    '# \u5e73\u53f0\u9002\u914d\u8bf4\u660e',
    '',
    `- \u76ee\u6807\u5e73\u53f0\uff1a${platform}`,
    `- \u7ae0\u8282\u5b57\u6570\u89c4\u5219\uff1a${formatPlatformWordRule(platform)}`,
    '',
    '## \u6838\u5fc3\u54c1\u724c\u5b9a\u4f4d',
    profile.position,
    '',
    '## \u76ee\u6807\u8bfb\u8005',
    profile.readers,
    '',
    '## \u672c\u4e66\u5fc5\u987b\u9075\u5b88',
    '\u5f85\u6839\u636e\u672c\u4e66\u7acb\u9879\u95ee\u7b54\u63d0\u70bc\u3002',
    '',
    '## \u5185\u5bb9\u98ce\u683c\u4e0e\u9898\u6750\u504f\u597d',
    profile.content,
  ].join('\n')
}

function inferGenreKey(text) {
  const source = String(text ?? '')

  if (/\u7f51\u6e38|\u6e38\u620f|\u5168\u606f|\u865a\u62df|\u670d\u52a1\u5668|\u73a9\u5bb6|\u526f\u672c|\u6280\u80fd|\u88c5\u5907/.test(source)) {
    return 'webGame'
  }

  if (/玄幻|修仙|仙侠|灵根|境界|宗门|功法|渡劫|妖兽|魔法|异能/.test(source)) {
    return 'fantasy'
  }

  if (/都市|职场|商业|创业|神医|鉴宝|娱乐圈|豪门|系统都市|赘婿/.test(source)) {
    return 'urban'
  }

  if (/言情|恋爱|甜宠|虐恋|婚恋|追妻|破镜重圆|校园|古言|纯爱|百合/.test(source)) {
    return 'romance'
  }

  if (/悬疑|推理|刑侦|探案|规则怪谈|无限流|惊悚|逃生|谜案/.test(source)) {
    return 'suspense'
  }

  return 'general'
}

function inferPreferredFingerprintGenres(text) {
  const source = String(text ?? '')
  const genres = []

  if (/网游|游戏|电竞|全息|虚拟|服务器|玩家|副本|技能|装备|公会|世界频道/u.test(source)) {
    genres.push('网游')
  }

  if (/玄幻|修仙|仙侠|灵根|境界|宗门|功法|渡劫|妖兽|魔法|异能|武侠|江湖|内功/u.test(source)) {
    genres.push('玄幻')
  }

  if (/都市|职场|商业|创业|神医|鉴宝|娱乐圈|豪门|系统都市|赘婿|校园/u.test(source)) {
    genres.push('都市')
  }

  if (/悬疑|推理|刑侦|探案|规则怪谈|无限流|惊悚|逃生|谜案|法医/u.test(source)) {
    genres.push('悬疑')
  }

  if (/古言|宫斗|宅斗|侯府|王爷|庶女|嫡女|将军|和离|重生|穿越|后宫/u.test(source)) {
    genres.push('古言')
  }

  return [...new Set(genres)]
}

function pickFingerprintGroups(groups, preferredGenres) {
  if (!Array.isArray(groups) || groups.length === 0) {
    return []
  }

  const preferred = Array.isArray(preferredGenres)
    ? preferredGenres.filter((genre) => typeof genre === 'string' && genre.trim())
    : []

  if (!preferred.length) {
    return []
  }

  const matched = groups.filter((group) => {
    const text = [
      typeof group?.genre === 'string' ? group.genre : '',
      typeof group?.name === 'string' ? group.name : '',
      typeof group?.file === 'string' ? group.file : '',
      typeof group?.bookFile === 'string' ? group.bookFile : '',
    ].join('\n')
    return preferred.some((genre) => text.includes(genre))
  })

  return matched.slice(0, 4)
}

function buildGenreRulesSeed({ genre, idea, title }) {
  const genreText = [genre, idea, title].filter(Boolean).join('\n')
  const genreKey = inferGenreKey(genreText)

  if (genreKey === 'webGame') {
    return [
      '# \u7f51\u6e38\u6587\u9898\u6750\u89c4\u5219',
      '',
      '## \u9898\u6750\u5e95\u7ebf',
      '',
      '- \u6bcf\u7ae0\u5fc5\u987b\u4fdd\u7559\u201c\u8fd9\u662f\u7f51\u6e38\u6587\u201d\u7684\u53ef\u611f\u77e5\u4fe1\u53f7\uff0c\u4e0d\u80fd\u5199\u6210\u7eaf\u7384\u5e7b\u3001\u7eaf\u4fee\u4ed9\u3001\u7eaf\u6b66\u4fa0\u6216\u6cdb\u5347\u7ea7\u723d\u6587\u3002',
      '- \u73a9\u5bb6\u611f\u8981\u59cb\u7ec8\u5b58\u5728\uff1a\u73a9\u5bb6\u884c\u4e3a\u3001\u7ec4\u961f/\u62a2\u602a/\u4ea4\u6613/\u6392\u884c\u699c/\u516c\u4f1a/\u4e16\u754c\u9891\u9053\u7b49\u53ef\u4ee5\u6309\u7ae0\u8282\u9700\u8981\u8f6e\u6362\u51fa\u73b0\u3002',
      '- \u6e38\u620f\u7cfb\u7edf\u8981\u53ef\u89c1\uff1a\u9762\u677f\u3001\u4efb\u52a1\u3001\u6280\u80fd\u3001\u88c5\u5907\u3001\u6389\u843d\u3001\u7ecf\u9a8c\u3001\u79f0\u53f7\u3001NPC \u597d\u611f/\u9635\u8425\u3001\u670d\u52a1\u5668\u516c\u544a\u3001\u5730\u56fe/\u526f\u672c\u673a\u5236\u7b49\u4e0d\u80fd\u957f\u671f\u7f3a\u4f4d\u3002',
      '- \u4e3b\u89d2\u7684\u5f3a\u5927\u8981\u901a\u8fc7\u6e38\u620f\u89c4\u5219\u4f53\u73b0\uff1a\u6280\u80fd\u7406\u89e3\u3001\u673a\u5236\u5229\u7528\u3001\u4efb\u52a1\u5224\u65ad\u3001\u8d44\u6e90\u7ba1\u7406\u3001\u73a9\u5bb6\u8ba4\u77e5\u5dee\uff0c\u4e0d\u8981\u53ea\u5199\u201c\u4ed6\u529f\u529b\u66f4\u9ad8\u201d\u3002',
      '',
      '## \u6bcf\u7ae0\u81f3\u5c11\u4f7f\u7528\u4e24\u7c7b\u7f51\u6e38\u4fe1\u53f7',
      '',
      '- \u7cfb\u7edf\u4fe1\u53f7\uff1a\u4efb\u52a1\u63d0\u793a\u3001\u9762\u677f\u53d8\u5316\u3001\u6280\u80fd\u6548\u679c\u3001\u88c5\u5907/\u6389\u843d\u3001\u7ecf\u9a8c/\u7b49\u7ea7\u3001\u4e16\u754c\u516c\u544a\u3002',
      '- \u73a9\u5bb6\u4fe1\u53f7\uff1a\u8def\u4eba\u73a9\u5bb6\u53cd\u5e94\u3001\u961f\u4f0d\u914d\u5408\u3001\u516c\u4f1a\u535a\u5f08\u3001\u4ea4\u6613\u884c\u3001\u6392\u884c\u699c\u3001\u4e16\u754c\u9891\u9053\u3002',
      '- \u5730\u56fe\u4fe1\u53f7\uff1a\u65b0\u624b\u6751\u3001\u91ce\u5916\u533a\u3001\u526f\u672c\u3001BOSS \u673a\u5236\u3001\u9690\u85cf\u8def\u7ebf\u3001NPC \u529f\u80fd\u533a\u3002',
      '- \u7ecf\u6d4e\u4fe1\u53f7\uff1a\u91d1\u5e01\u3001\u7269\u4ef7\u3001\u6750\u6599\u3001\u88c5\u5907\u4ef7\u503c\u3001\u73a9\u5bb6\u95f4\u4ea4\u6613\u3001\u8d44\u6e90\u7a00\u7f3a\u3002',
      '',
      '## \u5e38\u89c1\u8dd1\u504f',
      '',
      '- \u53ea\u5199\u4e3b\u89d2\u7ec3\u529f\u3001\u6253\u67b6\u3001\u9886\u609f\uff0c\u4f46\u6ca1\u6709\u4efb\u52a1/\u6280\u80fd/\u73a9\u5bb6/\u670d\u52a1\u5668\u53cd\u9988\u3002',
      '- \u628a NPC \u548c\u771f\u5b9e\u6c5f\u6e56\u4eba\u7269\u5199\u6210\u540c\u4e00\u7c7b\uff0c\u6ca1\u6709\u6e38\u620f\u4e16\u754c\u7684\u89c4\u5219\u611f\u3002',
      '- \u6218\u6597\u53ea\u6709\u62db\u5f0f\u548c\u60c5\u7eea\uff0c\u6ca1\u6709\u6280\u80fd\u673a\u5236\u3001\u51b7\u5374\u3001\u6548\u679c\u3001\u6389\u843d\u6216\u4efb\u52a1\u63a8\u8fdb\u3002',
    ].join('\n')
  }

  return [
    '# \u9898\u6750\u89c4\u5219',
    '',
    `- \u9898\u6750\uff1a${genre || '\u5f85\u5b9a'}`,
    '- \u672c\u4e66\u9700\u6301\u7eed\u4fdd\u7559\u9898\u6750\u8fa8\u8bc6\u5ea6\uff0c\u4e0d\u80fd\u8dd1\u9898\u6750\u6216\u6ed1\u6210\u6cdb\u723d\u6587\u3002',
    '- \u6bcf\u7ae0\u7ec6\u7eb2\u9700\u5199\u660e\u201c\u672c\u7ae0\u9898\u6750\u5473\u9053\u201d\uff0c\u6b63\u6587\u9700\u843d\u5730\u5bf9\u5e94\u5143\u7d20\u3002',
  ].join('\n')
}

function buildStoryStateSeed({ genre = '', idea = '', title = '' } = {}) {
  const genreText = [genre, idea, title].filter(Boolean).join('\n')
  const genreKey = inferGenreKey(genreText)

  if (genreKey === 'webGame') {
    return [
      '# 类型状态卡',
      '',
      '## 连续变量',
      '- 等级/经验：当前等级、当前经验、升级阈值、最近一次经验变化。',
      '- 任务进度：主线任务、支线/隐藏任务、已完成任务、失败或限时条件。',
      '- 装备/技能：已拥有装备、已掌握技能、冷却/限制/代价、可升级项。',
      '- 背包/资源：金币、材料、道具、消耗品、稀有资源。',
      '- 世界反馈：排行榜、公告、玩家认知、NPC 好感/阵营关系。',
      '',
      '## 当前状态',
      '- 等级/经验：待定。',
      '- 任务进度：待定。',
      '- 装备/技能：待定。',
      '- 背包/资源：待定。',
      '- 世界反馈：待定。',
    ].join('\n')
  }

  if (genreKey === 'fantasy') {
    return [
      '# 类型状态卡',
      '',
      '## 连续变量',
      '- 境界/修为：当前境界、瓶颈、突破条件、战力边界。',
      '- 功法/技能：主修功法、招式熟练度、代价、禁忌。',
      '- 资源/法宝：灵石丹药、法宝、材料、消耗与获得。',
      '- 势力关系：宗门、师承、敌对势力、盟友、人情债。',
      '- 因果伏笔：誓言、传承、秘境线索、天劫/诅咒。',
      '',
      '## 当前状态',
      '- 境界/修为：待定。',
      '- 功法/技能：待定。',
      '- 资源/法宝：待定。',
      '- 势力关系：待定。',
      '- 因果伏笔：待定。',
    ].join('\n')
  }

  if (genreKey === 'urban') {
    return [
      '# 类型状态卡',
      '',
      '## 连续变量',
      '- 事业/身份：当前职业、社会身份、阶段目标、公开认知。',
      '- 资产/资源：现金、公司、渠道、人脉、关键物件。',
      '- 关系网络：家人、对手、贵人、合作方、情感关系。',
      '- 能力/金手指：能力边界、使用代价、冷却限制、外界反馈。',
      '- 风险压力：债务、舆论、法律、商业竞争、隐藏威胁。',
      '',
      '## 当前状态',
      '- 事业/身份：待定。',
      '- 资产/资源：待定。',
      '- 关系网络：待定。',
      '- 能力/金手指：待定。',
      '- 风险压力：待定。',
    ].join('\n')
  }

  if (genreKey === 'romance') {
    return [
      '# 类型状态卡',
      '',
      '## 连续变量',
      '- 情感阶段：初识、试探、暧昧、拉扯、确认、裂痕、修复。',
      '- 关系温度：信任值、误会点、亲密行为边界、外界认知。',
      '- 关键承诺：约定、秘密、亏欠、共同目标、不能触碰的底线。',
      '- 外部阻力：家庭、事业、阶层、旧人旧事、舆论或身份差。',
      '- 情绪债：谁欠谁、谁误解谁、谁先退让、读者期待的情绪偿还。',
      '',
      '## 当前状态',
      '- 情感阶段：待定。',
      '- 关系温度：待定。',
      '- 关键承诺：待定。',
      '- 外部阻力：待定。',
      '- 情绪债：待定。',
    ].join('\n')
  }

  if (genreKey === 'suspense') {
    return [
      '# 类型状态卡',
      '',
      '## 连续变量',
      '- 案件/谜题：核心谜题、阶段谜题、已确认事实、伪线索。',
      '- 线索状态：已发现线索、未解释线索、证据链缺口、关键证人。',
      '- 规则/危险：禁忌规则、死亡条件、追杀压力、时间限制。',
      '- 推理进度：主角已知、读者已知、反派已知、误判点。',
      '- 压力倒计时：案发时间线、下一次危机、必须完成的检查点。',
      '',
      '## 当前状态',
      '- 案件/谜题：待定。',
      '- 线索状态：待定。',
      '- 规则/危险：待定。',
      '- 推理进度：待定。',
      '- 压力倒计时：待定。',
    ].join('\n')
  }

  return [
    '# 类型状态卡',
    '',
    '## 连续变量',
    '- 主角状态：身份、能力、目标、代价、阶段变化。',
    '- 关系状态：重要人物关系、信任/敌意、承诺和误会。',
    '- 资源状态：钱、道具、信息、人脉、可调用外力。',
    '- 事件进度：主线目标、当前阻碍、已完成节点、下一步钩子。',
    '- 伏笔状态：已埋伏笔、已回收伏笔、未解释矛盾。',
    '',
    '## 当前状态',
    '- 主角状态：待定。',
    '- 关系状态：待定。',
    '- 资源状态：待定。',
    '- 事件进度：待定。',
    '- 伏笔状态：待定。',
  ].join('\n')
}

function buildGameStateSeed(input = {}) {
  return buildStoryStateSeed(input)
}

function buildChapterProgressSeed({ title = '' } = {}) {
  return [
    '# 章节推进状态',
    '',
    `- 书名：${title || '待定'}`,
    '- 用途：记录章节推进的剧情账本，防止每章只重复上一章成果。',
    '',
    '## 当前篇章位置',
    '- 当前章节：待定',
    '- 当前阶段目标：待定',
    '- 当前阻碍：待定',
    '- 当前读者期待：待定',
    '',
    '## 主线推进',
    '- 已完成节点：暂无',
    '- 正在推进节点：待定',
    '- 下一章必须推进：待定',
    '- 禁止原地踏步：每章至少推进一个剧情状态、兑现一个信息差或改变一个阻碍。',
    '',
    '## 爽点/情绪推进',
    '- 已兑现爽点：暂无',
    '- 正在积累爽点：待定',
    '- 下一次兑现方式：待定',
    '',
    '## 伏笔与回收',
    '- 已埋伏笔：暂无',
    '- 待回收伏笔：暂无',
    '- 本卷核心悬念：待定',
    '',
    '## 章节节奏账本',
    '- 最近三章功能：待定',
    '- 重复风险：待定',
    '- 下一章功能建议：待定',
    '',
    '## 章节功能账本',
    '- 最近三章功能：待定',
    '- 当前章主功能：待定',
    '- 下一章功能建议：待定',
    '- 功能轮换提醒：连续章节不要只重复同一种推进方式。',
  ].join('\n')
}

function buildChapterMemorySeed({ title = '' } = {}) {
  return [
    '# 最近章节记忆',
    '',
    `- 书名：${title || '待定'}`,
    '- 用途：压缩最近三章到五章的真实剧情、章节功能、题材信号和必须承接点，防止长篇连载写散。',
    '',
    '## 最近三章',
    '- 暂无',
    '',
    '## 当前连续问题',
    '- 题材味道：待观察',
    '- 主线推进：待观察',
    '- 角色状态：待观察',
    '- 重复风险：待观察',
    '',
    '## 下一章必须承接',
    '- 暂无',
  ].join('\n')
}

function buildStructuredStateSeed({ title = '' } = {}) {
  return {
    title: title || '待定',
    currentChapter: '',
    protagonist: {
      status: '',
      goal: '',
      ability: '',
      resources: [],
      constraints: [],
    },
    plot: {
      stageGoal: '',
      currentObstacle: '',
      lastProgress: '',
      nextRequiredMove: '',
    },
    genreSignals: [],
    openLoops: [],
    recentChapterFunctions: [],
    updatedAt: new Date().toISOString(),
  }
}

function buildFuturePlanSeed({ title = '' } = {}) {
  return [
    '# 未来章节规划',
    '',
    `- 书名：${title || '待定'}`,
    '- 用途：滚动规划未来 3-5 章，避免每章现想、节奏散掉。',
    '',
    '## 未来 3-5 章',
    '- 待规划',
    '',
    '## 下一章优先级',
    '- 主功能：待定',
    '- 必须承接：待定',
    '- 必须避免：待定',
  ].join('\n')
}

function buildStyleSampleSeed({ title = '' } = {}) {
  return [
    '# 样章风格校准',
    '',
    `- 书名：${title || '待定'}`,
    '- 用途：记录用户认可的正文风格、节奏、句式密度、爽点写法和禁忌，生成正文时用于校准。',
    '',
    '## 已确认风格',
    '- 暂无',
    '',
    '## 好段落样本',
    '- 暂无',
    '',
    '## 禁止写法',
    '- 暂无',
    '',
    '## 拆书样本指纹',
    '- 人写感统计会从样本文本中抽象出章节节奏、句长、对白比例、钩子密度和题材反馈方式。',
    '- 这里只沉淀统计规律，不保存原文，不做指定作者仿写。',
  ].join('\n')
}

function buildHumanWritingFingerprintSeed({ title = '' } = {}) {
  return [
    '# 人写感指纹',
    '',
    `- 书名：${title || '待定'}`,
    '- 用途：从拆书样本中抽象人工文笔、章节节奏、题材信号和去模板化规律，用于正文生成与自然文风校准。',
    '- 边界：只沉淀统计规律，不保存原文，不复制具体表达，不做指定作者仿写。',
    '',
    '## 拆书样本指纹',
    '- 暂无样本统计。',
    '',
    '## 人写感统计',
    '- 暂无。',
    '',
    '## 章节节奏规律',
    '- 暂无。',
    '',
    '## 题材信号规律',
    '- 暂无。',
    '',
    '## 去 AI 味校准',
    '- 暂无。',
  ].join('\n')
}

function buildMemoryGovernanceSeed({ title = '' } = {}) {
  return [
    '# 记忆治理索引',
    '',
    `- 书名：${title || '待定'}`,
    '- 用途：把长期有效规则、当前事实、历史记录、未来计划和临时观察分层，避免资料越追加越乱。',
    '',
    '## 强规则',
    '- 平台调性、题材底线、人物核心动机和不可违背设定写在这里。',
    '',
    '## 当前事实',
    '- 只保留后续章节必须承接的当前状态。',
    '',
    '## 历史记录',
    '- 已经发生但不需要每章完整携带的事件摘要。',
    '',
    '## 未来计划',
    '- 未来 3-5 章必须推进、必须避免、必须回收的内容。',
    '',
    '## 临时观察',
    '- 还未确认是否长期有效的写作观察，后续可升级为强规则或删除。',
  ].join('\n')
}

function buildProjectRepairLogSeed({ title = '' } = {}) {
  return [
    '# 资料修复记录',
    '',
    `- 书名：${title || '待定'}`,
    '- 用途：记录项目资料修复、跨文件变更和后续章节必须承接的新规则。',
    '- 规则：最近资料修复记录优先于旧资料中含糊或冲突的表述。',
    '',
    '## 最近修复',
    '- 暂无',
  ].join('\n')
}

function buildChapterFunctionTaxonomy() {
  return [
    '## 章节功能判定规则',
    '写正文前必须先判定本章主功能。每章只选 1 个主功能，可以附带 1 个副功能；正文必须交付这个功能，不能只写氛围、解释设定或重复上一章。',
    '',
    '- 能力/资源兑现章：交付能力、资源、身份、关系、线索、资产或阶段成果的明确收益，并写出收益带来的后果；具体兑现物必须服从当前题材。',
    '- 阻碍升级章：让旧阻碍升级或出现新阻碍，主角不能只是顺滑通过，必须产生新的压力。',
    '- 信息差揭示章：揭示一个读者/主角/反派之间的信息差，改变下一步决策。',
    '- 伏笔埋设/回收章：埋下可追踪伏笔，或回收旧伏笔并改变局势。',
    '- 关系转折章：改变主角和关键人物的信任、敌意、承诺、误会或利益绑定。',
    '- 场景/行动推进章：推进地点、行动路线、势力版图、职场局面、案件现场、关系场域或阶段目标；具体场景类型必须服从当前题材。',
    '- 爽点结算章：兑现前文压抑、打脸、认可、反杀、阶段胜利、证据落地、资源到手或关系转折；结算形式必须服从当前题材。',
    '',
    '选择规则：',
    '- 如果最近三章功能重复，本章必须换功能或叠加新的功能交付物。',
    '- 如果上一章已经获得某类收益，本章优先处理收益后果，而不是再次获得同类收益。',
    '- 如果主线停滞，本章优先选择阻碍升级、信息差揭示或行动场景推进。',
    '- 功能交付物必须是可写入章节推进状态的具体变化。',
  ].join('\n')
}

function buildGenreEngineProfile(context = {}) {
  const source = [context.genreRules, context.coreSetting, context.overallOutline].filter(Boolean).join('\n')
  const genreKey = inferGenreKey(source)
  context.genreEngine = genreKey

  if (genreKey === 'webGame') {
    return [
      '## 题材专属写作引擎',
      '网游文专属执行：每章至少保留两类网游信号，优先从系统反馈、任务/副本、技能/装备、玩家社交、NPC 机制、世界公告、排行榜/交易/公会中选择。',
      '- 升级或经验不是终点，必须写出升级后果：技能解锁、任务变化、资源消耗、玩家反应、地图权限或新阻碍。',
      '- 战斗必须体现机制：技能效果、冷却、判定、掉落、任务进度或副本规则。',
    ].join('\n')
  }

  if (genreKey === 'fantasy') {
    return [
      '## 题材专属写作引擎',
      '玄幻/仙侠专属执行：境界、功法、资源、势力关系和因果伏笔必须持续变化。',
      '- 变强必须有代价或条件，不能只靠顿悟跳级。',
      '- 每章至少交付修为/资源/势力/秘境/因果中的一类推进。',
    ].join('\n')
  }

  if (genreKey === 'urban') {
    return [
      '## 题材专属写作引擎',
      '都市文专属执行：身份、资产、关系网络、现实压力和公开认知必须可追踪。',
      '- 爽点要落到现实结果：钱、人脉、权力、舆论、合同、证据、职位或风险变化。',
    ].join('\n')
  }

  if (genreKey === 'romance') {
    return [
      '## 题材专属写作引擎',
      '言情文专属执行：情感阶段、关系温度、误会/承诺、外部阻力和情绪债必须持续变化。',
      '- 每章至少推进一个关系行为边界，不能只写心理独白。',
    ].join('\n')
  }

  if (genreKey === 'suspense') {
    return [
      '## 题材专属写作引擎',
      '悬疑文专属执行：线索、误导、规则危险、推理进度和压力倒计时必须清晰。',
      '- 每章至少新增、反转或回收一个线索，并改变读者的问题列表。',
    ].join('\n')
  }

  return [
    '## 题材专属写作引擎',
    '通用长篇执行：每章必须交付主线、阻碍、关系、资源、伏笔或爽点中的明确变化。',
  ].join('\n')
}

const store = new Store({
  name: 'settings',
  defaults: {
    libraryPath: '',
    openaiApiKey: '',
    openaiModel: 'gpt-4.1',
    openaiBaseUrl: 'https://api.openai.com/v1',
    openaiProxyUrl: '',
    aiConnectionProfiles: [],
    activeAiProfileId: '',
    settingsUiMode: {
      visible: true,
      commercialMode: false,
    },
  },
})

function getPreloadPath() {
  return path.join(__dirname, 'preload.cjs')
}

function getRendererUrl() {
  if (process.env.VITE_DEV_SERVER_URL) {
    return process.env.VITE_DEV_SERVER_URL
  }

  return `file://${path.join(__dirname, '../dist/index.html')}`
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function readJsonFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function readTextFileIfExists(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8')
  } catch {
    return ''
  }
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

function getAiSettings() {
  const apiKey = store.get('openaiApiKey')
  const model = store.get('openaiModel')
  const baseUrl = store.get('openaiBaseUrl')
  const proxyUrl = store.get('openaiProxyUrl')
  const profiles = getAiConnectionProfiles()
  const activeProfileId = typeof store.get('activeAiProfileId') === 'string' ? store.get('activeAiProfileId') : ''
  const settingsUiMode = normalizeSettingsUiMode(store.get('settingsUiMode'))

  return {
    configured: typeof apiKey === 'string' && apiKey.trim().length > 0,
    model: normalizeAiModel(typeof model === 'string' && model.trim() ? model.trim() : 'gpt-4.1'),
    baseUrl: typeof baseUrl === 'string' && baseUrl.trim() ? baseUrl.trim() : 'https://api.openai.com/v1',
    proxyUrl: typeof proxyUrl === 'string' && proxyUrl.trim() ? proxyUrl.trim() : '',
    profiles,
    activeProfileId: profiles.some((profile) => profile.id === activeProfileId) ? activeProfileId : '',
    settingsUiMode,
  }
}

function normalizeSettingsUiMode(rawMode) {
  const mode = rawMode && typeof rawMode === 'object' ? rawMode : {}
  return {
    visible: mode.visible !== false,
    commercialMode: mode.commercialMode === true,
  }
}

function createAiProfileId(settings) {
  const raw = [
    normalizeAiModel(settings?.model),
    typeof settings?.baseUrl === 'string' ? settings.baseUrl.trim().replace(/\/+$/, '') : '',
    typeof settings?.proxyUrl === 'string' ? settings.proxyUrl.trim().replace(/\/+$/, '') : '',
  ].join('|')
  return `ai-${crypto.createHash('sha1').update(raw).digest('hex').slice(0, 16)}`
}

function sanitizeAiConnectionProfile(profile, { includeSecret = false } = {}) {
  if (!profile || typeof profile !== 'object') {
    return null
  }

  const baseUrl = typeof profile.baseUrl === 'string' && profile.baseUrl.trim()
    ? profile.baseUrl.trim().replace(/\/+$/, '')
    : 'https://api.openai.com/v1'
  const proxyUrl = normalizeProxyUrl(typeof profile.proxyUrl === 'string' ? profile.proxyUrl.trim() : '')
  const model = normalizeAiModel(typeof profile.model === 'string' && profile.model.trim() ? profile.model.trim() : 'gpt-4.1')
  const id = typeof profile.id === 'string' && profile.id.trim() ? profile.id.trim() : createAiProfileId({ model, baseUrl, proxyUrl })
  const apiKey = typeof profile.apiKey === 'string' ? profile.apiKey.trim() : ''
  const label = typeof profile.label === 'string' && profile.label.trim()
    ? profile.label.trim().slice(0, 48)
    : `${model} · ${baseUrl.replace(/^https?:\/\//i, '')}`.slice(0, 48)

  return {
    id,
    label,
    model,
    baseUrl,
    proxyUrl,
    configured: apiKey.length > 0,
    lastTestOk: profile.lastTestOk === true,
    lastTestedAt: typeof profile.lastTestedAt === 'string' ? profile.lastTestedAt : '',
    createdAt: typeof profile.createdAt === 'string' ? profile.createdAt : new Date().toISOString(),
    updatedAt: typeof profile.updatedAt === 'string' ? profile.updatedAt : new Date().toISOString(),
    ...(includeSecret ? { apiKey } : {}),
  }
}

function getAiConnectionProfiles({ includeSecret = false } = {}) {
  const stored = store.get('aiConnectionProfiles')
  const profiles = Array.isArray(stored) ? stored : []
  const normalized = profiles
    .map((profile) => sanitizeAiConnectionProfile(profile, { includeSecret }))
    .filter(Boolean)
  const unique = new Map()
  normalized.forEach((profile) => unique.set(profile.id, profile))
  return [...unique.values()]
}

function persistAiSettings(settings, activeProfileId = '') {
  store.set('openaiApiKey', settings.apiKey)
  store.set('openaiModel', settings.model)
  store.set('openaiBaseUrl', settings.baseUrl)
  store.set('openaiProxyUrl', settings.proxyUrl)
  if (activeProfileId) {
    store.set('activeAiProfileId', activeProfileId)
  }
}

function upsertAiConnectionProfile(settings, { lastTestOk = false } = {}) {
  const now = new Date().toISOString()
  const id = typeof settings.profileId === 'string' && settings.profileId.trim()
    ? settings.profileId.trim()
    : createAiProfileId(settings)
  const existingProfiles = getAiConnectionProfiles({ includeSecret: true })
  const existing = existingProfiles.find((profile) => profile.id === id)
  const profile = sanitizeAiConnectionProfile({
    ...existing,
    ...settings,
    id,
    label: settings.label || existing?.label,
    lastTestOk: lastTestOk || existing?.lastTestOk === true,
    lastTestedAt: lastTestOk ? now : existing?.lastTestedAt || '',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  }, { includeSecret: true })

  const nextProfiles = [
    profile,
    ...existingProfiles.filter((item) => item.id !== profile.id),
  ].slice(0, 12)
  store.set('aiConnectionProfiles', nextProfiles)
  store.set('activeAiProfileId', profile.id)
  persistAiSettings(profile, profile.id)
  return profile
}

function activateAiConnectionProfile(profileId) {
  const profile = getAiConnectionProfiles({ includeSecret: true }).find((item) => item.id === profileId)
  if (!profile) {
    throw new Error('未找到这个 AI 配置档案')
  }
  if (!profile.apiKey) {
    throw new Error('这个 AI 配置档案缺少 API Key，请重新保存或测试连接')
  }
  persistAiSettings(profile, profile.id)
  return getAiSettings()
}

function deleteAiConnectionProfile(profileId) {
  const profiles = getAiConnectionProfiles({ includeSecret: true })
  const nextProfiles = profiles.filter((profile) => profile.id !== profileId)
  store.set('aiConnectionProfiles', nextProfiles)
  if (store.get('activeAiProfileId') === profileId) {
    store.set('activeAiProfileId', nextProfiles[0]?.id || '')
    if (nextProfiles[0]) {
      persistAiSettings(nextProfiles[0], nextProfiles[0].id)
    }
  }
  return getAiSettings()
}

const supportedReasoningEfforts = new Set(['none', 'minimal', 'low', 'medium', 'high', 'xhigh'])

function isReasoningModel(model) {
  const normalized = normalizeAiModel(model).toLowerCase()
  return /^(gpt-5|o\d|o\d-|o\d_|gpt-oss)/.test(normalized)
}

function normalizeReasoningEffort(model, effort) {
  const normalizedEffort = typeof effort === 'string' ? effort.trim().toLowerCase() : ''
  if (!normalizedEffort || !supportedReasoningEfforts.has(normalizedEffort) || !isReasoningModel(model)) {
    return ''
  }

  const normalizedModel = normalizeAiModel(model).toLowerCase()
  if (normalizedModel.includes('gpt-5-pro')) {
    return 'high'
  }
  if (normalizedModel.startsWith('gpt-5.1') && ['none', 'minimal', 'xhigh'].includes(normalizedEffort)) {
    return 'low'
  }
  if (!normalizedModel.startsWith('gpt-5.1') && normalizedEffort === 'none') {
    return 'low'
  }
  return normalizedEffort
}

function normalizeAiModel(model) {
  const trimmed = typeof model === 'string' ? model.trim() : ''
  if (!trimmed) {
    return 'gpt-4.1'
  }

  return trimmed.replace(/^GPT-/i, 'gpt-')
}

function normalizeAiBaseUrl(baseUrl) {
  const trimmed = typeof baseUrl === 'string' && baseUrl.trim() ? baseUrl.trim() : 'https://api.openai.com/v1'
  return trimmed
    .replace(/\/+$/, '')
    .replace(/\/(?:chat\/completions|responses)$/i, '')
    .replace(/\/+$/, '')
}

function isChatCompletionsOnlyProvider(settings = {}) {
  const model = normalizeAiModel(settings.model).toLowerCase()
  const baseUrl = String(settings.baseUrl || '').toLowerCase()
  return model.startsWith('deepseek') || baseUrl.includes('deepseek.')
}

function assertAiSettings(input) {
  if (typeof input?.profileId === 'string' && input.profileId.trim() && !input.apiKey && !input.baseUrl && !input.model) {
    const profile = getAiConnectionProfiles({ includeSecret: true }).find((item) => item.id === input.profileId.trim())
    if (profile) {
      return {
        apiKey: profile.apiKey,
        model: profile.model,
        baseUrl: profile.baseUrl,
        proxyUrl: profile.proxyUrl,
        profileId: profile.id,
        label: profile.label,
      }
    }
  }

  const existingApiKey = store.get('openaiApiKey')
  const inputApiKey = typeof input?.apiKey === 'string' ? input.apiKey.trim() : ''
  const apiKey = inputApiKey || (typeof existingApiKey === 'string' ? existingApiKey.trim() : '')
  const model = normalizeAiModel(typeof input?.model === 'string' && input.model.trim() ? input.model.trim() : 'gpt-4.1')
  const baseUrl = normalizeAiBaseUrl(input?.baseUrl)
  const proxyUrl = normalizeProxyUrl(typeof input?.proxyUrl === 'string' ? input.proxyUrl.trim() : '')

  if (!apiKey) {
    throw new Error('\u8bf7\u8f93\u5165 OpenAI API Key')
  }

  try {
    new URL(baseUrl)
  } catch {
    throw new Error('\u8bf7\u8f93\u5165\u6709\u6548\u7684 Base URL')
  }

  if (proxyUrl) {
    try {
      new URL(proxyUrl)
    } catch {
      throw new Error('\u8bf7\u8f93\u5165\u6709\u6548\u7684\u4ee3\u7406\u5730\u5740\uff0c\u4f8b\u5982 http://127.0.0.1:18081')
    }
  }

  return {
    apiKey,
    model,
    baseUrl,
    proxyUrl,
    profileId: typeof input?.profileId === 'string' ? input.profileId.trim() : '',
    label: typeof input?.label === 'string' ? input.label.trim() : '',
  }
}

function createAiNetworkError(error, baseUrl) {
  if (isAiAbortError(error)) {
    return createAiAbortError()
  }
  const detail = error instanceof Error && error.message ? `（${error.message}）` : ''
  return new Error(`无法连接 AI 服务：请检查 Base URL、网络/代理、防火墙或服务商地址是否可用。当前 Base URL：${baseUrl}${detail}`)
}

function normalizeProxyUrl(proxyUrl) {
  if (!proxyUrl) {
    return ''
  }

  if (/^[a-z]+:\/\//i.test(proxyUrl)) {
    return proxyUrl.replace(/\/+$/, '')
  }

  return `http://${proxyUrl}`.replace(/\/+$/, '')
}

async function withAiProxy(proxyUrl, task) {
  if (!proxyUrl) {
    return task()
  }

  const proxyRules = `http=${proxyUrl};https=${proxyUrl}`
  await session.defaultSession.setProxy({ proxyRules })

  try {
    return await task()
  } finally {
    await session.defaultSession.setProxy({ proxyRules: '' })
  }
}

async function nodeAiFetch(url, options = {}, proxyUrl = '') {
  let dispatcher = null
  if (proxyUrl) {
    dispatcher = aiProxyAgents.get(proxyUrl)
    if (!dispatcher) {
      dispatcher = new ProxyAgent(proxyUrl)
      aiProxyAgents.set(proxyUrl, dispatcher)
    }
  }
  return undiciFetch(url, {
    ...options,
    ...(dispatcher ? { dispatcher } : {}),
  })
}

const aiRequestTimeoutMs = 180000
const aiStreamRequestTimeoutMs = 240000

function isTransientAiHttpStatus(status) {
  return [408, 409, 425, 429, 500, 502, 503, 504, 520, 521, 522, 523, 524].includes(Number(status))
}

function createTimedRequestSignal(signal, timeoutMs = aiRequestTimeoutMs) {
  if (signal?.aborted) {
    throw createAiAbortError()
  }

  const controller = new AbortController()
  let timedOut = false
  const abortFromParent = () => controller.abort()
  const timer = Number.isFinite(timeoutMs) && timeoutMs > 0
    ? setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
    : null

  if (signal && typeof signal.addEventListener === 'function') {
    signal.addEventListener('abort', abortFromParent, { once: true })
  }

  return {
    signal: controller.signal,
    cleanup() {
      if (timer) {
        clearTimeout(timer)
      }
      if (signal && typeof signal.removeEventListener === 'function') {
        signal.removeEventListener('abort', abortFromParent)
      }
    },
    isTimedOut: () => timedOut,
  }
}

function assertNotAborted(signal) {
  if (signal?.aborted) {
    throw createAiAbortError()
  }
}

async function aiFetch(url, options = {}, proxyUrl = '', fetchOptions = {}) {
  const timedSignal = createTimedRequestSignal(options.signal, fetchOptions.timeoutMs ?? aiRequestTimeoutMs)
  const requestOptions = { ...options, signal: timedSignal.signal }
  const request = () => net.fetch(url, requestOptions)
  let response
  let netFetchError = null

  try {
    if (net?.fetch) {
      response = await withAiProxy(proxyUrl, request)
      if (fetchOptions.keepSignalAlive) {
        response.__aiSignalCleanup = timedSignal.cleanup
      } else {
        timedSignal.cleanup()
      }
      return response
    }
  } catch (error) {
    if (timedSignal.isTimedOut()) {
      timedSignal.cleanup()
      throw new Error(`AI request timed out after ${Math.round((fetchOptions.timeoutMs ?? aiRequestTimeoutMs) / 1000)} seconds. Try again or switch to a faster model.`)
    }
    if (options.signal?.aborted || error?.name === 'AbortError') {
      timedSignal.cleanup()
      throw createAiAbortError()
    }
    netFetchError = error
  }

  try {
    response = await nodeAiFetch(url, requestOptions, proxyUrl)
    if (fetchOptions.keepSignalAlive) {
      response.__aiSignalCleanup = timedSignal.cleanup
    } else {
      timedSignal.cleanup()
    }
    return response
  } catch (error) {
    timedSignal.cleanup()
    if (timedSignal.isTimedOut()) {
      throw new Error(`AI request timed out after ${Math.round((fetchOptions.timeoutMs ?? aiRequestTimeoutMs) / 1000)} seconds. Try again or switch to a faster model.`)
    }
    if (options.signal?.aborted || error?.name === 'AbortError') {
      throw createAiAbortError()
    }
    const fallbackError = netFetchError instanceof Error
      ? new Error(`${error instanceof Error ? error.message : String(error)}; Electron net.fetch: ${netFetchError.message}`)
      : error
    throw createAiNetworkError(fallbackError, url)
  }
}

function extractResponseText(responseBody) {
  if (typeof responseBody?.output_text === 'string') {
    return responseBody.output_text
  }

  if (!Array.isArray(responseBody?.output)) {
    return ''
  }

  return responseBody.output
    .flatMap((item) => {
      const parts = []
      if (typeof item?.text === 'string') {
        parts.push(item.text)
      }
      if (typeof item?.content === 'string') {
        parts.push(item.content)
      }
      if (Array.isArray(item?.content)) {
        parts.push(extractContentPartsText(item.content))
      }
      if (Array.isArray(item?.message?.content)) {
        parts.push(extractContentPartsText(item.message.content))
      }
      return parts
    })
    .filter(Boolean)
    .join('\n')
}

function extractContentPartsText(parts) {
  if (!Array.isArray(parts)) {
    return typeof parts === 'string' ? parts : ''
  }

  return parts
    .map((part) => {
      if (typeof part === 'string') {
        return part
      }
      if (part?.type === 'output_text' && typeof part?.text === 'string') {
        return part.text
      }
      if (typeof part?.text === 'string') {
        return part.text
      }
      if (typeof part?.content === 'string') {
        return part.content
      }
      if (typeof part?.refusal === 'string') {
        return part.refusal
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
}

function responseOutputSummary(body) {
  if (!Array.isArray(body?.output)) {
    return ''
  }

  const summary = body.output
    .slice(0, 5)
    .map((item) => {
      const type = item?.type ?? 'unknown'
      const status = item?.status ? `/${item.status}` : ''
      const contentTypes = Array.isArray(item?.content) ? ` content=${item.content.map((part) => part?.type ?? typeof part).join('|')}` : ''
      return `${type}${status}${contentTypes}`
    })
    .join(', ')
  return summary ? `，output: ${summary}` : ''
}

function responseUsageSummary(body) {
  const usage = body?.usage
  if (!usage || typeof usage !== 'object') {
    return ''
  }

  const inputTokens = usage.input_tokens ?? usage.prompt_tokens
  const outputTokens = usage.output_tokens ?? usage.completion_tokens
  return `，usage: input=${inputTokens ?? '-'} output=${outputTokens ?? '-'}`
}

function responseErrorSummary(body) {
  if (typeof body?.error?.message === 'string') {
    return `，error: ${body.error.message}`
  }
  if (typeof body?.incomplete_details?.reason === 'string') {
    return `，reason: ${body.incomplete_details.reason}`
  }
  return ''
}

function buildEmptyResponsesTextMessage(body) {
  const status = typeof body?.status === 'string' ? `，status: ${body.status}` : ''
  const reason = responseErrorSummary(body)
  const outputTypes = responseOutputSummary(body)
  const usage = responseUsageSummary(body)

  return `Responses 未返回可用文本${status}${reason}${outputTypes}${usage}。建议：请降低本次输出长度、重试，或切换为支持当前端点的模型。`
}

function createAiAbortError() {
  const error = new Error('\u5df2\u505c\u6b62\u751f\u6210')
  error.name = 'AbortError'
  return error
}

function isAiAbortError(error) {
  return error?.name === 'AbortError'
    || error?.code === 'ABORT_ERR'
    || error?.message === '\u5df2\u505c\u6b62\u751f\u6210'
    || /aborted|abort|cancel/i.test(String(error?.message || ''))
}

function registerAiRequest(requestId) {
  if (typeof requestId !== 'string' || !requestId.trim()) {
    return null
  }

  const existing = aiRequestControllers.get(requestId)
  if (existing) {
    existing.abort()
  }

  const controller = new AbortController()
  aiRequestControllers.set(requestId, controller)
  return controller
}

function releaseAiRequest(requestId, controller) {
  if (requestId && aiRequestControllers.get(requestId) === controller) {
    aiRequestControllers.delete(requestId)
  }
}

function sendAiTaskProgress(payload) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }

  mainWindow.webContents.send('ai:task-progress', {
    requestId: typeof payload?.requestId === 'string' ? payload.requestId : '',
    scope: typeof payload?.scope === 'string' ? payload.scope : 'general',
    phase: typeof payload?.phase === 'string' ? payload.phase : '',
    label: typeof payload?.label === 'string' ? payload.label : '',
    detail: typeof payload?.detail === 'string' ? payload.detail : '',
    preview: typeof payload?.preview === 'string' ? payload.preview : '',
    status: typeof payload?.status === 'string' ? payload.status : 'running',
  })
}

function createAiTaskProgressEmitter({ requestId = '', scope = 'general', label = '' } = {}) {
  return (phase, detail = '', preview = '', status = 'running') => {
    sendAiTaskProgress({
      requestId,
      scope,
      label,
      phase,
      detail,
      preview: limitText(preview, 1400),
      status,
    })
  }
}

function createPromptCacheKey(...parts) {
  const raw = parts.filter((part) => typeof part === 'string' && part.trim()).join('|')
  if (!raw) {
    return ''
  }

  return `writing-${crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32)}`
}

function createBookWritingPromptCacheKey(bookPath) {
  return createPromptCacheKey('book-writing-v2', bookPath)
}

function textLength(value) {
  return typeof value === 'string' ? value.length : JSON.stringify(value ?? '').length
}

function splitHumanWritingSentences(text) {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[。！？!?；;])/u)
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitHumanWritingParagraphs(text) {
  return String(text ?? '')
    .split(/\n{1,}/u)
    .map((item) => item.trim())
    .filter((item) => normalizeMeaningfulContent(item).length >= 8)
}

function percentile(values, ratio) {
  if (!values.length) {
    return 0
  }

  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)))
  return sorted[index]
}

function countMatches(text, patterns) {
  return patterns.reduce((count, pattern) => count + (String(text ?? '').match(pattern)?.length ?? 0), 0)
}

function analyzeHumanWritingSamples(samples) {
  const normalizedSamples = samples
    .map((sample) => ({
      name: sample.name || '未命名样本',
      content: markdownToPlainText(sample.content || ''),
    }))
    .filter((sample) => normalizeMeaningfulContent(sample.content).length >= 80)

  const allText = normalizedSamples.map((sample) => sample.content).join('\n')
  const paragraphs = splitHumanWritingParagraphs(allText)
  const sentences = splitHumanWritingSentences(allText)
  const paragraphLengths = paragraphs.map((paragraph) => countTextWords(paragraph)).filter(Boolean)
  const sentenceLengths = sentences.map((sentence) => countTextWords(sentence)).filter(Boolean)
  const dialogueParagraphs = paragraphs.filter((paragraph) => /[“”"]/.test(paragraph) || /^[「『]/u.test(paragraph)).length
  const hookSignals = countMatches(allText, [/？/g, /！/g, /忽然|猛地|就在这时|下一刻|系统|公告|任务|奖励|经验|升级/g])
  const webGameSignals = countMatches(allText, [/系统/g, /任务/g, /经验/g, /等级/g, /技能/g, /装备/g, /NPC/gi, /玩家/g, /副本/g, /公告/g])
  const summarySignals = countMatches(allText, [/这意味着/g, /他意识到/g, /所有人都知道/g, /毫无疑问/g, /换句话说/g])
  const totalWords = countTextWords(allText)
  const avgParagraph = paragraphLengths.length ? Math.round(paragraphLengths.reduce((sum, value) => sum + value, 0) / paragraphLengths.length) : 0
  const avgSentence = sentenceLengths.length ? Math.round(sentenceLengths.reduce((sum, value) => sum + value, 0) / sentenceLengths.length) : 0
  const dialogueRatio = paragraphs.length ? Math.round((dialogueParagraphs / paragraphs.length) * 100) : 0
  const hookDensity = totalWords ? Math.round((hookSignals / totalWords) * 1000) : 0
  const genreDensity = totalWords ? Math.round((webGameSignals / totalWords) * 1000) : 0
  const summaryDensity = totalWords ? Math.round((summarySignals / totalWords) * 1000) : 0

  return {
    sampleCount: normalizedSamples.length,
    totalWords,
    paragraphCount: paragraphs.length,
    sentenceCount: sentences.length,
    avgParagraph,
    avgSentence,
    p20Sentence: percentile(sentenceLengths, 0.2),
    p80Sentence: percentile(sentenceLengths, 0.8),
    dialogueRatio,
    hookDensity,
    genreDensity,
    summaryDensity,
    sampleNames: normalizedSamples.slice(0, 20).map((sample) => sample.name),
  }
}

function buildHumanWritingFingerprintMarkdown({ bookTitle, analysis, sourceLabel = '本地样本' }) {
  const sentenceRange = analysis.p20Sentence && analysis.p80Sentence ? `${analysis.p20Sentence}-${analysis.p80Sentence} 字` : '暂无'
  const summaryAdvice = analysis.summaryDensity > 2
    ? '样本里也有少量总结句，生成时仍需优先写动作、对话和现场反馈。'
    : '样本总结腔较低，生成时要避免“这意味着/他意识到/所有人都知道”等解释句。'

  return [
    '# 人写感指纹',
    '',
    `- 书名：${bookTitle || '待定'}`,
    `- 样本来源：${sourceLabel}`,
    `- 样本数量：${analysis.sampleCount}`,
    `- 统计字数：${analysis.totalWords}`,
    '- 边界：只沉淀统计规律，不保存原文，不复制具体表达，不做指定作者仿写。',
    '',
    '## 拆书样本指纹',
    `- 样本文件：${analysis.sampleNames.length ? analysis.sampleNames.join('、') : '暂无'}`,
    '- 使用方式：样本统计只作为规律，用于校准节奏、段落、对白、钩子和题材信号；不要复刻原句。',
    '',
    '## 人写感统计',
    `- 平均段落长度：${analysis.avgParagraph || '暂无'} 字`,
    `- 平均句长：${analysis.avgSentence || '暂无'} 字`,
    `- 常见句长带：${sentenceRange}`,
    `- 对白段落比例：${analysis.dialogueRatio}%`,
    `- 钩子/反馈密度：每千字约 ${analysis.hookDensity} 个`,
    `- 题材信号密度：每千字约 ${analysis.genreDensity} 个`,
    '',
    '## 章节节奏规律',
    '- 每章要有可见推进：动作选择、冲突反馈、奖励/损失、信息差变化或章末钩子至少落地一项。',
    '- 段落不要平均铺开，短句用于反馈和转折，长句用于动作连续和情绪递进。',
    '- 爽点不要只宣布结果，要写触发、反应、代价和后续压力。',
    '',
    '## 题材信号规律',
    '- 网游文优先显化：系统、任务、经验、等级、技能、装备、玩家/NPC、副本、公告、论坛/世界频道等反馈。',
    '- 题材信号要变成现场事件，不要只作为设定说明堆在段落里。',
    '',
    '## 去 AI 味校准',
    `- ${summaryAdvice}`,
    '- 避免每段同构、过度对称排比、先总结后举例的说明书写法。',
    '- 优先用人物动作、对白停顿、旁人反应、环境反馈承接情绪。',
  ].join('\n')
}

function inferSamplePoolGroup(rootPath, filePath) {
  const relative = path.relative(rootPath, filePath)
  const parts = relative.split(path.sep).filter(Boolean)
  const fileName = parts.at(-1) || path.basename(filePath)

  if (parts.length >= 3) {
    return {
      platform: parts[0] || '未标注平台',
      genre: parts[1] || '未标注题材',
      fileName,
    }
  }

  if (parts.length >= 2) {
    return {
      platform: '未标注平台',
      genre: parts[0] || '未标注题材',
      fileName,
    }
  }

  return {
    platform: '未标注平台',
    genre: '未标注题材',
    fileName,
  }
}

function groupSamplePoolFiles(rootPath, files) {
  const groups = new Map()

  for (const file of files) {
    const inferred = inferSamplePoolGroup(rootPath, file)
    const key = `${inferred.platform}|||${inferred.genre}`
    const group = groups.get(key) ?? {
      platform: inferred.platform,
      genre: inferred.genre,
      files: [],
    }
    group.files.push(file)
    groups.set(key, group)
  }

  return [...groups.values()].sort((a, b) => `${a.platform}/${a.genre}`.localeCompare(`${b.platform}/${b.genre}`, 'zh-CN'))
}

function buildSamplePoolFingerprintFileName(platform, genre) {
  const safePlatform = sanitizeFolderName(platform || '未标注平台') || '未标注平台'
  const safeGenre = sanitizeFolderName(genre || '未标注题材') || '未标注题材'
  return `${safePlatform}-${safeGenre}.md`
}

function buildSamplePoolFingerprintMarkdown({ platform, genre, analysis, sourceRoot }) {
  return [
    `# ${platform || '未标注平台'} / ${genre || '未标注题材'} 样本指纹`,
    '',
    `- 平台：${platform || '未标注平台'}`,
    `- 题材：${genre || '未标注题材'}`,
    `- 样本池：${sourceRoot}`,
    `- 样本数量：${analysis.sampleCount}`,
    `- 统计字数：${analysis.totalWords}`,
    '- 边界：只输出指纹库，不保存原文章节，不把原文带入生成上下文。',
    '',
    buildHumanWritingFingerprintMarkdown({
      bookTitle: `${platform || '未标注平台'}-${genre || '未标注题材'}`,
      analysis,
      sourceLabel: `${platform || '未标注平台'}/${genre || '未标注题材'}`,
    }),
  ].join('\n')
}

function recordAiCallLog(entry) {
  const safeEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    time: new Date().toISOString(),
    endpoint: entry.endpoint,
    status: entry.status,
    model: entry.model,
    baseUrl: entry.baseUrl,
    durationMs: entry.durationMs,
    inputChars: entry.inputChars,
    outputChars: entry.outputChars ?? 0,
    maxOutputTokens: Number.isFinite(entry.maxOutputTokens) ? entry.maxOutputTokens : null,
    reasoningEffort: entry.reasoningEffort || '',
    promptCacheKey: entry.promptCacheKey || '',
    error: entry.error || '',
  }

  aiCallLogs.unshift(safeEntry)
  if (aiCallLogs.length > aiCallLogLimit) {
    aiCallLogs.length = aiCallLogLimit
  }
}

function getAiCallLogs() {
  return aiCallLogs.map((entry) => ({ ...entry }))
}

async function runCancellableAiTask(input, task) {
  const requestId = typeof input?.requestId === 'string' ? input.requestId : ''
  const controller = registerAiRequest(requestId)
  const parentSignal = input?.parentSignal
  const abortFromParent = () => controller?.abort()

  if (controller && parentSignal && typeof parentSignal.addEventListener === 'function') {
    if (parentSignal.aborted) {
      controller.abort()
    } else {
      parentSignal.addEventListener('abort', abortFromParent, { once: true })
    }
  }

  try {
    return await task(controller?.signal)
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw createAiAbortError()
    }
    throw error
  } finally {
    if (parentSignal && typeof parentSignal.removeEventListener === 'function') {
      parentSignal.removeEventListener('abort', abortFromParent)
    }
    releaseAiRequest(requestId, controller)
  }
}

async function callOpenAiText({ input, temperature = 0.2, maxOutputTokens, reasoningEffort = 'low', promptCacheKey = '', signal, settings: overrideSettings }) {
  const settings = overrideSettings ?? getAiSettings()
  const apiKey = settings.apiKey ?? store.get('openaiApiKey')
  const model = settings.model
  const baseUrl = settings.baseUrl.replace(/\/+$/, '')
  const proxyUrl = settings.proxyUrl ?? ''
  if (isChatCompletionsOnlyProvider({ model, baseUrl })) {
    return callOpenAiChatText({ input, temperature, maxOutputTokens, signal, settings: { ...settings, apiKey, model, baseUrl, proxyUrl } })
  }
  const normalizedReasoningEffort = normalizeReasoningEffort(model, reasoningEffort)
  const startedAt = Date.now()
  const baseLog = {
    endpoint: '/responses',
    model,
    baseUrl,
    inputChars: textLength(input),
    maxOutputTokens,
    reasoningEffort: normalizedReasoningEffort,
    promptCacheKey,
  }

  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    const error = '\u8bf7\u5148\u5728 AI \u8bbe\u7f6e\u4e2d\u586b\u5199 OpenAI API Key'
    recordAiCallLog({
      ...baseLog,
      status: 'failed',
      durationMs: Date.now() - startedAt,
      error,
    })
    throw new Error(error)
  }

  let response

  try {
    response = await aiFetch(`${baseUrl}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        model,
        input,
        temperature,
        ...(normalizedReasoningEffort ? { reasoning: { effort: normalizedReasoningEffort } } : {}),
        ...(Number.isFinite(maxOutputTokens) ? { max_output_tokens: maxOutputTokens } : {}),
        ...(promptCacheKey ? { prompt_cache_key: promptCacheKey } : {}),
      }),
    }, proxyUrl)
  } catch (error) {
    if (isAiAbortError(error)) {
      throw createAiAbortError()
    }
    const readableError = createAiNetworkError(error, baseUrl)
    recordAiCallLog({
      ...baseLog,
      status: 'failed',
      durationMs: Date.now() - startedAt,
      error: readableError.message,
    })
    throw readableError
  }

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (isTransientAiHttpStatus(response.status)) {
      const fallbackStartedAt = Date.now()
      try {
        const fallbackOutput = await callOpenAiChatCompletions({ apiKey: apiKey.trim(), baseUrl, model, input, temperature, maxOutputTokens, signal, proxyUrl })
        recordAiCallLog({
          ...baseLog,
          endpoint: '/chat/completions',
          status: 'success',
          durationMs: Date.now() - fallbackStartedAt,
          outputChars: textLength(fallbackOutput),
          error: `Responses transient ${response.status} fallback`,
        })
        return fallbackOutput
      } catch (error) {
        recordAiCallLog({
          ...baseLog,
          endpoint: '/chat/completions',
          status: 'failed',
          durationMs: Date.now() - fallbackStartedAt,
          error: error instanceof Error ? error.message : `Responses transient ${response.status} fallback failed`,
        })
        const message = typeof body?.error?.message === 'string' ? body.error.message : `OpenAI API 请求失败：${response.status}`
        throw new Error(`${message}；备用通道也失败，请稍后重试或切换更快模型。`)
      }
    }

    if ([400, 404, 405, 422, 501].includes(response.status)) {
      const fallbackStartedAt = Date.now()
      try {
        const fallbackOutput = await callOpenAiChatCompletions({ apiKey: apiKey.trim(), baseUrl, model, input, temperature, maxOutputTokens, signal, proxyUrl })
        recordAiCallLog({
          ...baseLog,
          endpoint: '/chat/completions',
          status: 'success',
          durationMs: Date.now() - fallbackStartedAt,
          outputChars: textLength(fallbackOutput),
          error: `Responses ${response.status} fallback`,
        })
        return fallbackOutput
      } catch (error) {
        recordAiCallLog({
          ...baseLog,
          endpoint: '/chat/completions',
          status: 'failed',
          durationMs: Date.now() - fallbackStartedAt,
          error: error instanceof Error ? error.message : 'Chat Completions fallback failed',
        })
        throw error
      }
    }

    const message = typeof body?.error?.message === 'string' ? body.error.message : `OpenAI API \u8bf7\u6c42\u5931\u8d25\uff1a${response.status}`
    recordAiCallLog({
      ...baseLog,
      status: 'failed',
      durationMs: Date.now() - startedAt,
      error: message,
    })
    throw new Error(message)
  }

  const textOutput = extractResponseText(body).trim()

  if (!textOutput) {
    const message = buildEmptyResponsesTextMessage(body)
    const emptyFallbackStartedAt = Date.now()

    try {
      const fallbackOutput = await callOpenAiChatCompletions({ apiKey: apiKey.trim(), baseUrl, model, input, temperature, maxOutputTokens, signal, proxyUrl })
      recordAiCallLog({
        ...baseLog,
        endpoint: '/chat/completions',
        status: 'success',
        durationMs: Date.now() - emptyFallbackStartedAt,
        outputChars: textLength(fallbackOutput),
        error: 'Responses empty text fallback',
      })
      return fallbackOutput
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : 'Chat Completions fallback failed'
      const combinedMessage = `${message}；Chat Completions 兜底也失败：${fallbackMessage}`
      recordAiCallLog({
        ...baseLog,
        status: 'failed',
        durationMs: Date.now() - startedAt,
        error: combinedMessage,
      })
      throw new Error(combinedMessage)
    }
  }

  recordAiCallLog({
    ...baseLog,
    status: 'success',
    durationMs: Date.now() - startedAt,
    outputChars: textLength(textOutput),
  })

  return textOutput
}

async function callOpenAiChatText({ input, temperature = 0.2, maxOutputTokens, signal, settings: overrideSettings }) {
  const settings = overrideSettings ?? getAiSettings()
  const apiKey = settings.apiKey ?? store.get('openaiApiKey')
  const model = settings.model
  const baseUrl = settings.baseUrl.replace(/\/+$/, '')
  const proxyUrl = settings.proxyUrl ?? ''

  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error('\u8bf7\u5148\u5728 AI \u8bbe\u7f6e\u4e2d\u586b\u5199 OpenAI API Key')
  }

  return callOpenAiChatCompletions({
    apiKey: apiKey.trim(),
    baseUrl,
    model,
    input,
    temperature,
    maxOutputTokens,
    signal,
    proxyUrl,
  })
}

async function callOpenAiChatCompletions({ apiKey, baseUrl, model, input, temperature, maxOutputTokens, signal, proxyUrl = '' }) {
  let response

  try {
    response = await aiFetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: input,
          },
        ],
        temperature,
        ...(Number.isFinite(maxOutputTokens) ? { max_tokens: maxOutputTokens } : {}),
      }),
    }, proxyUrl, { timeoutMs: aiStreamRequestTimeoutMs, keepSignalAlive: true })
  } catch (error) {
    if (isAiAbortError(error)) {
      throw createAiAbortError()
    }
    throw createAiNetworkError(error, baseUrl)
  }

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = typeof body?.error?.message === 'string' ? body.error.message : `Chat Completions \u8bf7\u6c42\u5931\u8d25\uff1a${response.status}`
    throw new Error(message)
  }

  const messageContent = body?.choices?.[0]?.message?.content
  const content = Array.isArray(messageContent)
    ? extractContentPartsText(messageContent)
    : typeof messageContent === 'string'
      ? messageContent
      : typeof body?.choices?.[0]?.message?.refusal === 'string'
        ? body.choices[0].message.refusal
        : ''

  if (typeof content !== 'string' || !content.trim()) {
    const reason = body?.choices?.[0]?.finish_reason
    const detail = reason ? `，finish_reason: ${reason}` : ''
    const choiceCount = Array.isArray(body?.choices) ? `，choices: ${body.choices.length}` : ''
    throw new Error(`Chat Completions 未返回可用文本${detail}${choiceCount}${chatChoiceSummary(body)}。建议：如果持续为空，请检查中转站是否完整转发 output_text/choices.message.content。`)
  }

  return content.trim()
}

async function callOpenAiChatCompletionsStream({
  apiKey,
  baseUrl,
  model,
  input,
  temperature,
  maxOutputTokens,
  promptCacheKey = '',
  signal,
  proxyUrl = '',
  onDelta,
}) {
  let response
  const startedAt = Date.now()
  const baseLog = {
    endpoint: '/chat/completions:stream',
    model,
    baseUrl,
    inputChars: textLength(input),
    maxOutputTokens,
    promptCacheKey,
  }
  const finalize = (output) => {
    recordAiCallLog({
      ...baseLog,
      status: 'success',
      durationMs: Date.now() - startedAt,
      outputChars: textLength(output),
    })
    return output
  }

  try {
    response = await aiFetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: input,
          },
        ],
        temperature,
        stream: true,
        ...(Number.isFinite(maxOutputTokens) ? { max_tokens: maxOutputTokens } : {}),
      }),
    }, proxyUrl, { timeoutMs: aiStreamRequestTimeoutMs, keepSignalAlive: true })
  } catch (error) {
    if (isAiAbortError(error)) {
      throw createAiAbortError()
    }
    const readableError = createAiNetworkError(error, baseUrl)
    recordAiCallLog({
      ...baseLog,
      status: 'failed',
      durationMs: Date.now() - startedAt,
      error: readableError.message,
    })
    throw readableError
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    response.__aiSignalCleanup?.()
    const message = typeof body?.error?.message === 'string' ? body.error.message : 'Chat Completions stream failed: ' + response.status
    recordAiCallLog({
      ...baseLog,
      status: 'failed',
      durationMs: Date.now() - startedAt,
      error: message,
    })
    throw new Error(message)
  }

  if (!response.body || typeof response.body.getReader !== 'function') {
    response.__aiSignalCleanup?.()
    const output = await callOpenAiChatCompletions({ apiKey, baseUrl, model, input, temperature, maxOutputTokens, signal, proxyUrl })
    return finalize(output)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let content = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split(/\r?\n\r?\n/)
      buffer = events.pop() ?? ''

      for (const rawEvent of events) {
        const lines = rawEvent.split(/\r?\n/)
        const data = lines
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trimStart())
          .filter(Boolean)
          .join('\n')

        if (!data) {
          continue
        }

        if (data === '[DONE]') {
          return finalize(content.trim())
        }

        let eventBody
        try {
          eventBody = JSON.parse(data)
        } catch {
          continue
        }

        const delta = eventBody?.choices?.[0]?.delta?.content
        if (typeof delta === 'string' && delta) {
          content += delta
          if (typeof onDelta === 'function') {
            onDelta(content, delta)
          }
          continue
        }

        const messageContent = eventBody?.choices?.[0]?.message?.content
        if (typeof messageContent === 'string' && messageContent && !content) {
          content = messageContent
          if (typeof onDelta === 'function') {
            onDelta(content, messageContent)
          }
        }
      }
    }
  } finally {
    response.__aiSignalCleanup?.()
    reader.releaseLock?.()
  }

  const trailing = buffer.trim()
  if (trailing && trailing !== '[DONE]') {
    try {
      const eventBody = JSON.parse(trailing)
      const delta = eventBody?.choices?.[0]?.delta?.content
      if (typeof delta === 'string' && delta) {
        content += delta
        if (typeof onDelta === 'function') {
          onDelta(content, delta)
        }
      }
    } catch {
      // Ignore trailing partial event content.
    }
  }

  return finalize(content.trim())
}

async function callOpenAiTextPreferStream({
  input,
  temperature = 0.2,
  maxOutputTokens,
  reasoningEffort = 'medium',
  promptCacheKey = '',
  signal,
  settings: overrideSettings,
  onDelta,
  onFallback,
}) {
  const settings = overrideSettings ?? getAiSettings()
  const apiKey = settings.apiKey ?? store.get('openaiApiKey')
  const model = settings.model
  const baseUrl = settings.baseUrl.replace(/\/+$/, '')
  const proxyUrl = settings.proxyUrl ?? ''

  try {
    const content = await callOpenAiChatCompletionsStream({
      apiKey: typeof apiKey === 'string' ? apiKey.trim() : '',
      baseUrl,
      model,
      proxyUrl,
      input,
      temperature,
      maxOutputTokens,
      promptCacheKey,
      signal,
      onDelta,
    })
    if (content.trim()) {
      return content
    }
    throw new Error('stream returned empty content')
  } catch (error) {
    if (signal?.aborted || isAiAbortError(error)) {
      throw createAiAbortError()
    }
    if (typeof onFallback === 'function') {
      onFallback(error)
    }
    return callOpenAiText({
      input,
      temperature,
      maxOutputTokens,
      reasoningEffort,
      promptCacheKey,
      signal,
      settings,
    })
  }
}

function chatChoiceSummary(body) {
  if (!Array.isArray(body?.choices)) {
    return ''
  }

  const summary = body.choices
    .slice(0, 3)
    .map((choice) => {
      const keys = choice?.message && typeof choice.message === 'object' ? Object.keys(choice.message).join('|') : 'no-message'
      return `${choice?.finish_reason ?? 'no-reason'}:${keys}`
    })
    .join(', ')
  return summary ? `，choice_summary: ${summary}` : ''
}

function normalizeStage(stage) {
  const knownStages = new Set(['idea', 'setting', 'outline', 'drafting', 'revision', 'finished'])
  return knownStages.has(stage) ? stage : 'unknown'
}

function sanitizeFolderName(value) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
}

function assertCreateBookInput(input) {
  const title = typeof input?.title === 'string' ? input.title.trim() : ''
  const platform = typeof input?.platform === 'string' ? input.platform.trim() : ''
  const idea = typeof input?.idea === 'string' ? input.idea.trim() : ''

  if (!platform) {
    throw new Error('\u8bf7\u9009\u62e9\u76ee\u6807\u5e73\u53f0')
  }

  if (!idea) {
    throw new Error('\u8bf7\u8f93\u5165\u4e00\u53e5\u8111\u6d1e')
  }

  return { title, platform, idea }
}

function createUntitledBookName(platform) {
  const date = new Date()
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
  ].join('')

  return `\u672a\u5b9a\u540d\u65b0\u4e66-${platform}-${stamp}`
}

function valueOrFallback(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function limitText(value, maxLength = 8000) {
  const text = typeof value === 'string' ? value.trim() : ''

  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, Math.floor(maxLength * 0.55))}\n\n[...中间内容已压缩，避免请求过大...]\n\n${text.slice(-Math.floor(maxLength * 0.45))}`
}

function parseJsonObjectCandidate(candidate) {
  if (typeof candidate !== 'string' || !candidate.trim()) {
    return null
  }

  try {
    const parsed = JSON.parse(candidate.trim())
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function collectFencedJsonCandidates(text) {
  if (typeof text !== 'string') {
    return []
  }

  const candidates = []
  const fencePattern = /```(?:json)?\s*([\s\S]*?)```/giu
  let match = fencePattern.exec(text)

  while (match) {
    if (match[1]?.trim()) {
      candidates.push(match[1].trim())
    }
    match = fencePattern.exec(text)
  }

  return candidates
}

function findBalancedJsonObjects(text) {
  const source = typeof text === 'string' ? text : ''
  const candidates = []
  let start = -1
  let depth = 0
  let inString = false
  let escapeNext = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]

    if (inString) {
      if (escapeNext) {
        escapeNext = false
        continue
      }
      if (char === '\\') {
        escapeNext = true
        continue
      }
      if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      if (depth === 0) {
        start = index
      }
      depth += 1
      continue
    }

    if (char === '}' && depth > 0) {
      depth -= 1
      if (depth === 0 && start >= 0) {
        candidates.push(source.slice(start, index + 1))
        start = -1
      }
    }
  }

  return candidates
}

function extractJsonObject(textOutput) {
  const parsed = tryExtractJsonObject(textOutput)

  if (parsed) {
    return parsed
  }

  const preview = typeof textOutput === 'string' ? textOutput.trim().slice(0, 240) : ''
  throw new Error(`\u0041\u0049 \u672a\u8fd4\u56de\u53ef\u89e3\u6790\u7684\u9879\u76ee\u5305\u3002\u8fd4\u56de\u7247\u6bb5\uff1a${preview || '\u7a7a'}`)
}

function extractJsonArray(textOutput) {
  const trimmed = textOutput.trim()

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return JSON.parse(trimmed)
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    return JSON.parse(fenced[1].trim())
  }

  const start = trimmed.indexOf('[')
  const end = trimmed.lastIndexOf(']')

  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1))
  }

  throw new Error('\u0041\u0049 \u672a\u8fd4\u56de\u53ef\u89e3\u6790\u7684\u9879\u76ee\u66f4\u65b0\u5305')
}

async function collectWritingSampleFiles(sourcePath) {
  const stat = await fs.stat(sourcePath)
  if (stat.isFile()) {
    return [sourcePath]
  }

  if (!stat.isDirectory()) {
    return []
  }

  const entries = await fs.readdir(sourcePath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const child = path.join(sourcePath, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectWritingSampleFiles(child))
    } else if (entry.isFile() && /\.(txt|md)$/i.test(entry.name)) {
      files.push(child)
    }
  }

  return files
}

async function analyzeWritingSamples(input) {
  const bookPath = input?.bookPath
  const sourcePath = typeof input?.sourcePath === 'string' && input.sourcePath.trim()
    ? input.sourcePath.trim()
    : path.join(bookPath, names.sampleLibrary)
  const targetFile = `${names.settings}/${names.humanWritingFingerprint}`
  const target = assertInsideBook(bookPath, targetFile)
  const files = await collectWritingSampleFiles(sourcePath)

  if (files.length === 0) {
    throw new Error(`未找到可拆书样本。请把 txt/md 放入：${sourcePath}`)
  }

  const limitedFiles = files.slice(0, 80)
  const samples = await Promise.all(limitedFiles.map(async (file) => ({
    name: path.basename(file),
    content: limitText(await fs.readFile(file, 'utf8'), 120000),
  })))
  const detail = await buildBookDetail(bookPath, input?.chapterFile)
  const analysis = analyzeHumanWritingSamples(samples)
  const content = buildHumanWritingFingerprintMarkdown({
    bookTitle: detail.book.title,
    analysis,
    sourceLabel: path.relative(bookPath, sourcePath) || sourcePath,
  })

  await fs.mkdir(path.dirname(target), { recursive: true })
  await writeProjectMaterialSnapshot(bookPath, targetFile, 'before-human-writing-fingerprint')
  await fs.writeFile(target, `${content}\n`, 'utf8')

  return {
    detail: await buildBookDetail(bookPath, input?.chapterFile),
    targetFile,
    content,
    analysis,
  }
}

async function analyzeSamplePoolFingerprints(input) {
  const bookPath = input?.bookPath
  const sourcePath = typeof input?.sourcePath === 'string' && input.sourcePath.trim()
    ? input.sourcePath.trim()
    : path.join(bookPath, names.sampleLibrary)
  const files = await collectWritingSampleFiles(sourcePath)

  if (files.length === 0) {
    throw new Error(`未找到样本池文本。请按“样本池/平台/题材/书名.txt”放入 txt/md：${sourcePath}`)
  }

  const detail = await buildBookDetail(bookPath, input?.chapterFile)
  const fingerprintDir = assertInsideBook(bookPath, `${names.settings}/${names.sampleFingerprintLibrary}`)
  const groups = groupSamplePoolFiles(sourcePath, files)
  const results = []

  await fs.mkdir(fingerprintDir, { recursive: true })

  for (const group of groups) {
    const samples = await Promise.all(group.files.slice(0, 80).map(async (file) => ({
      name: path.basename(file),
      content: limitText(await fs.readFile(file, 'utf8'), 120000),
    })))
    const analysis = analyzeHumanWritingSamples(samples)
    const fileName = buildSamplePoolFingerprintFileName(group.platform, group.genre)
    const relativeFile = `${names.settings}/${names.sampleFingerprintLibrary}/${fileName}`
    const target = assertInsideBook(bookPath, relativeFile)
    const content = buildSamplePoolFingerprintMarkdown({
      platform: group.platform,
      genre: group.genre,
      analysis,
      sourceRoot: path.relative(bookPath, sourcePath) || sourcePath,
    })

    await fs.writeFile(target, `${content}\n`, 'utf8')
    results.push({
      platform: group.platform,
      genre: group.genre,
      file: relativeFile,
      sampleCount: analysis.sampleCount,
      totalWords: analysis.totalWords,
      sourceFiles: group.files.map((file) => path.relative(sourcePath, file)),
    })
  }

  const index = {
    generatedAt: new Date().toISOString(),
    sourcePath,
    rule: '目录规则：样本池/平台/题材/书名.txt；如果只有一层目录，则平台记为“未标注平台”，该层目录作为题材。',
    boundary: '只输出指纹库，不保存原文章节，不把原文带入生成上下文。',
    groups: results,
  }
  await fs.writeFile(path.join(fingerprintDir, 'platform-genre-index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8')

  return {
    detail: await buildBookDetail(bookPath, input?.chapterFile),
    index,
  }
}

function normalizeAuthorizedBookSources(rawSources) {
  const sources = Array.isArray(rawSources) ? rawSources : []
  return sources
    .filter((source) => source && typeof source === 'object')
    .map((source, index) => {
      const name = typeof source.bookSourceName === 'string' && source.bookSourceName.trim() ? source.bookSourceName.trim() : `未命名书源-${index + 1}`
      const group = typeof source.bookSourceGroup === 'string' && source.bookSourceGroup.trim() ? source.bookSourceGroup.trim() : '未分组'
      const sourceUrl = typeof source.bookSourceUrl === 'string' ? source.bookSourceUrl.trim() : ''
      const exploreUrl = typeof source.exploreUrl === 'string' ? source.exploreUrl.trim() : ''
      const searchUrl = typeof source.searchUrl === 'string' ? source.searchUrl.trim() : ''
      const bookUrlPattern = typeof source.bookUrlPattern === 'string' ? source.bookUrlPattern.trim() : ''

      return {
        id: crypto.createHash('sha1').update(`${name}|${group}|${sourceUrl}`).digest('hex').slice(0, 16),
        name,
        group,
        sourceUrl,
        type: Number.isFinite(source.bookSourceType) ? source.bookSourceType : 0,
        enabled: source.enabled !== false,
        enabledExplore: source.enabledExplore !== false,
        hasSearch: Boolean(searchUrl),
        hasExplore: Boolean(exploreUrl),
        bookUrlPattern,
        comment: typeof source.bookSourceComment === 'string' ? limitText(source.bookSourceComment, 500) : '',
      }
    })
    .filter((source) => source.sourceUrl)
}

function buildAuthorizedSourceIndex({ sourceUrl, sources }) {
  const groupCounts = sources.reduce((acc, source) => {
    acc[source.group] = (acc[source.group] ?? 0) + 1
    return acc
  }, {})

  return {
    sourceUrl,
    importedAt: new Date().toISOString(),
    authorization: '用户确认合法来源；软件只建立授权书源索引，不默认抓取正文，正文拆书仍只沉淀统计规律。',
    sourceCount: sources.length,
    groupCounts,
    sources,
  }
}

async function writeAuthorizedSourceIndex(bookPath, index) {
  const target = assertInsideBook(bookPath, `${names.settings}/${names.authorizedSourceIndex}`)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, `${JSON.stringify(index, null, 2)}\n`, 'utf8')
}

async function readAuthorizedSourceIndex(bookPath) {
  const target = assertInsideBook(bookPath, `${names.settings}/${names.authorizedSourceIndex}`)
  if (!(await pathExists(target))) {
    return null
  }

  return JSON.parse(await fs.readFile(target, 'utf8'))
}

async function importAuthorizedBookSources(input) {
  const bookPath = input?.bookPath
  const sourceUrl = typeof input?.sourceUrl === 'string' && input.sourceUrl.trim() ? input.sourceUrl.trim() : authorizedSourceDefaultUrl
  const response = await aiFetch(sourceUrl, { method: 'GET' })

  if (!response.ok) {
    throw new Error(`授权书源拉取失败：${response.status}`)
  }

  const text = await response.text()
  let rawSources
  try {
    rawSources = JSON.parse(text)
  } catch (error) {
    throw new Error(`授权书源不是可解析 JSON：${error instanceof Error ? error.message : '未知错误'}`)
  }

  const sources = normalizeAuthorizedBookSources(rawSources)
  const index = buildAuthorizedSourceIndex({ sourceUrl, sources })
  await writeAuthorizedSourceIndex(bookPath, index)

  return {
    detail: await buildBookDetail(bookPath, input?.chapterFile),
    index,
  }
}

function normalizeProjectPackage(rawPackage, fallback) {
  const projectPackage = rawPackage && typeof rawPackage === 'object' ? rawPackage : {}
  const platform = valueOrFallback(projectPackage.platform, fallback.platform)
  const ruleFallback = fallbackProjectPackageSection('rules', { platform, genre: projectPackage.genre })
  const outlineFallback = fallbackProjectPackageSection('outline', { platform, genre: projectPackage.genre })
  const characterFallback = fallbackProjectPackageSection('characters', { platform, genre: projectPackage.genre })
  const trackingFallback = fallbackProjectPackageSection('tracking', { platform, genre: projectPackage.genre })

  return {
    title: valueOrFallback(projectPackage.title, fallback.title),
    platform,
    genre: valueOrFallback(projectPackage.genre, '\u5f85\u5b9a'),
    stage: valueOrFallback(projectPackage.stage, 'idea'),
    targetWordsPerChapter: formatPlatformWordRule(platform),
    updateStrategy: valueOrFallback(projectPackage.updateStrategy, '\u6bcf\u65e5\u7a33\u5b9a\u66f4\u65b0\uff0c\u5148\u4fdd\u8bc1\u524d\u4e09\u7ae0\u5b8c\u6574\u6253\u78e8'),
    sellingPoint: valueOrFallback(projectPackage.sellingPoint, '\u5f85 AI \u7acb\u9879\u95ee\u7b54\u8865\u5168\u3002'),
    synopsis: valueOrFallback(projectPackage.synopsis, '\u5f85 AI \u7acb\u9879\u95ee\u7b54\u8865\u5168\u3002'),
    coreSetting: valueOrFallback(projectPackage.coreSetting, ruleFallback.coreSetting),
    genreRules: valueOrFallback(projectPackage.genreRules, ruleFallback.genreRules),
    platformFit: valueOrFallback(projectPackage.platformFit, ruleFallback.platformFit),
    overallOutline: valueOrFallback(projectPackage.overallOutline, outlineFallback.overallOutline),
    goldenFirstThree: valueOrFallback(projectPackage.goldenFirstThree, outlineFallback.goldenFirstThree),
    mainCharacter: valueOrFallback(projectPackage.mainCharacter, characterFallback.mainCharacter),
    supportingCharacters: valueOrFallback(projectPackage.supportingCharacters, characterFallback.supportingCharacters),
    minorCharacters: valueOrFallback(projectPackage.minorCharacters, characterFallback.minorCharacters),
    tracking: valueOrFallback(projectPackage.tracking, trackingFallback.tracking),
  }
}

function buildMarkdownModules({ title, platform, idea, projectPackage }) {
  const now = new Date().toISOString()
  const packageData = projectPackage ? normalizeProjectPackage(projectPackage, { title, platform }) : null
  const coverPrompt = [
    '# \u5c01\u9762\u63d0\u793a\u8bcd',
    '',
    '## \u4e66\u540d',
    '',
    title,
    '',
    '## \u6838\u5fc3\u5356\u70b9',
    '',
    packageData?.sellingPoint ?? idea,
    '',
    '## \u753b\u9762\u4e3b\u4f53',
    '',
    '\u6839\u636e\u4e66\u540d\u3001\u6838\u5fc3\u8bbe\u5b9a\u548c\u524d\u4e09\u7ae0\u94a9\u5b50\uff0c\u9009\u62e9\u6700\u80fd\u4ee3\u8868\u672c\u4e66\u7684\u4e3b\u89d2\u6216\u6838\u5fc3\u573a\u666f\u3002',
    '',
    '## \u98ce\u683c\u65b9\u5411',
    '',
    `\u7b26\u5408${platform}\u8bfb\u8005\u9884\u671f\uff1a${formatPlatformProfile(platform).replace(/\n+/g, ' ').slice(0, 300)}`,
    '',
    '## \u53ef\u590d\u5236\u751f\u56fe\u63d0\u793a\u8bcd',
    '',
    `\u4e3a\u7f51\u7edc\u5c0f\u8bf4\u300a${title}\u300b\u751f\u6210\u4e00\u5f20\u5546\u4e1a\u5316\u5c01\u9762\uff0c\u7a81\u51fa\u201c${packageData?.sellingPoint ?? idea}\u201d\uff0c\u753b\u9762\u8981\u6709\u5f3a\u94a9\u5b50\u3001\u9ad8\u8bc6\u522b\u5ea6\u3001\u4e2d\u5fc3\u4e3b\u4f53\u6e05\u6670\uff0c\u9002\u5408\u624b\u673a\u7aef\u5c0f\u56fe\u70b9\u51fb\uff0c\u907f\u514d\u6587\u5b57\u5806\u53e0\u3001\u6742\u4e71\u80cc\u666f\u548c\u8fc7\u5ea6\u62bd\u8c61\u3002`,
  ].join('\n')

  return [
    {
      filePath: path.join(names.settings, 'project-brief.md'),
      content: [
        `# ${title}`,
        '',
        `- \u76ee\u6807\u5e73\u53f0\uff1a${platform}`,
        `- \u9898\u6750\uff1a${packageData?.genre ?? '\u5f85\u5b9a'}`,
        `- \u5b57\u6570\u89c4\u5219\uff1a${packageData?.targetWordsPerChapter ?? '\u5f85\u8865\u5168'}`,
        `- \u66f4\u65b0\u7b56\u7565\uff1a${packageData?.updateStrategy ?? '\u5f85\u8865\u5168'}`,
        `- \u521d\u59cb\u8111\u6d1e\uff1a${idea}`,
        `- \u521b\u5efa\u65f6\u95f4\uff1a${now}`,
        '',
        '## \u4e00\u53e5\u8bdd\u5356\u70b9',
        '',
        packageData?.sellingPoint ?? '\u5f85 AI \u7acb\u9879\u95ee\u7b54\u8865\u5168\u3002',
        '',
        '## \u7b80\u4ecb\u8349\u6848',
        '',
        packageData?.synopsis ?? '\u5f85 AI \u7acb\u9879\u95ee\u7b54\u8865\u5168\u3002',
      ].join('\n'),
    },
    {
      filePath: path.join(names.settings, 'core-setting.md'),
      content: packageData?.coreSetting || ['# \u6838\u5fc3\u8bbe\u5b9a', '', '## \u4e16\u754c\u89c2', '', '## \u4e3b\u89d2', '', '## \u91d1\u624b\u6307', '', '## \u4e3b\u8981\u77db\u76fe'].join('\n'),
    },
    {
      filePath: path.join(names.settings, 'genre-rules.md'),
      content: packageData?.genreRules || buildGenreRulesSeed({ genre: packageData?.genre, idea, title }),
    },
    {
      filePath: path.join(names.outline, 'overall-outline.md'),
      content: packageData?.overallOutline || ['# \u603b\u7eb2', '', '## \u5168\u4e66\u4e3b\u7ebf', '', '## \u9636\u6bb5\u76ee\u6807'].join('\n'),
    },
    {
      filePath: path.join(names.outline, 'golden-first-3-chapters.md'),
      content: packageData?.goldenFirstThree || ['# \u9ec4\u91d1\u524d\u4e09\u7ae0\u89c4\u5212', '', '## \u7b2c 1 \u7ae0', '', '## \u7b2c 2 \u7ae0', '', '## \u7b2c 3 \u7ae0'].join('\n'),
    },
    {
      filePath: path.join(names.settings, 'cover-prompt.md'),
      content: coverPrompt,
    },
    {
      filePath: path.join(names.tracking, 'tracking.md'),
      content: packageData?.tracking || ['# \u8ffd\u8e2a\u8868', '', '## \u4eba\u7269', '', '## \u4f0f\u7b14', '', '## \u5730\u70b9', '', '## \u8bbe\u5b9a\u53d8\u66f4', '', '## \u672a\u89e3\u51b3\u95ee\u9898'].join('\n'),
    },
    {
      filePath: path.join(names.tracking, 'story-state.md'),
      content: buildStoryStateSeed({ genre: packageData?.genreRules || packageData?.genre, idea, title }),
    },
    {
      filePath: path.join(names.tracking, 'chapter-progress.md'),
      content: buildChapterProgressSeed({ title }),
    },
    {
      filePath: path.join(names.tracking, 'chapter-memory.md'),
      content: buildChapterMemorySeed({ title }),
    },
    {
      filePath: path.join(names.tracking, 'state-machine.json'),
      content: JSON.stringify(buildStructuredStateSeed({ title }), null, 2),
    },
    {
      filePath: path.join(names.tracking, 'future-plan.md'),
      content: buildFuturePlanSeed({ title }),
    },
    {
      filePath: path.join(names.settings, 'style-sample.md'),
      content: buildStyleSampleSeed({ title }),
    },
    {
      filePath: path.join(names.settings, 'platform-fit.md'),
      content: packageData?.platformFit || formatPlatformFitSeed(platform),
    },
    {
      filePath: path.join(names.manuscript, 'chapter-001.md'),
      content: ['# \u7b2c001\u7ae0', '', '\u6b63\u6587\u5f85\u5199\u3002'].join('\n'),
    },
  ]
}

function buildPlanningMessages({ platform, idea, messages }) {
  const conversation = Array.isArray(messages)
    ? messages
        .map((message, index) => `${index + 1}. ${message.role === 'assistant' ? '\u7f16\u8f91' : '\u7528\u6237'}\uff1a${message.content}`)
        .join('\n')
    : ''

  return [
    '\u4f60\u662f\u4e00\u4f4d\u7f51\u6587\u7acb\u9879\u7f16\u8f91\uff0c\u4efb\u52a1\u662f\u628a\u4e00\u53e5\u8111\u6d1e\u901a\u8fc7 5 \u8f6e\u5fc5\u7b54\u95ee\u9898\uff0c\u6253\u78e8\u6210\u53ef\u5f00\u5199\u7684\u957f\u7bc7\u7f51\u6587\u9879\u76ee\u3002',
    '\u6bcf\u8f6e\u53ea\u95ee 1 \u4e2a\u95ee\u9898\uff0c\u95ee\u9898\u8981\u5177\u4f53\u3001\u597d\u56de\u7b54\u3001\u80fd\u63a8\u52a8\u7acb\u9879\u3002',
    '\u4e0d\u8981\u5199\u957f\u7bc7\u8bf4\u660e\uff0c\u4e0d\u8981\u4e00\u6b21\u6027\u63d0\u591a\u4e2a\u95ee\u9898\u3002',
    '\u4f60\u7684 5 \u8f6e\u5e94\u4f9d\u6b21\u78ba\u8ba4\uff1a\u9898\u6750/\u8bfb\u8005\u9884\u671f\u3001\u4e3b\u89d2\u548c\u6b32\u671b\u3001\u6838\u5fc3\u723d\u70b9\u548c\u91d1\u624b\u6307\u3001\u4e16\u754c\u89c2\u548c\u51b2\u7a81\u5c3a\u5ea6\u3001\u5f00\u5c40\u94a9\u5b50\u548c\u98ce\u683c\u98ce\u9669\u3002',
    '',
    `\u76ee\u6807\u5e73\u53f0\uff1a${platform}`,
    `\u7ae0\u8282\u5b57\u6570\u89c4\u5219\uff1a${formatPlatformWordRule(platform)}`,
    `\u521d\u59cb\u8111\u6d1e\uff1a${idea}`,
    '',
    '# \u5f00\u4e66\u5e73\u53f0\u8c03\u6027\u53c2\u8003',
    formatPlatformProfile(platform),
    '',
    '# \u5df2\u6709\u5bf9\u8bdd',
    conversation || '\u6682\u65e0',
    '',
    '\u8bf7\u76f4\u63a5\u8f93\u51fa\u4e0b\u4e00\u4e2a\u95ee\u9898\u3002',
  ].join('\n')
}

function buildProjectPackagePrompt({ title, platform, idea, messages }) {
  const conversation = Array.isArray(messages)
    ? messages
        .map((message, index) => `${index + 1}. ${message.role === 'assistant' ? '\u7f16\u8f91' : '\u7528\u6237'}\uff1a${message.content}`)
        .join('\n')
    : ''

  return [
    '\u4f60\u662f\u7f51\u6587\u7acb\u9879\u7f16\u8f91\u3002\u8bf7\u6839\u636e\u521d\u59cb\u8111\u6d1e\u548c 5 \u8f6e\u95ee\u7b54\uff0c\u751f\u6210\u4e00\u4e2a\u53ef\u5199\u4f5c\u7684\u9879\u76ee\u5305\u3002',
    '\u53ea\u8f93\u51fa JSON\uff0c\u4e0d\u8981 markdown \u4ee3\u7801\u5757\uff0c\u4e0d\u8981\u989d\u5916\u89e3\u91ca\u3002',
    '\u6240\u6709 markdown \u5185\u5bb9\u5fc5\u987b\u662f\u4e2d\u6587\uff0c\u5e76\u4fdd\u7559\u4e8c\u7ea7\u6807\u9898\u3002',
    '',
    '# JSON \u5b57\u6bb5',
    '{',
    '  "title": "\u4e66\u540d\uff0c\u82e5\u7528\u6237\u6ca1\u7ed9\u5219\u6839\u636e\u5356\u70b9\u751f\u6210",',
    '  "platform": "\u76ee\u6807\u5e73\u53f0",',
    '  "genre": "\u9898\u6750",',
    '  "stage": "idea",',
    '  "targetWordsPerChapter": "\u7ae0\u8282\u5b57\u6570\u89c4\u5219",',
    '  "updateStrategy": "\u66f4\u65b0\u7b56\u7565",',
    '  "sellingPoint": "\u4e00\u53e5\u8bdd\u5356\u70b9",',
    '  "synopsis": "\u7b80\u4ecb\u8349\u6848",',
    '  "coreSetting": "# \u6838\u5fc3\u8bbe\u5b9a\\n\\n## \u4e16\u754c\u89c2...",',
    '  "genreRules": "# \u9898\u6750\u89c4\u5219\\n\\n## \u9898\u6750\u5e95\u7ebf...",',
    '  "platformFit": "# \u5e73\u53f0\u9002\u914d\u8bf4\u660e\\n\\n## \u7ae0\u8282\u5b57\u6570\u89c4\u5219...",',
    '  "overallOutline": "# \u603b\u7eb2\\n\\n## \u5168\u4e66\u4e3b\u7ebf...",',
    '  "goldenFirstThree": "# \u9ec4\u91d1\u524d\u4e09\u7ae0\u89c4\u5212\\n\\n## \u7b2c 1 \u7ae0...",',
    '  "mainCharacter": "# \u4e3b\u89d2\u5361\\n\\n## \u6838\u5fc3\u8eab\u4efd...",',
    '  "supportingCharacters": "# \u914d\u89d2\u5361\\n\\n## \u91cd\u8981\u914d\u89d2...",',
    '  "minorCharacters": "# \u9f99\u5957\u8bb0\u5f55\\n\\n## \u51fa\u573a\u4eba\u7269...",',
    '  "tracking": "# \u8ffd\u8e2a\u8868\\n\\n## \u4eba\u7269..."',
    '}',
    '',
    `\u7528\u6237\u586b\u5199\u4e66\u540d\uff1a${title || '\u672a\u586b'}`,
    `\u76ee\u6807\u5e73\u53f0\uff1a${platform}`,
    `\u521d\u59cb\u8111\u6d1e\uff1a${idea}`,
    '',
    '# \u5f00\u4e66\u5e73\u53f0\u8c03\u6027\u53c2\u8003',
    formatPlatformProfile(platform),
    '',
    "\u751f\u6210 genreRules \u65f6\uff0c\u8bf7\u628a\u7528\u6237\u7684\u9898\u6750\u8f6c\u5316\u4e3a\u6bcf\u7ae0\u90fd\u8981\u9075\u5b88\u7684\u201c\u9898\u6750\u4e0d\u8dd1\u504f\u201d\u89c4\u5219\uff1a\u9898\u6750\u5e95\u7ebf\u3001\u5fc5\u987b\u53cd\u590d\u51fa\u73b0\u7684\u9898\u6750\u4fe1\u53f7\u3001\u5e38\u89c1\u8dd1\u504f\u3001\u672c\u7ae0\u7ec6\u7eb2\u5fc5\u987b\u68c0\u67e5\u7684\u9898\u6750\u5473\u9053\u3002\u5982\u679c\u662f\u7f51\u6e38\u6587\uff0c\u5fc5\u987b\u660e\u786e\u73a9\u5bb6\u611f\u3001\u6e38\u620f\u7cfb\u7edf\u3001\u4efb\u52a1/\u526f\u672c/\u6280\u80fd/\u88c5\u5907/\u4e16\u754c\u516c\u544a/NPC \u673a\u5236\uff0c\u5e76\u7981\u6b62\u6ed1\u6210\u7eaf\u7384\u5e7b\u6216\u7eaf\u6b66\u4fa0\u3002",
    '',
    "\u751f\u6210 platformFit \u65f6\uff0c\u53ea\u6839\u636e\u4e09\u7c7b\u5f00\u4e66\u4fe1\u606f\u63d0\u70bc\uff1a\u6838\u5fc3\u54c1\u724c\u5b9a\u4f4d\u3001\u7528\u6237\u7fa4\u4f53\u753b\u50cf\u3001\u5185\u5bb9\u98ce\u683c\u4e0e\u9898\u6750\u504f\u597d\u3002\u4e0d\u8981\u5199\u8fd0\u8425\u6a21\u5f0f\u3001\u4f5c\u8005\u751f\u6001\u3001\u5e73\u53f0\u5386\u53f2\u3001IP \u6539\u7f16\u6570\u636e\u7b49\u548c\u5f00\u4e66\u65e0\u5173\u7684\u767e\u79d1\u4fe1\u606f\u3002\u8bf7\u628a\u5e73\u53f0\u8c03\u6027\u8f6c\u5316\u4e3a\u201c\u8fd9\u672c\u4e66\u201d\u7684\u5199\u4f5c\u89c4\u5219\uff1a\u76ee\u6807\u8bfb\u8005\u3001\u7ae0\u8282\u5b57\u6570\u3001\u5f00\u5c40\u8282\u594f\u3001\u5fc5\u987b\u9075\u5b88\u7684 do/don't\u3001\u5e38\u89c1\u5931\u8d25\u6a21\u5f0f\u3002",
    '',
    '# \u7acb\u9879\u95ee\u7b54',
    conversation,
  ].join('\n')
}

function formatPlanningConversation(messages) {
  return Array.isArray(messages)
    ? messages
        .map((message, index) => `${index + 1}. ${message.role === 'assistant' ? '\u7f16\u8f91' : '\u7528\u6237'}\uff1a${message.content}`)
        .join('\n')
    : ''
}

function buildProjectPackageContext({ title, platform, idea, messages }) {
  return [
    `\u7528\u6237\u586b\u5199\u4e66\u540d\uff1a${title || '\u672a\u586b'}`,
    `\u76ee\u6807\u5e73\u53f0\uff1a${platform}`,
    `\u521d\u59cb\u8111\u6d1e\uff1a${idea}`,
    '',
    '# \u5f00\u4e66\u5e73\u53f0\u8c03\u6027\u53c2\u8003',
    formatPlatformProfile(platform),
    '',
    '# \u5e73\u53f0\u5927\u7eb2\u5bc6\u5ea6\u89c4\u5219',
    buildPlatformOutlinePlanningRule({ book: { title, platform }, mode: 'volume' }),
    '',
    '# \u5e73\u53f0\u5355\u7ae0\u5bc6\u5ea6\u89c4\u5219',
    buildPlatformOutlinePlanningRule({ book: { title, platform }, mode: 'chapter' }),
    '',
    '# \u7acb\u9879\u95ee\u7b54',
    formatPlanningConversation(messages) || '\u6682\u65e0',
  ].join('\n')
}

function buildProjectPackageSectionPrompt({ context, section, known }) {
  const knownJson = known ? JSON.stringify(known, null, 2) : '{}'
  const baseRules = [
    '\u4f60\u662f\u7f51\u6587\u7acb\u9879\u7f16\u8f91\u3002\u8bf7\u6839\u636e\u4e0a\u4e0b\u6587\u751f\u6210\u9879\u76ee\u5305\u7684\u4e00\u4e2a\u5206\u6bb5\u3002',
    '\u53ea\u8f93\u51fa JSON\uff0c\u4e0d\u8981 markdown \u4ee3\u7801\u5757\uff0c\u4e0d\u8981\u989d\u5916\u89e3\u91ca\u3002',
    '\u6240\u6709\u5b57\u6bb5\u90fd\u5fc5\u987b\u662f\u4e2d\u6587\uff0cmarkdown \u5b57\u6bb5\u4fdd\u7559\u4e8c\u7ea7\u6807\u9898\u3002',
  ]
  const sectionPrompts = {
    base: [
      '\u4ec5\u8f93\u51fa\u8fd9\u4e9b\u5b57\u6bb5\uff1atitle, platform, genre, stage, targetWordsPerChapter, updateStrategy, sellingPoint, synopsis\u3002',
      '\u5fc5\u987b\u628a targetWordsPerChapter \u5199\u6210\u4e0a\u4e0b\u6587\u7ed9\u51fa\u7684\u201c\u7ae0\u8282\u5b57\u6570\u89c4\u5219\u201d\uff0c\u4e0d\u8981\u81ea\u884c\u6539\u6210\u5176\u4ed6\u8303\u56f4\u3002',
      '\u7b80\u4ecb\u63a7\u5236\u5728 250-450 \u5b57\uff0c\u5356\u70b9\u8981\u50cf\u53ef\u76f4\u63a5\u653e\u5230\u5c01\u9762/\u7b80\u4ecb\u9875\u7684\u4e00\u53e5\u8bdd\u3002',
    ],
    rules: [
      '\u4ec5\u8f93\u51fa\u8fd9\u4e9b\u5b57\u6bb5\uff1acoreSetting, genreRules, platformFit\u3002',
      '\u751f\u6210 genreRules \u65f6\uff0c\u628a\u7528\u6237\u9898\u6750\u8f6c\u5316\u4e3a\u6bcf\u7ae0\u90fd\u8981\u9075\u5b88\u7684\u201c\u9898\u6750\u4e0d\u8dd1\u504f\u201d\u89c4\u5219\uff1a\u9898\u6750\u5e95\u7ebf\u3001\u5fc5\u987b\u53cd\u590d\u51fa\u73b0\u7684\u9898\u6750\u4fe1\u53f7\u3001\u5e38\u89c1\u8dd1\u504f\u3001\u7ec6\u7eb2\u5fc5\u987b\u68c0\u67e5\u7684\u9898\u6750\u5473\u9053\u3002\u5982\u679c\u662f\u7f51\u6e38\u6587\uff0c\u5fc5\u987b\u660e\u786e\u73a9\u5bb6\u611f\u3001\u6e38\u620f\u7cfb\u7edf\u3001\u4efb\u52a1/\u526f\u672c/\u6280\u80fd/\u88c5\u5907/\u4e16\u754c\u516c\u544a/NPC \u673a\u5236\uff0c\u5e76\u7981\u6b62\u6ed1\u6210\u7eaf\u7384\u5e7b\u6216\u7eaf\u6b66\u4fa0\u3002',
      '\u751f\u6210 platformFit \u65f6\uff0c\u53ea\u63d0\u70bc\u6838\u5fc3\u54c1\u724c\u5b9a\u4f4d\u3001\u7528\u6237\u7fa4\u4f53\u753b\u50cf\u3001\u5185\u5bb9\u98ce\u683c\u4e0e\u9898\u6750\u504f\u597d\uff0c\u4e0d\u5199\u8fd0\u8425\u6a21\u5f0f\u3001\u4f5c\u8005\u751f\u6001\u3001IP \u6570\u636e\u7b49\u767e\u79d1\u4fe1\u606f\u3002',
    ],
    outline: [
      '\u4ec5\u8f93\u51fa\u8fd9\u4e9b\u5b57\u6bb5\uff1aoverallOutline, goldenFirstThree\u3002',
      '\u603b\u7eb2\u8981\u6709\u5168\u4e66\u4e3b\u7ebf\u3001\u9636\u6bb5\u76ee\u6807\u3001\u6838\u5fc3\u51b2\u7a81\u3001\u9636\u6bb5\u53cd\u8f6c\u3002\u9ec4\u91d1\u524d\u4e09\u7ae0\u8981\u5206\u522b\u5199\u660e\u5f00\u573a\u94a9\u5b50\u3001\u89c4\u5219/\u91d1\u624b\u6307\u5c55\u793a\u3001\u5c0f\u95ed\u73af\u548c\u8ffd\u8bfb\u94a9\u5b50\u3002',
      '\u603b\u7eb2\u548c\u5377\u89c4\u5212\u4e0d\u80fd\u8fc7\u65e9\u628a\u4e00\u5377\u538b\u7f29\u5230\u5f88\u5c11\u7ae0\u7ed3\u675f\uff1b\u5fc5\u987b\u5148\u6309\u5e73\u53f0\u5b57\u6570\u548c\u8282\u594f\u62c6\u6210\u201c\u5355\u7ae0\u80fd\u5199\u5b8c\u201d\u7684\u5c0f\u8282\u70b9\u3002',
      '\u5982\u679c\u662f\u756a\u8304\uff0c\u6bcf\u7ae0\u53ea\u627f\u8f7d 1 \u4e2a\u4e3b\u529f\u80fd\u30012-4 \u4e2a\u573a\u666f\u8282\u70b9\u548c 1 \u4e2a\u7ae0\u672b\u94a9\u5b50\uff1b\u6750\u6599\u8fc7\u591a\u65f6\u8981\u589e\u52a0\u7ae0\u6570\uff0c\u4e0d\u8981\u589e\u52a0\u5355\u7ae0\u5bc6\u5ea6\u3002',
    ],
    characters: [
      '\u4ec5\u8f93\u51fa\u8fd9\u4e9b\u5b57\u6bb5\uff1amainCharacter, supportingCharacters, minorCharacters\u3002',
      '\u89d2\u8272\u5361\u8981\u6709\u6838\u5fc3\u8eab\u4efd\u3001\u6b32\u671b\u3001\u884c\u52a8\u903b\u8f91\u3001\u8bf4\u8bdd\u65b9\u5f0f\u3001\u7981\u6b62\u504f\u79bb\u5199\u6cd5\u3002\u914d\u89d2\u8981\u548c\u4e3b\u7ebf\u6709\u529f\u80fd\u5173\u7cfb\uff0c\u4e0d\u8981\u7a7a\u6cdb\u5806\u540d\u5b57\u3002',
    ],
    tracking: [
      '\u4ec5\u8f93\u51fa\u8fd9\u4e9b\u5b57\u6bb5\uff1atracking\u3002',
      '\u8ffd\u8e2a\u8868\u8981\u8bb0\u5f55\u4eba\u7269\u3001\u4f0f\u7b14\u3001\u5730\u70b9\u3001\u8bbe\u5b9a\u53d8\u66f4\u3001\u672a\u89e3\u51b3\u95ee\u9898\uff0c\u65b9\u4fbf\u540e\u7eed\u7ae0\u8282\u6301\u7eed\u66f4\u65b0\u3002',
    ],
  }

  return [
    ...baseRules,
    '',
    '# \u5df2\u6709\u5206\u6bb5\u7ed3\u679c',
    knownJson,
    '',
    '# \u672c\u6b21\u5206\u6bb5\u8981\u6c42',
    ...(sectionPrompts[section] ?? sectionPrompts.base),
    '',
    '# \u9879\u76ee\u4e0a\u4e0b\u6587',
    context,
  ].join('\n')
}

function fallbackProjectPackageSection(section, known = {}) {
  const title = valueOrFallback(known.title, '')
  const platform = valueOrFallback(known.platform, '')
  const genre = valueOrFallback(known.genre, '\u5f85\u5b9a')

  switch (section) {
    case 'base':
      return {
        title,
        platform,
        genre,
        stage: 'idea',
        targetWordsPerChapter: platform ? formatPlatformWordRule(platform) : '\u6309\u5e73\u53f0\u89c4\u5219\u6267\u884c',
        updateStrategy: '\u5148\u6253\u78e8\u9ec4\u91d1\u524d\u4e09\u7ae0\uff0c\u518d\u6309\u8282\u594f\u7a33\u5b9a\u66f4\u65b0\u3002',
        sellingPoint: '\u56f4\u7ed5\u6838\u5fc3\u8111\u6d1e\u5efa\u7acb\u6e05\u6670\u5356\u70b9\uff0c\u540e\u7eed\u5728\u9879\u76ee\u8bbe\u5b9a\u4e2d\u7ee7\u7eed\u8865\u5168\u3002',
        synopsis: '\u7acb\u9879\u95ee\u7b54\u5df2\u4fdd\u7559\uff0c\u9879\u76ee\u5305\u6682\u65f6\u4f7f\u7528\u57fa\u7840\u7248\u7ed3\u6784\uff0c\u53ef\u5728\u4e66\u7c4d\u521b\u5efa\u540e\u7ee7\u7eed\u4fee\u8ba2\u3002',
      }
    case 'rules':
      return {
        coreSetting: '# \u6838\u5fc3\u8bbe\u5b9a\n\n## \u57fa\u7840\u8bbe\u5b9a\n\n\u6839\u636e\u7acb\u9879\u95ee\u7b54\u8865\u5168\u4e3b\u89d2\u3001\u91d1\u624b\u6307\u3001\u4e16\u754c\u89c4\u5219\u548c\u4e3b\u8981\u77db\u76fe\u3002',
        genreRules: '# \u9898\u6750\u89c4\u5219\n\n- \u6bcf\u7ae0\u68c0\u67e5\u9898\u6750\u4fe1\u53f7\u662f\u5426\u8db3\u591f\u3002\n- \u9632\u6b62\u4e3b\u7ebf\u6ed1\u5411\u548c\u9898\u6750\u4e0d\u5339\u914d\u7684\u5199\u6cd5\u3002',
        platformFit: '# \u5e73\u53f0\u9002\u914d\n\n\u6309\u76ee\u6807\u5e73\u53f0\u7684\u9605\u8bfb\u8282\u594f\u5b89\u6392\u7ae0\u8282\u5bc6\u5ea6\u548c\u8ffd\u8bfb\u94a9\u5b50\u3002',
      }
    case 'outline':
      return {
        overallOutline: '# \u603b\u7eb2\n\n## \u5168\u4e66\u4e3b\u7ebf\n\n\u56f4\u7ed5\u4e3b\u89d2\u76ee\u6807\u3001\u9636\u6bb5\u963b\u529b\u548c\u8fde\u7eed\u5347\u7ea7\u5c55\u5f00\u3002\n\n## \u9636\u6bb5\u89c4\u5212\n\n1. \u5f00\u573a\u5efa\u7acb\u94a9\u5b50\u3002\n2. \u5c55\u793a\u89c4\u5219\u548c\u91d1\u624b\u6307\u3002\n3. \u5f62\u6210\u7b2c\u4e00\u4e2a\u5c0f\u95ed\u73af\u3002',
        goldenFirstThree: '# \u9ec4\u91d1\u524d\u4e09\u7ae0\n\n## \u7b2c001\u7ae0\n\n\u5f00\u573a\u94a9\u5b50\u548c\u4e3b\u89d2\u5904\u5883\u3002\n\n## \u7b2c002\u7ae0\n\n\u89c4\u5219\u5c55\u793a\u548c\u884c\u52a8\u63a8\u8fdb\u3002\n\n## \u7b2c003\u7ae0\n\n\u5c0f\u95ed\u73af\u3001\u7b2c\u4e00\u6b21\u723d\u70b9\u548c\u8ffd\u8bfb\u94a9\u5b50\u3002',
      }
    case 'characters':
      return {
        mainCharacter: '# \u4e3b\u89d2\u5361\n\n## \u6838\u5fc3\u8eab\u4efd\n\n\u5f85\u8865\u5168\u3002\n\n## \u884c\u52a8\u903b\u8f91\n\n\u4ee5\u660e\u786e\u76ee\u6807\u63a8\u52a8\u5267\u60c5\u3002',
        supportingCharacters: '# \u914d\u89d2\u5361\n\n\u6309\u201c\u4e0e\u4e3b\u7ebf\u7684\u529f\u80fd\u5173\u7cfb\u201d\u8865\u5168\u3002',
        minorCharacters: '# \u9f99\u5957\u8bb0\u5f55\n\n\u8bb0\u5f55\u51fa\u573a\u4eba\u7269\u3001\u529f\u80fd\u548c\u5df2\u77e5\u4fe1\u606f\u3002',
      }
    case 'tracking':
      return {
        tracking: '# \u8ffd\u8e2a\u8868\n\n## \u4eba\u7269\n\n- \u5f85\u8865\u5168\n\n## \u4f0f\u7b14\n\n- \u5f85\u8865\u5168\n\n## \u8bbe\u5b9a\u53d8\u66f4\n\n- \u5f85\u8865\u5168',
      }
    default:
      return {}
  }
}

function mergeProjectPackageSectionFallback(section, part, known = {}) {
  const fallback = fallbackProjectPackageSection(section, known)
  const source = part && typeof part === 'object' && !Array.isArray(part) ? part : {}
  const merged = { ...fallback }

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string') {
      if (value.trim()) {
        merged[key] = value.trim()
      }
    } else if (value !== null && value !== undefined) {
      merged[key] = value
    }
  }

  return merged
}

async function repairProjectPackageSectionJson({ section, content, known, signal }) {
  const repairPrompt = [
    '\u4f60\u662f JSON \u4fee\u590d\u5668\u3002\u4e0b\u9762\u662f\u5199\u4f5c\u8f6f\u4ef6\u9879\u76ee\u5305\u5206\u6bb5\u7684 AI \u8f93\u51fa\uff0c\u5b83\u6ca1\u6709\u88ab\u7a0b\u5e8f\u89e3\u6790\u3002',
    '\u8bf7\u628a\u539f\u6587\u63d0\u53d6\u6216\u6539\u5199\u6210\u4e00\u4e2a\u5408\u6cd5 JSON object\u3002',
    '\u53ea\u8f93\u51fa JSON\uff0c\u4e0d\u8981 Markdown\uff0c\u4e0d\u8981\u89e3\u91ca\uff0c\u4e0d\u8981\u4ee3\u7801\u5757\u3002',
    `\u672c\u6b21\u5206\u6bb5\uff1a${section}`,
    '# \u5df2\u6709\u5206\u6bb5',
    JSON.stringify(known ?? {}, null, 2),
    '# \u539f\u59cb\u8f93\u51fa',
    limitText(content, 12000),
  ].join('\n')

  const repaired = await callOpenAiText({
    input: repairPrompt,
    temperature: 0,
    maxOutputTokens: 1600,
    signal,
  })

  return extractJsonObject(repaired)
}

async function generateProjectPackageSection({ context, section, known, signal }) {
  const outputLimits = {
    base: aiOutputLimits.projectPackageBase,
    rules: aiOutputLimits.projectPackageRules,
    outline: aiOutputLimits.projectPackageOutline,
    characters: aiOutputLimits.projectPackageCharacters,
    tracking: aiOutputLimits.projectPackageTracking,
  }
  const content = await callOpenAiText({
    input: buildProjectPackageSectionPrompt({ context, section, known }),
    temperature: section === 'base' ? 0.25 : 0.35,
    maxOutputTokens: outputLimits[section],
    signal,
  })

  try {
    return mergeProjectPackageSectionFallback(section, extractJsonObject(content), known)
  } catch (parseError) {
    console.warn(`Project package section ${section} returned invalid JSON; trying repair.`, parseError)
  }

  try {
    return mergeProjectPackageSectionFallback(section, await repairProjectPackageSectionJson({ section, content, known, signal }), known)
  } catch (repairError) {
    console.warn(`Project package section ${section} repair failed; using fallback.`, repairError)
    return fallbackProjectPackageSection(section, known)
  }
}

async function generatePlanningQuestion(input) {
  return runCancellableAiTask(input, async (signal) => {
    const book = assertCreateBookInput(input)
    const messages = Array.isArray(input?.messages) ? input.messages : []
    const question = await callOpenAiText({
      input: buildPlanningMessages({ ...book, messages }),
      temperature: 0.5,
      maxOutputTokens: aiOutputLimits.planningQuestion,
      signal,
    })

    return { question }
  })
}

async function generateProjectPackage(input) {
  return runCancellableAiTask(input, async (signal) => {
    const book = assertCreateBookInput(input)
    const messages = Array.isArray(input?.messages) ? input.messages : []
    const context = buildProjectPackageContext({ ...book, messages })
    const packageParts = {}
    const sections = ['base', 'rules', 'outline', 'characters', 'tracking']

    const basePart = await generateProjectPackageSection({ context, section: 'base', known: packageParts, signal })
    Object.assign(packageParts, basePart)

    const remainingParts = await Promise.all(sections.slice(1).map((section) => generateProjectPackageSection({ context, section, known: packageParts, signal })))
    for (const part of remainingParts) {
      Object.assign(packageParts, part)
    }

    const normalizedPackage = normalizeProjectPackage(packageParts, {
      title: book.title || createUntitledBookName(book.platform),
      platform: book.platform,
    })
    return {
      ...normalizedPackage,
      title: book.title ? book.title : normalizedPackage.title,
      platform: book.platform,
    }
  })
}

async function createBookProject(input) {
  const libraryPath = store.get('libraryPath')
  const normalizedPath = typeof libraryPath === 'string' && libraryPath.trim() ? libraryPath : ''

  if (!normalizedPath) {
    throw new Error('\u8bf7\u5148\u9009\u62e9\u5199\u4f5c\u5e93\u76ee\u5f55')
  }

  const book = assertCreateBookInput(input)
  const rawProjectPackage = input?.projectPackage ? normalizeProjectPackage(input.projectPackage, { title: book.title || createUntitledBookName(book.platform), platform: book.platform }) : null
  const finalTitle = rawProjectPackage?.title || book.title || createUntitledBookName(book.platform)
  const folderName = sanitizeFolderName(finalTitle)

  if (!folderName) {
    throw new Error('\u4e66\u540d\u4e0d\u80fd\u4f5c\u4e3a\u6587\u4ef6\u5939\u540d')
  }

  const bookPath = path.join(normalizedPath, folderName)

  if (await pathExists(bookPath)) {
    throw new Error('\u540c\u540d\u4e66\u7c4d\u6587\u4ef6\u5939\u5df2\u5b58\u5728')
  }

  await fs.mkdir(bookPath, { recursive: true })
  await Promise.all([names.settings, names.characters, names.outline, names.manuscript, names.tracking, names.exportDir, '.backup'].map((folder) => fs.mkdir(path.join(bookPath, folder), { recursive: true })))

  const bookJson = {
    schemaVersion: 1,
    title: finalTitle,
    titleStatus: book.title ? 'user-provided' : rawProjectPackage ? 'ai-generated' : 'ai-pending',
    platform: rawProjectPackage?.platform || book.platform,
    genre: rawProjectPackage?.genre,
    stage: rawProjectPackage?.stage || 'idea',
    targetWordsPerChapter: rawProjectPackage?.targetWordsPerChapter,
    updateStrategy: rawProjectPackage?.updateStrategy,
    todayTask: rawProjectPackage ? '\u68c0\u67e5\u9ec4\u91d1\u524d\u4e09\u7ae0\u5e76\u5f00\u5199\u7b2c001\u7ae0' : '\u5b8c\u6210 AI \u7acb\u9879\u95ee\u7b54\u5e76\u751f\u6210\u4e66\u540d',
    idea: book.idea,
    createdAt: new Date().toISOString(),
    chapters: [
      {
        id: 'chapter-001',
        title: '\u7b2c001\u7ae0',
        file: `${names.manuscript}/chapter-001.md`,
        status: 'draft',
        targetWords: resolveTargetWordsForBook({ platform: rawProjectPackage?.platform || book.platform }),
      },
    ],
  }

  await fs.writeFile(path.join(bookPath, 'book.json'), `${JSON.stringify(bookJson, null, 2)}\n`, 'utf8')

  for (const moduleFile of buildMarkdownModules({ ...book, title: finalTitle, platform: rawProjectPackage?.platform || book.platform, projectPackage: rawProjectPackage })) {
    await fs.writeFile(path.join(bookPath, moduleFile.filePath), `${moduleFile.content}\n`, 'utf8')
  }

  const characterFiles = rawProjectPackage
    ? [
        ['main-character.md', rawProjectPackage.mainCharacter],
        ['supporting-characters.md', rawProjectPackage.supportingCharacters],
        ['minor-characters.md', rawProjectPackage.minorCharacters],
      ]
    : [
        ['main-character.md', ['# \u4e3b\u89d2\u5361', '', '## \u6838\u5fc3\u8eab\u4efd', '', '## \u6027\u683c\u5e95\u8272', '', '## \u8bf4\u8bdd\u65b9\u5f0f', '', '## \u884c\u4e8b\u539f\u5219', '', '## \u6210\u957f\u5f27\u7ebf', '', '## \u7981\u6b62\u5199\u6cd5', '', '- \u4e0d\u80fd\u7a81\u7136\u6027\u683c\u8f6c\u5411', '- \u4e0d\u80fd\u8bf4\u51fa\u4e0e\u58f0\u7ebf\u4e0d\u7b26\u7684\u53f0\u8bcd'].join('\n')],
        ['supporting-characters.md', ['# \u914d\u89d2\u5361', '', '## \u91cd\u8981\u914d\u89d2', '', '## \u4e0e\u4e3b\u89d2\u5173\u7cfb', '', '## \u6027\u683c\u5e95\u8272', '', '## \u8bf4\u8bdd\u65b9\u5f0f', '', '## \u4e0d\u80fd\u504f\u79bb\u7684\u4eba\u8bbe\u70b9', '', '- \u4e0d\u80fd\u7a81\u7136\u6027\u683c\u8f6c\u5411', '- \u4e0d\u80fd\u8bf4\u51fa\u4e0e\u58f0\u7ebf\u4e0d\u7b26\u7684\u53f0\u8bcd'].join('\n')],
        ['minor-characters.md', ['# \u9f99\u5957\u8bb0\u5f55', '', '## \u51fa\u573a\u4eba\u7269', '', '## \u529f\u80fd', '', '## \u5df2\u77e5\u4fe1\u606f'].join('\n')],
      ]

  for (const [fileName, content] of characterFiles) {
    await fs.writeFile(path.join(bookPath, names.characters, fileName), `${content.trimEnd()}\n`, 'utf8')
  }
}

const ignoredLibraryFolderNames = new Set([
  'build',
  'dist',
  'release',
  'node_modules',
  'scripts',
  'src',
  'public',
  'electron',
  '.cache',
  '.git',
  names.sampleLibrary.toLowerCase(),
  names.sampleFingerprintLibrary.toLowerCase(),
])

function isRecognizedBookProject(bookConfig, standardFolders) {
  const standardFolderCount = standardFolders.filter(Boolean).length
  const hasBookConfig = Boolean(bookConfig)
  if (hasBookConfig) {
    return true
  }

  const [hasManuscript, hasSettings, hasCharacters, hasOutline, hasTracking] = standardFolders
  if (hasManuscript && (hasSettings || hasCharacters || hasOutline || hasTracking)) {
    return true
  }

  return standardFolderCount >= 3
}

async function inferBookSummaryGenre(bookPath, bookConfig, fallbackTitle) {
  if (typeof bookConfig?.genre === 'string' && bookConfig.genre.trim()) {
    return bookConfig.genre.trim()
  }

  const candidates = [
    typeof bookConfig?.title === 'string' ? bookConfig.title : '',
    fallbackTitle,
    typeof bookConfig?.idea === 'string' ? bookConfig.idea : '',
    await readTextFileIfExists(path.join(bookPath, names.settings, 'project-brief.md')),
    await readTextFileIfExists(path.join(bookPath, names.settings, 'genre-rules.md')),
    await readTextFileIfExists(path.join(bookPath, names.outline, 'overall-outline.md')),
  ].join('\n')
  const genreKey = inferGenreKey(candidates)
  const labelByKey = {
    webGame: '网游',
    urban: '都市',
    fantasy: '玄幻',
    romance: '言情',
    suspense: '悬疑',
  }
  return labelByKey[genreKey] || names.unset
}

async function detectBookSummary(libraryPath, entry) {
  const bookPath = path.join(libraryPath, entry.name)
  if (ignoredLibraryFolderNames.has(entry.name.toLowerCase())) {
    return null
  }

  const bookConfigPath = path.join(bookPath, 'book.json')
  const bookConfig = await readJsonFile(bookConfigPath)
  const standardFolders = await Promise.all([
    pathExists(path.join(bookPath, names.manuscript)),
    pathExists(path.join(bookPath, names.settings)),
    pathExists(path.join(bookPath, names.characters)),
    pathExists(path.join(bookPath, names.outline)),
    pathExists(path.join(bookPath, names.tracking)),
  ])
  const standardFolderCount = standardFolders.filter(Boolean).length
  const isStandard = isRecognizedBookProject(bookConfig, standardFolders)
  if (!isStandard) {
    return null
  }
  const title = typeof bookConfig?.title === 'string' && bookConfig.title.trim() ? bookConfig.title.trim() : entry.name
  const genre = await inferBookSummaryGenre(bookPath, bookConfig, title)

  return {
    id: bookPath,
    title,
    path: bookPath,
    platform: typeof bookConfig?.platform === 'string' && bookConfig.platform.trim() ? bookConfig.platform.trim() : names.unset,
    genre,
    stage: normalizeStage(bookConfig?.stage),
    todayTask: typeof bookConfig?.todayTask === 'string' && bookConfig.todayTask.trim() ? bookConfig.todayTask.trim() : names.pendingTask,
    risk: standardFolderCount >= 3 || Boolean(bookConfig) ? names.noObviousRisk : names.unorganizedRisk,
    isStandard,
  }
}

function countTextWords(content) {
  const chineseChars = content.match(/[\u4e00-\u9fff]/g)?.length ?? 0
  const latinWords = content.match(/[A-Za-z0-9]+/g)?.length ?? 0
  return chineseChars + latinWords
}

function chapterTitleFromFile(fileName) {
  return path.basename(fileName, path.extname(fileName))
}

function normalizeChapterFile(filePath) {
  return filePath.replace(/\\/g, '/')
}

function markdownToPlainText(content) {
  return content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .trim()
}

function slugifyChapterId(value) {
  const sanitized = sanitizeFolderName(value)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-\u4e00-\u9fff]/g, '')

  return sanitized || 'chapter'
}

async function findMarkdownFiles(rootPath) {
  if (!(await pathExists(rootPath))) {
    return []
  }

  const entries = await fs.readdir(rootPath, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(rootPath, entry.name)
      if (entry.isDirectory()) {
        return findMarkdownFiles(entryPath)
      }
      return entry.isFile() && entry.name.toLowerCase().endsWith('.md') ? [entryPath] : []
    }),
  )

  return nested.flat()
}

async function hasMarkdownMatching(rootPath, patterns) {
  const files = await findMarkdownFiles(rootPath)
  const matchedFiles = files.filter((file) => {
    const normalized = normalizeChapterFile(file).toLowerCase()
    return patterns.some((pattern) => normalized.includes(pattern))
  })

  for (const file of matchedFiles) {
    const content = await readTextFileIfExists(file)
    if (isMeaningfulMarkdown(content)) {
      return true
    }
  }

  return false
}

function checkItem(key, label, exists, detailReady, detailMissing, optional = false) {
  return {
    key,
    label,
    status: exists ? 'ready' : optional ? 'optional' : 'missing',
    detail: exists ? detailReady : detailMissing,
  }
}

async function readBookConfig(bookPath) {
  return readJsonFile(path.join(bookPath, 'book.json'))
}

async function listChapters(bookPath) {
  const manuscriptPath = path.join(bookPath, names.manuscript)
  const config = await readBookConfig(bookPath)

  if (!(await pathExists(manuscriptPath))) {
    return []
  }

  const entries = await fs.readdir(manuscriptPath, { withFileTypes: true })
  const files = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md')).map((entry) => `${names.manuscript}/${entry.name}`)
  const chapterMeta = Array.isArray(config?.chapters) ? config.chapters : []
  const order = new Map(chapterMeta.map((chapter, index) => [normalizeChapterFile(chapter.file), index]))

  const sortedFiles = files.sort((a, b) => {
    const orderA = order.has(a) ? order.get(a) : Number.MAX_SAFE_INTEGER
    const orderB = order.has(b) ? order.get(b) : Number.MAX_SAFE_INTEGER
    return orderA - orderB || a.localeCompare(b, 'zh-CN')
  })

  return Promise.all(
    sortedFiles.map(async (file) => {
      const meta = chapterMeta.find((chapter) => normalizeChapterFile(chapter.file) === file)
      const content = await fs.readFile(path.join(bookPath, file), 'utf8')
      return {
        id: typeof meta?.id === 'string' ? meta.id : file,
        title: typeof meta?.title === 'string' ? meta.title : chapterTitleFromFile(file),
        file,
        wordCount: countTextWords(content),
        targetWords: resolveTargetWordsForBook(config, meta?.targetWords),
        status: typeof meta?.status === 'string' ? meta.status : 'draft',
      }
    }),
  )
}

async function isPlaceholderChapter(bookPath, chapter) {
  if (!chapter?.file) {
    return false
  }

  const content = await readTextFileIfExists(path.join(bookPath, chapter.file))
  return !isMeaningfulMarkdown(content)
}

async function findReusableChapterForNextFlow(bookPath, currentChapterFile) {
  const chapters = await listChapters(bookPath)
  const normalizedCurrent = normalizeChapterFile(currentChapterFile || '')
  const currentIndex = normalizedCurrent
    ? chapters.findIndex((chapter) => normalizeChapterFile(chapter.file) === normalizedCurrent)
    : -1

  if (currentIndex >= 0 && await isPlaceholderChapter(bookPath, chapters[currentIndex])) {
    return chapters[currentIndex]
  }

  const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0
  for (let index = startIndex; index < chapters.length; index += 1) {
    if (await isPlaceholderChapter(bookPath, chapters[index])) {
      return chapters[index]
    }
  }

  return null
}

function getChapterOutlineFile(chapter) {
  const chapterId = typeof chapter?.id === 'string' && chapter.id.trim()
    ? chapter.id.trim()
    : slugifyChapterId(chapter?.title || chapter?.file || 'chapter')
  return `${names.outline}/${chapterId}-outline.md`
}

async function buildChapterOutlineIndex(bookPath) {
  const detail = await buildBookDetail(bookPath)
  const chapters = detail.chapters
  const items = await Promise.all(chapters.map(async (chapter) => {
    const file = getChapterOutlineFile(chapter)
    const target = assertInsideBook(bookPath, file)
    const exists = await pathExists(target)
    const content = exists ? await fs.readFile(target, 'utf8') : ''
    return {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      chapterFile: chapter.file,
      outlineFile: file,
      exists,
      ready: exists && isMeaningfulMarkdown(content),
      wordCount: countTextWords(content),
      preview: limitText(content.replace(/\s+/g, ' ').trim(), 160),
      updatedAt: exists ? (await fs.stat(target)).mtime.toISOString() : '',
    }
  }))
  const readyCount = items.filter((item) => item.ready).length

  return {
    book: detail.book,
    total: items.length,
    readyCount,
    missingCount: Math.max(items.length - readyCount, 0),
    recommendedTotalChapters: getPlatformOutlinePolicy(detail.book?.platform).targetVolumeChapters,
    items,
  }
}

async function ensureChapterCount(bookPath, targetTotalChapters) {
  let chapters = await listChapters(bookPath)
  const safeTarget = Math.max(1, Math.min(Number(targetTotalChapters) || chapters.length || 1, 300))

  while (chapters.length < safeTarget) {
    await createChapter({ bookPath })
    chapters = await listChapters(bookPath)
  }

  return chapters
}

async function generateChapterOutlineForChapter({ bookPath, chapter, promptCacheKey, signal, snapshotReason = 'before-batch-chapter-outline' }) {
  const detail = await buildBookDetail(bookPath, chapter.file)
  const selectedChapter = detail.selectedChapter || chapter
  const context = selectOutlineContext(await readProjectContext(bookPath, selectedChapter), 'chapter')
  const content = await callOpenAiText({
    input: buildOutlinePrompt({
      mode: 'chapter',
      book: detail.book,
      selectedChapter,
      context,
    }),
    temperature: 0.42,
    maxOutputTokens: aiOutputLimits.chapterOutlinePatch,
    reasoningEffort: 'low',
    promptCacheKey,
    signal,
  })
  const outlineFile = getChapterOutlineFile(selectedChapter)
  const target = assertInsideBook(bookPath, outlineFile)
  await writeProjectMaterialSnapshot(bookPath, outlineFile, snapshotReason)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, `${content.trimEnd()}\n`, 'utf8')
  return {
    chapterId: selectedChapter.id,
    chapterTitle: selectedChapter.title,
    chapterFile: selectedChapter.file,
    outlineFile,
    content,
  }
}

async function batchGenerateChapterOutlines(input) {
  return runCancellableAiTask(input, async (signal) => {
    const bookPath = input.bookPath
    const targetTotalChapters = Math.max(1, Math.min(Number(input.targetTotalChapters) || 30, 300))
    const overwrite = input.overwrite === true
    const requestId = typeof input.requestId === 'string' ? input.requestId : ''
    const emitProgress = createAiTaskProgressEmitter({
      requestId,
      scope: 'chapter-outline-batch',
      label: 'Chapter outlines',
    })

    emitProgress('prepare', `Preparing chapter outline directory to chapter ${targetTotalChapters}`)
    const chapters = await ensureChapterCount(bookPath, targetTotalChapters)
    const promptCacheKey = createBookWritingPromptCacheKey(bookPath)
    const results = []

    for (const chapter of chapters.slice(0, targetTotalChapters)) {
      const outlineFile = getChapterOutlineFile(chapter)
      const existing = await readTextFileIfExists(assertInsideBook(bookPath, outlineFile))
      if (!overwrite && isMeaningfulMarkdown(existing)) {
        results.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterFile: chapter.file,
          outlineFile,
          status: 'skipped',
        })
        continue
      }

      emitProgress('outline', `Generating outline ${results.length + 1}/${targetTotalChapters}: ${chapter.title}`)
      const generated = await generateChapterOutlineForChapter({
        bookPath,
        chapter,
        promptCacheKey,
        signal,
        snapshotReason: overwrite ? 'before-regenerate-batch-chapter-outline' : 'before-batch-chapter-outline',
      })
      results.push({ ...generated, status: 'generated' })
      emitProgress('outline-done', `Saved outline: ${chapter.title}`, generated.content)
    }

    const index = await buildChapterOutlineIndex(bookPath)
    emitProgress('done', `Outline directory ready: ${index.readyCount}/${index.total}`, '', 'done')
    return {
      detail: await buildBookDetail(bookPath, chapters[0]?.file),
      index,
      generatedCount: results.filter((item) => item.status === 'generated').length,
      skippedCount: results.filter((item) => item.status === 'skipped').length,
      results,
    }
  })
}

async function generateSingleChapterOutline(input) {
  return runCancellableAiTask(input, async (signal) => {
    const bookPath = input.bookPath
    const chapterFile = typeof input.chapterFile === 'string' ? input.chapterFile : ''
    if (!bookPath || !chapterFile) {
      throw new Error('缺少书籍路径或章节文件，无法生成细纲')
    }

    const detail = await buildBookDetail(bookPath, chapterFile)
    if (!detail.selectedChapter) {
      throw new Error('未找到要生成细纲的章节')
    }

    const requestId = typeof input.requestId === 'string' ? input.requestId : ''
    const emitProgress = createAiTaskProgressEmitter({
      requestId,
      scope: 'chapter-outline-single',
      label: 'Chapter outline',
    })
    emitProgress('outline', `Generating outline: ${detail.selectedChapter.title}`)
    const generated = await generateChapterOutlineForChapter({
      bookPath,
      chapter: detail.selectedChapter,
      promptCacheKey: createBookWritingPromptCacheKey(bookPath),
      signal,
      snapshotReason: input.overwrite === true ? 'before-regenerate-single-chapter-outline' : 'before-single-chapter-outline',
    })
    emitProgress('done', 'Chapter outline ready', generated.content, 'done')

    return {
      detail: await buildBookDetail(bookPath, chapterFile),
      outline: generated,
      index: await buildChapterOutlineIndex(bookPath),
    }
  })
}

async function buildBookDetail(bookPath, requestedChapterFile) {
  const parentPath = path.dirname(bookPath)
  const entry = { name: path.basename(bookPath) }
  const book = await detectBookSummary(parentPath, entry)
  await ensureGenreRulesMaterial(bookPath, book)
  await ensureStoryStateMaterial(bookPath, book)
  await ensureChapterProgressMaterial(bookPath, book)
  await ensureChapterMemoryMaterial(bookPath, book)
  await ensureStructuredStateMaterial(bookPath, book)
  await ensureFuturePlanMaterial(bookPath, book)
  await ensureStyleSampleMaterial(bookPath, book)
  await ensureHumanWritingFingerprintMaterial(bookPath, book)
  await ensureMemoryGovernanceMaterial(bookPath, book)
  await ensureProjectRepairLogMaterial(bookPath, book)
  const chapters = await listChapters(bookPath)
  const selectedChapter = chapters.find((chapter) => chapter.file === requestedChapterFile) ?? chapters[0] ?? null
  const content = selectedChapter ? await fs.readFile(path.join(bookPath, selectedChapter.file), 'utf8') : ''
  const contextCheck = await buildContextCheck(bookPath, chapters, selectedChapter)

  return {
    book,
    chapters,
    selectedChapter,
    content,
    contextCheck,
  }
}

async function ensureGenreRulesMaterial(bookPath, book) {
  const target = path.join(bookPath, names.settings, 'genre-rules.md')
  if (await pathExists(target)) {
    return
  }

  await fs.mkdir(path.dirname(target), { recursive: true })
  const brief = await readTextFileIfExists(path.join(bookPath, names.settings, 'project-brief.md'))
  await fs.writeFile(target, `${buildGenreRulesSeed({ genre: brief, idea: brief, title: book?.title ?? path.basename(bookPath) })}\n`, 'utf8')
}

async function ensureStoryStateMaterial(bookPath, book) {
  const target = path.join(bookPath, names.tracking, 'story-state.md')
  if (await pathExists(target)) {
    return
  }

  await fs.mkdir(path.dirname(target), { recursive: true })
  const brief = await readTextFileIfExists(path.join(bookPath, names.settings, 'project-brief.md'))
  const genreRules = await readTextFileIfExists(path.join(bookPath, names.settings, 'genre-rules.md'))
  const legacyGameState = await readTextFileIfExists(path.join(bookPath, names.tracking, 'game-state.md'))
  const seed = buildStoryStateSeed({ genre: genreRules, idea: brief, title: book?.title ?? path.basename(bookPath) })
  const content = legacyGameState.trim() ? `${seed}\n\n## 旧状态迁移\n\n${legacyGameState.trim()}\n` : `${seed}\n`
  await fs.writeFile(target, content, 'utf8')
}

async function ensureGameStateMaterial(bookPath) {
  return ensureStoryStateMaterial(bookPath)
}

async function ensureChapterProgressMaterial(bookPath, book) {
  const target = path.join(bookPath, names.tracking, 'chapter-progress.md')
  if (await pathExists(target)) {
    return
  }

  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, `${buildChapterProgressSeed({ title: book?.title ?? path.basename(bookPath) })}\n`, 'utf8')
}

async function ensureChapterMemoryMaterial(bookPath, book) {
  const target = path.join(bookPath, names.tracking, 'chapter-memory.md')
  if (await pathExists(target)) {
    return
  }

  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, `${buildChapterMemorySeed({ title: book?.title ?? path.basename(bookPath) })}\n`, 'utf8')
}

async function ensureStructuredStateMaterial(bookPath, book) {
  const target = path.join(bookPath, names.tracking, 'state-machine.json')
  if (await pathExists(target)) {
    return
  }

  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, `${JSON.stringify(buildStructuredStateSeed({ title: book?.title ?? path.basename(bookPath) }), null, 2)}\n`, 'utf8')
}

async function ensureFuturePlanMaterial(bookPath, book) {
  const target = path.join(bookPath, names.tracking, 'future-plan.md')
  if (await pathExists(target)) {
    return
  }

  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, `${buildFuturePlanSeed({ title: book?.title ?? path.basename(bookPath) })}\n`, 'utf8')
}

async function ensureStyleSampleMaterial(bookPath, book) {
  const target = path.join(bookPath, names.settings, 'style-sample.md')
  if (await pathExists(target)) {
    return
  }

  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, `${buildStyleSampleSeed({ title: book?.title ?? path.basename(bookPath) })}\n`, 'utf8')
}

async function ensureHumanWritingFingerprintMaterial(bookPath, book) {
  const target = path.join(bookPath, names.settings, names.humanWritingFingerprint)
  if (await pathExists(target)) {
    return
  }

  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, `${buildHumanWritingFingerprintSeed({ title: book?.title ?? path.basename(bookPath) })}\n`, 'utf8')
}

async function ensureMemoryGovernanceMaterial(bookPath, book) {
  const target = path.join(bookPath, names.tracking, 'memory-index.md')
  if (await pathExists(target)) {
    return
  }

  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, `${buildMemoryGovernanceSeed({ title: book?.title ?? path.basename(bookPath) })}\n`, 'utf8')
}

async function ensureProjectRepairLogMaterial(bookPath, book) {
  const target = path.join(bookPath, names.tracking, 'project-repair-log.md')
  if (await pathExists(target)) {
    return
  }

  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, `${buildProjectRepairLogSeed({ title: book?.title ?? path.basename(bookPath) })}\n`, 'utf8')
}

function getProjectMaterialDefinitions(chapterId) {
  const safeChapterId = chapterId || 'chapter-001'

  return [
    { id: 'projectBrief', label: '\u9879\u76ee\u7b80\u4ecb', file: `${names.settings}/project-brief.md` },
    { id: 'coverPrompt', label: '\u5c01\u9762\u63d0\u793a\u8bcd', file: `${names.settings}/cover-prompt.md` },
    { id: 'platformFit', label: '\u5e73\u53f0\u89c4\u5219', file: `${names.settings}/platform-fit.md` },
    { id: 'genreRules', label: '\u9898\u6750\u89c4\u5219', file: `${names.settings}/genre-rules.md` },
    { id: 'coreSetting', label: '\u6838\u5fc3\u8bbe\u5b9a', file: `${names.settings}/core-setting.md` },
    { id: 'mainCharacter', label: '\u4e3b\u89d2\u5361', file: `${names.characters}/main-character.md` },
    { id: 'supportingCharacters', label: '\u914d\u89d2\u5361', file: `${names.characters}/supporting-characters.md` },
    { id: 'minorCharacters', label: '\u9f99\u5957\u8bb0\u5f55', file: `${names.characters}/minor-characters.md` },
    { id: 'overallOutline', label: '\u603b\u7eb2', file: `${names.outline}/overall-outline.md` },
    { id: 'goldenFirstThree', label: '\u9ec4\u91d1\u4e09\u7ae0', file: `${names.outline}/golden-first-3-chapters.md` },
    { id: 'volumeOutline', label: '\u5377\u7eb2', file: `${names.outline}/volume-001.md` },
    { id: 'chapterOutline', label: '\u672c\u7ae0\u7ec6\u7eb2', file: `${names.outline}/${safeChapterId}-outline.md` },
    { id: 'tracking', label: '\u8ffd\u8e2a\u8868', file: `${names.tracking}/tracking.md` },
    { id: 'storyState', label: '类型状态卡', file: `${names.tracking}/story-state.md` },
    { id: 'chapterProgress', label: '章节推进状态', file: `${names.tracking}/chapter-progress.md` },
    { id: 'chapterMemory', label: '最近章节记忆', file: `${names.tracking}/chapter-memory.md` },
    { id: 'structuredState', label: '结构化状态机', file: `${names.tracking}/state-machine.json` },
    { id: 'futurePlan', label: '未来章节规划', file: `${names.tracking}/future-plan.md` },
    { id: 'memoryGovernance', label: '记忆治理索引', file: `${names.tracking}/memory-index.md` },
    { id: 'projectRepairLog', label: '资料修复记录', file: `${names.tracking}/project-repair-log.md` },
    { id: 'editorialReview', label: '主编审稿记录', file: `${names.tracking}/editorial-review.md` },
    { id: 'bookStrategyReview', label: '全书/卷节奏复盘', file: `${names.tracking}/book-strategy-review.md` },
    { id: 'projectImpactMap', label: '全项目影响图', file: `${names.tracking}/project-impact-map.md` },
    { id: 'styleSample', label: '样章风格校准', file: `${names.settings}/style-sample.md` },
    { id: 'humanWritingFingerprint', label: '人写感指纹', file: `${names.settings}/${names.humanWritingFingerprint}` },
  ]
}

async function listProjectMaterials(input) {
  const definitions = getProjectMaterialDefinitions(input?.chapterId)

  return Promise.all(
    definitions.map(async (definition) => {
      const target = assertInsideBook(input.bookPath, definition.file)
      const exists = await pathExists(target)
      const content = exists ? await fs.readFile(target, 'utf8') : ''
      return {
        ...definition,
        exists,
        ready: exists && isMeaningfulMarkdown(content),
      }
    }),
  )
}

async function readProjectMaterial(input) {
  const target = assertInsideBook(input.bookPath, input.file)
  const exists = await pathExists(target)
  const content = exists ? await fs.readFile(target, 'utf8') : ''

  return {
    file: input.file,
    content,
    exists,
    ready: exists && isMeaningfulMarkdown(content),
  }
}

async function writeProjectMaterialSnapshot(bookPath, relativeFile, reason) {
  const target = assertInsideBook(bookPath, relativeFile)

  if (!(await pathExists(target))) {
    return null
  }

  const content = await fs.readFile(target, 'utf8')
  const materialName = sanitizeFolderName(relativeFile.replace(/[\\/]+/g, '-').replace(/\.md$/i, '')) || 'material'
  const snapshotDir = path.join(bookPath, '.backup', 'materials', materialName)
  await fs.mkdir(snapshotDir, { recursive: true })
  const suffix = sanitizeFolderName(reason || 'save') || 'save'
  const snapshotPath = path.join(snapshotDir, `${createTimestamp()}-${suffix}.md`)
  await fs.writeFile(snapshotPath, content, 'utf8')
  return snapshotPath
}

async function saveProjectMaterial(input) {
  const target = assertInsideBook(input.bookPath, input.file)
  await writeProjectMaterialSnapshot(input.bookPath, input.file, input.reason || 'before-save')
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, input.content, 'utf8')
  return buildBookDetail(input.bookPath, input.selectedChapterFile)
}

async function listProjectMaterialSnapshots(input) {
  const materialName = sanitizeFolderName(input.file.replace(/[\\/]+/g, '-').replace(/\.md$/i, '')) || 'material'
  const snapshotDir = path.join(input.bookPath, '.backup', 'materials', materialName)

  if (!(await pathExists(snapshotDir))) {
    return []
  }

  const entries = await fs.readdir(snapshotDir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => ({
      id: entry.name,
      file: path.join(snapshotDir, entry.name),
      name: entry.name,
    }))
    .sort((a, b) => b.name.localeCompare(a.name))
}

async function restoreProjectMaterialSnapshot(input) {
  const snapshots = await listProjectMaterialSnapshots(input)
  const snapshot = snapshots.find((item) => item.id === input.snapshotId)

  if (!snapshot) {
    throw new Error('\u672a\u627e\u5230\u6307\u5b9a\u8d44\u6599\u5feb\u7167')
  }

  await writeProjectMaterialSnapshot(input.bookPath, input.file, 'before-restore')
  const content = await fs.readFile(snapshot.file, 'utf8')
  const target = assertInsideBook(input.bookPath, input.file)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, content, 'utf8')
  return buildBookDetail(input.bookPath, input.selectedChapterFile)
}

async function applyProjectUpdatePackage(input) {
  const updates = Array.isArray(input?.updates) ? input.updates : []
  const applied = []
  const source = input?.source === 'project-repair' || input?.source === 'memory-compaction' ? input.source : 'project-update'
  const sourceLabel = source === 'project-repair' ? '资料修复包' : source === 'memory-compaction' ? '长期记忆整理' : '项目资料变更'
  const sectionTitle = source === 'project-repair' ? '资料修复应用' : source === 'memory-compaction' ? '长期记忆整理应用' : '项目资料变更应用'

  for (const update of updates) {
    const file = typeof update?.file === 'string' ? update.file : ''
    const patch = typeof update?.patch === 'string' ? update.patch.trim() : ''

    if (!file || !patch) {
      continue
    }

    const target = assertInsideBook(input.bookPath, file)
    await writeProjectMaterialSnapshot(input.bookPath, file, 'before-project-update-package')
    await fs.mkdir(path.dirname(target), { recursive: true })
    const existing = (await pathExists(target)) ? await fs.readFile(target, 'utf8') : ''
    const reason = typeof update.reason === 'string' && update.reason.trim() ? update.reason.trim() : '项目对话沉淀'
    const nextContent = [
      existing.trimEnd(),
      '',
      `## 项目对话变更 ${createTimestamp()}`,
      '',
      `> 变更原因：${reason}`,
      '',
      patch,
      '',
    ].join('\n')
    await fs.writeFile(target, nextContent, 'utf8')
    applied.push({ file, reason, patch })
  }

  if (applied.length === 0) {
    throw new Error('项目变更单没有可写入的内容')
  }

  await appendProjectRepairLog(input.bookPath, {
    source,
    sourceLabel,
    summary: input?.summary || sourceLabel,
    sectionTitle,
    applied,
  })

  if (input.impactMap) {
    await persistProjectImpactMap(input.bookPath, input.impactMap, sourceLabel)
  }

  const detail = await buildBookDetail(input.bookPath, input.selectedChapterFile)
  return {
    ...detail,
    projectUpdateApplyReport: {
      ok: true,
      summary: `${sourceLabel}已应用：写入 ${applied.length} 处，后续生成会优先读取资料修复记录。`,
      appliedFiles: applied.map((item) => item.file),
      reviewFile: `${names.tracking}/project-repair-log.md`,
      nextStep: '打开资料修复记录查看大改变更单；如果方向不对，可以从该资料的历史版本恢复。',
    },
  }
}

async function buildContextCheck(bookPath, chapters, selectedChapter) {
  const settingsPath = path.join(bookPath, names.settings)
  const outlinePath = path.join(bookPath, names.outline)
  const trackingPath = path.join(bookPath, names.tracking)
  const config = await readBookConfig(bookPath)
  const selectedIndex = selectedChapter ? chapters.findIndex((chapter) => chapter.file === selectedChapter.file) : -1
  const hasPreviousChapter = selectedIndex <= 0 ? true : await pathExists(path.join(bookPath, chapters[selectedIndex - 1].file))

  const checks = {
    platformFit: Boolean(config?.platform) && (await hasMarkdownMatching(settingsPath, ['platform-fit', 'platform', '\u5e73\u53f0'])),
    genreRules: await hasMarkdownMatching(settingsPath, ['genre-rules', '\u9898\u6750\u89c4\u5219', '\u9898\u6750']),
    coreSetting: await hasMarkdownMatching(settingsPath, ['core-setting', 'setting', '\u8bbe\u5b9a']),
    humanWritingFingerprint: await hasMarkdownMatching(settingsPath, ['human-writing-fingerprint', '人写感', '拆书样本指纹']),
    mainCharacter: await hasMarkdownMatching(path.join(bookPath, names.characters), ['main-character', '\u4e3b\u89d2']),
    supportingCharacters: await hasMarkdownMatching(path.join(bookPath, names.characters), ['supporting-characters', '\u914d\u89d2']),
    minorCharacters: await hasMarkdownMatching(path.join(bookPath, names.characters), ['minor-characters', '\u9f99\u5957']),
    overallOutline: await hasMarkdownMatching(outlinePath, ['overall-outline', 'overall', '\u603b\u7eb2']),
    volumeOutline: await hasMarkdownMatching(outlinePath, ['volume', '\u5377\u7eb2', '\u7b2c\u4e00\u5377', '\u7b2c1\u5377']),
    chapterOutline: selectedChapter ? await hasMarkdownMatching(outlinePath, [selectedChapter.id.toLowerCase(), path.basename(selectedChapter.file, '.md').toLowerCase(), '\u7ec6\u7eb2']) : false,
    tracking: await hasMarkdownMatching(trackingPath, ['tracking', '\u8ffd\u8e2a']),
    previousChapter: hasPreviousChapter,
  }

  const items = [
    checkItem('platformFit', contextLabels.platformFit, checks.platformFit, contextLabels.exists, contextLabels.missing),
    checkItem('genreRules', contextLabels.genreRules, checks.genreRules, contextLabels.exists, contextLabels.missing),
    checkItem('coreSetting', contextLabels.coreSetting, checks.coreSetting, contextLabels.exists, contextLabels.missing),
    checkItem('humanWritingFingerprint', '人写感指纹', checks.humanWritingFingerprint, contextLabels.exists, contextLabels.missing, true),
    checkItem('mainCharacter', contextLabels.mainCharacter, checks.mainCharacter, contextLabels.exists, contextLabels.missing),
    checkItem('supportingCharacters', contextLabels.supportingCharacters, checks.supportingCharacters, contextLabels.exists, contextLabels.missing),
    checkItem('minorCharacters', contextLabels.minorCharacters, checks.minorCharacters, contextLabels.exists, contextLabels.missing, true),
    checkItem('overallOutline', contextLabels.overallOutline, checks.overallOutline, contextLabels.exists, contextLabels.missing),
    checkItem('volumeOutline', contextLabels.volumeOutline, checks.volumeOutline, contextLabels.exists, contextLabels.missing),
    checkItem('chapterOutline', contextLabels.chapterOutline, checks.chapterOutline, contextLabels.exists, contextLabels.missing),
    checkItem('previousChapter', contextLabels.previousChapter, checks.previousChapter, selectedIndex <= 0 ? contextLabels.firstChapter : contextLabels.exists, contextLabels.missing, selectedIndex <= 0),
    checkItem('tracking', contextLabels.tracking, checks.tracking, contextLabels.exists, contextLabels.missing),
  ]

  const setupReady = checks.platformFit && checks.genreRules && checks.coreSetting && checks.mainCharacter && checks.supportingCharacters && checks.overallOutline && checks.tracking

  if (!setupReady) {
    return {
      level: 'incomplete-setup',
      message: contextLabels.incompleteSetup,
      primaryAction: contextLabels.actionSetup,
      items,
    }
  }

  if (!checks.volumeOutline) {
    return {
      level: 'missing-volume-outline',
      message: contextLabels.missingVolumeOutline,
      primaryAction: contextLabels.actionVolumeOutline,
      items,
    }
  }

  if (!checks.chapterOutline) {
    return {
      level: 'missing-chapter-outline',
      message: contextLabels.missingChapterOutline,
      primaryAction: contextLabels.actionChapterOutline,
      items,
    }
  }

  return {
    level: 'ready',
    message: contextLabels.ready,
    primaryAction: contextLabels.actionWrite,
    items,
  }
}

function assertInsideBook(bookPath, relativeFile) {
  const target = path.resolve(bookPath, relativeFile)
  const root = path.resolve(bookPath)

  if (!target.startsWith(root)) {
    throw new Error('\u7ae0\u8282\u8def\u5f84\u8d8a\u754c')
  }

  return target
}

function createTimestamp() {
  const date = new Date()
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join('')
}

async function writeChapterSnapshot(bookPath, chapterFile, reason) {
  const target = assertInsideBook(bookPath, chapterFile)

  if (!(await pathExists(target))) {
    return
  }

  const content = await fs.readFile(target, 'utf8')
  const chapterName = sanitizeFolderName(path.basename(chapterFile, path.extname(chapterFile))) || 'chapter'
  const snapshotDir = path.join(bookPath, '.backup', 'chapters', chapterName)
  await fs.mkdir(snapshotDir, { recursive: true })
  const suffix = sanitizeFolderName(reason || 'save') || 'save'
  const snapshotPath = path.join(snapshotDir, `${createTimestamp()}-${suffix}.md`)
  await fs.writeFile(snapshotPath, content, 'utf8')

  const snapshots = (await fs.readdir(snapshotDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort()

  const overflow = snapshots.length - 20
  if (overflow > 0) {
    await Promise.all(snapshots.slice(0, overflow).map((file) => fs.unlink(path.join(snapshotDir, file))))
  }
}

async function listChapterSnapshots(bookPath, chapterFile) {
  const chapterName = sanitizeFolderName(path.basename(chapterFile, path.extname(chapterFile))) || 'chapter'
  const snapshotDir = path.join(bookPath, '.backup', 'chapters', chapterName)

  if (!(await pathExists(snapshotDir))) {
    return []
  }

  const entries = await fs.readdir(snapshotDir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => ({
      id: entry.name,
      file: path.join(snapshotDir, entry.name),
      name: entry.name,
    }))
    .sort((a, b) => b.name.localeCompare(a.name))
}

async function restoreChapterSnapshot(input) {
  const snapshots = await listChapterSnapshots(input.bookPath, input.chapterFile)
  const snapshot = snapshots.find((item) => item.id === input.snapshotId)

  if (!snapshot) {
    throw new Error('\u672a\u627e\u5230\u6307\u5b9a\u5feb\u7167')
  }

  await writeChapterSnapshot(input.bookPath, input.chapterFile, 'before-restore')
  const content = await fs.readFile(snapshot.file, 'utf8')
  const target = assertInsideBook(input.bookPath, input.chapterFile)
  await fs.writeFile(target, content, 'utf8')
  return buildBookDetail(input.bookPath, input.chapterFile)
}

async function writeBookConfig(bookPath, config) {
  await fs.writeFile(path.join(bookPath, 'book.json'), `${JSON.stringify(config, null, 2)}\n`, 'utf8')
}

async function createChapter(input) {
  const bookPath = input.bookPath
  const config = (await readBookConfig(bookPath)) || {
    schemaVersion: 1,
    title: path.basename(bookPath),
    platform: names.unset,
    stage: 'drafting',
    chapters: [],
  }
  const chapters = Array.isArray(config.chapters) ? config.chapters : []
  const nextNumber = chapters.length + 1
  const title = typeof input.title === 'string' && input.title.trim() ? input.title.trim() : `\u7b2c${String(nextNumber).padStart(3, '0')}\u7ae0`
  const id = slugifyChapterId(`chapter-${String(nextNumber).padStart(3, '0')}`)
  const file = `${names.manuscript}/${id}.md`
  const target = assertInsideBook(bookPath, file)

  if (await pathExists(target)) {
    throw new Error('\u540c\u540d\u7ae0\u8282\u5df2\u5b58\u5728')
  }

  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, `# ${title}\n\n`, 'utf8')

  config.chapters = [
    ...chapters,
    {
      id,
      title,
      file,
      status: 'draft',
      targetWords: resolveTargetWordsForBook(config, input.targetWords),
    },
  ]
  config.stage = config.stage === 'idea' || config.stage === 'setting' || config.stage === 'outline' ? 'drafting' : config.stage
  await writeBookConfig(bookPath, config)
  return buildBookDetail(bookPath, file)
}

async function organizeBookProject(bookPath) {
  const backupDir = path.join(bookPath, '.backup', `\u6574\u7406\u524d-${createTimestamp()}`)
  await fs.mkdir(backupDir, { recursive: true })

  const entries = await fs.readdir(bookPath, { withFileTypes: true })
  await Promise.all(
    entries
      .filter((entry) => entry.name !== '.backup')
      .map(async (entry) => {
        const source = path.join(bookPath, entry.name)
        const target = path.join(backupDir, entry.name)
        if (entry.isDirectory()) {
          await fs.cp(source, target, { recursive: true })
        } else if (entry.isFile()) {
          await fs.copyFile(source, target)
        }
      }),
  )

  await Promise.all([names.settings, names.characters, names.outline, names.manuscript, names.tracking, names.exportDir].map((folder) => fs.mkdir(path.join(bookPath, folder), { recursive: true })))

  const configPath = path.join(bookPath, 'book.json')
  if (!(await pathExists(configPath))) {
    const manuscriptFiles = await findMarkdownFiles(path.join(bookPath, names.manuscript))
    const chapters = manuscriptFiles.map((file, index) => {
      const relative = normalizeChapterFile(path.relative(bookPath, file))
      return {
        id: slugifyChapterId(path.basename(file, '.md')) || `chapter-${index + 1}`,
        title: chapterTitleFromFile(file),
        file: relative,
        status: 'draft',
        targetWords: resolveTargetWordsForBook(config),
      }
    })
    await writeBookConfig(bookPath, {
      schemaVersion: 1,
      title: path.basename(bookPath),
      platform: names.unset,
      stage: chapters.length > 0 ? 'drafting' : 'idea',
      todayTask: names.pendingTask,
      createdAt: new Date().toISOString(),
      chapters,
    })
  }

  const seedFiles = [
    [path.join(names.settings, 'project-brief.md'), `# ${path.basename(bookPath)}\n\n## \u4e00\u53e5\u8bdd\u5356\u70b9\n\n`],
    [path.join(names.settings, 'cover-prompt.md'), `# \u5c01\u9762\u63d0\u793a\u8bcd\n\n## \u4e66\u540d\n\n${path.basename(bookPath)}\n\n## \u53ef\u590d\u5236\u751f\u56fe\u63d0\u793a\u8bcd\n\n\u8bf7\u6839\u636e\u672c\u4e66\u8bbe\u5b9a\u3001\u4e3b\u89d2\u3001\u6838\u5fc3\u51b2\u7a81\u548c\u5e73\u53f0\u8c03\u6027\u751f\u6210\u5546\u4e1a\u5316\u5c0f\u8bf4\u5c01\u9762\u63d0\u793a\u8bcd\u3002\n\n`],
    [path.join(names.settings, 'core-setting.md'), '# \u6838\u5fc3\u8bbe\u5b9a\n\n'],
    [path.join(names.settings, 'platform-fit.md'), '# \u5e73\u53f0\u9002\u914d\u8bf4\u660e\n\n'],
    [path.join(names.settings, 'genre-rules.md'), `${buildGenreRulesSeed({ genre: '', idea: '', title: path.basename(bookPath) })}\n\n`],
    [path.join(names.characters, 'main-character.md'), '# \u4e3b\u89d2\u5361\n\n'],
    [path.join(names.characters, 'supporting-characters.md'), '# \u914d\u89d2\u5361\n\n'],
    [path.join(names.characters, 'minor-characters.md'), '# \u9f99\u5957\u8bb0\u5f55\n\n'],
    [path.join(names.outline, 'overall-outline.md'), '# \u603b\u7eb2\n\n'],
    [path.join(names.outline, 'golden-first-3-chapters.md'), '# \u9ec4\u91d1\u524d\u4e09\u7ae0\u89c4\u5212\n\n## \u7b2c 1 \u7ae0\n\n## \u7b2c 2 \u7ae0\n\n## \u7b2c 3 \u7ae0\n\n'],
    [path.join(names.tracking, 'tracking.md'), '# \u8ffd\u8e2a\u8868\n\n'],
    [path.join(names.tracking, 'story-state.md'), `${buildStoryStateSeed({ title: path.basename(bookPath) })}\n`],
    [path.join(names.tracking, 'chapter-progress.md'), `${buildChapterProgressSeed({ title: path.basename(bookPath) })}\n`],
    [path.join(names.tracking, 'chapter-memory.md'), `${buildChapterMemorySeed({ title: path.basename(bookPath) })}\n`],
    [path.join(names.tracking, 'state-machine.json'), `${JSON.stringify(buildStructuredStateSeed({ title: path.basename(bookPath) }), null, 2)}\n`],
    [path.join(names.tracking, 'future-plan.md'), `${buildFuturePlanSeed({ title: path.basename(bookPath) })}\n`],
    [path.join(names.tracking, 'memory-index.md'), `${buildMemoryGovernanceSeed({ title: path.basename(bookPath) })}\n`],
    [path.join(names.tracking, 'project-repair-log.md'), `${buildProjectRepairLogSeed({ title: path.basename(bookPath) })}\n`],
    [path.join(names.settings, 'style-sample.md'), `${buildStyleSampleSeed({ title: path.basename(bookPath) })}\n`],
  ]

  for (const [relativeFile, content] of seedFiles) {
    const target = path.join(bookPath, relativeFile)
    if (!(await pathExists(target))) {
      await fs.writeFile(target, content, 'utf8')
    }
  }

  return getWorkspaceState()
}

async function exportChapter(input) {
  const detail = await buildBookDetail(input.bookPath, input.chapterFile)
  if (!detail.selectedChapter) {
    throw new Error('\u8bf7\u5148\u9009\u62e9\u7ae0\u8282')
  }

  const exportDir = path.join(input.bookPath, names.exportDir)
  await fs.mkdir(exportDir, { recursive: true })
  const content = await fs.readFile(path.join(input.bookPath, detail.selectedChapter.file), 'utf8')
  const outputPath = path.join(exportDir, `${sanitizeFolderName(detail.selectedChapter.title) || 'chapter'}.txt`)
  await fs.writeFile(outputPath, `${markdownToPlainText(content)}\n`, 'utf8')
  return { filePath: outputPath, folderPath: exportDir }
}

async function exportBook(bookPath) {
  const detail = await buildBookDetail(bookPath)
  const exportDir = path.join(bookPath, names.exportDir)
  await fs.mkdir(exportDir, { recursive: true })

  const chunks = await Promise.all(
    detail.chapters.map(async (chapter) => {
      const content = await fs.readFile(path.join(bookPath, chapter.file), 'utf8')
      return `${chapter.title}\n\n${markdownToPlainText(content)}`
    }),
  )
  const outputPath = path.join(exportDir, `${sanitizeFolderName(detail.book.title) || 'book'}_\u5168\u4e66_${createTimestamp()}.txt`)
  await fs.writeFile(outputPath, `${chunks.join('\n\n')}\n`, 'utf8')
  return { filePath: outputPath, folderPath: exportDir }
}

async function appendSection(bookPath, relativeFile, title, content) {
  const target = assertInsideBook(bookPath, relativeFile)
  await fs.mkdir(path.dirname(target), { recursive: true })
  const existing = (await pathExists(target)) ? await fs.readFile(target, 'utf8') : ''
  const next = `${existing.trimEnd()}\n\n## ${title} ${new Date().toISOString()}\n\n${content.trim() || '\u6682\u65e0'}\n`
  await fs.writeFile(target, next, 'utf8')
}

async function appendGovernedSection(bookPath, relativeFile, title, content, maxLength = 20000) {
  const target = assertInsideBook(bookPath, relativeFile)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await archiveOversizedMemoryMaterial(bookPath, relativeFile, maxLength)
  const existing = (await pathExists(target)) ? await fs.readFile(target, 'utf8') : ''
  const section = `\n\n## ${title} ${new Date().toISOString()}\n\n${content.trim() || '\u6682\u65e0'}\n`
  const next = `${existing.trimEnd()}${section}`

  if (next.length <= maxLength) {
    await fs.writeFile(target, next, 'utf8')
    return
  }

  const head = next.slice(0, Math.floor(maxLength * 0.32)).trimEnd()
  const tail = next.slice(-Math.floor(maxLength * 0.62)).trimStart()
  await fs.writeFile(target, `${head}\n\n## 自动压缩说明 ${new Date().toISOString()}\n\n中间较旧的记忆条目已折叠。保留开头索引和最近更新，避免长期上下文失控。\n\n${tail}`, 'utf8')
}

async function archiveOversizedMemoryMaterial(bookPath, relativeFile, maxLength = memoryGovernanceMaxLength) {
  const target = assertInsideBook(bookPath, relativeFile)
  if (!(await pathExists(target))) {
    return null
  }

  const existing = await fs.readFile(target, 'utf8')
  if (existing.length <= maxLength) {
    return null
  }

  const archiveDir = assertInsideBook(bookPath, `${names.tracking}/memory-archive`)
  await fs.mkdir(archiveDir, { recursive: true })
  const archiveName = `${createTimestamp()}-${sanitizeFolderName(relativeFile.replace(/[\\/]+/g, '-')) || 'memory'}.md`
  const archivePath = path.join(archiveDir, archiveName)
  await fs.writeFile(archivePath, existing, 'utf8')
  const head = existing.slice(0, Math.floor(maxLength * 0.25)).trimEnd()
  const tail = existing.slice(-Math.floor(maxLength * 0.55)).trimStart()
  await fs.writeFile(target, `${head}\n\n## 归档说明 ${new Date().toISOString()}\n\n旧内容已归档到：${path.relative(bookPath, archivePath)}\n\n${tail}\n`, 'utf8')
  return archivePath
}

async function appendProjectRepairLog(bookPath, { source, sourceLabel, summary, sectionTitle, applied }) {
  const appliedList = applied
    .map((item) => {
      return [
        `- 文件：${item.file}`,
        `  - 原因：${item.reason}`,
        `  - 补丁摘要：${limitText(item.patch, 500)}`,
      ].join('\n')
    })
    .join('\n')
  const content = [
    `- 来源：${sourceLabel}`,
    `- source：${source}`,
    `- 摘要：${summary}`,
    '- 约束：最近资料修复记录优先于旧资料中含糊或冲突的表述。',
    '',
    '## 本次写入',
    appliedList || '- 暂无',
  ].join('\n')

  await appendGovernedSection(bookPath, `${names.tracking}/project-repair-log.md`, sectionTitle, content, 24000)
}

function buildWritingSyncReport({ sourceLabel, chapterFile, mode, draft }) {
  const warnings = [
    ...(Array.isArray(draft?.stateGateWarnings) ? draft.stateGateWarnings : []),
    ...(Array.isArray(draft?.qualityGateWarnings) ? draft.qualityGateWarnings : []),
  ]

  return [
    `- 来源：${sourceLabel}`,
    `- 章节文件：${chapterFile || '未知'}`,
    `- 应用模式：${mode || 'append'}`,
    `- 导演状态：${draft?.directorStatus || 'unknown'}`,
    typeof draft?.qualityScore === 'number' ? `- 质量分：${draft.qualityScore}` : '- 质量分：未评分',
    `- 质量门禁：${draft?.qualityGatePassed === false ? '建议复核' : '已通过或未评分'}`,
    '',
    '## 门禁提示',
    warnings.map((warning) => `- ${warning}`).join('\n') || '- 暂无',
    '',
    '## 下一章准备',
    draft?.nextChapterReadiness || '- 暂无',
  ].join('\n')
}

function buildEditorialReviewReport({ sourceLabel, chapterFile, mode, draft }) {
  const judgement = draft?.editorialJudgement || {}
  const radar = Array.isArray(draft?.editorialRadar) ? draft.editorialRadar : []
  const focusActions = Array.isArray(draft?.editorialFocusActions) ? draft.editorialFocusActions : []
  const reasons = Array.isArray(judgement.reasons) ? judgement.reasons : []

  return [
    `- source: ${sourceLabel || 'unknown'}`,
    `- chapterFile: ${chapterFile || 'unknown'}`,
    `- mode: ${mode || 'append'}`,
    `- editorialLevel: ${judgement.level || 'idle'}`,
    `- editorialTitle: ${judgement.title || 'not judged'}`,
    `- editorialWhy: ${judgement.why || 'none'}`,
    `- nextAction: ${judgement.nextAction || 'none'}`,
    '',
    '## Reasons',
    reasons.map((reason) => `- ${reason}`).join('\n') || '- none',
    '',
    '## Radar',
    radar.map((item) => `- ${item.label || item.id || 'unknown'}: ${item.status || 'idle'}; ${item.detail || ''}`).join('\n') || '- none',
    '',
    '## Focus Actions',
    focusActions.map((action) => `- ${action.label || action.radarId || 'action'}: ${limitText(action.feedback || '', 240)}`).join('\n') || '- none',
  ].join('\n')
}

function buildEditorialReviewIndexReport({ sourceLabel, chapterFile, mode, draft }) {
  const judgement = draft?.editorialJudgement || {}
  const radar = Array.isArray(draft?.editorialRadar) ? draft.editorialRadar : []
  const focusActions = Array.isArray(draft?.editorialFocusActions) ? draft.editorialFocusActions : []
  const riskyRadar = radar.filter((item) => item?.status === 'risk' || item?.status === 'watch')

  return [
    `- source: ${sourceLabel || 'unknown'}`,
    `- chapterFile: ${chapterFile || 'unknown'}`,
    `- mode: ${mode || 'append'}`,
    `- editorialLevel: ${judgement.level || 'idle'}`,
    `- conclusion: ${judgement.title || 'not judged'}`,
    `- nextAction: ${judgement.nextAction || 'none'}`,
    '',
    '## Active Risks',
    riskyRadar.map((item) => `- ${item.label || item.id || 'unknown'}: ${item.detail || item.status || 'risk'}`).join('\n') || '- none',
    '',
    '## Carry Forward',
    focusActions.map((action) => `- ${action.label || action.radarId || 'action'}: ${limitText(action.feedback || '', 180)}`).join('\n') || judgement.why || '- none',
  ].join('\n')
}

function buildBookStrategyReviewReport({ sourceLabel, chapterFile, mode, draft }) {
  const stateWarnings = Array.isArray(draft?.stateGateWarnings) ? draft.stateGateWarnings : []
  const qualityWarnings = Array.isArray(draft?.qualityGateWarnings) ? draft.qualityGateWarnings : []
  const radar = Array.isArray(draft?.editorialRadar) ? draft.editorialRadar : []
  const riskyRadar = radar.filter((item) => item?.status === 'risk' || item?.status === 'watch')
  const warnings = [...stateWarnings, ...qualityWarnings]

  return [
    `- source: ${sourceLabel || 'unknown'}`,
    `- chapterFile: ${chapterFile || 'unknown'}`,
    `- mode: ${mode || 'append'}`,
    `- directorStatus: ${draft?.directorStatus || 'unknown'}`,
    typeof draft?.qualityScore === 'number' ? `- qualityScore: ${draft.qualityScore}` : '- qualityScore: unknown',
    '',
    '## 本章推进结论',
    draft?.progressPatch || draft?.nextChapterReadiness || '- none',
    '',
    '## 卷节奏风险',
    warnings.map((warning) => `- ${warning}`).join('\n') || '- none',
    '',
    '## 主编雷达承接',
    riskyRadar.map((item) => `- ${item.label || item.id || 'unknown'}: ${item.detail || item.status || 'risk'}`).join('\n') || '- none',
    '',
    '## 下一段策略',
    draft?.futurePlanPatch || draft?.nextChapterReadiness || '- none',
  ].join('\n')
}

const writingApplyReadbackTargets = [
  { id: 'chapterContent', label: '\u6b63\u6587', file: null, field: 'content', required: true },
  { id: 'statePatch', label: '\u7c7b\u578b\u72b6\u6001\u5361', file: () => `${names.tracking}/story-state.md`, field: 'statePatch' },
  { id: 'progressPatch', label: '\u7ae0\u8282\u63a8\u8fdb\u8868', file: () => `${names.tracking}/chapter-progress.md`, field: 'progressPatch' },
  { id: 'memoryPatch', label: '\u7ae0\u8282\u8bb0\u5fc6', file: () => `${names.tracking}/chapter-memory.md`, field: 'memoryPatch' },
  { id: 'structuredPatch', label: '\u72b6\u6001\u673a', file: () => `${names.tracking}/state-machine.json`, field: 'structuredPatch', json: true },
  { id: 'futurePlanPatch', label: '\u672a\u6765\u89c4\u5212', file: () => `${names.tracking}/future-plan.md`, field: 'futurePlanPatch' },
  { id: 'stylePatch', label: '\u6587\u98ce\u6837\u672c', file: () => `${names.settings}/style-sample.md`, field: 'stylePatch' },
  { id: 'memoryGovernancePatch', label: '\u8bb0\u5fc6\u7d22\u5f15', file: () => `${names.tracking}/memory-index.md`, field: 'memoryGovernancePatch' },
]

function buildReadbackProbe(value) {
  if (typeof value !== 'string') {
    return ''
  }
  return value.replace(/\s+/g, ' ').trim().slice(0, 80)
}

function contentIncludesReadbackProbe(content, probe) {
  if (!probe) {
    return false
  }
  const normalized = String(content || '').replace(/\s+/g, ' ')
  return normalized.includes(probe) || normalized.includes(probe.slice(0, 32))
}

async function buildWritingApplyReadbackCheck({ bookPath, chapterFile, draft, sourceLabel }) {
  const items = []

  for (const target of writingApplyReadbackTargets) {
    const expected = target.id === 'chapterContent' ? draft?.content : draft?.[target.field]
    if (!target.required && (typeof expected !== 'string' || !expected.trim())) {
      continue
    }

    const relativeFile = target.id === 'chapterContent' ? chapterFile : target.file()
    const filePath = assertInsideBook(bookPath, relativeFile)
    const exists = await pathExists(filePath)
    const content = exists ? await fs.readFile(filePath, 'utf8') : ''
    const probe = buildReadbackProbe(expected)
    const ok = exists && (target.json ? content.trim().length > 2 : contentIncludesReadbackProbe(content, probe))
    items.push({
      id: target.id,
      label: target.label,
      file: relativeFile,
      ok,
      message: ok ? '\u5df2\u56de\u8bfb\u786e\u8ba4' : '\u672a\u5728\u76ee\u6807\u6587\u4ef6\u8bfb\u5230\u672c\u6b21\u66f4\u65b0',
    })
  }

  const ok = items.length > 0 && items.every((item) => item.ok)
  return {
    checkedAt: new Date().toISOString(),
    sourceLabel,
    chapterFile,
    ok,
    summary: ok
      ? '\u5e94\u7528\u540e\u56de\u8bfb\u81ea\u68c0\u901a\u8fc7\uff1a\u6b63\u6587\u548c\u957f\u671f\u8bb0\u5fc6\u5df2\u843d\u5230\u4e0b\u4e00\u6b21\u751f\u6210\u4f1a\u8bfb\u53d6\u7684\u6587\u4ef6\u3002'
      : '\u5e94\u7528\u540e\u56de\u8bfb\u81ea\u68c0\u672a\u5168\u90e8\u901a\u8fc7\uff1a\u5efa\u8bae\u67e5\u770b\u540c\u6b65\u62a5\u544a\u6216\u91cd\u8bd5\u672c\u6b65\u3002',
    items,
  }
}

function formatWritingApplyReadbackCheck(check) {
  return [
    `- \u68c0\u67e5\u65f6\u95f4\uff1a${check.checkedAt}`,
    `- \u6765\u6e90\uff1a${check.sourceLabel || '\u672a\u77e5'}`,
    `- \u7ae0\u8282\u6587\u4ef6\uff1a${check.chapterFile || '\u672a\u77e5'}`,
    `- \u7ed3\u8bba\uff1a${check.ok ? '\u901a\u8fc7' : '\u9700\u590d\u6838'}`,
    '',
    check.items.map((item) => `- ${item.ok ? '[OK]' : '[WARN]'} ${item.label} -> ${item.file}：${item.message}`).join('\n') || '- \u6682\u65e0\u53ef\u68c0\u67e5\u9879',
  ].join('\n')
}

async function persistWritingCandidatePatches({ bookPath, chapterFile, mode, draft, sourceLabel }) {
  if (typeof draft?.statePatch === 'string' && draft.statePatch.trim()) {
    await appendGovernedSection(bookPath, `${names.tracking}/story-state.md`, `${sourceLabel}章节后状态更新`, draft.statePatch, 24000)
  }

  if (typeof draft?.progressPatch === 'string' && draft.progressPatch.trim()) {
    await appendGovernedSection(bookPath, `${names.tracking}/chapter-progress.md`, `${sourceLabel}章节推进更新`, draft.progressPatch, 24000)
  }

  if (typeof draft?.memoryPatch === 'string' && draft.memoryPatch.trim()) {
    await appendGovernedSection(bookPath, `${names.tracking}/chapter-memory.md`, `${sourceLabel}章节记忆更新`, draft.memoryPatch, 26000)
  }

  if (typeof draft?.structuredPatch === 'string' && draft.structuredPatch.trim()) {
    await mergeStructuredStatePatch(bookPath, draft.structuredPatch)
  }

  if (typeof draft?.futurePlanPatch === 'string' && draft.futurePlanPatch.trim()) {
    await appendGovernedSection(bookPath, `${names.tracking}/future-plan.md`, `${sourceLabel}未来章节规划更新`, draft.futurePlanPatch, 24000)
  }

  if (typeof draft?.stylePatch === 'string' && draft.stylePatch.trim()) {
    await appendGovernedSection(bookPath, `${names.settings}/style-sample.md`, `${sourceLabel}风格校准更新`, draft.stylePatch, 22000)
  }

  if (typeof draft?.memoryGovernancePatch === 'string' && draft.memoryGovernancePatch.trim()) {
    await appendGovernedSection(bookPath, `${names.tracking}/memory-index.md`, `${sourceLabel}记忆治理更新`, draft.memoryGovernancePatch, 24000)
  }

  if (draft?.editorialJudgement || Array.isArray(draft?.editorialRadar)) {
    await appendGovernedSection(
      bookPath,
      `${names.tracking}/editorial-review.md`,
      `${sourceLabel} editorial review`,
      buildEditorialReviewReport({ sourceLabel, chapterFile, mode, draft }),
      26000,
    )
    await appendGovernedSection(
      bookPath,
      `${names.tracking}/editorial-review-index.md`,
      `${sourceLabel} editorial review index`,
      buildEditorialReviewIndexReport({ sourceLabel, chapterFile, mode, draft }),
      12000,
    )
  }

  if (
    typeof draft?.progressPatch === 'string'
    || typeof draft?.futurePlanPatch === 'string'
    || typeof draft?.nextChapterReadiness === 'string'
    || Array.isArray(draft?.stateGateWarnings)
    || Array.isArray(draft?.qualityGateWarnings)
  ) {
    await appendGovernedSection(
      bookPath,
      `${names.tracking}/book-strategy-review.md`,
      `${sourceLabel} book strategy review`,
      buildBookStrategyReviewReport({ sourceLabel, chapterFile, mode, draft }),
      18000,
    )
  }

  await appendGovernedSection(
    bookPath,
    `${names.tracking}/writing-sync-report.md`,
    `${sourceLabel}写作同步报告`,
    buildWritingSyncReport({ sourceLabel, chapterFile, mode, draft }),
    24000,
  )

  const applyReadbackCheck = await buildWritingApplyReadbackCheck({ bookPath, chapterFile, draft, sourceLabel })
  await appendGovernedSection(
    bookPath,
    `${names.tracking}/writing-sync-report.md`,
    `${sourceLabel}\u5e94\u7528\u540e\u56de\u8bfb\u81ea\u68c0`,
    formatWritingApplyReadbackCheck(applyReadbackCheck),
    24000,
  )
  return applyReadbackCheck
}

function tryExtractJsonObject(text) {
  if (typeof text !== 'string') {
    return null
  }

  const trimmed = text.trim()
  const candidates = [trimmed]

  for (const fenced of collectFencedJsonCandidates(trimmed)) {
    candidates.push(fenced, ...findBalancedJsonObjects(fenced))
  }

  candidates.push(...findBalancedJsonObjects(trimmed))

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const parsed = parseJsonObjectCandidate(candidates[index])
    if (parsed) {
      return parsed
    }
  }

  return null
}

function mergePlainObject(base, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return base
  }

  const next = { ...(base && typeof base === 'object' && !Array.isArray(base) ? base : {}) }
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      next[key] = mergePlainObject(next[key], value)
    } else if (Array.isArray(value)) {
      next[key] = value
    } else if (value !== '' && value !== null && value !== undefined) {
      next[key] = value
    }
  }
  return next
}

async function mergeStructuredStatePatch(bookPath, patchText) {
  const patch = tryExtractJsonObject(patchText)
  if (!patch) {
    return
  }

  const target = assertInsideBook(bookPath, `${names.tracking}/state-machine.json`)
  await fs.mkdir(path.dirname(target), { recursive: true })
  const existing = (await pathExists(target)) ? await readJsonFile(target) : {}
  const merged = mergePlainObject(existing || {}, { ...patch, updatedAt: new Date().toISOString() })
  await fs.writeFile(target, `${JSON.stringify(merged, null, 2)}\n`, 'utf8')
}

async function readStoryStateMaterial(bookPath) {
  const storyState = await readTextFileIfExists(path.join(bookPath, names.tracking, 'story-state.md'))
  if (storyState.trim()) {
    return storyState
  }

  return readTextFileIfExists(path.join(bookPath, names.tracking, 'game-state.md'))
}

async function readChapterProgressMaterial(bookPath) {
  return readTextFileIfExists(path.join(bookPath, names.tracking, 'chapter-progress.md'))
}

async function readChapterMemoryMaterial(bookPath) {
  return readTextFileIfExists(path.join(bookPath, names.tracking, 'chapter-memory.md'))
}

async function readStructuredStateMaterial(bookPath) {
  return readTextFileIfExists(path.join(bookPath, names.tracking, 'state-machine.json'))
}

async function readFuturePlanMaterial(bookPath) {
  return readTextFileIfExists(path.join(bookPath, names.tracking, 'future-plan.md'))
}

async function readMemoryGovernanceMaterial(bookPath) {
  return readTextFileIfExists(path.join(bookPath, names.tracking, 'memory-index.md'))
}

async function readProjectRepairLogMaterial(bookPath) {
  return readTextFileIfExists(path.join(bookPath, names.tracking, 'project-repair-log.md'))
}

async function readEditorialReviewMaterial(bookPath) {
  const index = await readTextFileIfExists(path.join(bookPath, names.tracking, 'editorial-review-index.md'))
  const review = await readTextFileIfExists(path.join(bookPath, names.tracking, 'editorial-review.md'))

  if (!index.trim() && !review.trim()) {
    return ''
  }

  return [
    '# 主编风险索引',
    index || '暂无',
    '',
    '# 最近审稿记录',
    limitText(review, 2200) || '暂无',
  ].join('\n')
}

async function readStyleSampleMaterial(bookPath) {
  return readTextFileIfExists(path.join(bookPath, names.settings, 'style-sample.md'))
}

async function readBookStrategyReviewMaterial(bookPath) {
  return readTextFileIfExists(path.join(bookPath, names.tracking, 'book-strategy-review.md'))
}

async function readProjectImpactMapMaterial(bookPath) {
  return readTextFileIfExists(path.join(bookPath, names.tracking, 'project-impact-map.md'))
}

async function readHumanWritingFingerprintMaterial(bookPath) {
  return readTextFileIfExists(path.join(bookPath, names.settings, names.humanWritingFingerprint))
}

function getBundledFingerprintRoot() {
  const appRoot = app.isPackaged ? process.resourcesPath : path.dirname(__dirname)
  return path.join(appRoot, 'build/writing-fingerprints')
}

async function readBookGenreFingerprints(bookPath, preferredGenres = []) {
  // 书籍自定义题材指纹优先，允许用户覆盖软件内置指纹；这里不存放原文样本。
  const fingerprintDir = path.join(bookPath, names.settings, names.sampleFingerprintLibrary)
  const genreIndexPath = path.join(fingerprintDir, 'genre-index.json')
  const legacyIndexPath = path.join(fingerprintDir, 'platform-genre-index.json')
  const indexPath = await pathExists(genreIndexPath) ? genreIndexPath : legacyIndexPath

  if (!(await pathExists(indexPath))) {
    return ''
  }

  let index
  try {
    index = JSON.parse(await fs.readFile(indexPath, 'utf8'))
  } catch {
    return ''
  }

  const groups = Array.isArray(index?.genres)
    ? index.genres
    : Array.isArray(index?.groups)
      ? index.groups
      : []
  const selected = pickFingerprintGroups(groups, preferredGenres)
  const contents = []

  for (const group of selected) {
    const file = typeof group.bookFile === 'string' ? group.bookFile : group.file
    if (typeof file !== 'string') {
      continue
    }

    const target = assertInsideBook(bookPath, file)
    if (await pathExists(target)) {
      contents.push(limitText(await fs.readFile(target, 'utf8'), 900))
    }
  }

  return contents.join('\n\n---\n\n')
}

async function readBundledGenreFingerprints(preferredGenres = []) {
  const fingerprintRoot = getBundledFingerprintRoot()
  const indexPath = path.join(fingerprintRoot, 'genre-index.json')

  if (!(await pathExists(indexPath))) {
    return ''
  }

  let index
  try {
    index = JSON.parse(await fs.readFile(indexPath, 'utf8'))
  } catch {
    return ''
  }

  const genres = pickFingerprintGroups(Array.isArray(index?.genres) ? index.genres : [], preferredGenres)
  const contents = []

  for (const genre of genres) {
    if (typeof genre.file !== 'string') {
      continue
    }

    const target = path.resolve(fingerprintRoot, genre.file)
    if (!target.startsWith(path.resolve(fingerprintRoot))) {
      continue
    }

    if (await pathExists(target)) {
      contents.push(limitText(await fs.readFile(target, 'utf8'), 900))
    }
  }

  return contents.join('\n\n---\n\n')
}

async function readRelevantSampleFingerprints(bookPath) {
  const book = await readBookConfig(bookPath)
  const preferredGenres = inferPreferredFingerprintGenres([
    book?.title,
    book?.genre,
    book?.idea,
  ].filter(Boolean).join('\n'))
  const bookFingerprints = await readBookGenreFingerprints(bookPath, preferredGenres)
  return bookFingerprints || await readBundledGenreFingerprints(preferredGenres)
}

async function readProjectContext(bookPath, selectedChapter) {
  const chapterFile = selectedChapter?.file ?? ''
  const chapterId = selectedChapter?.id ?? 'chapter-001'
  const chapterNumber = Number(chapterId.match(/\d+/)?.[0] ?? 0)
  const outlinePath = path.join(bookPath, names.outline)
  const chapters = await listChapters(bookPath)
  const selectedIndex = selectedChapter ? chapters.findIndex((chapter) => chapter.file === selectedChapter.file) : -1
  const previousChapter = selectedIndex > 0 ? chapters[selectedIndex - 1] : null
  const goldenFirstThree = await readTextFileIfExists(path.join(outlinePath, 'golden-first-3-chapters.md'))
  const book = await readBookConfig(bookPath)

  return {
    platformFit: await readTextFileIfExists(path.join(bookPath, names.settings, 'platform-fit.md')),
    genreRules: await readTextFileIfExists(path.join(bookPath, names.settings, 'genre-rules.md')),
    coreSetting: await readTextFileIfExists(path.join(bookPath, names.settings, 'core-setting.md')),
    mainCharacter: await readTextFileIfExists(path.join(bookPath, names.characters, 'main-character.md')),
    supportingCharacters: await readTextFileIfExists(path.join(bookPath, names.characters, 'supporting-characters.md')),
    minorCharacters: await readTextFileIfExists(path.join(bookPath, names.characters, 'minor-characters.md')),
    overallOutline: await readTextFileIfExists(path.join(outlinePath, 'overall-outline.md')),
    goldenFirstThree,
    goldenFirstThreeForCurrentChapter: chapterNumber >= 1 && chapterNumber <= 3 ? goldenFirstThree : '',
    volumeOutline: await readTextFileIfExists(path.join(outlinePath, 'volume-001.md')),
    chapterOutline: await readTextFileIfExists(path.join(outlinePath, `${chapterId}-outline.md`)),
    tracking: await readTextFileIfExists(path.join(bookPath, names.tracking, 'tracking.md')),
    storyState: await readStoryStateMaterial(bookPath),
    chapterProgress: await readChapterProgressMaterial(bookPath),
    chapterMemory: await readChapterMemoryMaterial(bookPath),
    structuredState: await readStructuredStateMaterial(bookPath),
    futurePlan: await readFuturePlanMaterial(bookPath),
    memoryGovernance: await readMemoryGovernanceMaterial(bookPath),
    projectRepairLog: await readProjectRepairLogMaterial(bookPath),
    editorialReview: await readEditorialReviewMaterial(bookPath),
    bookStrategyReview: await readBookStrategyReviewMaterial(bookPath),
    projectImpactMap: await readProjectImpactMapMaterial(bookPath),
    styleSample: await readStyleSampleMaterial(bookPath),
    humanWritingFingerprint: await readHumanWritingFingerprintMaterial(bookPath),
    samplePoolFingerprints: await readRelevantSampleFingerprints(bookPath, book),
    previousChapter: previousChapter ? await readTextFileIfExists(path.join(bookPath, previousChapter.file)) : '',
    currentChapter: chapterFile ? await readTextFileIfExists(path.join(bookPath, chapterFile)) : '',
  }
}

async function readLightProjectChatContext(bookPath, selectedChapter) {
  const fullContext = await readProjectContext(bookPath, selectedChapter)

  return {
    platformFit: limitText(fullContext.platformFit, 1600),
    genreRules: limitText(fullContext.genreRules, 1600),
    coreSetting: limitText(fullContext.coreSetting, 2200),
    mainCharacter: limitText(fullContext.mainCharacter, 1800),
    supportingCharacters: limitText(fullContext.supportingCharacters, 1600),
    overallOutline: limitText(fullContext.overallOutline, 2200),
    chapterOutline: limitText(fullContext.chapterOutline, 1600),
    tracking: limitText(fullContext.tracking, 1400),
    storyState: limitText(fullContext.storyState, 1400),
    chapterProgress: limitText(fullContext.chapterProgress, 1400),
    chapterMemory: limitText(fullContext.chapterMemory, 1600),
    structuredState: limitText(fullContext.structuredState, 1600),
    futurePlan: limitText(fullContext.futurePlan, 1400),
    projectRepairLog: limitText(fullContext.projectRepairLog, 1400),
    editorialReview: limitText(fullContext.editorialReview, 1200),
    bookStrategyReview: limitText(fullContext.bookStrategyReview, 1000),
    projectImpactMap: limitText(fullContext.projectImpactMap, 1000),
    styleSample: limitText(fullContext.styleSample, 1200),
    humanWritingFingerprint: limitText(fullContext.humanWritingFingerprint, 1200),
    samplePoolFingerprints: limitText(fullContext.samplePoolFingerprints, 1200),
    previousChapter: limitText(fullContext.previousChapter, 1200),
    currentChapter: limitText(fullContext.currentChapter, 1200),
  }
}

async function readMaterialRewriteContext(bookPath, selectedChapter, materialId) {
  const fullContext = await readProjectContext(bookPath, selectedChapter)

  return selectContextForTask(fullContext, 'material-rewrite', { materialId })
}

function selectOutlineContext(context, mode) {
  const isChapter = mode === 'chapter'
  return {
    platformFit: limitText(context.platformFit, 1000),
    genreRules: limitText(context.genreRules, 1200),
    coreSetting: limitText(context.coreSetting, 1600),
    mainCharacter: limitText(context.mainCharacter, 1200),
    supportingCharacters: limitText(context.supportingCharacters, 900),
    minorCharacters: limitText(context.minorCharacters, 500),
    overallOutline: limitText(context.overallOutline, isChapter ? 1600 : 2200),
    goldenFirstThree: limitText(context.goldenFirstThree, 900),
    goldenFirstThreeForCurrentChapter: limitText(context.goldenFirstThreeForCurrentChapter, 800),
    volumeOutline: limitText(context.volumeOutline, isChapter ? 1800 : 1000),
    chapterOutline: limitText(context.chapterOutline, isChapter ? 900 : 400),
    tracking: limitText(context.tracking, 900),
    storyState: limitText(context.storyState, 1100),
    chapterProgress: limitText(context.chapterProgress, 1300),
    chapterMemory: limitText(context.chapterMemory, 1200),
    structuredState: limitText(context.structuredState, 1400),
    futurePlan: limitText(context.futurePlan, 1200),
    memoryGovernance: '',
    projectRepairLog: limitText(context.projectRepairLog, 900),
    editorialReview: limitText(context.editorialReview, 900),
    bookStrategyReview: limitText(context.bookStrategyReview, 900),
    projectImpactMap: limitText(context.projectImpactMap, 900),
    styleSample: limitText(context.styleSample, 700),
    humanWritingFingerprint: limitText(context.humanWritingFingerprint, 700),
    samplePoolFingerprints: limitText(context.samplePoolFingerprints, 700),
    previousChapter: limitText(context.previousChapter, isChapter ? 1300 : 500),
    currentChapter: limitText(context.currentChapter, isChapter ? 700 : 300),
  }
}

function buildChapterStableContext({ book, context }) {
  const genreRequirement = detectGenreRequiredSignals(context)
  const genreContinuityContract = buildGenreContinuityContract({ genreRequirement })

  return [
    '# 项目稳定上下文',
    `书名：${book.title}`,
    `平台：${book.platform}`,
    '',
    '## 平台规则',
    context.platformFit || '暂无',
    '## 题材规则',
    context.genreRules || '暂无',
    '## 核心设定',
    context.coreSetting || '暂无',
    '## 主角卡',
    context.mainCharacter || '暂无',
    '## 配角卡',
    context.supportingCharacters || '暂无',
    '## 龙套记录',
    context.minorCharacters || '暂无',
    '## 总纲',
    context.overallOutline || '暂无',
    '## 黄金三章规划',
    context.goldenFirstThree || '暂无',
    '## 卷纲',
    context.volumeOutline || '暂无',
    '## 追踪表',
    context.tracking || '暂无',
    '## 类型状态卡',
    context.storyState || buildStoryStateSeed({ genre: context.genreRules, idea: context.coreSetting, title: book.title }),
    '## 章节推进状态',
    context.chapterProgress || buildChapterProgressSeed({ title: book.title }),
    '## 最近章节记忆',
    context.chapterMemory || buildChapterMemorySeed({ title: book.title }),
    '## 结构化状态机',
    context.structuredState || JSON.stringify(buildStructuredStateSeed({ title: book.title }), null, 2),
    '## 未来章节规划',
    context.futurePlan || buildFuturePlanSeed({ title: book.title }),
    '## 记忆治理索引',
    context.memoryGovernance || buildMemoryGovernanceSeed({ title: book.title }),
    '## 最近资料修复记录',
    '最近资料修复记录优先于旧资料中含糊或冲突的表述；后续章节必须承接这里写明的跨文件修复、题材纠偏和状态连续规则。',
    context.projectRepairLog || buildProjectRepairLogSeed({ title: book.title }),
    '## 主编审稿记录',
    '主编审稿记录来自用户应用候选时的判断快照；后续生成必须优先修正这里反复出现的雷达风险，不要重复已被标记的问题。记录文件：editorial-review.md。',
    context.editorialReview || '暂无主编审稿记录。',
    '## 全书/卷节奏复盘',
    '全书/卷节奏复盘用于提醒当前卷的主线密度、爽点分布、重复风险和下一段推进方向；后续章节必须优先避开这里标记的长期节奏风险。记录文件：book-strategy-review.md。',
    context.bookStrategyReview || '暂无全书/卷节奏复盘。',
    '## 全项目影响图',
    '全项目影响图记录用户改动会牵动的资料、章节状态、未来承接和冲突风险；后续对话、改稿和写下一章必须先看这里，避免只改一处导致全书不一致。',
    context.projectImpactMap || '暂无全项目影响图。',
    '## 样章风格校准',
    context.styleSample || buildStyleSampleSeed({ title: book.title }),
    '## 拆书样本指纹',
    context.humanWritingFingerprint || buildHumanWritingFingerprintSeed({ title: book.title }),
    '## 样本池指纹库',
    context.samplePoolFingerprints || '暂无',
    buildGenreFingerprintContract(context),
    '## 本章字数硬约束',
    buildChapterWordRequirement(book),
    buildGenreEngineProfile(context),
    buildChapterFunctionTaxonomy(),
    '## 章节推进硬约束',
    '章节推进状态是硬约束：每次正文必须推进主线节点、阶段阻碍、爽点兑现、信息差或伏笔回收中的至少一项，不能只重复上一章已经成立的信息，不能只写“状态变好/众人震惊/局势变化”但没有后果。',
    '## 类型连续性硬约束',
    '类型状态卡里的连续变量是硬约束：正文、任务卡、自检和章节后状态更新都必须承接当前题材的连续变量，不要套用其他题材框架。',
    genreContinuityContract,
  ].join('\n')
}

function compileChapterWritingContext(context, budget = contextBudget) {
  const compiledContext = {}

  for (const [key, value] of Object.entries(context || {})) {
    const limit = budget[key] ?? 1200
    compiledContext[key] = typeof value === 'string' ? limitText(value, limit) : value
  }

  return {
    ...compiledContext,
    compiledAt: new Date().toISOString(),
    contextBudget: budget,
  }
}

function selectContextForTask(context, taskType, options = {}) {
  if (taskType === 'chapter-writing') {
    return compileChapterWritingContext(context, contextBudget)
  }

  if (taskType === 'project-update') {
    return {
      platformFit: limitText(context.platformFit, 1200),
      genreRules: limitText(context.genreRules, 1400),
      coreSetting: limitText(context.coreSetting, 1800),
      mainCharacter: limitText(context.mainCharacter, 1200),
      supportingCharacters: limitText(context.supportingCharacters, 1000),
      overallOutline: limitText(context.overallOutline, 1800),
      goldenFirstThree: limitText(context.goldenFirstThree, 800),
      volumeOutline: limitText(context.volumeOutline, 1200),
      chapterOutline: limitText(context.chapterOutline, 1000),
      tracking: limitText(context.tracking, 1200),
      storyState: limitText(context.storyState, 1200),
      chapterProgress: limitText(context.chapterProgress, 1200),
      chapterMemory: limitText(context.chapterMemory, 1200),
      structuredState: limitText(context.structuredState, 1200),
      futurePlan: limitText(context.futurePlan, 1200),
      memoryGovernance: limitText(context.memoryGovernance, 1200),
      projectRepairLog: limitText(context.projectRepairLog, 1200),
      editorialReview: limitText(context.editorialReview, 1000),
      bookStrategyReview: limitText(context.bookStrategyReview, 1000),
      projectImpactMap: limitText(context.projectImpactMap, 1000),
      styleSample: limitText(context.styleSample, 800),
      humanWritingFingerprint: limitText(context.humanWritingFingerprint, 900),
      samplePoolFingerprints: limitText(context.samplePoolFingerprints, 900),
    }
  }

  if (taskType === 'material-rewrite') {
    return selectMaterialRewriteContext(context, options.materialId)
  }

  return compileChapterWritingContext(context)
}

function selectMaterialRewriteContext(context, materialId) {
  const baseContext = {
    platformFit: limitText(context.platformFit, 1200),
    genreRules: limitText(context.genreRules, 1200),
    coreSetting: limitText(context.coreSetting, 1800),
    mainCharacter: limitText(context.mainCharacter, 1400),
    supportingCharacters: limitText(context.supportingCharacters, 1200),
    minorCharacters: '',
    overallOutline: limitText(context.overallOutline, 1800),
    goldenFirstThree: '',
    volumeOutline: '',
    chapterOutline: '',
    tracking: limitText(context.tracking, 1200),
    storyState: limitText(context.storyState, 1400),
    chapterProgress: limitText(context.chapterProgress, 1400),
    chapterMemory: limitText(context.chapterMemory, 1600),
    structuredState: limitText(context.structuredState, 1600),
    futurePlan: limitText(context.futurePlan, 1400),
    memoryGovernance: limitText(context.memoryGovernance, 1200),
    projectRepairLog: limitText(context.projectRepairLog, 1200),
    editorialReview: limitText(context.editorialReview, 1000),
    bookStrategyReview: limitText(context.bookStrategyReview, 1000),
    projectImpactMap: limitText(context.projectImpactMap, 1000),
    styleSample: limitText(context.styleSample, 1200),
    humanWritingFingerprint: limitText(context.humanWritingFingerprint, 1200),
    samplePoolFingerprints: limitText(context.samplePoolFingerprints, 1200),
  }

  if (materialId === 'volumeOutline') {
    return {
      ...baseContext,
      goldenFirstThree: limitText(context.goldenFirstThree, 1000),
      volumeOutline: limitText(context.volumeOutline, 2600),
      chapterOutline: limitText(context.chapterOutline, 900),
    }
  }

  if (materialId === 'chapterOutline') {
    return {
      ...baseContext,
      goldenFirstThree: limitText(context.goldenFirstThreeForCurrentChapter, 900),
      volumeOutline: limitText(context.volumeOutline, 1500),
      chapterOutline: limitText(context.chapterOutline, 1600),
    }
  }

  return {
    ...baseContext,
    minorCharacters: limitText(context.minorCharacters, 800),
    goldenFirstThree: limitText(context.goldenFirstThree, 900),
    volumeOutline: limitText(context.volumeOutline, 1100),
    chapterOutline: limitText(context.chapterOutline, 900),
  }
}

function buildChapterDynamicContext({ selectedChapter, context }) {
  return [
    '# 当前章节动态上下文',
    `当前章节：${selectedChapter?.title ?? '未选择'}`,
    '',
    '## 本章细纲',
    context.chapterOutline || '暂无',
    '## 上一章',
    context.previousChapter || '第一章，无上一章。',
    '## 当前章节正文',
    context.currentChapter || '暂无',
  ].join('\n')
}

function pickFingerprintLines(text, patterns, maxLines = 12) {
  const lines = String(text ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return lines
    .filter((line) => patterns.some((pattern) => pattern.test(line)))
    .slice(0, maxLines)
}

function buildGenreFingerprintAssistProfile(context = {}) {
  const fingerprint = String(context.samplePoolFingerprints ?? '').trim()
  const humanFingerprint = String(context.humanWritingFingerprint ?? '').trim()
  const source = [fingerprint, humanFingerprint].filter(Boolean).join('\n')
  const activeGenre = detectGenreRequiredSignals({
    ...context,
    samplePoolFingerprints: '',
    humanWritingFingerprint: '',
  }).genre

  if (!source.trim()) {
    return {
      activeGenre,
      rhythmLines: [],
      genreSignalLines: [],
      antiAiLines: [],
    }
  }

  return {
    activeGenre,
    rhythmLines: pickFingerprintLines(source, [
      /平均章节长度|章节长度中位数|章节长度 P80/u,
      /平均段落长度|句长中位数|句长 P80|对白段落占比/u,
    ], 8),
    genreSignalLines: pickFingerprintLines(source, [
      /信号密度|推进反馈密度|必保留信号|生成建议|章末含/u,
    ], 12),
    antiAiLines: pickFingerprintLines(source, [
      /不要|不能只|必须落成|去 AI 味|像现场|解释|设定说明/u,
    ], 10),
  }
}

function buildGenreFingerprintContract(context = {}) {
  const profile = buildGenreFingerprintAssistProfile(context)

  if (!profile.rhythmLines.length && !profile.genreSignalLines.length && !profile.antiAiLines.length) {
    return [
      '## 题材指纹辅助层',
      '- 当前没有可用题材指纹；按本书题材规则、平台规则和类型状态卡执行。',
      '- 指纹库只提供写法参考，不作为硬门禁，不要求逐条命中。',
    ].join('\n')
  }

  return [
    '## 题材指纹辅助层',
    `- 当前项目题材：${profile.activeGenre}。样本指纹只辅助选择题材变量、章节节奏和人写感，不作为硬门禁，不要求逐条命中。`,
    '- 指纹库是题材导演建议：每章按章节功能挑 1-2 个适合的变量使用，以本书设定、用户反馈、题材规则和平台规则为准。',
    '- 禁止复刻样本原句、段落或指定作者口吻；禁止把其他题材样本信号注入当前正文。',
    '',
    '### 节奏参考',
    profile.rhythmLines.length ? profile.rhythmLines.join('\n') : '- 暂无节奏统计；按平台章节字数和当前章节功能执行。',
    '',
    '### 题材变量参考',
    profile.genreSignalLines.length ? profile.genreSignalLines.join('\n') : '- 暂无题材变量统计；按本书题材规则和本章功能选择可见变量。',
    '',
    '### 去 AI 味参考',
    profile.antiAiLines.length ? profile.antiAiLines.join('\n') : '- 不要写成总结、设定说明、会议纪要或模板化排比；用动作、对话、现场反馈承接变化。',
    '',
    '### 使用方式',
    '- 细纲可以参考指纹选择本章最合适的变量，但不要为了命中样本标签而硬塞桥段。',
    '- 正文优先服务本章推进：现场事件、角色选择、状态变化、资源变化、外界反馈和章末钩子要自然出现。',
    '- 自检只把指纹当优化建议；是否通过门禁由本书题材规则、章节推进、状态同步和正文质量决定。',
  ].join('\n')
}


function stripNegatedGenreLines(source) {
  return String(source || '')
    .split(/[\r\n，,。；;]+/u)
    .map((segment) => segment.trim())
    .filter((segment) => segment && !/禁止|不要|不能|不得|避免|不许|严禁|剔除|修正|纠偏|不是|非/u.test(segment))
    .join('\n')
}

function getExplicitGenreAuthority(source = '') {
  const text = String(source || '')

  if (/当前题材.{0,12}(都市|职场|商战|创业|现实)|题材.{0,12}(改为|调整为|修正为|确定为).{0,12}(都市|职场|商战|创业|现实)|纯都市|都市文|都市创业|都市职场|都市商战/u.test(text)) {
    return '都市'
  }

  if (/当前题材.{0,12}(网游|游戏文|电竞|全息)|题材.{0,12}(改为|调整为|修正为|确定为).{0,12}(网游|游戏文|电竞|全息)|网游文|虚拟网游|全息网游/u.test(text)) {
    return '网游'
  }

  if (/当前题材.{0,12}(玄幻|修仙|仙侠|高武)|题材.{0,12}(改为|调整为|修正为|确定为).{0,12}(玄幻|修仙|仙侠|高武)|玄幻文|修仙文|仙侠文/u.test(text)) {
    return '玄幻'
  }

  if (/当前题材.{0,12}(悬疑|推理|刑侦|规则怪谈|无限流)|题材.{0,12}(改为|调整为|修正为|确定为).{0,12}(悬疑|推理|刑侦|规则怪谈|无限流)|悬疑文|推理文/u.test(text)) {
    return '悬疑'
  }

  if (/当前题材.{0,12}(言情|甜宠|虐恋|纯爱|百合)|题材.{0,12}(改为|调整为|修正为|确定为).{0,12}(言情|甜宠|虐恋|纯爱|百合)|言情文|甜宠文/u.test(text)) {
    return '言情'
  }

  return ''
}

function splitBookScopedGenreSignalItems(value = '') {
  return String(value || '')
    .replace(/^[#>*\-\s\d.、]+/u, '')
    .split(/[、,，/|；;\n]+/u)
    .map((item) => item.trim().replace(/[。.!！?？]+$/u, ''))
    .filter((item) => item.length >= 2 && item.length <= 24)
    .filter((item) => !/当前题材|本书题材|题材信号|信号指纹|每章必须|必须|不要|不能|禁止|避免|剔除|不再|无关|噪声|旧样本|其他题材/u.test(item))
}

function extractBookScopedGenreSignals(context = {}, genre = '') {
  const source = [
    context.projectRepairLog,
    context.genreRules,
  ].filter(Boolean).join('\n')

  const candidates = []
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    if (!/题材信号|信号指纹|每章必须|必须反复|必须保留|必须承接/u.test(line)) {
      continue
    }

    if (/禁止|不要|不能|不得|避免|剔除|不再|无关|噪声|旧样本|其他题材|不要把|禁止把/u.test(line)) {
      continue
    }

    const payload = line.includes('：') || line.includes(':')
      ? line.split(/[:：]/u).slice(1).join('：')
      : line.replace(/.*?(题材信号|信号指纹|每章必须|必须反复|必须保留|必须承接)/u, '')

    candidates.push(...splitBookScopedGenreSignalItems(payload))
  }

  const unique = []
  for (const item of candidates) {
    if (!unique.includes(item)) {
      unique.push(item)
    }
  }

  return unique.slice(0, 4)
}

function buildGenreRequirement(genre, context = {}) {
  const bookScopedSignals = extractBookScopedGenreSignals(context, genre)
  if (bookScopedSignals.length >= 2) {
    return {
      genre,
      signals: bookScopedSignals,
      minimumHits: Math.min(2, bookScopedSignals.length),
    }
  }

  if (genre === '网游') {
    return {
      genre: '网游',
      signals: ['系统/面板反馈', '任务/副本进度', '等级/经验/技能/装备变化', '玩家/NPC/公告反馈'],
      minimumHits: 2,
    }
  }

  if (genre === '都市') {
    return {
      genre: '都市',
      signals: ['身份/事业状态', '资产/资源变化', '关系网络反馈', '现实风险压力'],
      minimumHits: 2,
    }
  }

  if (genre === '玄幻') {
    return {
      genre: '玄幻',
      signals: ['境界/修为变化', '功法/资源消耗', '势力关系反馈', '战力后果'],
      minimumHits: 2,
    }
  }

  if (genre === '悬疑') {
    return {
      genre: '悬疑',
      signals: ['案件线索变化', '规则/危险压力', '嫌疑关系变化', '推理进度'],
      minimumHits: 2,
    }
  }

  if (genre === '言情') {
    return {
      genre: '言情',
      signals: ['情感阶段变化', '关系温度变化', '误会/承诺推进', '现实阻碍反馈'],
      minimumHits: 2,
    }
  }

  return {
    genre: '通用长篇',
    signals: ['目标推进', '阻碍升级', '资源变化', '关系或信息差变化', '章末承接'],
    minimumHits: 2,
  }
}

function detectGenreRequiredSignals(context = {}) {
  const declaredSource = stripNegatedGenreLines([
    context.projectRepairLog,
    context.genreRules,
    context.coreSetting,
    context.overallOutline,
    context.platformFit,
  ].filter(Boolean).join('\n'))
  const stateSource = stripNegatedGenreLines([
    context.storyState,
    context.structuredState,
    context.chapterProgress,
    context.futurePlan,
  ].filter(Boolean).join('\n'))
  const source = declaredSource || stateSource

  const declaredAuthority = getExplicitGenreAuthority(declaredSource)
  if (declaredAuthority) {
    return buildGenreRequirement(declaredAuthority, context)
  }

  const hasWebGame = /网游|游戏文|电竞|全息|虚拟现实|虚拟网游|服务器|玩家|副本|公会|世界频道|NPC|野怪|游戏面板|游戏系统/u.test(source)
  const hasUrban = /都市|职场|商业|创业|商战|神医|鉴宝|娱乐圈|豪门|赘婿|校园|现实向|都市异能|都市系统/u.test(source)
  const hasFantasy = /玄幻|修仙|仙侠|高武|异界|灵气|宗门|境界|修为|功法/u.test(source)
  const hasSuspense = /悬疑|推理|刑侦|探案|规则怪谈|无限流|诡异|案件|凶手|线索/u.test(source)
  const hasRomance = /言情|甜宠|虐恋|婚恋|纯爱|百合|古言|现言|情感|恋爱|拉扯/u.test(source)

  const stateAuthority = getExplicitGenreAuthority(stateSource)
  if (stateAuthority) {
    return buildGenreRequirement(stateAuthority, context)
  }

  if (hasWebGame) {
    return buildGenreRequirement('网游', context)
  }

  if (hasUrban) {
    return buildGenreRequirement('都市', context)
  }

  if (hasFantasy) {
    return buildGenreRequirement('玄幻', context)
  }

  if (hasSuspense) {
    return buildGenreRequirement('悬疑', context)
  }

  if (hasRomance) {
    return buildGenreRequirement('言情', context)
  }

  return buildGenreRequirement('通用长篇', context)
}


function buildGenreContinuityContract({ genreRequirement } = {}) {
  const genre = genreRequirement?.genre || '通用长篇'

  if (genre === '网游') {
    return [
      '## 题材连续合同',
      '- 当前题材是网游时，才允许把等级、经验、任务面板、副本、装备掉落、玩家/NPC/公告当作硬承接变量。',
      '- 本章必须让游戏状态产生后果：升级、解锁、消耗、任务进度、玩家反馈、排行榜/公会/交易变化至少出现两类。',
      '- 游戏反馈必须写成现场事件和角色选择，不能只写设定说明或面板列表。',
    ].join('\n')
  }

  if (genre === '都市') {
    return [
      '## 题材连续合同',
      '- 当前题材是都市，禁止混入网游框架：不要写等级、经验、任务面板、副本、装备掉落、玩家公告。',
      '- 本章必须承接现实世界变量：身份/事业状态、资产/资源变化、关系网络反馈、现实风险压力至少出现两类。',
      '- 都市爽点要落在合同、职位、客户、舆论、现金流、人脉、家庭/职场压力或公开认知变化上。',
    ].join('\n')
  }

  if (genre === '玄幻') {
    return [
      '## 题材连续合同',
      '- 当前题材是玄幻，必须承接境界/修为、功法、资源、势力关系和战力后果。',
      '- 不要把玄幻收益写成网游面板；修为变化必须有消耗、代价、限制或外界反馈。',
    ].join('\n')
  }

  if (genre === '悬疑') {
    return [
      '## 题材连续合同',
      '- 当前题材是悬疑，必须承接案件线索、嫌疑关系、规则危险、推理进度和压力倒计时。',
      '- 每章至少让一个线索改变判断，或让一个危险规则产生现场后果。',
    ].join('\n')
  }

  if (genre === '言情') {
    return [
      '## 题材连续合同',
      '- 当前题材是言情，必须承接情感阶段、关系温度、误会/承诺、现实阻碍和双方行为边界。',
      '- 情感推进要通过行动、选择、对话和关系后果体现，不要只写心理总结。',
    ].join('\n')
  }

  return [
    '## 题材连续合同',
    '- 当前题材按项目资料和类型状态卡执行，只承接本书已经确认的连续变量。',
    '- 本章必须让目标、阻碍、资源、关系、信息差或伏笔至少两类发生可追踪变化。',
  ].join('\n')
}

function buildWritingCompanion90Contract({ mode, context = {}, instruction = '' } = {}) {
  const genreRequirement = detectGenreRequiredSignals(context)

  return [
    '## 90% 写作搭档合同',
    `- 当前模式：${mode || 'unknown'}`,
    '- 持续对话式写作：先判断用户想法会影响哪些资料，再沉淀为可执行补丁；不能把聊天过程、AI 追问、未确认选项直接写入项目资料。',
    '- 自动章节编排：写下一章必须自动完成章节战略、任务卡、正文、自检、修订、最终同步、主编终审、读者试读模拟；用户不应该逐步手点内部环节。',
    '- 质量稳定性：正文必须守住题材信号、主线推进、主角主动、收益反馈、章末承接、状态连续、人写感；任一项明显缺失必须标记 needs-review 或自动补救。',
    `- 题材最低信号：${genreRequirement.genre}；至少命中 ${genreRequirement.minimumHits} 类：${genreRequirement.signals.join('、')}`,
    '- 长期记忆：影响全书/卷/角色/题材/状态的内容必须同步到 storyState、chapterProgress、chapterMemory、structuredState、futurePlan、memoryGovernance 或对应项目资料。',
    '- 用户体验：前台只给用户人话判断、候选内容和是否建议应用；底层合同、状态机、门禁字段不要变成用户负担。',
    instruction ? `- 用户当前补充要求：${instruction}` : '',
  ].filter(Boolean).join('\n')
}

function buildChapterExecutionContract({ book, selectedChapter, context, instruction }) {
  const genreRequirement = detectGenreRequiredSignals(context)
  const genreContinuityContract = buildGenreContinuityContract({ genreRequirement })
  const fingerprintContract = buildGenreFingerprintContract(context)
  const companionContract = buildWritingCompanion90Contract({ mode: 'chapter-writing', context, instruction })
  const stableState = [
    context.storyState,
    context.chapterProgress,
    context.structuredState,
    context.futurePlan,
    context.chapterMemory,
  ].filter(Boolean).join('\n')
  const mustCarry = stableState
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]|["']?(nextRequiredMove|currentObstacle|lastProgress|goal|ability|resources|constraints|openLoops|recentChapterFunctions)["']?/u.test(line))
    .slice(0, 10)

  return [
    '## 本章执行合同',
    `- 书名：${book.title}`,
    `- 章节：${selectedChapter?.title ?? '未选择章节'}`,
    `- 题材合同：${genreRequirement.genre}`,
    instruction ? `- 用户补充要求：${instruction}` : '',
    '',
    '## 本章必须推进',
    '- 正文必须让主线、阻碍、爽点、信息差、伏笔、关系或类型状态至少一项发生可追踪变化。',
    '- 禁止只重复上一章已经成立的结果；本章必须写出新的后果、消耗、解锁、新阻碍、外界反馈或关系变化。',
    '- 章末必须留下下一章可承接的具体状态，而不是空泛悬念。',
    '',
    '## 题材信号底线',
    `- 题材：${genreRequirement.genre}`,
    `- 至少命中 ${genreRequirement.minimumHits} 类信号：${genreRequirement.signals.join('、')}`,
    '',
    genreContinuityContract,
    '',
    companionContract,
    '',
    fingerprintContract,
    '',
    '## 状态同步底线',
    '- 最终同步必须写明章节后状态更新、章节推进更新、章节记忆更新、结构化状态更新、未来章节规划更新。',
    '- 如果关键变量没有变化，也要写“未变化但下一章必须承接”的原因。',
    mustCarry.length ? ['- 已识别必须承接：', ...mustCarry.map((item) => `  ${item}`)].join('\n') : '- 暂无可提取的结构化承接项，但仍必须从本章细纲和上一章中提取承接点。',
  ].filter(Boolean).join('\n')
}

function normalizeSignalTerms(signal = '') {
  return String(signal || '')
    .replace(/[()（）【】\[\]#>*\-]/gu, ' ')
    .split(/[\/、,，|；;：:\s]+/u)
    .map((term) => term.trim().replace(/(变化|反馈|压力|状态|进度|条件|选择|信号|指纹)$/u, ''))
    .filter((term) => term.length >= 2)
}

function matchesBookScopedSignal(source, signal) {
  const rawSignal = String(signal || '').trim()
  if (!rawSignal) {
    return false
  }
  if (source.includes(rawSignal)) {
    return true
  }
  return normalizeSignalTerms(rawSignal).some((term) => source.includes(term))
}

function evaluateChapterExecutionGate({ executionContract, context, content, statePatch, progressPatch, memoryPatch, structuredPatch, futurePlanPatch }) {
  const source = [content, statePatch, progressPatch, memoryPatch, structuredPatch, futurePlanPatch].filter(Boolean).join('\n')
  const warnings = []
  const genreRequirement = detectGenreRequiredSignals(context)
  const signalHits = genreRequirement.signals.filter((signal) => {
    if (matchesBookScopedSignal(source, signal)) {
      return true
    }
    if (genreRequirement.genre === '网游') {
      if (signal.includes('系统') || signal.includes('面板')) return /系统|面板|提示|属性|弹窗/u.test(source)
      if (signal.includes('任务') || signal.includes('副本')) return /任务|副本|主线|支线|隐藏任务|进度/u.test(source)
      if (signal.includes('经验') || signal.includes('等级') || signal.includes('技能') || signal.includes('装备')) return /经验|等级|升级|技能|装备|掉落|奖励|背包/u.test(source)
      if (signal.includes('玩家') || signal.includes('NPC') || signal.includes('公告')) return /玩家|NPC|公告|世界|排行榜|公会|队伍/u.test(source)
    }
    if (genreRequirement.genre === '都市') {
      if (signal.includes('身份') || signal.includes('事业')) return /身份|职位|事业|公司|职场|创业|项目|岗位|名声|公开认知|客户|工作|老板|同事|上班|下班|办公室|工位|门店|医院|学校|派出所|物业/u.test(source)
      if (signal.includes('资产') || signal.includes('资源')) return /资产|资源|现金|资金|合同|订单|渠道|股份|房|车|人脉|客户|银行卡|工资|房租|账单|缴费|存款|贷款|押金|债务|手机|账号/u.test(source)
      if (signal.includes('关系网络')) return /关系|人脉|合作方|对手|贵人|家人|同事|老板|客户|圈层|邻居|物业|医生|警察|房东|母亲|父亲|朋友|业主群|群聊/u.test(source)
      if (signal.includes('风险') || signal.includes('压力')) return /风险|压力|舆论|法律|债务|竞争|威胁|危机|投诉|追责|成本|催债|报警|扣款|拖欠|纠纷|赔偿|辞退|失业|病历|缴费单|房租/u.test(source)
    }
    if (genreRequirement.genre === '玄幻') {
      if (signal.includes('境界') || signal.includes('修为')) return /境界|修为|灵气|突破|瓶颈|功法|丹药|灵石|宗门|战力/u.test(source)
      if (signal.includes('功法') || signal.includes('资源')) return /功法|资源|丹药|灵石|法宝|秘境|消耗|代价/u.test(source)
      if (signal.includes('势力') || signal.includes('战力')) return /势力|宗门|家族|长老|敌人|战力|压制|反击/u.test(source)
    }
    if (genreRequirement.genre === '悬疑') {
      if (signal.includes('线索') || signal.includes('案件')) return /线索|案件|证据|嫌疑|凶手|现场|口供|痕迹/u.test(source)
      if (signal.includes('规则') || signal.includes('危险')) return /规则|危险|倒计时|死亡|禁忌|异常|诡异|威胁/u.test(source)
      if (signal.includes('推理') || signal.includes('嫌疑')) return /推理|判断|嫌疑|排除|发现|真相|反转/u.test(source)
    }
    if (genreRequirement.genre === '言情') {
      if (signal.includes('情感') || signal.includes('关系')) return /情感|关系|暧昧|心动|误会|承诺|拉扯|信任|边界/u.test(source)
      if (signal.includes('阻碍') || signal.includes('温度')) return /阻碍|家庭|事业|现实|压力|冷淡|靠近|疏离|选择/u.test(source)
    }
    return source.includes(signal.replace(/[\/、].*$/u, ''))
  })

  if (signalHits.length < genreRequirement.minimumHits) {
    warnings.push(`题材信号不足：${genreRequirement.genre} 至少需要 ${genreRequirement.minimumHits} 类，本次命中 ${signalHits.length} 类`)
  }

  if (!/章节后状态更新|连续变量|目标|阻碍|身份|事业|资产|资源|压力|关系|线索|境界|任务|技能|装备|未变化但必须承接/u.test(statePatch || '')) {
    warnings.push('状态同步不足：章节后状态更新没有写出可承接变量')
  }

  if (!/本章实际推进|下一章必须承接|主线|阻碍|爽点|信息差|伏笔|变化/u.test(progressPatch || '')) {
    warnings.push('推进同步不足：章节推进更新没有说明本章实际推进和下一章承接')
  }

  if (!/currentChapter|nextRequiredMove|openLoops|recentChapterFunctions|protagonist|plot/u.test(structuredPatch || '')) {
    warnings.push('结构化状态不足：缺少可机读的 currentChapter/nextRequiredMove/openLoops 等字段')
  }

  if (!/下一章|未来|必须承接|必须避免|主功能/u.test(futurePlanPatch || '')) {
    warnings.push('未来计划不足：没有明确下一章必须承接或避免的内容')
  }

  const structuredStateGateWarnings = evaluateStructuredStateGate({ context, structuredPatch, progressPatch, futurePlanPatch })
  warnings.push(...structuredStateGateWarnings)

  if (hasConfirmedStallingRisk(source)) {
    warnings.push('执行合同失败：内容或同步报告承认存在原地踏步/重复上一章风险')
  }

  const hardGateChecks = [
    ['题材信号', signalHits.length >= genreRequirement.minimumHits],
    ['主线推进', /主线|目标|冲突|阻碍|线索|阶段|进度|推进|选择|决定/u.test(source)],
    ['收益反馈', /收获|收益|回报|身份|事业|资产|资源|关系|线索|境界|经验|奖励|技能|装备|爽点/u.test(source)],
    ['章末承接', /下一章|接下来|必须承接|钩子|伏笔|危机|新对手|新线索|新压力|新目标/u.test(source)],
    ['状态同步', [statePatch, progressPatch, memoryPatch, structuredPatch, futurePlanPatch].some((part) => typeof part === 'string' && part.trim())],
  ]
  const failedHardGates = hardGateChecks.filter(([, ok]) => !ok).map(([label]) => label)
  if (failedHardGates.length) {
    warnings.push(`90% 写作搭档合同未通过：${failedHardGates.join('、')}不足`)
  }

  return {
    passed: warnings.length === 0,
    warnings,
    executionContract,
    signalHits,
  }
}

const structuredStateRequiredKeys = ['currentChapter', 'protagonist', 'plot', 'genreSignals', 'openLoops', 'recentChapterFunctions']

function evaluateStructuredStateGate({ context, structuredPatch, progressPatch, futurePlanPatch }) {
  const source = [structuredPatch, progressPatch, futurePlanPatch].filter(Boolean).join('\n')
  const structuredStateGateWarnings = []

  for (const key of structuredStateRequiredKeys) {
    if (!source.includes(key)) {
      structuredStateGateWarnings.push(`结构化状态缺少字段：${key}`)
    }
  }

  if (!/nextRequiredMove|下一章必须承接|下一章主功能|下一章必须避免/u.test(source)) {
    structuredStateGateWarnings.push('结构化状态缺少下一章明确动作：nextRequiredMove / 下一章必须承接')
  }

  if (isWebGameContext(context) && !/level|exp|experience|quest|skill|equipment|等级|经验|任务|技能|装备/u.test(source)) {
    structuredStateGateWarnings.push('网游结构化状态缺少等级/经验/任务/技能/装备等连续变量')
  }

  return structuredStateGateWarnings
}

function evaluateChapterProgressGate({ context, content, statePatch, progressPatch, memoryPatch, structuredPatch, futurePlanPatch }) {
  const source = [content, statePatch, progressPatch, memoryPatch, structuredPatch, futurePlanPatch].filter(Boolean).join('\n')
  const warnings = []
  const progressAxisHits = [
    /主线|阶段目标|目标|决定|选择|推进/u,
    /阻碍|压力|危险|代价|消耗|新敌|限制/u,
    /爽点|兑现|反转|打脸|奖励|收益|升级|解锁/u,
    /信息差|发现|暴露|揭开|线索|真相|误会/u,
    /伏笔|回收|埋下|钩子|下一章/u,
    /关系|信任|敌意|联盟|承诺|背叛/u,
  ].filter((pattern) => pattern.test(source)).length

  if (progressAxisHits < 2) {
    warnings.push('章节推进不足：主线、阻碍、爽点、信息差、伏笔、关系至少需要两类发生可追踪变化')
  }

  if (!/下一章必须承接|nextRequiredMove|下一章主功能|下一章必须推进/u.test(source)) {
    warnings.push('下一章承接不足：没有形成 nextRequiredMove 或“下一章必须承接”的具体动作')
  }

  if (!/openLoops|未解决|待解决|悬念|钩子|风险|问题/u.test(source)) {
    warnings.push('开放问题不足：缺少 openLoops、未解决问题或可承接钩子')
  }

  if (isWebGameContext(context)) {
    const hasGameState = /等级|经验|任务|技能|装备|背包|奖励|掉落|面板|公告|玩家|NPC|副本/u.test(source)
    const hasGameConsequence = /升级|解锁|消耗|冷却|失败|成功|奖励|掉落|声望|排行|公告|新任务|任务进度|熟练度|耐久/u.test(source)

    if (!hasGameState) {
      warnings.push('网游状态不足：缺少等级/经验/任务/技能/装备/背包等连续变量')
    }

    if (!hasGameConsequence) {
      warnings.push('网游后果不足：游戏状态出现了但没有写出升级、解锁、消耗、奖励、任务进度或玩家反馈')
    }
  }

  return {
    passed: warnings.length === 0,
    warnings,
  }
}

function buildNextChapterReadiness({ selectedChapter, progressPatch, memoryPatch, futurePlanPatch, structuredPatch, stateGateWarnings, qualityGateWarnings }) {
  return [
    `# 下一章准备卡`,
    '',
    `- 当前章：${selectedChapter?.title ?? '未选择'}`,
    `- 门禁状态：${stateGateWarnings?.length || qualityGateWarnings?.length ? '建议先修复后再写下一章' : '可以进入下一章'}`,
    '',
    '## 下一章必须承接',
    parseNextRequirement([progressPatch, memoryPatch, futurePlanPatch, structuredPatch].join('\n')),
    '',
    '## 下一章必须避免',
    parseAvoidRequirement([futurePlanPatch, memoryPatch, progressPatch].join('\n')),
    '',
    '## 未解决门禁',
    [...(stateGateWarnings || []), ...(qualityGateWarnings || [])].map((warning) => `- ${warning}`).join('\n') || '- 暂无',
  ].join('\n')
}

function buildCompanion90FlowSummary({ draft }) {
  const warnings = [
    ...(Array.isArray(draft?.stateGateWarnings) ? draft.stateGateWarnings : []),
    ...(Array.isArray(draft?.qualityGateWarnings) ? draft.qualityGateWarnings : []),
  ].filter(Boolean)

  return {
    level: warnings.length || draft?.directorStatus === 'needs-review' ? 'review' : 'pass',
    chatReady: true,
    autoChapterFlowReady: Boolean(draft?.taskCard && draft?.directorDetail && draft?.nextChapterReadiness),
    qualityGateReady: warnings.length === 0 && draft?.directorStatus !== 'needs-review',
    summary: warnings.length
      ? `90% 写作搭档合同仍需复核：${warnings.slice(0, 3).join('；')}`
      : '90% 写作搭档合同通过：自动编排、质量门禁和下一章承接已形成闭环。',
    warnings,
  }
}

function parseNextRequirement(source) {
  const match = String(source || '').match(/下一章(?:必须承接|主功能|必须推进)[：:\s]*([\s\S]*?)(?=\n[-#]|$)/u)
  return match?.[1]?.trim() || '根据章节推进更新、未来章节规划和结构化状态继续承接。'
}

function parseAvoidRequirement(source) {
  const match = String(source || '').match(/下一章必须避免[：:\s]*([\s\S]*?)(?=\n[-#]|$)/u)
  return match?.[1]?.trim() || '避免重复上一章成果、跳过状态后果或跑偏题材信号。'
}

function parseSyncSection(textOutput, sectionName) {
  const escaped = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`##\\s*${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, 'u')
  const match = textOutput.match(pattern)
  return match?.[1]?.trim() || '\u6682\u65e0'
}

function parseOptionalSyncSection(textOutput, sectionName) {
  const value = parseSyncSection(textOutput, sectionName)
  return value === '\u6682\u65e0' ? '' : value
}

function uniqueWarnings(warnings = []) {
  const seen = new Set()
  return warnings
    .filter((warning) => typeof warning === 'string' && warning.trim())
    .map((warning) => warning.trim())
    .filter((warning) => {
      if (seen.has(warning)) {
        return false
      }
      seen.add(warning)
      return true
    })
}

function dedupeDraftGateWarnings({ stateWarnings = [], qualityWarnings = [] } = {}) {
  const stateGateWarnings = uniqueWarnings(stateWarnings)
  const stateSet = new Set(stateGateWarnings)
  const qualityGateWarnings = uniqueWarnings(qualityWarnings).filter((warning) => !stateSet.has(warning))

  return {
    stateGateWarnings,
    qualityGateWarnings,
  }
}

function sanitizeChapterDraftContent(rawContent) {
  let content = String(rawContent ?? '').trim()

  if (!content) {
    return ''
  }

  content = content
    .replace(/^```(?:markdown|md|text)?\s*/iu, '')
    .replace(/\s*```$/u, '')
    .trim()

  const finalDraftMatch = content.match(/(?:^|\n)#{1,3}\s*(?:最终正文候选|最终正文|正文候选|本章重写稿|续写正文|修订后正文)\s*\n([\s\S]*)$/u)
  if (finalDraftMatch?.[1]?.trim()) {
    content = finalDraftMatch[1].trim()
  }

  const firstChapterTitle = content.match(/(?:^|\n)#\s*第[^\n]+/u)
  if (firstChapterTitle?.index && firstChapterTitle.index > 0) {
    content = content.slice(firstChapterTitle.index).trim()
  }

  const bannedHeadingPattern = /(?:^|\n)#{1,3}\s*(?:本章任务卡|任务卡|自检报告|反馈理解|影响范围|长期记忆更新|章节后状态更新|章节推进更新|章节记忆更新|结构化状态更新|未来章节规划更新|风格校准更新|记忆治理更新|质量门禁|导演明细|写作依据|执行合同|状态门禁|问题|修订建议)\b/u
  const bannedMatch = content.match(bannedHeadingPattern)
  if (bannedMatch?.index !== undefined && bannedMatch.index >= 0) {
    content = content.slice(0, bannedMatch.index).trim()
  }

  return content.trim()
}

function assertCleanChapterDraftContent(content, sourceLabel = '\u6b63\u6587\u5019\u9009') {
  const cleanContent = sanitizeChapterDraftContent(content)
  if (!cleanContent) {
    throw new Error(`${sourceLabel}\u672a\u8fd4\u56de\u53ef\u7528\u6b63\u6587`)
  }

  const contaminationPattern = /(?:^|\n)#{1,3}\s*(?:本章任务卡|任务卡|自检报告|反馈理解|影响范围|长期记忆更新|章节后状态更新|章节推进更新|章节记忆更新|结构化状态更新|未来章节规划更新|风格校准更新|记忆治理更新|质量门禁|导演明细|写作依据|执行合同|状态门禁|问题|修订建议)\b/u
  if (contaminationPattern.test(cleanContent)) {
    throw new Error(`${sourceLabel}\u6df7\u5165\u4e86\u975e\u6b63\u6587\u5185\u5bb9\uff0c\u5df2\u62e6\u622a\uff0c\u8bf7\u91cd\u65b0\u751f\u6210`)
  }

  return cleanContent
}

function buildCheckSyncPrompt({ book, selectedChapter, context }) {
  return [
    '\u4f60\u662f\u7f51\u6587\u957f\u7bc7\u5199\u4f5c\u7684\u8bbe\u5b9a\u4e0e\u8fde\u8f7d\u7f16\u8f91\u3002',
    '\u4efb\u52a1\uff1a\u6839\u636e\u9879\u76ee\u5df2\u6709\u8bbe\u5b9a\u3001\u89d2\u8272\u5361\u3001\u5927\u7eb2\u3001\u5377\u7eb2\u3001\u672c\u7ae0\u7ec6\u7eb2\u3001\u4e0a\u4e00\u7ae0\u548c\u5f53\u524d\u7ae0\u8282\uff0c\u505a\u201c\u68c0\u67e5\u5e76\u540c\u6b65\u201d\u3002',
    '\u539f\u5219\uff1a',
    '1. \u4e0d\u91cd\u5199\u6b63\u6587\uff0c\u53ea\u505a\u68c0\u67e5\u3001\u4fee\u8ba2\u5efa\u8bae\u548c\u8bb0\u5fc6\u540c\u6b65\u3002',
    '2. \u53ea\u63d0\u53d6\u5f53\u524d\u7ae0\u8282\u4e2d\u5df2\u7ecf\u6210\u7acb\u6216\u660e\u663e\u5e94\u8be5\u8ffd\u8e2a\u7684\u65b0\u4fe1\u606f\uff0c\u4e0d\u81ea\u884c\u675c\u64b0\u8bbe\u5b9a\u3002',
    '3. \u91cd\u70b9\u68c0\u67e5\u8bb0\u5fc6\u4e22\u5931\u3001\u8bbe\u5b9a\u51b2\u7a81\u3001\u4eba\u8bbe\u504f\u79bb\u3001\u89d2\u8272\u58f0\u7ebf\u4e0d\u7a33\u3001\u4f0f\u7b14\u6f0f\u8bb0\u3002',
    '4. \u8f93\u51fa\u5fc5\u987b\u4e25\u683c\u4f7f\u7528\u4e0b\u9762 7 \u4e2a Markdown \u4e8c\u7ea7\u6807\u9898\uff0c\u4e0d\u8981\u589e\u52a0\u989d\u5916\u4e8c\u7ea7\u6807\u9898\u3002',
    '',
    `\u4e66\u540d\uff1a${book.title}`,
    `\u5e73\u53f0\uff1a${book.platform}`,
    `\u5f53\u524d\u7ae0\u8282\uff1a${selectedChapter?.title ?? '\u672a\u9009\u62e9'}`,
    '',
    '# \u5199\u4f5c\u4f9d\u636e',
    '## \u5e73\u53f0\u89c4\u5219',
    context.platformFit,
    '## \u9898\u6750\u89c4\u5219',
    context.genreRules,
    '## \u6838\u5fc3\u8bbe\u5b9a',
    context.coreSetting,
    '## \u4e3b\u89d2\u5361',
    context.mainCharacter,
    '## \u914d\u89d2\u5361',
    context.supportingCharacters,
    '## \u9f99\u5957\u8bb0\u5f55',
    context.minorCharacters,
    '## \u603b\u7eb2',
    context.overallOutline,
    '## \u9ec4\u91d1\u4e09\u7ae0\u89c4\u5212',
    context.goldenFirstThreeForCurrentChapter || '\u975e\u524d\u4e09\u7ae0\u6216\u6682\u65e0\u4e13\u95e8\u89c4\u5212\u3002',
    '## \u5377\u7eb2',
    context.volumeOutline,
    '## \u672c\u7ae0\u7ec6\u7eb2',
    context.chapterOutline,
    '## \u8ffd\u8e2a\u8868',
    context.tracking,
    '## \u4e0a\u4e00\u7ae0',
    context.previousChapter || '\u7b2c\u4e00\u7ae0\uff0c\u65e0\u4e0a\u4e00\u7ae0\u3002',
    '## \u5f53\u524d\u7ae0\u8282\u6b63\u6587',
    context.currentChapter,
    '',
    '# \u8f93\u51fa\u683c\u5f0f',
    '## \u672c\u7ae0\u68c0\u67e5',
    '- ',
    '## \u4fee\u8ba2\u5efa\u8bae',
    '- ',
    '## \u65b0\u589e\u8bbe\u5b9a',
    '- ',
    '## \u4e3b\u89d2\u53d8\u5316',
    '- ',
    '## \u914d\u89d2\u53d8\u5316',
    '- ',
    '## \u9f99\u5957\u8bb0\u5f55',
    '- ',
    '## \u4f0f\u7b14/\u672a\u89e3\u51b3\u95ee\u9898',
    '- ',
  ].join('\n')
}

function buildAiEditPrompt({ mode, instruction, book, selectedChapter, context }) {
  const taskLabel = {
    continue: '\u7eed\u5199\u5f53\u524d\u7ae0\u8282',
    check: '\u68c0\u67e5\u672c\u7ae0\u95ee\u9898',
    revise: '\u4fee\u8ba2\u672c\u7ae0',
  }[mode]

  const outputRule = {
    continue: '\u53ea\u8f93\u51fa\u53ef\u63a5\u5728\u5f53\u524d\u7ae0\u8282\u672b\u5c3e\u7684\u6b63\u6587\u5019\u9009\uff0c\u4e0d\u8981\u8986\u76d6\u539f\u6587\u3002',
    check: '\u53ea\u8f93\u51fa\u95ee\u9898\u5217\u8868\u548c\u4fee\u8ba2\u5efa\u8bae\uff0c\u4e0d\u8981\u91cd\u5199\u6b63\u6587\u3002',
    revise: '\u8f93\u51fa\u4fee\u8ba2\u540e\u7684\u672c\u7ae0\u5019\u9009\u5168\u6587\uff0c\u4fdd\u7559\u7ae0\u8282\u6807\u9898\u3002',
  }[mode]

  return [
    '\u4f60\u662f\u957f\u7bc7\u7f51\u6587\u8fde\u8f7d\u7f16\u8f91\u3002',
    `\u4efb\u52a1\uff1a${taskLabel}\u3002`,
    `\u8f93\u51fa\u89c4\u5219\uff1a${outputRule}`,
    '\u5fc5\u987b\u9075\u5b88\u5e73\u53f0\u89c4\u5219\u3001\u89d2\u8272\u58f0\u7ebf\u3001\u603b\u7eb2/\u5377\u7eb2/\u672c\u7ae0\u7ec6\u7eb2\u548c\u8ffd\u8e2a\u8868\uff0c\u4e0d\u8981\u81ea\u884c\u6539\u53d8\u5df2\u5b9a\u8bbe\u5b9a\u3002',
    '\u9898\u6750\u89c4\u5219\u662f\u786c\u7ea6\u675f\uff1a\u4e0d\u80fd\u8dd1\u9898\u6750\u3002\u5199\u6b63\u6587\u65f6\u5fc5\u987b\u843d\u5730\u672c\u7ae0\u7ec6\u7eb2\u91cc\u7684\u201c\u672c\u7ae0\u9898\u6750\u5473\u9053\u201d\uff0c\u5982\u9898\u6750\u89c4\u5219\u8981\u6c42\u73a9\u5bb6\u611f\u3001\u4efb\u52a1\u3001\u6280\u80fd\u3001\u88c5\u5907\u3001NPC\u3001\u4e16\u754c\u516c\u544a\u7b49\u4fe1\u53f7\uff0c\u6b63\u6587\u91cc\u5fc5\u987b\u53ef\u89c1\u3002',
    instruction ? `\u7528\u6237\u8865\u5145\u8981\u6c42\uff1a${instruction}` : '',
    '',
    `\u4e66\u540d\uff1a${book.title}`,
    `\u5e73\u53f0\uff1a${book.platform}`,
    `\u5f53\u524d\u7ae0\u8282\uff1a${selectedChapter?.title ?? '\u672a\u9009\u62e9'}`,
    '',
    '# \u5199\u4f5c\u4f9d\u636e',
    '## \u5e73\u53f0\u89c4\u5219',
    context.platformFit,
    '## \u9898\u6750\u89c4\u5219',
    context.genreRules,
    '## \u6838\u5fc3\u8bbe\u5b9a',
    context.coreSetting,
    '## \u4e3b\u89d2\u5361',
    context.mainCharacter,
    '## \u914d\u89d2\u5361',
    context.supportingCharacters,
    '## \u9f99\u5957\u8bb0\u5f55',
    context.minorCharacters,
    '## \u603b\u7eb2',
    context.overallOutline,
    '## \u9ec4\u91d1\u4e09\u7ae0\u89c4\u5212',
    context.goldenFirstThreeForCurrentChapter || '\u975e\u524d\u4e09\u7ae0\u6216\u6682\u65e0\u4e13\u95e8\u89c4\u5212\u3002',
    '## \u5377\u7eb2',
    context.volumeOutline,
    '## \u672c\u7ae0\u7ec6\u7eb2',
    context.chapterOutline,
    '## \u8ffd\u8e2a\u8868',
    context.tracking,
    '## \u4e0a\u4e00\u7ae0',
    context.previousChapter || '\u7b2c\u4e00\u7ae0\uff0c\u65e0\u4e0a\u4e00\u7ae0\u3002',
    '## \u5f53\u524d\u7ae0\u8282',
    context.currentChapter,
  ]
    .filter(Boolean)
    .join('\n')
}

function buildChapterStrategyPrompt({ instruction, book, selectedChapter, context, executionContract }) {
  const compiledContext = compileChapterWritingContext(context)
  const genreRequirement = detectGenreRequiredSignals(compiledContext)
  const genreContinuityContract = buildGenreContinuityContract({ genreRequirement })
  return [
    buildChapterStableContext({ book, context: compiledContext }),
    '',
    '# 当前任务',
    '你是长篇网文主编。任务：在写本章任务卡和正文之前，先做章节战略规划。',
    '只输出 Markdown，不要写正文。',
    '章节战略必须回答：这一章为什么存在、不能重复什么、读者本章获得什么、题材信号如何落地、下一章要承接什么。',
    '',
    executionContract,
    '',
    '# 全书/卷节奏复盘',
    context.bookStrategyReview || '暂无全书/卷节奏复盘。',
    '',
    '# 必须输出',
    '## 本章功能定位',
    '- 主功能：',
    '- 副功能：',
    '- 为什么这一章必须承担这个功能：',
    '',
    '## 必须推进',
    '- 主线推进：',
    '- 阻碍变化：',
    '- 爽点/情绪收益：',
    '- 信息差/伏笔：',
    '- 状态变量变化：',
    '',
    '## 禁止重复',
    '- 上一章已经完成、不能再原地重复的内容：',
    '- 本章不能偷懒成解释/总结/设定报告的地方：',
    '',
    '## 题材信号',
    '- 本章必须可见的题材元素：',
    `- 当前题材：${genreRequirement.genre}；必须从本章执行合同中选择当前题材信号，不要套用其他题材模板。`,
    genreContinuityContract,
    '- 信号必须如何变成现场事件：',
    '',
    '## 读者本章获得',
    '- 读者看到本章后获得的爽感/期待/信息：',
    '- 章末必须留下的钩子：',
    '',
    '## 下一章承接',
    '- 下一章必须接住：',
    '- 下一章必须避免：',
    instruction ? `\n# 用户补充要求\n${instruction}` : '',
    '',
    buildChapterDynamicContext({ selectedChapter, context: compiledContext }),
  ].filter(Boolean).join('\n')
}

function buildChapterTaskCardPrompt({ instruction, book, selectedChapter, context, executionContract, chapterStrategy }) {
  const compiledContext = compileChapterWritingContext(context)
  const genreRequirement = detectGenreRequiredSignals(compiledContext)
  const genreContinuityContract = buildGenreContinuityContract({ genreRequirement })
  return [
    buildChapterStableContext({ book, context: compiledContext }),
    '',
    '# 当前任务',
    '\u4f60\u662f\u957f\u7bc7\u7f51\u6587\u8fde\u8f7d\u7b56\u5212\u7f16\u8f91\u3002',
    '\u4efb\u52a1\uff1a\u5728\u5199\u6b63\u6587\u524d\uff0c\u5148\u6574\u7406\u4e00\u5f20\u201c\u672c\u7ae0\u4efb\u52a1\u5361\u201d\u3002',
    '\u672c\u7ae0\u4efb\u52a1\u5361\u662f\u6b63\u6587\u751f\u6210\u7684\u6700\u9ad8\u6267\u884c\u4f9d\u636e\uff1b\u5fc5\u987b\u5177\u4f53\u3001\u53ef\u6267\u884c\uff0c\u4e0d\u8981\u5199\u7a7a\u6cdb\u53e3\u53f7\u3002',
    '必须先满足下面的“本章执行合同”。任务卡只能细化合同，不能降低合同要求。',
    '\u53ea\u8f93\u51fa Markdown\uff0c\u4e0d\u8981\u5199\u6b63\u6587\u3002',
    '',
    executionContract,
    '',
    '# 章节战略规划',
    chapterStrategy || '暂无章节战略规划。',
    '',
    '# \u5fc5\u987b\u5305\u542b',
    '## 本章功能判定',
    '- 主功能：从章节功能判定规则中选择 1 个。',
    '- 副功能：可选，最多 1 个。',
    '- 选择理由：结合最近三章功能、当前阻碍、卷纲和本章细纲说明为什么本章必须承担这个功能。',
    '- 功能交付物：写清正文结束后必须发生的可追踪变化。',
    '',
    '- \u672c\u7ae0\u529f\u80fd',
    '- \u672c\u7ae0\u5fc5\u987b\u63a8\u8fdb\u7684\u5267\u60c5',
    '- 本章推进变更：主线推进、阻碍变化、爽点兑现、信息差变化或伏笔回收至少一项，禁止原地踏步',
    '- \u672c\u7ae0\u9898\u6750\u5473\u9053',
    '- \u672c\u7ae0\u723d\u70b9/\u60c5\u7eea\u70b9',
    `- 类型状态卡中连续变量的本章开始状态和本章结束状态：当前题材为${genreRequirement.genre}，只写当前题材合同要求的变量。`,
    genreContinuityContract,
    '- \u5fc5\u987b\u9075\u5b88\u7684\u5e73\u53f0\u8282\u594f',
    '- \u4e0d\u80fd\u5199\u504f\u7684\u70b9',
    '- \u7ae0\u672b\u94a9\u5b50',
    '- \u672c\u7ae0\u7ed3\u675f\u72b6\u6001',
    instruction ? `\u7528\u6237\u8865\u5145\u8981\u6c42\uff1a${instruction}` : '',
    '',
    '## 章节推进更新',
    '- 本章实际推进：主线/阻碍/爽点/信息差/伏笔中发生了什么变化。',
    '- 下一章必须承接：下一章不能跳过或重复的具体状态。',
    '- 重复风险：最近是否出现原地踏步，如有请写明需要避开的重复写法。',
    '',
    buildChapterDynamicContext({ selectedChapter, context: compiledContext }),
  ].filter(Boolean).join('\n')
}

function buildChapterPlanBundlePrompt({ instruction, book, selectedChapter, context, executionContract }) {
  const compiledContext = compileChapterWritingContext(context)
  return [
    buildChapterStableContext({ book, context: compiledContext }),
    '',
    '# 当前任务',
    '你是长篇网文主编。任务：一次性完成“章节策略规划”和“本章任务卡”。',
    '这一步是为了减少等待时间，但不能降低规划质量。只输出 Markdown，不要写正文。',
    '必须先满足本章执行合同；策略和任务卡只能细化合同，不能降低合同要求。',
    '',
    executionContract,
    '',
    '# 全书/卷节奏复盘',
    context.bookStrategyReview || '暂无全书/卷节奏复盘。',
    '',
    '# 输出格式',
    '严格使用下面两个二级标题，不要新增其他二级标题：',
    '## 章节策略规划',
    '- 本章功能定位：',
    '- 必须推进：主线/阻碍/爽点/信息差/状态变量至少一项发生什么变化：',
    '- 禁止重复：上一章已经完成、不能原地重复的内容：',
    '- 题材信号：本章必须可见的题材元素，以及如何变成现场事件：',
    '- 读者本章获得：',
    '- 章末钩子：',
    '- 下一章承接：',
    '',
    '## 本章任务卡',
    '- 主功能：',
    '- 副功能：',
    '- 功能交付物：正文结束后必须发生的可追踪变化：',
    '- 本章必须推进的剧情：',
    '- 本章题材味道：',
    '- 本章爽点/情绪点：',
    '- 类型状态承接：按当前题材合同和类型状态卡写清对应变量：',
    '- 平台节奏要求：',
    '- 不能写偏的点：',
    '- 章节推进更新：下一章必须承接什么、必须避免什么：',
    '',
    instruction ? `# 用户补充要求\n${instruction}` : '',
    '',
    buildChapterDynamicContext({ selectedChapter, context: compiledContext }),
  ].filter(Boolean).join('\n')
}

function shouldUseLocalChapterPlanBundle({ context, speedMode }) {
  return (speedMode === 'guarded' || speedMode === 'reckless') && isMeaningfulMarkdown(context?.chapterOutline)
}

function buildLocalChapterPlanBundle({ selectedChapter, context, executionContract }) {
  const source = 'existing-chapter-outline'
  const planMeta = { source: 'existing-chapter-outline' }
  const outline = limitText(context?.chapterOutline || '', 2600)
  const dynamicContext = buildChapterDynamicContext({
    selectedChapter,
    context: compileChapterWritingContext(context),
  })

  return [
    '## 章节策略规划',
    `- 规划来源：${planMeta.source || source}`,
    `- 本章功能定位：以已生成细纲为准执行${selectedChapter?.title ? `《${selectedChapter.title}》` : '本章'}，不再重复调用 AI 做前置规划。`,
    '- 必须推进：按细纲里的主线/阻碍/爽点/信息差/状态变量推进，至少让一项状态发生可追踪变化。',
    '- 禁止重复：不得重复上一章已完成结果，不得跳过章节状态承接。',
    '- 题材信号：按题材规则与类型状态卡落地到现场事件，不得混入无关题材味道。',
    '- 读者本章获得：看到明确的新进展、新反馈或新压力。',
    '- 章末钩子：从细纲结尾与未来章节规划中提取下一步压力。',
    '- 下一章承接：正文结束后必须能沉淀到章节推进状态、最近章节记忆和未来章节规划。',
    '',
    '## 本章任务卡',
    '- 主功能：执行本章细纲的核心剧情功能。',
    '- 副功能：补足人物行动、关系反应、题材信号和平台节奏。',
    '- 功能交付物：正文结束后必须出现可追踪的目标/阻碍/关系/线索/资源/能力/压力变化。',
    '- 本章必须推进的剧情：',
    outline,
    '',
    '- 本章题材味道：从项目题材规则、类型状态卡和本章细纲中抽取，不使用无关题材模板。',
    '- 本章爽点/情绪点：以现场行动和读者反馈呈现，不写成设定说明。',
    '- 类型状态承接：按当前题材状态卡承接对应变量。',
    '- 平台节奏要求：遵守平台字数、断章和推进密度要求。',
    '- 不能写偏的点：不得空转、不得只解释设定、不得把章节写成总结报告。',
    '- 章节推进更新：下一章必须承接本章新产生的状态，避免重复上章成果。',
    '',
    executionContract,
    '',
    dynamicContext,
  ].filter(Boolean).join('\n')
}

function buildChapterDraftPrompt({ instruction, book, selectedChapter, context, taskCard, executionContract, chapterStrategy }) {
  const compiledContext = compileChapterWritingContext(context)
  const genreRequirement = detectGenreRequiredSignals(compiledContext)
  const genreContinuityContract = buildGenreContinuityContract({ genreRequirement })
  const strategyAwareTaskCard = [
    chapterStrategy ? `# 章节战略规划\n${chapterStrategy}` : '',
    taskCard,
  ].filter(Boolean).join('\n\n')
  return [
    buildChapterStableContext({ book, context: compiledContext }),
    '',
    buildChapterWordRequirement(book, selectedChapter),
    '',
    '# 当前任务',
    '\u4f60\u662f\u957f\u7bc7\u7f51\u6587\u8fde\u8f7d\u5199\u624b\u3002',
    '\u4efb\u52a1\uff1a\u7eed\u5199\u5f53\u524d\u7ae0\u8282\u3002',
    '\u4ee5\u672c\u7ae0\u4efb\u52a1\u5361\u4e3a\u6700\u9ad8\u6267\u884c\u4f9d\u636e\uff1b\u53ea\u8f93\u51fa\u53ef\u63a5\u5728\u5f53\u524d\u7ae0\u8282\u672b\u5c3e\u7684\u6b63\u6587\u5019\u9009\uff0c\u4e0d\u8981\u8986\u76d6\u539f\u6587\uff0c\u4e0d\u8981\u8f93\u51fa\u4efb\u52a1\u5361\u6216\u81ea\u68c0\u62a5\u544a\u3002',
    '本章执行合同是硬约束，正文必须兑现合同里的推进、题材信号和状态承接。',
    executionContract,
    '章节功能合同：正文必须兑现任务卡中的主功能和功能交付物。升级/能力兑现章要写清收益和后果；阻碍升级章要写清新压力；信息差揭示章要改变决策；伏笔埋设/回收章要产生后续钩子；关系转折章要改变双方行为边界。',
    '\u6b63\u6587\u5fc5\u987b\u843d\u5730\u9898\u6750\u89c4\u5219\u548c\u672c\u7ae0\u9898\u6750\u5473\u9053\uff0c\u4e0d\u80fd\u8dd1\u9898\u6750\u3001\u4e0d\u80fd\u7a7a\u8f6c\u3001\u4e0d\u80fd\u53ea\u89e3\u91ca\u8bbe\u5b9a\u3002',
    '自然文风要求：正文要像作者在写现场，不要像摘要、项目报告或模板化总结腔。少用过度工整排比，少用“这意味着、他意识到、所有人都知道”这类解释句；用动作、对话、感官细节和现场反应承接情绪。',
    '人写感指纹是风格统计约束：样本统计只作为规律，参考段落长短、对白比例、钩子密度和题材信号密度；不要复刻样本原句或指定作者口吻。',
    '章节推进状态必须变化：正文不能只重复上一章已经完成的结果；必须让目标、阻碍、关系、线索、资源、身份、压力或伏笔发生可追踪变化。',
    '类型连续状态是硬约束：必须承接“类型状态卡”中的当前题材连续变量，不要套用其他题材的状态框架。',
    genreContinuityContract,
    instruction ? `\u7528\u6237\u8865\u5145\u8981\u6c42\uff1a${instruction}` : '',
    '',
    '# \u672c\u7ae0\u4efb\u52a1\u5361',
    strategyAwareTaskCard,
    '',
    buildChapterDynamicContext({ selectedChapter, context: compiledContext }),
  ].filter(Boolean).join('\n')
}

function buildChapterSelfCheckPrompt({ book, selectedChapter, context, taskCard, draft, executionContract, chapterStrategy }) {
  const compiledContext = compileChapterWritingContext(context)
  const genreRequirement = detectGenreRequiredSignals(compiledContext)
  const genreContinuityContract = buildGenreContinuityContract({ genreRequirement })
  const strategyAwareTaskCard = [
    chapterStrategy ? `# 章节战略规划\n${chapterStrategy}` : '',
    taskCard,
  ].filter(Boolean).join('\n\n')
  return [
    buildChapterStableContext({ book, context: compiledContext }),
    '',
    '# 当前任务',
    '\u4f60\u662f\u957f\u7bc7\u7f51\u6587\u8d28\u68c0\u7f16\u8f91\u3002',
    '\u4efb\u52a1\uff1a\u5bf9\u672c\u6b21\u7eed\u5199\u521d\u7a3f\u505a\u8f7b\u91cf\u81ea\u68c0\uff0c\u5e2e\u7528\u6237\u5224\u65ad\u662f\u5426\u53ef\u4ee5\u5e94\u7528\u3002',
    '\u53ea\u8f93\u51fa Markdown \u81ea\u68c0\u62a5\u544a\uff0c\u4e0d\u8981\u91cd\u5199\u6b63\u6587\u3002',
    '必须按本章执行合同验收。未满足合同则结论必须是“建议先修订”。',
    '',
    executionContract,
    '',
    '# \u5fc5\u987b\u68c0\u67e5',
    '- \u662f\u5426\u8dd1\u9898\u6750',
    '- \u662f\u5426\u7b26\u5408\u5e73\u53f0\u8282\u594f',
    '- \u662f\u5426\u5b8c\u6210\u672c\u7ae0\u4efb\u52a1',
    '- 本章功能是否完成：主功能、功能交付物、本章功能结果是否真实落地；功能未完成时必须建议先修订',
    '- \u662f\u5426\u8fdd\u80cc\u8bbe\u5b9a/\u89d2\u8272\u58f0\u7ebf',
    '- \u662f\u5426\u7a7a\u8f6c\u3001\u6c34\u6587\u6216\u89e3\u91ca\u8fc7\u591a',
    '- \u7ae0\u672b\u94a9\u5b50\u662f\u5426\u6210\u7acb',
    '- 是否原地踏步：是否只重复上一章成果，是否没有推进主线、阻碍、爽点、信息差或伏笔',
    `- 类型状态是否连续：当前题材为${genreRequirement.genre}，只检查当前题材合同里的连续变量。`,
    genreContinuityContract,
    '',
    '# \u8f93\u51fa\u683c\u5f0f',
    '## \u7ed3\u8bba',
    '\u53ef\u5e94\u7528 / \u5efa\u8bae\u5148\u4fee\u8ba2',
    '## \u547d\u4e2d\u70b9',
    '- ...',
    '## \u95ee\u9898',
    '- ...',
    '## \u4fee\u8ba2\u5efa\u8bae',
    '- ...',
    '## 本章功能结果',
    '- 主功能：',
    '- 是否完成：完成 / 功能未完成',
    '- 已交付变化：',
    '- 下一章承接点：',
    '## 章节后状态更新',
    '- 连续变量：逐条写出本章后已经改变或确认不变的状态。',
    '- 按当前题材合同输出连续变量；不要为了举例写入其他题材变量。',
    '',
    buildChapterDynamicContext({ selectedChapter, context: compiledContext }),
    '',
    '# \u672c\u7ae0\u4efb\u52a1\u5361',
    strategyAwareTaskCard,
    '',
    '# \u7eed\u5199\u521d\u7a3f',
    draft,
  ].join('\n') + '\n\n## 章节推进更新\n- 本章实际推进：主线/阻碍/爽点/信息差/伏笔中发生了什么变化。\n- 下一章必须承接：下一章不能跳过或重复的具体状态。\n- 重复风险：最近是否出现原地踏步，如有请写明需要避开的重复写法。\n\n## 章节记忆更新\n- 本章摘要：2-4 条，只写最终成立的剧情。\n- 本章功能：主功能/副功能/是否交付。\n- 题材信号：本章实际出现的题材元素。\n- 必须承接：下一章必须接住的状态和问题。\n- 最近三章风险：重复、跑题材、主线停滞或角色状态错位。'
}

function buildChapterSelfCheckRevisionPrompt({ instruction, book, selectedChapter, context, taskCard, selfCheck, draft }) {
  const compiledContext = compileChapterWritingContext(context)
  return [
    buildChapterStableContext({ book, context: compiledContext }),
    '',
    '# 当前任务',
    '\u4f60\u662f\u957f\u7bc7\u7f51\u6587\u8fde\u8f7d\u4fee\u7a3f\u7f16\u8f91\u3002',
    '\u4efb\u52a1\uff1a\u6839\u636e\u81ea\u68c0\u62a5\u544a\u4fee\u8ba2\u7eed\u5199\u521d\u7a3f\u3002',
    '\u53ea\u8f93\u51fa\u4fee\u8ba2\u540e\u7684\u7eed\u5199\u6b63\u6587\u5019\u9009\uff0c\u4e0d\u8981\u8f93\u51fa\u81ea\u68c0\u62a5\u544a\u3001\u4efb\u52a1\u5361\u6216\u89e3\u91ca\u3002',
    '\u4fee\u8ba2\u65f6\u4f18\u5148\u89e3\u51b3\uff1a\u8dd1\u9898\u6750\u3001\u5e73\u53f0\u8282\u594f\u4e0d\u5bf9\u3001\u672c\u7ae0\u4efb\u52a1\u672a\u5b8c\u6210\u3001\u8bbe\u5b9a/\u58f0\u7ebf\u504f\u79bb\u3001\u7a7a\u8f6c\u6c34\u6587\u3001\u7ae0\u672b\u94a9\u5b50\u4e0d\u6210\u7acb\u3002',
    instruction ? `\u7528\u6237\u8865\u5145\u8981\u6c42\uff1a${instruction}` : '',
    '',
    buildChapterDynamicContext({ selectedChapter, context: compiledContext }),
    '',
    '# \u672c\u7ae0\u4efb\u52a1\u5361',
    taskCard,
    '',
    '# \u81ea\u68c0\u62a5\u544a',
    selfCheck,
    '',
    '# \u7eed\u5199\u521d\u7a3f',
    draft,
  ].filter(Boolean).join('\n')
}

function buildNaturalProseCalibrationPrompt({ book, selectedChapter, context, taskCard, content, executionContract }) {
  const compiledContext = compileChapterWritingContext(context)
  return [
    buildChapterStableContext({ book, context: compiledContext }),
    '',
    buildChapterWordRequirement(book, selectedChapter),
    '',
    '# 当前任务',
    '你是长篇网文连载修稿编辑。',
    '任务：在不改变剧情事实和状态变量的前提下，把正文修成更像真人作者写出来的连载现场。',
    '只输出修订后的正文全文，不要输出解释、报告、评分、修改说明或 Markdown 代码块。',
    '',
    '# 硬约束',
    '- 不改变剧情事实、人物动机、能力状态、任务进度、装备/资源、伏笔、章末钩子和本章结束状态。',
    '- 不新增会影响后续大纲的设定、角色关系、战力收益或世界规则。',
    '- 不删掉本章任务卡、执行合同、题材规则要求必须交付的推进点。',
    '- 保留章节标题和当前 POV；如果原文没有标题，不要自行补解释性标题。',
    '- 网游文必须保留游戏系统、任务、经验、等级、技能、装备、玩家/NPC、副本、公告等已出现的题材信号，并让它们像现场事件，不像设定报告。',
    '',
    '# 自然文风校准',
    '- 正文要像作者在写现场：先让人物动起来、说起来、做选择，再让读者自己感到变化。',
    '- 避免模板化总结腔、会议纪要腔、说明书腔和过度工整排比。',
    '- 少用“这意味着、他意识到、所有人都知道、毫无疑问、与此同时”等总结式衔接；能用动作、眼神、语气、环境反馈表达，就不要抽象解释。',
    '- 句长要有变化，允许短句、停顿和口语化反应；不要每段都同样长度、同样结构。',
    '- 爽点不要只宣布结果，要写出触发、反馈、旁人反应和后果。',
    '- 可以增加少量动作、感官、对话和现场反应来润色，但不能添加新的剧情事实。',
    '- 人写感指纹来自拆书样本统计。样本统计只作为规律，参考常见句长、对白比例、钩子密度和题材信号密度；不要复刻样本原句。',
    '',
    executionContract,
    '',
    '# 本章任务卡',
    taskCard,
    '',
    buildChapterDynamicContext({ selectedChapter, context: compiledContext }),
    '',
    '# 待校准正文',
    content,
  ].filter(Boolean).join('\n')
}

async function calibrateNaturalProse({ detail, context, taskCard, content, executionContract, promptCacheKey, signal }) {
  const calibrated = await callOpenAiText({
    input: buildNaturalProseCalibrationPrompt({
      book: detail.book,
      selectedChapter: detail.selectedChapter,
      context,
      taskCard,
      content,
      executionContract,
    }),
    temperature: 0.35,
    maxOutputTokens: Math.max(aiOutputLimits.naturalProseCalibration, estimateDraftMaxOutputTokens(detail.book, detail.selectedChapter)),
    reasoningEffort: 'medium',
    promptCacheKey,
    signal,
  })

  return enforceChapterWordBudget({
    detail,
    content: calibrated,
    promptCacheKey,
    signal,
    sourceLabel: 'natural prose calibration',
    reason: 'natural prose calibration must not expand beyond platform budget',
  })
}

function buildFinalDraftSyncPrompt({ book, selectedChapter, context, taskCard, finalContent, executionContract }) {
  const compiledContext = compileChapterWritingContext(context)
  const genreRequirement = detectGenreRequiredSignals(compiledContext)
  const genreContinuityContract = buildGenreContinuityContract({ genreRequirement })
  return [
    buildChapterStableContext({ book, context: compiledContext }),
    '',
    '# 当前任务',
    '你是长篇网文连载的最终稿场记。',
    '任务：只根据最终正文生成可沉淀状态，用于写入类型状态卡和章节推进状态。',
    '不要评价正文，不要改正文，不要复述全文，不要根据初稿或旧自检补写没有在最终正文成立的内容。',
    '必须按本章执行合同做状态沉淀，合同里要求承接的变量如果正文没有改变，也要写入“未变化但必须承接”。',
    '',
    executionContract,
    '',
    '# 输出格式',
    '## 质量门禁',
    '- 质量分：0-100',
    '- 是否通过：通过 / 低于 80 分',
    '- 扣分原因：',
    '',
    '## 章节后状态更新',
    `- 类型连续变量：当前题材为${genreRequirement.genre}，只写最终正文已经成立的当前题材变量。`,
    genreContinuityContract,
    '- 未变化但必须承接：如有关键变量保持不变，也写明。',
    '',
    '## 章节推进更新',
    '- 本章功能结果：主功能是什么，最终正文是否完成。',
    '- 本章实际推进：主线/阻碍/爽点/信息差/伏笔中发生了什么变化。',
    '- 下一章必须承接：下一章不能跳过或重复的具体状态。',
    '- 重复风险：是否仍有原地踏步风险。',
    '',
    '## 章节记忆更新',
    '- 本章摘要：用 2-4 条写清最终正文真实发生的事。',
    '- 本章功能：主功能和副功能，以及是否交付。',
    '- 题材信号：本章保住了哪些当前题材味道；只记录最终正文里实际出现的题材信号，不补写其他题材变量。',
    '- 必须承接：下一章必须接住的角色状态、主线压力、奖励后果、伏笔、未解决问题。',
    '- 最近三章风险：是否重复、降智、跑题材或主线停滞。',
    '',
    '## 结构化状态更新',
    '{"currentChapter":"","protagonist":{"status":"","goal":"","ability":"","resources":[],"constraints":[]},"plot":{"stageGoal":"","currentObstacle":"","lastProgress":"","nextRequiredMove":""},"genreSignals":[],"openLoops":[],"recentChapterFunctions":[]}',
    '',
    '## 未来章节规划更新',
    '- 未来 3-5 章：',
    '- 下一章主功能：',
    '- 下一章必须承接：',
    '- 下一章必须避免：',
    '',
    '## 风格校准更新',
    '- 本章可沉淀风格：',
    '- 好段落特征：',
    '- 应避免写法：',
    '',
    '## 记忆治理更新',
    '- 强规则：',
    '- 当前事实：',
    '- 历史记录：',
    '- 未来计划：',
    '- 临时观察：',
    '',
    '# 本章任务卡',
    taskCard,
    '',
    buildChapterDynamicContext({ selectedChapter, context: compiledContext }),
    '',
    '# 最终正文',
    finalContent,
  ].filter(Boolean).join('\n')
}

async function syncFinalDraftState({ detail, context, taskCard, finalContent, executionContract, promptCacheKey, signal }) {
  const finalSync = await callOpenAiText({
    input: buildFinalDraftSyncPrompt({
      book: detail.book,
      selectedChapter: detail.selectedChapter,
      context,
      taskCard,
      finalContent,
      executionContract,
    }),
    temperature: 0.15,
    maxOutputTokens: aiOutputLimits.chapterFinalSync,
    reasoningEffort: 'low',
    promptCacheKey,
    signal,
  })

  return {
    finalSync,
    statePatch: parseSyncSection(finalSync, '章节后状态更新'),
    progressPatch: parseSyncSection(finalSync, '章节推进更新'),
    memoryPatch: parseSyncSection(finalSync, '章节记忆更新'),
    structuredPatch: parseSyncSection(finalSync, '结构化状态更新'),
    futurePlanPatch: parseSyncSection(finalSync, '未来章节规划更新'),
    stylePatch: parseSyncSection(finalSync, '风格校准更新'),
    memoryGovernancePatch: parseSyncSection(finalSync, '记忆治理更新'),
    qualityScore: parseQualityScore(finalSync),
  }
}

function parseQualityScore(content) {
  const match = String(content ?? '').match(/质量分[：:\s-]*(\d{1,3})/u)
  if (!match) {
    return null
  }

  return Math.max(0, Math.min(100, Number(match[1])))
}

function shouldAutoReviseChapterDraft(selfCheck) {
  if (typeof selfCheck !== 'string' || !selfCheck.trim()) {
    return false
  }

  return /建议先修订|需要修订|不可应用|跑题材|偏题|未完成本章任务|违背设定|声线偏离|空转|水文|钩子不成立|状态不连续|经验|升级|任务进度|功能未完成|原地踏步|只重复上一章/u.test(selfCheck)
}

function normalizeWritingSpeedMode(value) {
  return value === 'polish' || value === 'reckless' || value === 'guarded' ? value : 'guarded'
}

function isFastWritingSpeedMode(speedMode) {
  return speedMode === 'guarded' || speedMode === 'reckless'
}

function shouldAutoReviseChapterDraftForSpeed(selfCheck, speedMode) {
  if (speedMode === 'reckless') {
    return false
  }
  if (speedMode === 'polish') {
    return shouldAutoReviseChapterDraft(selfCheck)
  }
  const check = String(selfCheck || '')
  return /不可应用|跑题材|偏题|未完成本章任务|违背设定|状态不连续|原地踏步|只重复上一章|涓嶅彲搴旂敤|璺戦|鍋忛|鏈畬鎴愭湰绔犱换鍔|杩濊儗璁惧畾|鐘舵€佷笉杩炵画|鍘熷湴韪忔|鍙噸澶嶄笂涓€绔/u.test(check)
}

function shouldForceNaturalProseCalibrationForSpeed({ speedMode, stateGate, progressGate, executionGate, selfCheck }) {
  if (speedMode === 'polish') {
    return true
  }
  if (speedMode === 'reckless') {
    return false
  }
  const warnings = [
    ...(stateGate?.warnings || []),
    ...(progressGate?.warnings || []),
    ...(executionGate?.warnings || []),
    selfCheck || '',
  ].join('\n')
  return /AI味|模板|空泛|总结腔|不像人写|水文|跑题材|偏题|状态不连续|AI鍛|妯℃澘|绌烘硾|姘存枃|璺戦|鍋忛|鐘舵€佷笉杩炵画/u.test(warnings)
}

function shouldRepairEditorialFinalPassForSpeed({ speedMode, editorialFinalPass }) {
  if (speedMode === 'polish') {
    return true
  }
  if (speedMode === 'reckless') {
    return false
  }
  const warnings = (editorialFinalPass?.warnings || []).join('\n')
  return /跑题材|偏题|状态不连续|未推进|不可应用|违背设定|主线断裂|等级|经验|任务|装备|璺戦|鍋忛|鐘舵€佷笉杩炵画|鏈帹杩|涓嶅彲搴旂敤|杩濊儗璁惧畾|涓荤嚎/u.test(warnings)
}

function hasConfirmedStallingRisk(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const safeLine = /无|暂无|没有|未出现|不存在|已避免|已经避免|不是|并非|禁止|避免|防止|是否|需要检查|如有请写明|待观察|待定|none|no\b/i
  const riskLine = /原地踏步|重复上一章|没有推进|空转|推进不足/u
  const confirmedRisk = /存在|仍有|出现|承认|需要修复|需要避免|风险[:：]\s*(有|存在|高|明显)|问题[:：]\s*(有|存在)|未解决|失败/u

  return lines.some((line) => {
    if (!riskLine.test(line)) {
      return false
    }
    if (safeLine.test(line)) {
      return false
    }
    return confirmedRisk.test(line) || /^[-*]?\s*(原地踏步|重复上一章|没有推进|空转)/u.test(line)
  })
}

function isWebGameContext(context) {
  return detectGenreRequiredSignals(context).genre === '网游'
}

function evaluateChapterStateGate({ context, content, statePatch, progressPatch }) {
  const source = [content, statePatch, progressPatch].filter(Boolean).join('\n')
  const warnings = []
  const hasProgressSignal = /推进|变化|解锁|获得|失去|升级|暴露|发现|决定|承接|下一章|阻碍|任务|伏笔|线索|关系|资源|后果|代价|公告|排名|奖励/u.test(source)

  if (!hasProgressSignal) {
    warnings.push('缺少可追踪推进：主线、阻碍、爽点、信息差、伏笔或类型状态没有明显变化')
  }

  if (hasConfirmedStallingRisk(source)) {
    warnings.push('存在原地踏步风险：正文或状态同步承认推进不足')
  }

  if (isWebGameContext(context)) {
    const webGameSignals = ['玩家', '系统', '任务', '经验', '等级', '技能', '装备', 'NPC', '副本', '公告', '面板', '掉落', '排行榜']
    const hitCount = webGameSignals.filter((signal) => source.includes(signal)).length

    if (hitCount < 2) {
      warnings.push('网游题材信号不足：需要至少两个玩家/系统/任务/经验/等级/技能/装备/NPC/副本/公告等可见信号')
    }
  }

  return {
    passed: warnings.length === 0,
    warnings,
  }
}

function buildChapterStateGateRevisionPrompt({ instruction, book, selectedChapter, context, taskCard, stateGate, finalContent, executionContract }) {
  const compiledContext = compileChapterWritingContext(context)
  return [
    buildChapterStableContext({ book, context: compiledContext }),
    '',
    '# 当前任务',
    '你是长篇网文连载的状态门禁修稿编辑。',
    '任务：根据状态门禁失败原因，重写当前正文候选。',
    '只输出修订后的本章正文全文，不要输出解释、门禁报告或 Markdown 代码块。',
    '必须保留章节标题。',
    '本章执行合同是硬约束，修订后必须补足合同里缺失的推进、题材信号和状态承接。',
    '',
    executionContract,
    '',
    '# 状态门禁失败原因',
    (stateGate?.warnings || []).map((warning) => `- ${warning}`).join('\n') || '- 未知状态门禁失败',
    '',
    instruction ? `# 用户补充要求\n${instruction}` : '',
    '',
    '# 本章任务卡',
    taskCard,
    '',
    buildChapterDynamicContext({ selectedChapter, context: compiledContext }),
    '',
    '# 待修订正文',
    finalContent,
  ].filter(Boolean).join('\n')
}

function evaluateEditorialFinalPass({ context, content, qualityScore, stateGate, progressGate, executionGate, naturalProseDetail }) {
  const warnings = []
  const source = [content, naturalProseDetail].filter(Boolean).join('\n')
  const editorialMemory = String(context?.editorialReview || '')

  if (typeof qualityScore === 'number' && qualityScore < 85) {
    warnings.push(`质量分低于主编终审线：${qualityScore} 分，需要再修一轮。`)
  }
  if (!stateGate?.passed) {
    warnings.push(...(stateGate?.warnings || ['状态连续性未通过。']))
  }
  if (!progressGate?.passed) {
    warnings.push(...(progressGate?.warnings || ['章节推进未通过。']))
  }
  if (!executionGate?.passed) {
    warnings.push(...(executionGate?.warnings || ['执行合同未通过。']))
  }
  if (isWebGameContext(context)) {
    const signals = ['玩家', '系统', '任务', '经验', '等级', '技能', '装备', 'NPC', '副本', '公告', '面板', '掉落', '排行榜']
    const hitCount = signals.filter((signal) => source.includes(signal)).length
    if (hitCount < 3) {
      warnings.push('主编终审：网游可见信号不足，正文需要更像游戏现场，而不是泛玄幻/泛爽文。')
    }
  }
  if (/总结|说明|这意味着|毫无疑问|与此同时|所有人都知道/u.test(source) && !/“|”|。/.test(source.slice(0, 500))) {
    warnings.push('主编终审：开头说明感偏重，需要用动作、对话、现场反馈承接。')
  }
  if (editorialMemory && /risk|watch|风险|不建议|needs-review|题材味|主角主动|收益反馈|主线推进/u.test(editorialMemory)) {
    const rememberedRisks = pickFingerprintLines(editorialMemory, [/risk|watch|风险|不建议|needs-review|题材味|主角主动|收益反馈|主线推进/u], 6)
    if (rememberedRisks.length && warnings.length) {
      warnings.push(`主编审稿记录提醒：${rememberedRisks.join('；')}`)
    }
  }

  return {
    passed: warnings.length === 0,
    warnings,
  }
}

function buildEditorialFinalPassRevisionPrompt({ instruction, book, selectedChapter, context, taskCard, finalPass, finalContent, executionContract, chapterStrategy }) {
  const compiledContext = compileChapterWritingContext(context)
  return [
    buildChapterStableContext({ book, context: compiledContext }),
    '',
    '# 当前任务',
    '你是长篇网文主编。任务：根据主编终审失败原因，重写当前正文候选。',
    '只输出修订后的正文全文，不要解释，不要输出报告，不要输出 Markdown 代码块。',
    '这次修订必须同时解决：题材味、主角主动性、收益/后果反馈、主线推进、章末承接、人写感。',
    '',
    executionContract,
    '',
    '# 章节战略规划',
    chapterStrategy || '暂无章节战略规划。',
    '',
    '# 主编审稿记录',
    context.editorialReview || '暂无主编审稿记录。',
    '',
    '# 主编终审失败原因',
    (finalPass?.warnings || []).map((warning) => `- ${warning}`).join('\n') || '- 未知失败原因',
    '',
    instruction ? `# 用户补充要求\n${instruction}` : '',
    '',
    '# 本章任务卡',
    taskCard,
    '',
    buildChapterDynamicContext({ selectedChapter, context: compiledContext }),
    '',
    '# 待修订正文',
    finalContent,
  ].filter(Boolean).join('\n')
}

function buildReaderSimulationPrompt({ book, selectedChapter, context, chapterStrategy, taskCard, content }) {
  const compiledContext = compileChapterWritingContext(context)
  return [
    buildChapterStableContext({ book, context: compiledContext }),
    '',
    '# 当前任务',
    '你是网文平台试读读者模拟器。任务：站在目标平台读者视角，快速判断这一章会不会让人继续翻页。',
    '只输出 Markdown 试读报告，不要改正文。',
    '',
    '# 试读维度',
    '- 翻页欲：读完是否想看下一章。',
    '- 读者本章获得：爽点、情绪、信息差、奖励、关系变化或悬念是否足够。',
    '- 弃读风险：哪里水、慢、解释多、题材味弱、主角被动、收益没后果。',
    '- 题材感知：读者是否能清楚感到这是本书当前题材，而不是泛爽文。',
    '',
    '# 输出格式',
    '## 试读结论',
    '可继续 / 建议复核',
    '## 翻页欲',
    '- 分数：0-100',
    '- 理由：',
    '## 读者本章获得',
    '- ',
    '## 弃读风险',
    '- ',
    '## 最容易弃读的位置',
    '- ',
    '',
    '# 章节战略规划',
    chapterStrategy || '暂无',
    '',
    '# 本章任务卡',
    taskCard || '暂无',
    '',
    buildChapterDynamicContext({ selectedChapter, context: compiledContext }),
    '',
    '# 待试读正文',
    content,
  ].filter(Boolean).join('\n')
}

function evaluateReaderSimulation({ content, readerSimulation }) {
  const source = String(content || '')
  const report = String(readerSimulation || '')
  const warnings = []
  const scoreMatch = report.match(/(?:分数|翻页欲)[：:\s-]*(\d{1,3})/u)
  const score = scoreMatch ? Math.max(0, Math.min(100, Number(scoreMatch[1]))) : null

  if (/建议复核|弃读风险|题材味弱|主角被动|收益没后果|解释多|节奏慢|水/u.test(report)) {
    warnings.push('读者试读模拟：存在翻页欲或弃读风险，建议复核本章读者获得感。')
  }
  if (typeof score === 'number' && score < 75) {
    warnings.push(`读者试读模拟：翻页欲 ${score} 分，低于 75。`)
  }
  if (/这意味着|他意识到|所有人都知道|毫无疑问|与此同时/u.test(source.slice(0, 900))) {
    warnings.push('读者试读模拟：开头说明感偏重，可能降低代入。')
  }

  return {
    passed: warnings.length === 0,
    warnings,
    score,
  }
}

function buildLocalReaderSimulationResult({ content, chapterStrategy, taskCard, stateGate, progressGate, executionGate, naturalProseDetail }) {
  const warnings = []
  let score = 95
  const body = String(content || '')
  const strategy = String(chapterStrategy || '')
  const task = String(taskCard || '')

  if (textLength(body) < 1800) {
    warnings.push('正文偏短，建议再补一层推进')
    score -= 12
  }
  if (!strategy.trim()) {
    warnings.push('缺少章节策略')
    score -= 10
  }
  if (!task.trim()) {
    warnings.push('缺少本章任务卡')
    score -= 10
  }
  if (!stateGate?.passed || !progressGate?.passed || !executionGate?.passed) {
    warnings.push('门禁未完全通过')
    score -= 18
  }
  if (typeof naturalProseDetail === 'string' && /重复|空转|太快|无聊|偏题/.test(naturalProseDetail)) {
    warnings.push('自然文风修正提示偏重')
    score -= 8
  }

  score = Math.max(0, Math.min(100, score))
  return {
    passed: warnings.length === 0 && score >= 75,
    warnings,
    score,
  }
}

function shouldRunNaturalProseCalibration({ book, selectedChapter, content, qualityScore, stateGate, progressGate, executionGate, selfCheck }) {
  const policy = getPlatformWordPolicy(book?.platform)
  const targetWords = resolveTargetWordsForBook(book, selectedChapter?.targetWords)
  const minUsefulLength = Math.max(1200, Math.floor(Math.min(policy.min, targetWords) * 0.78))
  const source = String(content || '')
  const check = String(selfCheck || '')

  if (!stateGate?.passed || !progressGate?.passed || !executionGate?.passed) {
    return true
  }
  if (typeof qualityScore === 'number' && qualityScore < 85) {
    return true
  }
  if (textLength(source) < minUsefulLength) {
    return true
  }
  if (/建议先修订|需要修订|不可应用|跑题材|偏题|空转|水文|声线偏离|任务未完成|钩子不成立/u.test(check)) {
    return true
  }
  if (/这意味着|他意识到|所有人都知道|毫无疑问|与此同时/u.test(source.slice(0, 1200))) {
    return true
  }

  return false
}

function buildFastPathNaturalProseDetail() {
  return '快速链路：正文已通过任务卡、自检和本地门禁，跳过强制全文二次润色；如用户不满意，可用“哪里不满意”触发定向重写。'
}

function buildChapterOutlineFromDirectorDraft({ selectedChapter, draft }) {
  return [
    `# ${selectedChapter?.title || selectedChapter?.id || '本章'}细纲`,
    '',
    '## 本章任务卡',
    draft?.taskCard || '- 已由写作导演生成，正文候选中保留。',
    '',
    '## 章节承接',
    draft?.nextChapterReadiness || '- 以任务卡、状态追踪和最终正文为准。',
    '',
    '## 应用提示',
    `- 导演状态：${draft?.directorStatus || 'ready'}`,
    '- 这是由写作导演任务卡沉淀出的轻量细纲，用于减少额外等待；后续写作仍以项目设定、卷纲、任务卡和章节状态为核心依据。',
  ].join('\n')
}

function createWritingTaskTrace(label) {
  return {
    label,
    startedAt: Date.now(),
    steps: [],
  }
}

async function createWritingTaskRun(bookPath, type, payload = {}) {
  const id = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
  const now = new Date().toISOString()
  const run = {
    id,
    type,
    status: 'running',
    recoverable: true,
    partialContent: '',
    payload,
    steps: [],
    startedAt: now,
    updatedAt: now,
    startedAtMs: Date.now(),
    totalDurationMs: 0,
  }
  await persistWritingTaskRun(bookPath, run)
  return run
}

async function persistWritingTaskRun(bookPath, run) {
  const target = assertInsideBook(bookPath, `${names.tracking}/task-runs/${run.id}.json`)
  await fs.mkdir(path.dirname(target), { recursive: true })
  const startedAtMs = Number.isFinite(run.startedAtMs) ? run.startedAtMs : Date.parse(run.startedAt || '') || Date.now()
  await fs.writeFile(target, `${JSON.stringify({ ...run, totalDurationMs: Date.now() - startedAtMs, updatedAt: new Date().toISOString() }, null, 2)}\n`, 'utf8')
}

async function recordWritingTaskRunStep(bookPath, run, step, status, detail = '', partialContent = '') {
  if (!run) {
    return
  }

  run.status = status === 'failed' ? 'failed' : 'running'
  run.partialContent = partialContent || run.partialContent || ''
  const now = Date.now()
  const previousAtMs = run.lastStepAtMs || run.startedAtMs || now
  run.steps.push({
    step,
    status,
    detail,
    at: new Date().toISOString(),
    durationMs: now - previousAtMs,
  })
  run.lastStepAtMs = now
  await persistWritingTaskRun(bookPath, run)
}

async function runAiManagedTask({ bookPath, type, payload = {}, step, signal, execute }) {
  const taskRun = await createWritingTaskRun(bookPath, type, payload)

  try {
    const result = await execute({
      signal,
      taskRun,
      recordStep: (stepName, status, detail = '', partialContent = '') => recordWritingTaskRunStep(bookPath, taskRun, stepName, status, detail, partialContent),
    })
    taskRun.status = result?.directorStatus === 'needs-review' ? 'needs-review' : 'completed'
    if (typeof result?.content === 'string' && result.content.trim()) {
      taskRun.partialContent = result.content
    }
    await persistWritingTaskRun(bookPath, taskRun)
    return result
  } catch (error) {
    await recordWritingTaskRunStep(bookPath, taskRun, step, 'failed', error instanceof Error ? error.message : String(error))
    throw error
  }
}

async function getLatestRecoverableWritingTaskRun(input) {
  const taskDir = assertInsideBook(input.bookPath, `${names.tracking}/task-runs`)
  if (!(await pathExists(taskDir))) {
    return null
  }

  const chapterFile = typeof input?.chapterFile === 'string' ? input.chapterFile : ''
  const sinceTime = typeof input?.since === 'string' ? Date.parse(input.since) : 0
  const entries = await fs.readdir(taskDir, { withFileTypes: true })
  const runs = []

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue
    }

    try {
      const raw = await fs.readFile(path.join(taskDir, entry.name), 'utf8')
      const run = JSON.parse(raw)
      if (!run?.recoverable || typeof run?.partialContent !== 'string' || !run.partialContent.trim()) {
        continue
      }
      if (chapterFile && run?.payload?.chapterFile !== chapterFile) {
        continue
      }
      const updatedAt = Date.parse(run.updatedAt || run.startedAt || '')
      if (sinceTime && updatedAt < sinceTime) {
        continue
      }
      runs.push(run)
    } catch {
      // Ignore damaged task run files; they should not block recovery.
    }
  }

  runs.sort((a, b) => String(b.updatedAt || b.startedAt || '').localeCompare(String(a.updatedAt || a.startedAt || '')))
  const latest = runs[0]
  if (!latest) {
    return null
  }

  return {
    id: latest.id,
    type: latest.type,
    status: latest.status,
    recoverable: Boolean(latest.recoverable),
    partialContent: latest.partialContent,
    chapterFile: latest.payload?.chapterFile,
    updatedAt: latest.updatedAt || latest.startedAt || '',
    steps: Array.isArray(latest.steps) ? latest.steps : [],
    totalDurationMs: latest.totalDurationMs,
  }
}

function recordWritingTaskStep(trace, step, status, detail = '') {
  if (!trace || !Array.isArray(trace.steps)) {
    return
  }

  trace.steps.push({
    step,
    status,
    detail,
    at: new Date().toISOString(),
    elapsedMs: Date.now() - trace.startedAt,
  })
}

function formatWritingTaskTrace(trace) {
  if (!trace || !Array.isArray(trace.steps) || trace.steps.length === 0) {
    return '暂无'
  }

  return trace.steps.map((item) => `- ${item.status}｜${item.step}｜${Math.round(item.elapsedMs / 100) / 10}s${item.detail ? `｜${item.detail}` : ''}`).join('\n')
}

function buildDirectorDetail({ chapterStrategy, taskCard, draft, selfCheck, finalSync, finalContent, statePatch, progressPatch, memoryPatch, structuredPatch, futurePlanPatch, stylePatch, memoryGovernancePatch, qualityScore, qualityGatePassed, directorStatus, selfCheckFailed, revisionError, taskTrace, nextChapterReadiness, stateGate, naturalProseDetail, editorialFinalPassDetail, readerSimulationDetail }) {
  const statusLabel = {
    ready: '初稿通过自检',
    'auto-revised': '已根据自检自动修订',
    'needs-review': '需要人工复核',
  }[directorStatus] ?? '已生成'

  return [
    `# 生成详情`,
    '',
    `## 导演判断`,
    `- 状态：${statusLabel}`,
    `- 质量门禁：${typeof qualityScore === 'number' ? `${qualityScore} 分，${qualityGatePassed ? '通过' : '低于 80 分'}` : '未评分'}`,
    '',
    '## 任务轨迹',
    taskTrace ? formatWritingTaskTrace(taskTrace) : '暂无',
    '',
    '## 状态门禁',
    stateGate ? [`- 是否通过：${stateGate.passed ? '通过' : '未通过'}`, ...(stateGate.warnings || []).map((warning) => `- ${warning}`)].join('\n') : '暂无',
    selfCheckFailed ? '- 自检失败：已保留正文候选，建议人工快速看一眼。' : '',
    revisionError ? `- 自动修订失败：${revisionError}` : '',
    '',
    '## 自然文风校准',
    naturalProseDetail || '暂无',
    '',
    '## 主编终审',
    editorialFinalPassDetail || '暂无',
    '',
    '## 读者试读模拟',
    readerSimulationDetail || '暂无',
    '',
    '## 章节战略规划',
    chapterStrategy || '暂无',
    '',
    '## 本章任务卡',
    taskCard || '暂无',
    '',
    '## 初稿',
    draft || '暂无',
    '',
    '## 自检报告',
    selfCheck || '暂无',
    '',
    '## 最终稿状态同步',
    finalSync || '暂无',
    '',
    '## 章节后状态更新',
    statePatch || '暂无',
    '',
    '## 章节推进更新',
    progressPatch || '暂无',
    '',
    '## 章节记忆更新',
    memoryPatch || '暂无',
    '',
    '## 结构化状态更新',
    structuredPatch || '暂无',
    '',
    '## 未来章节规划更新',
    futurePlanPatch || '暂无',
    '',
    '## 风格校准更新',
    stylePatch || '暂无',
    '',
    '## 记忆治理更新',
    memoryGovernancePatch || '暂无',
    '',
    '## 下一章准备卡',
    nextChapterReadiness || '暂无',
    '',
    '## 最终正文候选',
    finalContent || '暂无',
  ].filter(Boolean).join('\n')
}

async function runChapterWritingDirector({ instruction, detail, context, promptCacheKey, signal, reportProgress, speedMode = 'guarded' }) {
  speedMode = normalizeWritingSpeedMode(speedMode)
  const chapterContext = selectContextForTask(context, 'chapter-writing')
  const executionContract = buildChapterExecutionContract({
    book: detail.book,
    selectedChapter: detail.selectedChapter,
    context: chapterContext,
    instruction,
  })
  return await runAiManagedTask({
    bookPath: detail.book.path,
    type: 'chapter-director',
    payload: {
      chapterFile: detail.selectedChapter?.file,
      instruction,
      executionContract,
      speedMode,
    },
    step: 'chapter-director',
    signal,
    execute: ({ taskRun }) => runChapterWritingDirectorPipeline({ instruction, detail, context: chapterContext, promptCacheKey, signal, executionContract, taskRun, reportProgress, speedMode }),
  })
}

async function runChapterWritingDirectorPipeline({ instruction, detail, context, promptCacheKey, signal, executionContract, taskRun, reportProgress, speedMode = 'guarded' }) {
  speedMode = normalizeWritingSpeedMode(speedMode)
  const taskTrace = createWritingTaskTrace('chapter-director')
  const emitProgress = (phase, detailText = '', preview = '', status = 'running') => {
    if (typeof reportProgress === 'function') {
      reportProgress({
        phase,
        detail: detailText,
        preview: limitText(preview, 240),
        status,
      })
    }
  }

  assertNotAborted(signal)
  const useLocalPlanBundle = shouldUseLocalChapterPlanBundle({ context, speedMode })
  emitProgress('plan', useLocalPlanBundle ? 'Using existing chapter outline as local strategy' : 'Generating chapter strategy and task card')
  const planBundle = useLocalPlanBundle
    ? buildLocalChapterPlanBundle({
      selectedChapter: detail.selectedChapter,
      context,
      executionContract,
    })
    : await callOpenAiText({
      input: buildChapterPlanBundlePrompt({
        instruction,
        book: detail.book,
        selectedChapter: detail.selectedChapter,
        context,
        executionContract,
      }),
      temperature: 0.22,
      maxOutputTokens: Math.max(aiOutputLimits.chapterTaskCard, aiOutputLimits.chapterSelfCheck),
      reasoningEffort: 'low',
      promptCacheKey,
      signal,
    })
  assertNotAborted(signal)
  const chapterStrategy = parseSyncSection(planBundle, '章节策略规划')
  const taskCard = parseSyncSection(planBundle, '本章任务卡')
  recordWritingTaskStep(taskTrace, 'chapter-strategy', 'success', '??????????????')
  await recordWritingTaskRunStep(detail.book.path, taskRun, 'chapter-strategy', 'success', '??????????????', chapterStrategy)
  recordWritingTaskStep(taskTrace, 'task-card', 'success', '????????????')
  await recordWritingTaskRunStep(detail.book.path, taskRun, 'task-card', 'success', '????????????', taskCard)
  assertNotAborted(signal)
  emitProgress('draft', 'Generating draft')
  const draftText = await callOpenAiTextPreferStream({
    input: buildChapterDraftPrompt({
      instruction,
      book: detail.book,
      selectedChapter: detail.selectedChapter,
      context,
      taskCard,
      executionContract,
      chapterStrategy,
    }),
    temperature: 0.55,
    maxOutputTokens: estimateDraftMaxOutputTokens(detail.book, detail.selectedChapter),
    reasoningEffort: 'medium',
    promptCacheKey,
    signal,
    onDelta: (content) => {
      emitProgress('draft', 'Drafting ' + countTextWords(content) + ' chars', content)
    },
    onFallback: (error) => {
      emitProgress('draft', 'Streaming failed, falling back to normal generation: ' + (error instanceof Error ? error.message : 'unknown error'))
    },
  })
  assertNotAborted(signal)
  let draft = await enforceChapterWordBudget({
    detail,
    content: draftText,
    promptCacheKey,
    signal,
    sourceLabel: 'initial draft',
    reason: 'initial chapter draft must fit the selected platform budget',
    speedMode,
  })
  assertNotAborted(signal)
  emitProgress('draft', 'Draft ready', draft)
  recordWritingTaskStep(taskTrace, 'draft', 'success', '已生成正文初稿')
  await recordWritingTaskRunStep(detail.book.path, taskRun, 'draft', 'success', '已生成正文初稿', draft)

  let selfCheckFailed = false
  let selfCheck = ''
  let finalContent = draft
  let directorStatus = 'ready'
  let revisionError = ''
  let statePatch = ''
  let progressPatch = ''
  let memoryPatch = ''
  let structuredPatch = ''
  let futurePlanPatch = ''
  let stylePatch = ''
  let qualityScore = null
  let finalSync = ''
  let memoryGovernancePatch = ''
  let stateGate = { passed: true, warnings: [] }
  let executionGate = { passed: true, warnings: [], executionContract, signalHits: [] }
  let progressGate = { passed: true, warnings: [] }
  let naturalProseDetail = ''
  let editorialFinalPass = { passed: true, warnings: [] }
  let editorialFinalPassDetail = ''
  let readerSimulation = { passed: true, warnings: [], score: null }
  let readerSimulationDetail = ''

  try {
    assertNotAborted(signal)
    emitProgress('self-check', 'Checking continuity and genre signals')
    selfCheck = await callOpenAiText({
      input: buildChapterSelfCheckPrompt({
        book: detail.book,
        selectedChapter: detail.selectedChapter,
        context,
        taskCard,
        draft,
        executionContract,
        chapterStrategy,
      }),
      temperature: 0.2,
      maxOutputTokens: aiOutputLimits.chapterSelfCheck,
      reasoningEffort: 'low',
      promptCacheKey,
      signal,
    })
    assertNotAborted(signal)
    emitProgress('self-check', 'Self-check ready', selfCheck)
    recordWritingTaskStep(taskTrace, 'self-check', 'success', '已完成自检')
    await recordWritingTaskRunStep(detail.book.path, taskRun, 'self-check', 'success', '已完成自检', finalContent)
    statePatch = parseSyncSection(selfCheck, '章节后状态更新')
    progressPatch = parseSyncSection(selfCheck, '章节推进更新')
    memoryPatch = parseSyncSection(selfCheck, '章节记忆更新')
    qualityScore = parseQualityScore(selfCheck)
  } catch (error) {
    selfCheckFailed = true
    directorStatus = 'needs-review'
    recordWritingTaskStep(taskTrace, 'self-check', 'failed', error instanceof Error ? error.message : '自检失败')
    await recordWritingTaskRunStep(detail.book.path, taskRun, 'self-check', 'failed', error instanceof Error ? error.message : '自检失败', finalContent)
    selfCheck = [
      '# 自检未完成',
      '',
      `- 原因：${error instanceof Error ? error.message : '自检失败'}`,
      '- 正文候选已保留，建议人工快速看一眼。',
    ].join('\n')
    statePatch = '- 自检失败，未提取章节后状态更新。'
    progressPatch = '- 自检失败，未提取章节推进更新。'
    memoryPatch = '- 自检失败，未提取章节记忆更新。'
  }

  assertNotAborted(signal)
  if (!selfCheckFailed && shouldAutoReviseChapterDraftForSpeed(selfCheck, speedMode)) {
    try {
      assertNotAborted(signal)
      emitProgress('self-check', 'Self-check requested an automatic revision')
      finalContent = assertCleanChapterDraftContent(await callOpenAiText({
        input: buildChapterSelfCheckRevisionPrompt({
          instruction,
          book: detail.book,
          selectedChapter: detail.selectedChapter,
          context,
          taskCard,
          selfCheck,
          draft,
        }),
        temperature: 0.45,
        maxOutputTokens: aiOutputLimits.chapterSelfCheckRevision,
        reasoningEffort: speedMode === 'polish' ? 'medium' : 'low',
        promptCacheKey,
        signal,
      }), '\u81ea\u68c0\u4fee\u8ba2\u7a3f')
      assertNotAborted(signal)
      finalContent = await enforceChapterWordBudget({
        detail,
        content: finalContent,
        promptCacheKey,
        signal,
        sourceLabel: 'self-check revision',
        reason: 'self-check revision must keep platform chapter length',
        speedMode,
      })
      assertNotAborted(signal)
      directorStatus = 'auto-revised'
      recordWritingTaskStep(taskTrace, 'self-check-repair', 'success', '已根据自检自动修订')
      await recordWritingTaskRunStep(detail.book.path, taskRun, 'self-check-repair', 'success', '已根据自检自动修订', finalContent)
      const synced = await syncFinalDraftState({
        detail,
        context,
        taskCard,
        finalContent,
        executionContract,
        promptCacheKey,
        signal,
      })
      assertNotAborted(signal)
      finalSync = synced.finalSync
      statePatch = synced.statePatch
      progressPatch = synced.progressPatch
      memoryPatch = synced.memoryPatch
      structuredPatch = synced.structuredPatch
      futurePlanPatch = synced.futurePlanPatch
      stylePatch = synced.stylePatch
      memoryGovernancePatch = synced.memoryGovernancePatch
      qualityScore = synced.qualityScore
      recordWritingTaskStep(taskTrace, 'final-sync', 'success', '已同步最终稿状态')
      await recordWritingTaskRunStep(detail.book.path, taskRun, 'final-sync', 'success', '已同步最终稿状态', finalContent)
    } catch (error) {
      directorStatus = 'needs-review'
      revisionError = error instanceof Error ? error.message : '自动修订失败'
      recordWritingTaskStep(taskTrace, 'self-check-repair', 'failed', revisionError)
      await recordWritingTaskRunStep(detail.book.path, taskRun, 'self-check-repair', 'failed', revisionError, finalContent)
    }
  }

  assertNotAborted(signal)
  stateGate = evaluateChapterStateGate({ context, content: finalContent, statePatch, progressPatch })
  progressGate = evaluateChapterProgressGate({ context, content: finalContent, statePatch, progressPatch, memoryPatch, structuredPatch, futurePlanPatch })
  recordWritingTaskStep(taskTrace, 'state-gate', stateGate.passed ? 'success' : 'failed', stateGate.warnings.join('；'))
  await recordWritingTaskRunStep(detail.book.path, taskRun, 'state-gate', stateGate.passed ? 'success' : 'failed', stateGate.warnings.join('；'), finalContent)
  recordWritingTaskStep(taskTrace, 'progress-gate', progressGate.passed ? 'success' : 'failed', progressGate.warnings.join('；'))
  await recordWritingTaskRunStep(detail.book.path, taskRun, 'progress-gate', progressGate.passed ? 'success' : 'failed', progressGate.warnings.join('；'), finalContent)

  executionGate = evaluateChapterExecutionGate({
    executionContract,
    context,
    content: finalContent,
    statePatch,
    progressPatch,
    memoryPatch,
    structuredPatch,
    futurePlanPatch,
  })
  assertNotAborted(signal)
  recordWritingTaskStep(taskTrace, 'execution-gate', executionGate.passed ? 'success' : 'failed', executionGate.warnings.join('；'))
  await recordWritingTaskRunStep(detail.book.path, taskRun, 'execution-gate', executionGate.passed ? 'success' : 'failed', executionGate.warnings.join('；'), finalContent)

  if (!stateGate.passed || !executionGate.passed || !progressGate.passed) {
    try {
      assertNotAborted(signal)
      finalContent = assertCleanChapterDraftContent(await callOpenAiText({
        input: buildChapterStateGateRevisionPrompt({
          instruction,
          book: detail.book,
          selectedChapter: detail.selectedChapter,
          context,
          taskCard,
          stateGate: {
            passed: stateGate.passed && executionGate.passed && progressGate.passed,
            warnings: [...stateGate.warnings, ...executionGate.warnings, ...progressGate.warnings],
          },
          finalContent,
          executionContract,
        }),
        temperature: 0.45,
        maxOutputTokens: aiOutputLimits.chapterSelfCheckRevision,
        reasoningEffort: speedMode === 'polish' ? 'medium' : 'low',
        promptCacheKey,
        signal,
      }), '\u72b6\u6001\u95e8\u7981\u4fee\u8ba2\u7a3f')
      assertNotAborted(signal)
      finalContent = await enforceChapterWordBudget({
        detail,
        content: finalContent,
        promptCacheKey,
        signal,
        sourceLabel: 'execution-gate revision',
        reason: 'execution gate revision must keep platform chapter length',
        speedMode,
      })
      assertNotAborted(signal)
      recordWritingTaskStep(taskTrace, 'execution-gate-repair', 'success', '已根据状态/执行合同门禁自动修订')
      await recordWritingTaskRunStep(detail.book.path, taskRun, 'execution-gate-repair', 'success', '已根据状态/执行合同门禁自动修订', finalContent)
      const synced = await syncFinalDraftState({
        detail,
        context,
        taskCard,
        finalContent,
        executionContract,
        promptCacheKey,
        signal,
      })
      assertNotAborted(signal)
      finalSync = synced.finalSync
      statePatch = synced.statePatch
      progressPatch = synced.progressPatch
      memoryPatch = synced.memoryPatch
      structuredPatch = synced.structuredPatch
      futurePlanPatch = synced.futurePlanPatch
      stylePatch = synced.stylePatch
      memoryGovernancePatch = synced.memoryGovernancePatch
      qualityScore = synced.qualityScore
      stateGate = evaluateChapterStateGate({ context, content: finalContent, statePatch, progressPatch })
      progressGate = evaluateChapterProgressGate({ context, content: finalContent, statePatch, progressPatch, memoryPatch, structuredPatch, futurePlanPatch })
      executionGate = evaluateChapterExecutionGate({
        executionContract,
        context,
        content: finalContent,
        statePatch,
        progressPatch,
        memoryPatch,
        structuredPatch,
        futurePlanPatch,
      })
      recordWritingTaskStep(taskTrace, 'execution-gate', executionGate.passed ? 'success' : 'failed', executionGate.passed ? '修订后通过' : executionGate.warnings.join('；'))
      await recordWritingTaskRunStep(detail.book.path, taskRun, 'execution-gate', executionGate.passed ? 'success' : 'failed', executionGate.passed ? '修订后通过' : executionGate.warnings.join('；'), finalContent)
      recordWritingTaskStep(taskTrace, 'state-gate', stateGate.passed ? 'success' : 'failed', stateGate.passed ? '修订后通过' : stateGate.warnings.join('；'))
      await recordWritingTaskRunStep(detail.book.path, taskRun, 'state-gate', stateGate.passed ? 'success' : 'failed', stateGate.passed ? '修订后通过' : stateGate.warnings.join('；'), finalContent)
      recordWritingTaskStep(taskTrace, 'progress-gate', progressGate.passed ? 'success' : 'failed', progressGate.passed ? '修订后通过' : progressGate.warnings.join('；'))
      await recordWritingTaskRunStep(detail.book.path, taskRun, 'progress-gate', progressGate.passed ? 'success' : 'failed', progressGate.passed ? '修订后通过' : progressGate.warnings.join('；'), finalContent)
    } catch (error) {
      directorStatus = 'needs-review'
      recordWritingTaskStep(taskTrace, 'execution-gate-repair', 'failed', error instanceof Error ? error.message : '执行合同门禁修订失败')
      await recordWritingTaskRunStep(detail.book.path, taskRun, 'execution-gate-repair', 'failed', error instanceof Error ? error.message : '执行合同门禁修订失败', finalContent)
    }
  }

  const needsNaturalProseCalibration = shouldRunNaturalProseCalibration({
    book: detail.book,
    selectedChapter: detail.selectedChapter,
    content: finalContent,
    qualityScore,
    stateGate,
    progressGate,
    executionGate,
    selfCheck,
  })
  const shouldRunNaturalProseStep = needsNaturalProseCalibration && (!isFastWritingSpeedMode(speedMode) || shouldForceNaturalProseCalibrationForSpeed({
    speedMode,
    stateGate,
    progressGate,
    executionGate,
    selfCheck,
  }))

  if (shouldRunNaturalProseStep) {
  try {
    assertNotAborted(signal)
    emitProgress('natural-prose', 'Calibrating natural prose')
    const calibratedContent = await calibrateNaturalProse({
      detail,
      context,
      taskCard,
      content: finalContent,
      executionContract,
      promptCacheKey,
      signal,
    })
    assertNotAborted(signal)

    if (calibratedContent.trim() !== finalContent.trim()) {
      finalContent = calibratedContent
      naturalProseDetail = '已完成自然文风校准：保留剧情事实和状态变量，压低模板化总结腔，增强现场感。'
    } else {
      naturalProseDetail = '自然文风校准完成：正文已符合当前校准要求，未产生明显改写。'
    }

    recordWritingTaskStep(taskTrace, 'natural-prose', 'success', naturalProseDetail)
    await recordWritingTaskRunStep(detail.book.path, taskRun, 'natural-prose', 'success', naturalProseDetail, finalContent)

    emitProgress('final-sync', 'Syncing chapter state')
    const synced = await syncFinalDraftState({
      detail,
      context,
      taskCard,
      finalContent,
      executionContract,
      promptCacheKey,
      signal,
    })
    assertNotAborted(signal)
    finalSync = synced.finalSync
    statePatch = synced.statePatch
    progressPatch = synced.progressPatch
    memoryPatch = synced.memoryPatch
    structuredPatch = synced.structuredPatch
    futurePlanPatch = synced.futurePlanPatch
    stylePatch = synced.stylePatch
    memoryGovernancePatch = synced.memoryGovernancePatch
    qualityScore = synced.qualityScore
    stateGate = evaluateChapterStateGate({ context, content: finalContent, statePatch, progressPatch })
    progressGate = evaluateChapterProgressGate({ context, content: finalContent, statePatch, progressPatch, memoryPatch, structuredPatch, futurePlanPatch })
    executionGate = evaluateChapterExecutionGate({
      executionContract,
      context,
      content: finalContent,
      statePatch,
      progressPatch,
      memoryPatch,
      structuredPatch,
      futurePlanPatch,
    })
    recordWritingTaskStep(taskTrace, 'final-sync', 'success', '自然文风校准后已重新同步最终稿状态')
    await recordWritingTaskRunStep(detail.book.path, taskRun, 'final-sync', 'success', '自然文风校准后已重新同步最终稿状态', finalContent)
  } catch (error) {
    directorStatus = 'needs-review'
    naturalProseDetail = `自然文风校准失败：${error instanceof Error ? error.message : '未知错误'}。已保留校准前正文，建议人工复核文风。`
    recordWritingTaskStep(taskTrace, 'natural-prose', 'failed', naturalProseDetail)
    await recordWritingTaskRunStep(detail.book.path, taskRun, 'natural-prose', 'failed', naturalProseDetail, finalContent)
  }
  } else {
    naturalProseDetail = buildFastPathNaturalProseDetail()
    recordWritingTaskStep(taskTrace, 'natural-prose', 'success', naturalProseDetail)
    await recordWritingTaskRunStep(detail.book.path, taskRun, 'natural-prose', 'success', naturalProseDetail, finalContent)
  }

  editorialFinalPass = evaluateEditorialFinalPass({
    context,
    content: finalContent,
    qualityScore,
    stateGate,
    progressGate,
    executionGate,
    naturalProseDetail,
  })
  editorialFinalPassDetail = editorialFinalPass.passed
    ? '主编终审通过：题材、推进、状态、人写感达到当前门槛。'
    : `主编终审未通过：${editorialFinalPass.warnings.join('；')}`
  recordWritingTaskStep(taskTrace, 'editorial-final-pass', editorialFinalPass.passed ? 'success' : 'failed', editorialFinalPassDetail)
  await recordWritingTaskRunStep(detail.book.path, taskRun, 'editorial-final-pass', editorialFinalPass.passed ? 'success' : 'failed', editorialFinalPassDetail, finalContent)

  if (!editorialFinalPass.passed && shouldRepairEditorialFinalPassForSpeed({ speedMode, editorialFinalPass })) {
    try {
      assertNotAborted(signal)
      emitProgress('editorial-final-pass', 'Repairing chapter after final editor review')
      finalContent = assertCleanChapterDraftContent(await callOpenAiText({
        input: buildEditorialFinalPassRevisionPrompt({
          instruction,
          book: detail.book,
          selectedChapter: detail.selectedChapter,
          context,
          taskCard,
          finalPass: editorialFinalPass,
          finalContent,
          executionContract,
          chapterStrategy,
        }),
        temperature: 0.42,
        maxOutputTokens: aiOutputLimits.chapterSelfCheckRevision,
        reasoningEffort: speedMode === 'polish' ? 'medium' : 'low',
        promptCacheKey,
        signal,
      }), '主编终审修订稿')
      assertNotAborted(signal)
      finalContent = await enforceChapterWordBudget({
        detail,
        content: finalContent,
        promptCacheKey,
        signal,
        sourceLabel: 'editorial final pass revision',
        reason: 'editorial final pass revision must keep platform chapter length',
        speedMode,
      })
      assertNotAborted(signal)
      directorStatus = 'auto-revised'
      recordWritingTaskStep(taskTrace, 'editorial-final-pass-repair', 'success', '已根据主编终审自动补救')
      await recordWritingTaskRunStep(detail.book.path, taskRun, 'editorial-final-pass-repair', 'success', '已根据主编终审自动补救', finalContent)
      const synced = await syncFinalDraftState({
        detail,
        context,
        taskCard,
        finalContent,
        executionContract,
        promptCacheKey,
        signal,
      })
      assertNotAborted(signal)
      finalSync = synced.finalSync
      statePatch = synced.statePatch
      progressPatch = synced.progressPatch
      memoryPatch = synced.memoryPatch
      structuredPatch = synced.structuredPatch
      futurePlanPatch = synced.futurePlanPatch
      stylePatch = synced.stylePatch
      memoryGovernancePatch = synced.memoryGovernancePatch
      qualityScore = synced.qualityScore
      stateGate = evaluateChapterStateGate({ context, content: finalContent, statePatch, progressPatch })
      progressGate = evaluateChapterProgressGate({ context, content: finalContent, statePatch, progressPatch, memoryPatch, structuredPatch, futurePlanPatch })
      executionGate = evaluateChapterExecutionGate({
        executionContract,
        context,
        content: finalContent,
        statePatch,
        progressPatch,
        memoryPatch,
        structuredPatch,
        futurePlanPatch,
      })
      editorialFinalPass = evaluateEditorialFinalPass({
        context,
        content: finalContent,
        qualityScore,
        stateGate,
        progressGate,
        executionGate,
        naturalProseDetail,
      })
      editorialFinalPassDetail = editorialFinalPass.passed
        ? '主编终审补救后通过。'
        : `主编终审补救后仍需复核：${editorialFinalPass.warnings.join('；')}`
      recordWritingTaskStep(taskTrace, 'editorial-final-pass', editorialFinalPass.passed ? 'success' : 'failed', editorialFinalPassDetail)
      await recordWritingTaskRunStep(detail.book.path, taskRun, 'editorial-final-pass', editorialFinalPass.passed ? 'success' : 'failed', editorialFinalPassDetail, finalContent)
    } catch (error) {
      directorStatus = 'needs-review'
      editorialFinalPassDetail = `主编终审补救失败：${error instanceof Error ? error.message : '未知错误'}。`
      recordWritingTaskStep(taskTrace, 'editorial-final-pass-repair', 'failed', editorialFinalPassDetail)
      await recordWritingTaskRunStep(detail.book.path, taskRun, 'editorial-final-pass-repair', 'failed', editorialFinalPassDetail, finalContent)
    }
  }

  try {
    assertNotAborted(signal)
    emitProgress('reader-simulation', 'Running reader simulation')
    readerSimulation = buildLocalReaderSimulationResult({
      content: finalContent,
      chapterStrategy,
      taskCard,
      stateGate,
      progressGate,
      executionGate,
      naturalProseDetail,
    })
    readerSimulationDetail = [
      '# 读者试读模拟',
      '',
      `- 评分：${readerSimulation.score ?? 0}`,
      `- 结论：${readerSimulation.passed ? '可通过' : '建议再看一眼'}`,
      '',
      '## 提示',
      ...(readerSimulation.warnings.length ? readerSimulation.warnings : ['暂无']),
    ].join('\n')
    recordWritingTaskStep(taskTrace, 'reader-simulation', readerSimulation.passed ? 'success' : 'failed', readerSimulation.warnings.join('；') || '读者试读模拟通过')
    await recordWritingTaskRunStep(detail.book.path, taskRun, 'reader-simulation', readerSimulation.passed ? 'success' : 'failed', readerSimulation.warnings.join('；') || '读者试读模拟通过', finalContent)
  } catch (error) {
    directorStatus = 'needs-review'
    readerSimulation = {
      passed: false,
      warnings: [error instanceof Error ? error.message : '读者试读模拟失败'],
      score: 0,
    }
    readerSimulationDetail = [
      '# 读者试读模拟',
      '',
      '- 评分：0',
      '- 结论：建议再看一眼',
      '',
      '## 提示',
      ...(readerSimulation.warnings.length ? readerSimulation.warnings : ['暂无']),
    ].join('\n')
    recordWritingTaskStep(taskTrace, 'reader-simulation', 'failed', readerSimulation.warnings.join('；') || '读者试读模拟失败')
    await recordWritingTaskRunStep(detail.book.path, taskRun, 'reader-simulation', 'failed', readerSimulation.warnings.join('；') || '读者试读模拟失败', finalContent)
  }

  assertNotAborted(signal)
  const editorialFinalPassWarnings = editorialFinalPass.warnings
  const readerSimulationWarnings = readerSimulation.warnings
  const qualityGatePassed = typeof qualityScore === 'number' ? qualityScore >= 80 : directorStatus === 'ready' || directorStatus === 'auto-revised'
  if (!qualityGatePassed) {
    directorStatus = 'needs-review'
  }
  if (!stateGate.passed) {
    directorStatus = 'needs-review'
  }
  if (!progressGate.passed) {
    directorStatus = 'needs-review'
  }
  if (!executionGate.passed) {
    directorStatus = 'needs-review'
  }
  if (!editorialFinalPass.passed) {
    directorStatus = 'needs-review'
  }
  if (!readerSimulation.passed) {
    directorStatus = 'needs-review'
  }
  taskRun.status = directorStatus === 'needs-review' ? 'needs-review' : 'completed'
  taskRun.partialContent = finalContent
  await persistWritingTaskRun(detail.book.path, taskRun)
  assertNotAborted(signal)
  const finalDraftGateWarnings = dedupeDraftGateWarnings({
    stateWarnings: [...stateGate.warnings, ...progressGate.warnings],
    qualityWarnings: [...executionGate.warnings, ...editorialFinalPassWarnings, ...readerSimulationWarnings],
  })
  const nextChapterReadiness = buildNextChapterReadiness({
    selectedChapter: detail.selectedChapter,
    progressPatch,
    memoryPatch,
    futurePlanPatch,
    structuredPatch,
    stateGateWarnings: finalDraftGateWarnings.stateGateWarnings,
    qualityGateWarnings: finalDraftGateWarnings.qualityGateWarnings,
  })
  const companion90Summary = buildCompanion90FlowSummary({
    draft: {
      taskCard,
      directorDetail: true,
      nextChapterReadiness,
      stateGateWarnings: finalDraftGateWarnings.stateGateWarnings,
      qualityGateWarnings: finalDraftGateWarnings.qualityGateWarnings,
      directorStatus,
    },
  })

  return {
    title: directorStatus === 'auto-revised' ? '正文候选（已自动修订）' : directorStatus === 'needs-review' ? '正文候选（建议复核）' : '正文候选',
    content: finalContent,
    taskCard,
    selfCheck,
    selfCheckFailed,
    statePatch,
    progressPatch,
    memoryPatch,
    structuredPatch,
    futurePlanPatch,
    stylePatch,
    memoryGovernancePatch,
    stateGateWarnings: finalDraftGateWarnings.stateGateWarnings,
    qualityGateWarnings: finalDraftGateWarnings.qualityGateWarnings,
    qualityScore,
    qualityGatePassed,
    nextChapterReadiness,
    companion90Summary: buildCompanion90FlowSummary({
      draft: {
        taskCard,
        directorDetail: true,
        nextChapterReadiness,
        stateGateWarnings: finalDraftGateWarnings.stateGateWarnings,
        qualityGateWarnings: finalDraftGateWarnings.qualityGateWarnings,
        directorStatus,
      },
    }),
    directorStatus,
    directorDetail: buildDirectorDetail({
      chapterStrategy,
      taskCard,
      draft,
      selfCheck,
      finalSync,
      finalContent,
      statePatch,
      progressPatch,
      memoryPatch,
      structuredPatch,
      futurePlanPatch,
      stylePatch,
      memoryGovernancePatch,
      qualityScore,
      qualityGatePassed,
      directorStatus,
      selfCheckFailed,
      revisionError,
      taskTrace,
      nextChapterReadiness,
      stateGate: {
        passed: stateGate.passed && progressGate.passed && executionGate.passed,
        warnings: [...stateGate.warnings, ...progressGate.warnings, ...executionGate.warnings],
      },
      naturalProseDetail,
      editorialFinalPassDetail,
      readerSimulationDetail,
    }),
  }
}

async function generateAiEditCandidate(input) {
  return runCancellableAiTask(input, async (signal) => {
    const detail = await buildBookDetail(input.bookPath, input.chapterFile)
    if (!detail.selectedChapter) {
      throw new Error('\u8bf7\u5148\u9009\u62e9\u7ae0\u8282')
    }

    const mode = ['continue', 'check', 'revise', 'revise-continuation'].includes(input.mode) ? input.mode : 'continue'
    const context = await readProjectContext(input.bookPath, detail.selectedChapter)
    const instruction = typeof input.instruction === 'string' ? input.instruction : ''
    const promptCacheKey = createBookWritingPromptCacheKey(input.bookPath)
    const requestId = typeof input.requestId === 'string' ? input.requestId : ''
    const emitProgress = createAiTaskProgressEmitter({
      requestId,
      scope: 'ai-edit-candidate',
      label: 'AI writing',
    })
    emitProgress('prepare', 'Preparing chapter context')

    if (mode === 'revise-continuation') {
      const taskCard = typeof input.taskCard === 'string' ? input.taskCard : ''
      const selfCheck = typeof input.selfCheck === 'string' ? input.selfCheck : ''
      const draftContent = typeof input.draftContent === 'string' ? input.draftContent : ''

      if (!taskCard || !selfCheck || !draftContent) {
        throw new Error('\u7f3a\u5c11\u4efb\u52a1\u5361\u3001\u81ea\u68c0\u62a5\u544a\u6216\u7eed\u5199\u521d\u7a3f\uff0c\u65e0\u6cd5\u6309\u81ea\u68c0\u4fee\u8ba2')
      }

      emitProgress('revise', 'Rewriting candidate from self-check')
      let content = assertCleanChapterDraftContent(await callOpenAiTextPreferStream({
        input: buildChapterSelfCheckRevisionPrompt({
          instruction,
          book: detail.book,
          selectedChapter: detail.selectedChapter,
          context,
          taskCard,
          selfCheck,
          draft: draftContent,
        }),
        temperature: 0.45,
        maxOutputTokens: aiOutputLimits.chapterSelfCheckRevision,
        reasoningEffort: 'medium',
        promptCacheKey,
        signal,
        onDelta: (streamContent) => {
          emitProgress('revise', 'Rewriting ' + countTextWords(streamContent) + ' chars', streamContent)
        },
        onFallback: (error) => {
          emitProgress('revise', 'Streaming failed, falling back to normal generation: ' + (error instanceof Error ? error.message : 'unknown error'))
        },
      }), '\u6309\u81ea\u68c0\u4fee\u8ba2\u5019\u9009')
      content = await enforceChapterWordBudget({
        detail,
        content,
        promptCacheKey,
        signal,
        sourceLabel: 'self-check edit candidate',
        reason: 'self-check edit candidate must keep platform chapter length',
      })
      emitProgress('done', 'Revision candidate ready', content, 'done')

      return {
        title: '\u6309\u81ea\u68c0\u4fee\u8ba2\u5019\u9009',
        content,
        taskCard,
        selfCheck,
      }
    }

    if (mode === 'continue') {
      emitProgress('draft', 'Starting writing director')
      const writingCandidate = await runChapterWritingDirector({
        instruction,
        detail,
        context,
        promptCacheKey,
        signal,
        reportProgress: (event) => emitProgress(event.phase, event.detail, event.preview, event.status),
      })
      emitProgress('done', 'Writing candidate ready', writingCandidate.content, 'done')
      return writingCandidate
    }

    const editPrompt = buildAiEditPrompt({
      mode,
      instruction,
      book: detail.book,
      selectedChapter: detail.selectedChapter,
      context,
    })
    emitProgress(mode === 'check' ? 'check' : 'revise', mode === 'check' ? 'Checking chapter' : 'Rewriting chapter')
    let content = assertCleanChapterDraftContent(await callOpenAiTextPreferStream({
      input: editPrompt,
      temperature: mode === 'check' ? 0.2 : 0.55,
      maxOutputTokens: mode === 'check' ? aiOutputLimits.checkChapter : undefined,
      reasoningEffort: mode === 'check' ? 'low' : 'medium',
      promptCacheKey,
      signal,
      onDelta: (streamContent) => {
        emitProgress(mode === 'check' ? 'check' : 'revise', 'Generating ' + countTextWords(streamContent) + ' chars', streamContent)
      },
      onFallback: (error) => {
        emitProgress(mode === 'check' ? 'check' : 'revise', 'Streaming failed, falling back to normal generation: ' + (error instanceof Error ? error.message : 'unknown error'))
      },
    }), '\u5355\u6b65\u91cd\u8bd5\u5019\u9009')

    if (mode === 'revise') {
      content = await enforceChapterWordBudget({
        detail,
        content,
        promptCacheKey,
        signal,
        sourceLabel: 'revise candidate',
        reason: 'manual revise candidate must keep platform chapter length',
      })
    }
    const candidateContent = mode === 'revise' ? assertCleanChapterDraftContent(content, '\u4fee\u8ba2\u5019\u9009') : content
    emitProgress('done', 'Candidate ready', candidateContent, 'done')

    return {
      title: {
        continue: '\u7eed\u5199\u5019\u9009',
        check: '\u672c\u7ae0\u68c0\u67e5\u5019\u9009',
        revise: '\u4fee\u8ba2\u5019\u9009',
      }[mode],
      content: candidateContent,
    }
  })
}

async function retryWritingTaskStep(input) {
  return runCancellableAiTask(input, async (signal) => {
    const latest = await getLatestRecoverableWritingTaskRun(input)
    if (!latest) {
      throw new Error('没有可重试的写作任务')
    }

    const step = typeof input?.step === 'string' ? input.step : 'self-check'
    const detail = await buildBookDetail(input.bookPath, latest.chapterFile || input.chapterFile)
    const context = await readProjectContext(input.bookPath, detail.selectedChapter)
    const promptCacheKey = createBookWritingPromptCacheKey(input.bookPath)
    const payload = latest.payload || {}

    if (step === 'draft') {
      return runChapterWritingDirector({
        instruction: payload.instruction || '',
        detail,
        context,
        promptCacheKey,
        signal,
      })
    }

    const taskCard = payload.taskCard || '根据当前章节资料继续执行。'
    const selfCheck = payload.selfCheck || '上一轮任务中断，按当前半成品重新修订。'
    const content = await callOpenAiText({
      input: buildChapterSelfCheckRevisionPrompt({
        instruction: payload.instruction || '',
        book: detail.book,
        selectedChapter: detail.selectedChapter,
        context,
        taskCard,
        selfCheck,
        draft: latest.partialContent,
      }),
      temperature: 0.45,
      maxOutputTokens: aiOutputLimits.chapterSelfCheckRevision,
      reasoningEffort: 'medium',
      promptCacheKey,
      signal,
    })

    return {
      title: '单步重试候选',
      content,
      taskCard,
      selfCheck,
      directorStatus: 'needs-review',
      directorDetail: `# 单步重试\n\n- 来源任务：${latest.id}\n- 重试步骤：${step}\n- 原任务状态：${latest.status}`,
    }
  })
}

function buildChapterFeedbackPackagePrompt({ feedback, book, selectedChapter, context, currentContent }) {
  const executionContract = buildChapterExecutionContract({ book, selectedChapter, context, instruction: feedback })
  return [
    buildChapterStableContext({ book, context }),
    '',
    '# 当前任务',
    '你是长篇网文连载的章节主编。用户已经读完当前章，认为这一章不行。',
    '任务：根据用户反馈，判断问题是只影响本章，还是会贯穿全篇；然后给出一份“反馈修改包”。',
    '反馈修改包必须同时解决两个目标：',
    '1. 把当前章重写到可用状态。',
    '2. 把需要长期记住的规则、状态、未来承接点沉淀出来，供后续章节继续使用。',
    '',
    '# 用户反馈',
    feedback,
    '',
    executionContract,
    '',
    '# 输出硬规则',
    '- 必须保留章节标题。',
    '- 不要只给建议，必须输出完整的本章重写稿。',
    '- 如果用户反馈涉及贯穿全篇的规则、人物动机、题材味道、系统机制、经验等级、任务线、角色关系、伏笔或未来章节承接，必须写入长期记忆更新和对应同步区。',
    '- 如果只是本章局部问题，也要在影响范围中说明“只影响本章”。',
    '- 网游文必须检查并保留玩家感、系统反馈、任务/经验/技能/装备/NPC/公告/玩家反应等题材信号，不能滑成纯玄幻或泛升级文。',
    '- 重写稿必须解决原地踏步问题：至少让主线、阻碍、爽点、信息差、伏笔或类型状态之一发生可追踪变化。',
    '',
    '# 输出格式',
    '严格使用下面这些 Markdown 二级标题，不要增加其他二级标题：',
    '## 反馈理解',
    '- 用户真正不满意的点：',
    '- 本次修改目标：',
    '',
    '## 影响范围',
    '- 本章局部修改：',
    '- 需要长期记住：',
    '- 需要更新的项目资料：',
    '',
    '## 长期记忆更新',
    '- 后续必须遵守：',
    '- 后续必须避免：',
    '- 下一章承接：',
    '',
    '## 本章重写稿',
    `# ${selectedChapter?.title ?? '当前章节'}`,
    '',
    '## 章节后状态更新',
    '- 类型连续变量：',
    '- 未变化但必须承接：',
    '',
    '## 章节推进更新',
    '- 本章功能结果：',
    '- 本章实际推进：',
    '- 下一章必须承接：',
    '- 重复风险：',
    '',
    '## 章节记忆更新',
    '- 本章摘要：',
    '- 本章功能：',
    '- 题材信号：',
    '- 必须承接：',
    '- 最近三章风险：',
    '',
    '## 结构化状态更新',
    '{"currentChapter":"","protagonist":{"status":"","goal":"","ability":"","resources":[],"constraints":[]},"plot":{"stageGoal":"","currentObstacle":"","lastProgress":"","nextRequiredMove":""},"genreSignals":[],"openLoops":[],"recentChapterFunctions":[]}',
    '',
    '## 未来章节规划更新',
    '- 未来 3-5 章：',
    '- 下一章主功能：',
    '- 下一章必须承接：',
    '- 下一章必须避免：',
    '',
    '## 风格校准更新',
    '- 本次反馈后的风格要求：',
    '- 好段落特征：',
    '- 应避免写法：',
    '',
    '## 记忆治理更新',
    '- 强规则：',
    '- 当前事实：',
    '- 历史记录：',
    '- 未来计划：',
    '- 临时观察：',
    '',
    buildChapterDynamicContext({ selectedChapter, context }),
    '',
    '# 用户当前编辑器里的本章正文',
    currentContent || context.currentChapter || '暂无',
  ].filter(Boolean).join('\n')
}

async function generateChapterFeedbackPackage(input) {
  return runCancellableAiTask(input, async (signal) => {
    const detail = await buildBookDetail(input.bookPath, input.chapterFile)
    if (!detail.selectedChapter) {
      throw new Error('请先选择章节')
    }

    const feedback = typeof input.feedback === 'string' ? input.feedback.trim() : ''
    if (!feedback) {
      throw new Error('请先写下你觉得这一章哪里不行')
    }

    const context = await readProjectContext(input.bookPath, detail.selectedChapter)
    const currentContent = typeof input.currentContent === 'string' && input.currentContent.trim() ? input.currentContent : detail.content
    const promptCacheKey = createBookWritingPromptCacheKey(input.bookPath)
    const content = await callOpenAiText({
      input: buildChapterFeedbackPackagePrompt({
        feedback,
        book: detail.book,
        selectedChapter: detail.selectedChapter,
        context,
        currentContent,
      }),
      temperature: 0.45,
      maxOutputTokens: aiOutputLimits.chapterFeedbackPackage,
      reasoningEffort: 'medium',
      promptCacheKey,
      signal,
    })
    let rewritten = await enforceChapterWordBudget({
      detail,
      content: parseSyncSection(content, '本章重写稿'),
      promptCacheKey,
      signal,
      sourceLabel: '\u53cd\u9988\u91cd\u5199\u7a3f',
      reason: 'feedback rewrite must keep platform chapter length',
    })
    let statePatch = parseSyncSection(content, '章节后状态更新')
    let progressPatch = parseSyncSection(content, '章节推进更新')
    let stateGate = evaluateChapterStateGate({ context, content: rewritten, statePatch, progressPatch })
    const feedbackExecutionContract = buildChapterExecutionContract({ book: detail.book, selectedChapter: detail.selectedChapter, context, instruction: feedback })
    let feedbackMemoryPatch = parseSyncSection(content, '章节记忆更新')
    let feedbackStructuredPatch = parseSyncSection(content, '结构化状态更新')
    let feedbackFuturePlanPatch = parseSyncSection(content, '未来章节规划更新')
    let feedbackStylePatch = parseSyncSection(content, '风格校准更新')
    let feedbackMemoryGovernancePatch = parseSyncSection(content, '记忆治理更新')
    let feedbackQualityScore = parseQualityScore(content)
    let feedbackNaturalProseDetail = ''
    let feedbackFinalSync = ''
    let feedbackEditorialFinalPass = { passed: true, warnings: [] }
    let feedbackDirectorDetail = content
    let progressGate = evaluateChapterProgressGate({
      context,
      content: rewritten,
      statePatch,
      progressPatch,
      memoryPatch: feedbackMemoryPatch,
      structuredPatch: feedbackStructuredPatch,
      futurePlanPatch: feedbackFuturePlanPatch,
    })
    let executionGate = evaluateChapterExecutionGate({
      executionContract: feedbackExecutionContract,
      context,
      content: rewritten,
      statePatch,
      progressPatch,
      memoryPatch: feedbackMemoryPatch,
      structuredPatch: feedbackStructuredPatch,
      futurePlanPatch: feedbackFuturePlanPatch,
    })

    if (!rewritten || rewritten === '\u6682\u65e0') {
      throw new Error('反馈修改包没有返回本章重写稿')
    }

    try {
      rewritten = await calibrateNaturalProse({
        detail,
        context,
        taskCard: feedback,
        content: rewritten,
        executionContract: feedbackExecutionContract,
        promptCacheKey,
        signal,
      })
      feedbackNaturalProseDetail = '反馈改稿已完成自然文风校准。'
      const synced = await syncFinalDraftState({
        detail,
        context,
        taskCard: feedback,
        finalContent: rewritten,
        executionContract: feedbackExecutionContract,
        promptCacheKey,
        signal,
      })
      feedbackFinalSync = synced.finalSync
      statePatch = synced.statePatch || statePatch
      progressPatch = synced.progressPatch || progressPatch
      feedbackMemoryPatch = synced.memoryPatch || feedbackMemoryPatch
      feedbackStructuredPatch = synced.structuredPatch || feedbackStructuredPatch
      feedbackFuturePlanPatch = synced.futurePlanPatch || feedbackFuturePlanPatch
      feedbackStylePatch = synced.stylePatch || feedbackStylePatch
      feedbackMemoryGovernancePatch = synced.memoryGovernancePatch || feedbackMemoryGovernancePatch
      feedbackQualityScore = synced.qualityScore ?? feedbackQualityScore
      stateGate = evaluateChapterStateGate({ context, content: rewritten, statePatch, progressPatch })
      progressGate = evaluateChapterProgressGate({
        context,
        content: rewritten,
        statePatch,
        progressPatch,
        memoryPatch: feedbackMemoryPatch,
        structuredPatch: feedbackStructuredPatch,
        futurePlanPatch: feedbackFuturePlanPatch,
      })
      executionGate = evaluateChapterExecutionGate({
        executionContract: feedbackExecutionContract,
        context,
        content: rewritten,
        statePatch,
        progressPatch,
        memoryPatch: feedbackMemoryPatch,
        structuredPatch: feedbackStructuredPatch,
        futurePlanPatch: feedbackFuturePlanPatch,
      })
    } catch (error) {
      feedbackNaturalProseDetail = `反馈改稿自然文风校准失败：${error instanceof Error ? error.message : '未知错误'}`
    }

    feedbackEditorialFinalPass = evaluateEditorialFinalPass({
      context,
      content: rewritten,
      qualityScore: feedbackQualityScore,
      stateGate,
      progressGate,
      executionGate,
      naturalProseDetail: feedbackNaturalProseDetail,
    })

    if (!feedbackEditorialFinalPass.passed) {
      try {
        const feedbackEditorialFinalPassRepairStep = 'feedback-editorial-final-pass-repair'
        rewritten = assertCleanChapterDraftContent(await callOpenAiText({
          input: buildEditorialFinalPassRevisionPrompt({
            instruction: feedback,
            book: detail.book,
            selectedChapter: detail.selectedChapter,
            context,
            taskCard: feedback,
            finalPass: feedbackEditorialFinalPass,
            finalContent: rewritten,
            executionContract: feedbackExecutionContract,
          }),
          temperature: 0.42,
          maxOutputTokens: aiOutputLimits.chapterSelfCheckRevision,
          promptCacheKey,
          signal,
        }), '反馈主编终审修订稿')
        rewritten = await enforceChapterWordBudget({
          detail,
          content: rewritten,
          promptCacheKey,
          signal,
          sourceLabel: 'feedback editorial final pass revision',
          reason: 'feedback editorial revision must keep platform chapter length',
        })
        const synced = await syncFinalDraftState({
          detail,
          context,
          taskCard: feedback,
          finalContent: rewritten,
          executionContract: feedbackExecutionContract,
          promptCacheKey,
          signal,
        })
        feedbackFinalSync = synced.finalSync
        statePatch = synced.statePatch || statePatch
        progressPatch = synced.progressPatch || progressPatch
        feedbackMemoryPatch = synced.memoryPatch || feedbackMemoryPatch
        feedbackStructuredPatch = synced.structuredPatch || feedbackStructuredPatch
        feedbackFuturePlanPatch = synced.futurePlanPatch || feedbackFuturePlanPatch
        feedbackStylePatch = synced.stylePatch || feedbackStylePatch
        feedbackMemoryGovernancePatch = synced.memoryGovernancePatch || feedbackMemoryGovernancePatch
        feedbackQualityScore = synced.qualityScore ?? feedbackQualityScore
        stateGate = evaluateChapterStateGate({ context, content: rewritten, statePatch, progressPatch })
        progressGate = evaluateChapterProgressGate({
          context,
          content: rewritten,
          statePatch,
          progressPatch,
          memoryPatch: feedbackMemoryPatch,
          structuredPatch: feedbackStructuredPatch,
          futurePlanPatch: feedbackFuturePlanPatch,
        })
        executionGate = evaluateChapterExecutionGate({
          executionContract: feedbackExecutionContract,
          context,
          content: rewritten,
          statePatch,
          progressPatch,
          memoryPatch: feedbackMemoryPatch,
          structuredPatch: feedbackStructuredPatch,
          futurePlanPatch: feedbackFuturePlanPatch,
        })
        feedbackEditorialFinalPass = evaluateEditorialFinalPass({
          context,
          content: rewritten,
          qualityScore: feedbackQualityScore,
          stateGate,
          progressGate,
          executionGate,
          naturalProseDetail: feedbackNaturalProseDetail,
        })
      } catch (error) {
        feedbackNaturalProseDetail = `${feedbackNaturalProseDetail}\n反馈主编终审补救失败：${error instanceof Error ? error.message : '未知错误'}`
      }
    }
    const feedbackEditorialFinalPassWarnings = feedbackEditorialFinalPass.warnings
    feedbackDirectorDetail = [
      content,
      '',
      '## 反馈改稿主编链路',
      `- 自然文风校准：${feedbackNaturalProseDetail || '未执行'}`,
      `- 主编终审：${feedbackEditorialFinalPass.passed ? '通过' : '仍需复核'}`,
      feedbackEditorialFinalPassWarnings.map((warning) => `- ${warning}`).join('\n') || '- 暂无终审风险',
      '',
      '## 反馈改稿最终同步',
      feedbackFinalSync || '暂无',
    ].join('\n')

    const feedbackGateWarnings = dedupeDraftGateWarnings({
      stateWarnings: [...stateGate.warnings, ...progressGate.warnings],
      qualityWarnings: [...executionGate.warnings, ...feedbackEditorialFinalPassWarnings],
    })

    return {
      title: '反馈修改包',
      content: rewritten,
      feedbackSummary: parseOptionalSyncSection(content, '反馈理解'),
      impactSummary: parseOptionalSyncSection(content, '影响范围'),
      longTermMemory: parseOptionalSyncSection(content, '长期记忆更新'),
      statePatch,
      progressPatch,
      memoryPatch: feedbackMemoryPatch,
      structuredPatch: feedbackStructuredPatch,
      futurePlanPatch: feedbackFuturePlanPatch,
      stylePatch: feedbackStylePatch,
      memoryGovernancePatch: feedbackMemoryGovernancePatch,
      stateGateWarnings: feedbackGateWarnings.stateGateWarnings,
      qualityGateWarnings: feedbackGateWarnings.qualityGateWarnings,
      qualityScore: feedbackQualityScore,
      qualityGatePassed: typeof feedbackQualityScore === 'number' ? feedbackQualityScore >= 80 && feedbackEditorialFinalPass.passed : feedbackEditorialFinalPass.passed,
      directorStatus: feedbackEditorialFinalPass.passed ? 'auto-revised' : 'needs-review',
      directorDetail: feedbackDirectorDetail,
    }
  })
}

function buildSmartFeedbackRoutingPrompt({ book, selectedChapter, context, feedback, gateWarnings }) {
  return [
    '你是长篇网文写作软件的反馈分流器。',
    '任务：根据用户一句话反馈，判断应该修改当前章、修复长期项目资料，还是两者都要做。',
    '只输出 JSON，不要 markdown 代码块，不要解释。',
    '',
    '# 输出 JSON 格式',
    '{"chapterAction":"rewrite|none","projectAction":"repair|none","targetMaterialIds":[],"reason":"","userFacingSummary":"","companionDecision":{"understoodProblem":"","plannedAction":"","impactScope":"","applyAdvice":"apply|review|reject","userNextStep":""}}',
    '',
    '# 判断规则',
    '- 只影响当前章的节奏、描写、对话、爽点、章末钩子：chapterAction=rewrite，projectAction=none。',
    '- 涉及贯穿全篇的规则、题材味道、主角动机、能力机制、任务线、角色关系、伏笔、未来章节承接：projectAction=repair。',
    '- 当前章也需要改写时，chapterAction=rewrite。',
    '- 网游味不够、升级没后果、任务没推进、系统反馈缺失，一般两者都要做。',
    '- targetMaterialIds 从 genreRules/coreSetting/mainCharacter/supportingCharacters/overallOutline/volumeOutline/chapterOutline/tracking/storyState/chapterProgress/chapterMemory/structuredState/futurePlan/memoryGovernance/styleSample 中选择。',
    '',
    `书名：${book.title}`,
    `平台：${book.platform}`,
    `当前章节：${selectedChapter?.title ?? '未选择'}`,
    '',
    '# 用户反馈',
    feedback,
    '',
    '# 门禁警告',
    gateWarnings?.length ? gateWarnings.map((warning) => `- ${warning}`).join('\n') : '- 暂无',
    '',
    '# 当前写作依据摘要',
    compactProjectContextForUpdate(context, ['genreRules', 'coreSetting', 'mainCharacter', 'supportingCharacters', 'overallOutline', 'volumeOutline', 'chapterOutline', 'tracking', 'storyState', 'chapterProgress', 'chapterMemory', 'structuredState', 'futurePlan', 'memoryGovernance', 'styleSample']),
  ].join('\n')
}

function normalizeCompanionDecision(rawDecision, fallback = {}) {
  const decision = rawDecision && typeof rawDecision === 'object' ? rawDecision : {}
  const applyAdvice = ['apply', 'review', 'reject'].includes(decision.applyAdvice) ? decision.applyAdvice : 'review'

  return {
    understoodProblem: typeof decision.understoodProblem === 'string'
      ? limitText(decision.understoodProblem, 500)
      : limitText(fallback.understoodProblem || '', 500),
    plannedAction: typeof decision.plannedAction === 'string'
      ? limitText(decision.plannedAction, 500)
      : limitText(fallback.plannedAction || '', 500),
    impactScope: typeof decision.impactScope === 'string'
      ? limitText(decision.impactScope, 500)
      : limitText(fallback.impactScope || '', 500),
    applyAdvice,
    userNextStep: typeof decision.userNextStep === 'string'
      ? limitText(decision.userNextStep, 500)
      : limitText(fallback.userNextStep || '', 500),
  }
}

function normalizeSmartFeedbackRoute(rawRoute) {
  const route = rawRoute && typeof rawRoute === 'object' ? rawRoute : {}
  const chapterAction = route.chapterAction === 'none' ? 'none' : 'rewrite'
  const projectAction = route.projectAction === 'repair' ? 'repair' : 'none'
  const targetMaterialIds = Array.isArray(route.targetMaterialIds)
    ? route.targetMaterialIds.filter((id) => typeof id === 'string' && id.trim()).slice(0, projectUpdateMaxMaterials)
    : []

  return {
    chapterAction,
    projectAction,
    targetMaterialIds,
    reason: typeof route.reason === 'string' ? limitText(route.reason, 500) : '',
    userFacingSummary: typeof route.userFacingSummary === 'string' ? limitText(route.userFacingSummary, 500) : '',
    companionDecision: normalizeCompanionDecision(route.companionDecision, {
      understoodProblem: typeof route.userFacingSummary === 'string' ? route.userFacingSummary : '',
      plannedAction: `${chapterAction === 'rewrite' ? '重写当前章' : '不重写当前章'}；${projectAction === 'repair' ? '同步修复项目资料' : '暂不修复项目资料'}`,
      impactScope: projectAction === 'repair' ? '这次反馈会影响后续章节，需要同步长期资料。' : '这次反馈主要影响当前章。',
      userNextStep: '看一眼搭档判断，确认方向后再应用候选。',
    }),
  }
}

async function generateSmartFeedbackPackage(input) {
  return runCancellableAiTask(input, async (signal) => {
    const detail = await buildBookDetail(input.bookPath, input.chapterFile)
    if (!detail.selectedChapter) {
      throw new Error('请先选择章节')
    }

    const feedback = typeof input.feedback === 'string' ? input.feedback.trim() : ''
    if (!feedback) {
      throw new Error('请先写下你觉得这一章哪里不行')
    }

    const gateWarnings = Array.isArray(input.gateWarnings) ? input.gateWarnings.filter((warning) => typeof warning === 'string') : []
    const context = await readProjectContext(input.bookPath, detail.selectedChapter)
    const promptCacheKey = createBookWritingPromptCacheKey(input.bookPath)
    const routeText = await callOpenAiText({
      input: buildSmartFeedbackRoutingPrompt({
        book: detail.book,
        selectedChapter: detail.selectedChapter,
        context,
        feedback,
        gateWarnings,
      }),
      temperature: 0.15,
      maxOutputTokens: 700,
      reasoningEffort: 'low',
      promptCacheKey,
      signal,
    })
    const smartFeedbackRoute = normalizeSmartFeedbackRoute(tryExtractJsonObject(routeText))
    const shouldRewriteChapter = smartFeedbackRoute.chapterAction === 'rewrite'
    const shouldRepairProject = smartFeedbackRoute.projectAction === 'repair' || smartFeedbackRoute.targetMaterialIds.length > 0 || gateWarnings.length > 0

    let chapterPackage = null
    let projectRepairPackage = null

    if (shouldRewriteChapter) {
      chapterPackage = await generateChapterFeedbackPackage({
        bookPath: input.bookPath,
        chapterFile: detail.selectedChapter.file,
        feedback,
        currentContent: typeof input.currentContent === 'string' ? input.currentContent : detail.content,
        requestId: '',
      })
    }

    if (shouldRepairProject) {
      projectRepairPackage = await generateProjectRepairPackage({
        bookPath: input.bookPath,
        chapterFile: detail.selectedChapter.file,
        feedback: [
          feedback,
          smartFeedbackRoute.reason ? `分流原因：${smartFeedbackRoute.reason}` : '',
          smartFeedbackRoute.companionDecision?.impactScope ? `搭档影响判断：${smartFeedbackRoute.companionDecision.impactScope}` : '',
          smartFeedbackRoute.targetMaterialIds.length ? `建议资料：${smartFeedbackRoute.targetMaterialIds.join('、')}` : '',
        ].filter(Boolean).join('\n'),
        gateWarnings,
        requestId: '',
      })
    }

    if (!chapterPackage && !projectRepairPackage) {
      chapterPackage = await generateChapterFeedbackPackage({
        bookPath: input.bookPath,
        chapterFile: detail.selectedChapter.file,
        feedback,
        currentContent: typeof input.currentContent === 'string' ? input.currentContent : detail.content,
        requestId: '',
      })
    }

    return {
      title: chapterPackage?.title || projectRepairPackage?.title || '智能反馈处理包',
      smartFeedbackRoute,
      chapterPackage,
      projectRepairPackage,
      projectImpactMap: projectRepairPackage?.impactMap || null,
    }
  })
}

function buildMemoryCompactionPrompt({ book, context }) {
  return [
    '你是长篇网文项目的记忆治理编辑。',
    '任务：把长期追加的项目记忆压缩成清晰、可继续写作的当前资料。',
    '不要写正文，不要改大纲，只整理记忆。',
    '',
    '# 输出格式',
    '严格使用以下二级标题：',
    '## 记忆治理索引',
    '- 强规则：',
    '- 当前事实：',
    '- 历史记录：',
    '- 未来计划：',
    '- 临时观察：',
    '',
    '## 类型状态卡',
    '- 当前连续变量：',
    '- 必须承接：',
    '- 已关闭状态：',
    '',
    '## 章节推进状态',
    '- 最近三章功能：',
    '- 当前主线推进：',
    '- 下一章必须推进：',
    '- 必须避免：',
    '',
    '## 最近章节记忆',
    '- 最近章节摘要：',
    '- 题材信号：',
    '- 角色状态：',
    '- 未解决问题：',
    '',
    '## 未来章节规划',
    '- 未来 3-5 章：',
    '- 下一章主功能：',
    '- 下一章必须承接：',
    '- 下一章必须避免：',
    '',
    `书名：${book.title}`,
    `平台：${book.platform}`,
    '',
    '# 当前资料',
    '## 记忆治理索引',
    context.memoryGovernance,
    '## 类型状态卡',
    context.storyState,
    '## 章节推进状态',
    context.chapterProgress,
    '## 最近章节记忆',
    context.chapterMemory,
    '## 未来章节规划',
    context.futurePlan,
    '## 结构化状态机',
    context.structuredState,
    '## 题材规则',
    context.genreRules,
    '## 总纲',
    context.overallOutline,
  ].join('\n')
}

async function compactProjectMemory(input) {
  return runCancellableAiTask(input, async (signal) => {
    const detail = await buildBookDetail(input.bookPath, input.chapterFile)
    const context = await readProjectContext(input.bookPath, detail.selectedChapter)
    const emitProgress = createAiTaskProgressEmitter({
      requestId: typeof input.requestId === 'string' ? input.requestId : '',
      scope: 'memory-compaction',
      label: 'Memory compaction',
    })
    emitProgress('prepare', 'Preparing project memory')
    const content = await callOpenAiTextPreferStream({
      input: buildMemoryCompactionPrompt({ book: detail.book, context: compileChapterWritingContext(context) }),
      temperature: 0.2,
      maxOutputTokens: aiOutputLimits.projectUpdatePatch,
      reasoningEffort: 'low',
      promptCacheKey: createBookWritingPromptCacheKey(input.bookPath),
      signal,
      onDelta: (streamContent) => {
        emitProgress('compact', 'Compacting ' + countTextWords(streamContent) + ' chars', streamContent)
      },
      onFallback: (error) => {
        emitProgress('compact', 'Streaming failed, falling back to normal generation: ' + (error instanceof Error ? error.message : 'unknown error'))
      },
    })
    const updates = [
      {
        id: 'memoryGovernance',
        file: `${names.tracking}/memory-index.md`,
        label: '记忆治理索引',
        reason: '整理长期记忆，减少重复和冲突',
        patch: parseSyncSection(content, '记忆治理索引'),
      },
      {
        id: 'storyState',
        file: `${names.tracking}/story-state.md`,
        label: '类型状态卡',
        reason: '压缩当前类型连续状态',
        patch: parseSyncSection(content, '类型状态卡'),
      },
      {
        id: 'chapterProgress',
        file: `${names.tracking}/chapter-progress.md`,
        label: '章节推进状态',
        reason: '压缩章节推进状态',
        patch: parseSyncSection(content, '章节推进状态'),
      },
      {
        id: 'chapterMemory',
        file: `${names.tracking}/chapter-memory.md`,
        label: '最近章节记忆',
        reason: '压缩最近章节记忆',
        patch: parseSyncSection(content, '最近章节记忆'),
      },
      {
        id: 'futurePlan',
        file: `${names.tracking}/future-plan.md`,
        label: '未来章节规划',
        reason: '压缩未来章节计划',
        patch: parseSyncSection(content, '未来章节规划'),
      },
    ].filter((update) => update.patch && update.patch !== '\u6682\u65e0')

    return {
      title: '长期记忆整理候选',
      content,
      updates,
    }
  })
}

function buildOutlinePrompt({ mode, book, selectedChapter, context }) {
  const isVolume = mode === 'volume'
  const taskLabel = isVolume ? '\u751f\u6210\u7b2c\u4e00\u5377\u5377\u7eb2' : `\u751f\u6210\u201c${selectedChapter?.title ?? '\u5f53\u524d\u7ae0\u8282'}\u201d\u7ec6\u7eb2`
  const outputRule = isVolume
    ? [
        '\u53ea\u8f93\u51fa\u5377\u7eb2 Markdown\uff0c\u4e0d\u8981\u5199\u6b63\u6587\u3002',
        '\u5fc5\u987b\u5305\u542b\uff1a\u672c\u5377\u6838\u5fc3\u76ee\u6807\u3001\u4e3b\u8981\u51b2\u7a81\u3001\u9636\u6bb5\u6027\u723d\u70b9/\u60c5\u7eea\u70b9\u3001\u89d2\u8272\u53d8\u5316\u3001\u4f0f\u7b14\u5e03\u7f6e\u3001\u7ae0\u8282\u63a8\u8fdb\u8868\u3002',
        '\u7ae0\u8282\u63a8\u8fdb\u8868\u8981\u7ed9\u51fa\u81f3\u5c11 10 \u4e2a\u7ae0\u8282\u8282\u70b9\uff0c\u6bcf\u4e2a\u8282\u70b9\u5305\u542b\u529f\u80fd\u3001\u51b2\u7a81\u3001\u723d\u70b9/\u94a9\u5b50\u3002',
      ].join('\n')
    : [
        '\u53ea\u8f93\u51fa\u672c\u7ae0\u7ec6\u7eb2 Markdown\uff0c\u4e0d\u8981\u5199\u6b63\u6587\u3002',
        '\u5fc5\u987b\u5305\u542b\uff1a\u672c\u7ae0\u529f\u80fd\u3001\u672c\u7ae0\u9898\u6750\u5473\u9053\u3001\u51fa\u573a\u4eba\u7269\u3001\u573a\u666f\u987a\u5e8f\u3001\u60c5\u8282\u8282\u70b9\u3001\u5fc5\u987b\u56de\u6536/\u57cb\u4e0b\u7684\u4fe1\u606f\u3001\u7ae0\u672b\u94a9\u5b50\u3002',
        '\u60c5\u8282\u8282\u70b9\u8981\u80fd\u76f4\u63a5\u6307\u5bfc\u4f5c\u8005\u5199\u672c\u7ae0\uff0c\u4e0d\u8981\u53ea\u5199\u7a7a\u6cdb\u65b9\u5411\u3002',
      ].join('\n')

  const planningRule = buildPlatformOutlinePlanningRule({ book, selectedChapter, mode })
  const platformStrategy = getPlatformWritingStrategy(book?.platform)
  const densityRule = isVolume
    ? [
        '',
        '# Volume outline output density',
        `- Use this platform's volume density: ${platformStrategy.volumeRule}`,
        `- First-volume chapter table baseline: at least ${platformStrategy.minVolumeChapters}, target ${platformStrategy.targetVolumeChapters}.`,
        '- Do not write only 10 chapter nodes for a commercial serial volume unless the platform strategy or user explicitly requires it.',
        '- The chapter table should be expandable. If uncertain, create more shorter nodes rather than fewer overloaded nodes.',
        '- Each chapter row must be a chapter-sized slice, not a mini-volume.',
      ].join('\n')
    : [
        '',
        '# Chapter outline output density',
        `- Use this platform's chapter density: ${platformStrategy.chapterRule}`,
        '- Add these sections: "This chapter writes", "This chapter does not write", and "Next chapter carry-over".',
        '- The scene order must be short enough that a writer can finish it within the platform word range.',
        `- Hard density cap: at most ${platformStrategy.maxSceneBeats} scene beats and ${platformStrategy.maxPlotEvents} major plot events unless the user explicitly overrides it.`,
      ].join('\n')

  return [
    '\u4f60\u662f\u957f\u7bc7\u7f51\u6587\u7b56\u5212\u7f16\u8f91\u3002',
    `\u4efb\u52a1\uff1a${taskLabel}\u3002`,
    outputRule,
    planningRule,
    '\u5fc5\u987b\u4f9d\u636e\u5df2\u6709\u5e73\u53f0\u89c4\u5219\u3001\u6838\u5fc3\u8bbe\u5b9a\u3001\u89d2\u8272\u5361\u3001\u603b\u7eb2\u3001\u5df2\u6709\u5377\u7eb2/\u7ec6\u7eb2\u548c\u8ffd\u8e2a\u8868\uff0c\u4e0d\u8981\u63a8\u7ffb\u5df2\u5b9a\u8bbe\u5b9a\u3002',
    '\u9898\u6750\u89c4\u5219\u662f\u786c\u7ea6\u675f\uff1a\u4e0d\u80fd\u8dd1\u9898\u6750\u3002\u751f\u6210\u5377\u7eb2\u6216\u7ec6\u7eb2\u65f6\u5fc5\u987b\u660e\u786e\u672c\u5377/\u672c\u7ae0\u5982\u4f55\u4fdd\u7559\u9898\u6750\u4fe1\u53f7\u3002',
    '题材指纹是辅助参考：细纲可以借鉴样本统计里的节奏、题材变量和去 AI 味建议，但不把样本标签当硬门禁，也不要求逐条命中。',
    buildWritingCompanion90Contract({ mode: 'outline', context }),
    '\u8f93\u51fa\u8981\u5177\u4f53\uff0c\u80fd\u76f4\u63a5\u4f5c\u4e3a\u540e\u7eed\u5199\u6b63\u6587\u7684\u4f9d\u636e\u3002',
    densityRule,
    '',
    `\u4e66\u540d\uff1a${book.title}`,
    `\u5e73\u53f0\uff1a${book.platform}`,
    `\u5f53\u524d\u7ae0\u8282\uff1a${selectedChapter?.title ?? '\u672a\u9009\u62e9'}`,
    '',
    '# \u5199\u4f5c\u4f9d\u636e',
    '## \u5e73\u53f0\u89c4\u5219',
    context.platformFit,
    '## \u9898\u6750\u89c4\u5219',
    context.genreRules,
    buildGenreFingerprintContract(context),
    '## \u6838\u5fc3\u8bbe\u5b9a',
    context.coreSetting,
    '## \u4e3b\u89d2\u5361',
    context.mainCharacter,
    '## \u914d\u89d2\u5361',
    context.supportingCharacters,
    '## \u9f99\u5957\u8bb0\u5f55',
    context.minorCharacters,
    '## \u603b\u7eb2',
    context.overallOutline,
    '## \u9ec4\u91d1\u4e09\u7ae0\u89c4\u5212',
    context.goldenFirstThreeForCurrentChapter || '\u975e\u524d\u4e09\u7ae0\u6216\u6682\u65e0\u4e13\u95e8\u89c4\u5212\u3002',
    '## \u5df2\u6709\u5377\u7eb2',
    context.volumeOutline || '\u6682\u65e0',
    '## \u5df2\u6709\u672c\u7ae0\u7ec6\u7eb2',
    context.chapterOutline || '\u6682\u65e0',
    '## \u8ffd\u8e2a\u8868',
    context.tracking,
    '## \u4e0a\u4e00\u7ae0',
    context.previousChapter || '\u7b2c\u4e00\u7ae0\uff0c\u65e0\u4e0a\u4e00\u7ae0\u3002',
    '## \u5f53\u524d\u7ae0\u8282\u6b63\u6587',
    context.currentChapter || '\u6682\u65e0',
  ].join('\n')
}

function estimateOutlineMaxOutputTokens(mode) {
  return mode === 'chapter' ? 1600 : 2600
}

async function generateOutlineCandidate(input) {
  return runCancellableAiTask(input, async (signal) => {
    const detail = await buildBookDetail(input.bookPath, input.chapterFile)
    const mode = input.mode === 'chapter' ? 'chapter' : 'volume'
    const selectedChapter = detail.selectedChapter

    if (mode === 'chapter' && !selectedChapter) {
      throw new Error('\u8bf7\u5148\u9009\u62e9\u7ae0\u8282')
    }

    const context = selectOutlineContext(await readProjectContext(input.bookPath, selectedChapter), mode)
    const content = await callOpenAiTextPreferStream({
      input: buildOutlinePrompt({
        mode,
        book: detail.book,
        selectedChapter,
        context,
      }),
      temperature: 0.45,
      maxOutputTokens: estimateOutlineMaxOutputTokens(mode),
      reasoningEffort: 'low',
      promptCacheKey: `outline-candidate:${detail.book.id || detail.book.title}:${mode}`,
      signal,
    })
    const chapterId = selectedChapter?.id ?? 'chapter-001'

    return {
      kind: mode === 'chapter' ? 'chapter-outline' : 'volume-outline',
      title: mode === 'chapter' ? '\u672c\u7ae0\u7ec6\u7eb2\u5019\u9009' : '\u5377\u7eb2\u5019\u9009',
      targetFile: mode === 'chapter' ? `${names.outline}/${chapterId}-outline.md` : `${names.outline}/volume-001.md`,
      content,
    }
  })
}

async function startNextChapterFlow(input) {
  return runCancellableAiTask(input, async (signal) => {
    const bookPath = input.bookPath
    const currentChapterFile = typeof input.currentChapterFile === 'string' ? input.currentChapterFile : ''
    const currentContent = typeof input.currentContent === 'string' ? input.currentContent : ''
    const requestId = typeof input.requestId === 'string' ? input.requestId : ''
    const speedMode = normalizeWritingSpeedMode(input.speedMode)
    const emitProgress = (phase, detail = '', preview = '', status = 'running') => {
      sendAiTaskProgress({
        requestId,
        scope: 'next-chapter-flow',
        phase,
        label: 'Next chapter',
        detail,
        preview,
        status,
      })
    }

    assertNotAborted(signal)
    if (currentChapterFile) {
      emitProgress('save', 'Saving current chapter')
      const currentTarget = assertInsideBook(bookPath, currentChapterFile)
      assertNotAborted(signal)
      await writeChapterSnapshot(bookPath, currentChapterFile, 'before-next-chapter-auto-flow')
      await fs.mkdir(path.dirname(currentTarget), { recursive: true })
      await fs.writeFile(currentTarget, currentContent, 'utf8')
      assertNotAborted(signal)
      emitProgress('save-done', 'Current chapter saved')
    }

    assertNotAborted(signal)
    emitProgress('create', 'Finding next writable chapter')
    const reusableChapter = await findReusableChapterForNextFlow(bookPath, currentChapterFile)
    assertNotAborted(signal)
    const createdDetail = reusableChapter
      ? await buildBookDetail(bookPath, reusableChapter.file)
      : await createChapter({ bookPath })
    const selectedChapter = createdDetail.selectedChapter

    if (!selectedChapter) {
      throw new Error('\u65e0\u6cd5\u521b\u5efa\u4e0b\u4e00\u7ae0')
    }

    emitProgress('create-done', reusableChapter ? `Using empty chapter: ${selectedChapter.title || selectedChapter.file}` : selectedChapter.title || selectedChapter.file)
    const promptCacheKey = createBookWritingPromptCacheKey(bookPath)
    assertNotAborted(signal)
    const writingContext = await readProjectContext(bookPath, selectedChapter)
    assertNotAborted(signal)
    emitProgress('draft', 'Starting draft director')
    const draft = await runChapterWritingDirector({
      instruction: typeof input.instruction === 'string' ? input.instruction : '',
      detail: createdDetail,
      context: writingContext,
      promptCacheKey,
      signal,
      speedMode,
      reportProgress: (event) => emitProgress(event.phase, event.detail, event.preview, event.status),
    })
    assertNotAborted(signal)

    emitProgress('outline', 'Saving chapter outline from writing director')
    const outline = {
      kind: 'chapter-outline',
      title: '\u672c\u7ae0\u7ec6\u7eb2\u5019\u9009',
      targetFile: `${names.outline}/${selectedChapter.id}-outline.md`,
      content: buildChapterOutlineFromDirectorDraft({ selectedChapter, draft }),
    }
    const outlineTarget = assertInsideBook(bookPath, outline.targetFile)
    await writeProjectMaterialSnapshot(bookPath, outline.targetFile, 'before-next-chapter-auto-outline')
    await fs.mkdir(path.dirname(outlineTarget), { recursive: true })
    await fs.writeFile(outlineTarget, outline.content, 'utf8')
    assertNotAborted(signal)
    emitProgress('outline-done', 'Chapter outline ready', outline.content)
    emitProgress('done', 'Next chapter candidate ready', draft.content, 'done')

    return {
      detail: await buildBookDetail(bookPath, selectedChapter.file),
      outline,
      draft,
    }
  })
}

async function applyGeneratedWritingDraft({ bookPath, chapterFile, content, draft, mode = 'append' }) {
  const target = assertInsideBook(bookPath, chapterFile)
  await writeChapterSnapshot(bookPath, chapterFile, 'before-batch-writing-apply')
  await fs.mkdir(path.dirname(target), { recursive: true })
  const existing = (await pathExists(target)) ? await fs.readFile(target, 'utf8') : ''
  const cleanContent = assertCleanChapterDraftContent(content, '\u6279\u91cf\u751f\u6210\u6b63\u6587')
  const nextContent = mode === 'replace' ? cleanContent : `${existing.trimEnd()}\n\n${cleanContent}\n`
  await fs.writeFile(target, nextContent, 'utf8')
  const applyReadbackCheck = await persistWritingCandidatePatches({
    bookPath,
    chapterFile,
    mode,
    draft,
    sourceLabel: '批量生成应用',
  })
  return applyReadbackCheck
}

async function startBatchWritingFlow(input) {
  return runCancellableAiTask(input, async (signal) => {
    const mode = input.mode === 'reckless' ? 'reckless' : 'guarded'
    const chapterCount = Math.max(1, Math.min(Number(input.chapterCount) || (mode === 'reckless' ? 10 : 5), mode === 'reckless' ? 50 : 12))
    const results = []
    assertNotAborted(signal)
    let currentDetail = await buildBookDetail(input.bookPath, input.currentChapterFile)
    let currentContent = typeof input.currentContent === 'string' ? input.currentContent : currentDetail.content
    const requestId = typeof input.requestId === 'string' ? input.requestId : ''
    const emitProgress = createAiTaskProgressEmitter({
      requestId,
      scope: 'batch-writing-flow',
      label: mode === 'reckless' ? 'Batch writing' : 'Guarded batch writing',
    })
    emitProgress('prepare', `Preparing ${chapterCount} chapter batch`)

    for (let index = 0; index < chapterCount; index += 1) {
      assertNotAborted(signal)
      emitProgress('batch-chapter', `Generating chapter ${index + 1}/${chapterCount}`)
      const flow = await startNextChapterFlow({
        bookPath: input.bookPath,
        currentChapterFile: currentDetail.selectedChapter?.file,
        currentContent,
        instruction: input.instruction,
        speedMode: mode,
        requestId: `${input.requestId || 'batch'}-${index + 1}`,
        parentSignal: signal,
      })
      assertNotAborted(signal)
      const chapter = flow.detail.selectedChapter
      if (!chapter) {
        break
      }

      emitProgress('apply', `Applying chapter ${index + 1}/${chapterCount}`, flow.draft.content)
      const applyReadbackCheck = await applyGeneratedWritingDraft({
        bookPath: input.bookPath,
        chapterFile: chapter.file,
        content: flow.draft.content,
        draft: flow.draft,
        mode: 'replace',
      })
      assertNotAborted(signal)

      const warnings = [...(flow.draft.stateGateWarnings || []), ...(flow.draft.qualityGateWarnings || [])]
      results.push({
        chapterFile: chapter.file,
        chapterTitle: chapter.title,
        status: warnings.length ? 'needs-review' : 'applied',
        warnings,
        directorStatus: flow.draft.directorStatus,
        readbackOk: applyReadbackCheck.ok,
      })

      if (mode === 'guarded' && (warnings.length || flow.draft.directorStatus === 'needs-review')) {
        break
      }

      currentDetail = await buildBookDetail(input.bookPath, chapter.file)
      currentContent = currentDetail.content
      assertNotAborted(signal)
      emitProgress('batch-chapter-done', `Chapter ${index + 1}/${chapterCount} applied`, currentContent)
    }

    const result = {
      mode,
      requested: chapterCount,
      completed: results.length,
      stopped: results.length < chapterCount,
      results,
      detail: await buildBookDetail(input.bookPath, results.at(-1)?.chapterFile),
    }
    emitProgress('done', `Batch complete: ${results.length}/${chapterCount}`, '', 'done')
    return result
  })
}

const materialRewriteProfiles = {
  projectBrief: {
    title: '\u9879\u76ee\u7b80\u4ecb\u5019\u9009',
    role: '\u9879\u76ee\u7b80\u4ecb',
    sections: '\u4e66\u540d\u3001\u76ee\u6807\u5e73\u53f0\u3001\u9898\u6750\u3001\u4e00\u53e5\u8bdd\u5356\u70b9\u3001\u7b80\u4ecb\u8349\u6848\u3001\u672c\u4e66\u6838\u5fc3\u627f\u8bfa',
  },
  coverPrompt: {
    title: '\u5c01\u9762\u63d0\u793a\u8bcd\u5019\u9009',
    role: '\u5c01\u9762\u751f\u56fe\u63d0\u793a\u8bcd',
    sections: '\u4e66\u540d\u3001\u6838\u5fc3\u5356\u70b9\u3001\u753b\u9762\u4e3b\u4f53\u3001\u89c6\u89c9\u98ce\u683c\u3001\u53ef\u590d\u5236\u751f\u56fe\u63d0\u793a\u8bcd\u3001\u8d1f\u9762\u63d0\u793a\u8bcd',
  },
  platformFit: {
    title: '\u5e73\u53f0\u89c4\u5219\u5019\u9009',
    role: '\u8fd9\u672c\u4e66\u7684\u5e73\u53f0\u5199\u4f5c\u89c4\u5219',
    sections: '\u76ee\u6807\u8bfb\u8005\u3001\u7ae0\u8282\u5b57\u6570\u3001\u5f00\u5c40\u8282\u594f\u3001\u5185\u5bb9\u98ce\u683c\u3001\u5fc5\u987b\u9075\u5b88\u3001\u5e38\u89c1\u5931\u8d25\u6a21\u5f0f',
  },
  genreRules: {
    title: '\u9898\u6750\u89c4\u5219\u5019\u9009',
    role: '\u8fd9\u672c\u4e66\u7684\u9898\u6750\u89c4\u5219',
    sections: '\u9898\u6750\u5e95\u7ebf\u3001\u5fc5\u987b\u53cd\u590d\u51fa\u73b0\u7684\u9898\u6750\u4fe1\u53f7\u3001\u6bcf\u7ae0\u6700\u5c11\u8981\u843d\u5730\u7684\u5143\u7d20\u3001\u5e38\u89c1\u8dd1\u504f\u3001\u672c\u7ae0\u7ec6\u7eb2\u5fc5\u987b\u68c0\u67e5\u7684\u9898\u6750\u5473\u9053',
  },
  coreSetting: {
    title: '\u6838\u5fc3\u8bbe\u5b9a\u5019\u9009',
    role: '\u6838\u5fc3\u8bbe\u5b9a',
    sections: '\u4e16\u754c\u89c2\u3001\u4e3b\u89d2\u521d\u59cb\u5904\u5883\u3001\u91d1\u624b\u6307/\u6838\u5fc3\u80fd\u529b\u3001\u4e3b\u8981\u77db\u76fe\u3001\u723d\u70b9\u673a\u5236\u3001\u7981\u6b62\u5199\u6cd5',
  },
  mainCharacter: {
    title: '\u4e3b\u89d2\u5361\u5019\u9009',
    role: '\u4e3b\u89d2\u5361',
    sections: '\u6838\u5fc3\u8eab\u4efd\u3001\u8868\u5c42\u76ee\u6807\u3001\u5e95\u5c42\u6b32\u671b\u3001\u6027\u683c\u5e95\u8272\u3001\u8bf4\u8bdd\u65b9\u5f0f\u3001\u884c\u4e8b\u539f\u5219\u3001\u6210\u957f\u5f27\u7ebf\u3001\u4e0d\u80fd\u504f\u79bb',
  },
  supportingCharacters: {
    title: '\u914d\u89d2\u5361\u5019\u9009',
    role: '\u914d\u89d2\u5361',
    sections: '\u91cd\u8981\u914d\u89d2\u5217\u8868\u3001\u4e0e\u4e3b\u89d2\u5173\u7cfb\u3001\u529f\u80fd\u3001\u6027\u683c\u5e95\u8272\u3001\u58f0\u7ebf\u3001\u53ef\u53d8\u4e0e\u4e0d\u53ef\u53d8',
  },
  minorCharacters: {
    title: '\u9f99\u5957\u8bb0\u5f55\u5019\u9009',
    role: '\u9f99\u5957\u8bb0\u5f55',
    sections: '\u5df2\u51fa\u573a\u4eba\u7269\u3001\u529f\u80fd\u3001\u5df2\u77e5\u4fe1\u606f\u3001\u53ef\u56de\u6536\u7528\u6cd5',
  },
  overallOutline: {
    title: '\u603b\u7eb2\u5019\u9009',
    role: '\u5168\u4e66\u603b\u7eb2',
    sections: '\u5168\u4e66\u4e3b\u7ebf\u3001\u6838\u5fc3\u51b2\u7a81\u3001\u4e3b\u89d2\u6210\u957f\u9636\u6bb5\u3001\u6309\u5e73\u53f0\u7ae0\u8282\u5b57\u6570\u62c6\u5206\u7684\u4e3b\u8981\u5377\u89c4\u5212\u3001\u7ec8\u5c40\u627f\u8bfa\u3001\u957f\u7ebf\u4f0f\u7b14',
  },
  goldenFirstThree: {
    title: '\u9ec4\u91d1\u4e09\u7ae0\u5019\u9009',
    role: '\u9ec4\u91d1\u524d\u4e09\u7ae0\u89c4\u5212',
    sections: '\u7b2c 1 \u7ae0\u5f00\u573a\u94a9\u5b50\u3001\u7b2c 2 \u7ae0\u723d\u70b9/\u89c4\u5219\u5c55\u793a\u3001\u7b2c 3 \u7ae0\u5c0f\u95ed\u73af\u548c\u8ffd\u8bfb\u94a9\u5b50\u3001\u524d\u4e09\u7ae0\u5fc5\u987b\u907f\u514d\u7684\u5199\u6cd5',
  },
  tracking: {
    title: '\u8ffd\u8e2a\u8868\u5019\u9009',
    role: '\u8fde\u8f7d\u8ffd\u8e2a\u8868',
    sections: '\u4eba\u7269\u3001\u4f0f\u7b14\u3001\u5730\u70b9\u3001\u9053\u5177/\u80fd\u529b\u3001\u8bbe\u5b9a\u53d8\u66f4\u3001\u672a\u89e3\u51b3\u95ee\u9898',
  },
}

function buildMaterialRewritePrompt({ book, selectedChapter, materialId, targetFile, currentContent, context }) {
  const profile = materialRewriteProfiles[materialId] || {
    title: '\u9879\u76ee\u8d44\u6599\u5019\u9009',
    role: '\u9879\u76ee\u8d44\u6599',
    sections: '\u6309\u8d44\u6599\u529f\u80fd\u62c6\u6210\u6e05\u6670\u4e8c\u7ea7\u6807\u9898',
  }

  return [
    '\u4f60\u662f\u957f\u7bc7\u7f51\u6587\u7acb\u9879\u4e0e\u8fde\u8f7d\u8bbe\u5b9a\u7f16\u8f91\u3002',
    `\u4efb\u52a1\uff1a\u4e3a\u201c${profile.role}\u201d\u6574\u7406\u4e00\u6bb5\u53ef\u8ffd\u52a0\u5230\u539f\u8d44\u6599\u540e\u9762\u7684\u8865\u4e01\u3002`,
    '\u53ea\u8f93\u51fa Markdown \u8865\u4e01\uff0c\u4e0d\u8981\u989d\u5916\u89e3\u91ca\uff0c\u4e0d\u8981\u8f93\u51fa\u5b8c\u6574\u8d44\u6599\u6587\u4ef6\u3002',
    `\u8865\u4e01\u4f18\u5148\u8865\u8db3\u6216\u4fee\u6b63\u8fd9\u4e9b\u5185\u5bb9\uff1a${profile.sections}\u3002`,
    '\u4e0a\u4e0b\u6587\u5df2\u7531\u672c\u5730\u7f16\u8bd1\u5668\u7b5b\u9009\uff0c\u4e0d\u8981\u8981\u6c42\u66f4\u591a\u5168\u9879\u76ee\u8d44\u6599\u3002',
    '\u4e0d\u8981\u91cd\u590d\u539f\u6587\u5df2\u7ecf\u8bf4\u6e05\u7684\u5185\u5bb9\uff0c\u53ea\u5199\u9700\u8981\u65b0\u589e\u3001\u66f4\u6b63\u3001\u660e\u786e\u7684\u8981\u70b9\u3002',
    '\u6bcf\u6761\u8981\u5177\u4f53\uff0c\u80fd\u76f4\u63a5\u652f\u6491\u540e\u7eed\u5377\u7eb2\u3001\u7ec6\u7eb2\u548c\u6b63\u6587\u5199\u4f5c\u3002',
    ['overallOutline', 'volumeOutline', 'chapterOutline'].includes(materialId)
      ? buildPlatformOutlinePlanningRule({ book, selectedChapter, mode: materialId === 'chapterOutline' ? 'chapter' : 'volume' })
      : '',
    '',
    `\u4e66\u540d\uff1a${book.title}`,
    `\u5e73\u53f0\uff1a${book.platform}`,
    `\u76ee\u6807\u6587\u4ef6\uff1a${targetFile}`,
    `\u5f53\u524d\u7ae0\u8282\uff1a${selectedChapter?.title ?? '\u672a\u9009\u62e9'}`,
    '',
    '# \u73b0\u6709\u76ee\u6807\u8d44\u6599\u6458\u8981',
    limitText(currentContent, materialId === 'volumeOutline' ? 1800 : materialId === 'chapterOutline' ? 1200 : 1400) || '\u6682\u65e0',
    '',
    '# \u9879\u76ee\u5df2\u6709\u4f9d\u636e',
    '## \u5e73\u53f0\u89c4\u5219',
    context.platformFit,
    '## \u9898\u6750\u89c4\u5219',
    context.genreRules,
    '## \u6838\u5fc3\u8bbe\u5b9a',
    context.coreSetting,
    '## \u4e3b\u89d2\u5361',
    context.mainCharacter,
    '## \u914d\u89d2\u5361',
    context.supportingCharacters,
    '## \u9f99\u5957\u8bb0\u5f55',
    context.minorCharacters,
    '## \u603b\u7eb2',
    context.overallOutline,
    '## \u9ec4\u91d1\u4e09\u7ae0',
    context.goldenFirstThree,
    '## \u5377\u7eb2',
    context.volumeOutline,
    '## \u672c\u7ae0\u7ec6\u7eb2',
    context.chapterOutline,
    '## \u8ffd\u8e2a\u8868',
    context.tracking,
  ].join('\n')
}

async function generateMaterialCandidate(input) {
  return runCancellableAiTask(input, async (signal) => {
    const detail = await buildBookDetail(input.bookPath, input.chapterFile)
    const context = await readMaterialRewriteContext(input.bookPath, detail.selectedChapter, input.materialId)
    const patch = await callOpenAiText({
      input: buildMaterialRewritePrompt({
        book: detail.book,
        selectedChapter: detail.selectedChapter,
        materialId: input.materialId,
        targetFile: input.targetFile,
        currentContent: typeof input.currentContent === 'string' ? input.currentContent : '',
        context,
      }),
      temperature: 0.4,
      maxOutputTokens: input.materialId === 'volumeOutline' ? aiOutputLimits.volumeOutlinePatch : input.materialId === 'chapterOutline' ? aiOutputLimits.chapterOutlinePatch : aiOutputLimits.materialPatch,
      reasoningEffort: ['volumeOutline', 'chapterOutline'].includes(input.materialId) ? 'low' : 'low',
      signal,
    })
    const profile = materialRewriteProfiles[input.materialId]
    const currentContent = typeof input.currentContent === 'string' ? input.currentContent.trimEnd() : ''
    const content = [
      currentContent,
      '',
      `## AI 资料补丁 ${createTimestamp()}`,
      '',
      patch.trim(),
      '',
    ].filter((part) => part !== '').join('\n')

    return {
      kind: input.materialId === 'volumeOutline' ? 'volume-outline' : input.materialId === 'chapterOutline' ? 'chapter-outline' : 'material',
      title: profile?.title ? `${profile.title}补丁` : '\u9879\u76ee\u8d44\u6599\u8865\u4e01\u5019\u9009',
      targetFile: input.targetFile,
      content,
    }
  })
}

function buildProjectChatPrompt({ book, selectedChapter, context, messages }) {
  const conversation = Array.isArray(messages)
    ? messages
        .slice(-8)
        .map((message) => `${message.role === 'assistant' ? '\u5199\u4f5c\u52a9\u624b' : '\u7528\u6237'}\uff1a${limitText(message.content, 700)}`)
        .join('\n\n')
    : ''

  return [
    '\u4f60\u662f\u7528\u6237\u7684\u957f\u7bc7\u7f51\u6587\u521b\u4f5c\u4f19\u4f34\uff0c\u4e0d\u662f\u4e00\u6b21\u6027\u751f\u6210\u5668\u3002',
    '\u7528\u6237\u4f1a\u548c\u4f60\u8ba8\u8bba\u65b0\u8bbe\u5b9a\u3001\u89d2\u8272\u52a8\u673a\u3001\u5267\u60c5\u8f6c\u6298\u3001\u5e73\u53f0\u8c03\u6027\u3001\u7ec6\u8282\u8865\u4e01\u3002',
    '\u56de\u7b54\u539f\u5219\uff1a',
    '1. \u5148\u7406\u89e3\u7528\u6237\u60f3\u6cd5\uff0c\u518d\u7ed9\u51fa\u53ef\u6267\u884c\u65b9\u6848\u3002',
    '2. \u4e0d\u8981\u63a8\u7ffb\u5df2\u6709\u8bbe\u5b9a\uff0c\u5982\u679c\u7528\u6237\u60f3\u6cd5\u548c\u5df2\u6709\u8bbe\u5b9a\u51b2\u7a81\uff0c\u76f4\u63a5\u6307\u51fa\u51b2\u7a81\u548c\u4fee\u6b63\u65b9\u5411\u3002',
    '3. \u56de\u7b54\u6700\u540e\u7ed9\u4e00\u6bb5\u201c\u53ef\u6c89\u6dc0\u5230\u8d44\u6599\u7684\u5185\u5bb9\u201d\uff0c\u65b9\u4fbf\u7528\u6237\u590d\u7528\u3002',
    '4. \u5982\u679c\u4fe1\u606f\u4e0d\u8db3\uff0c\u53ef\u4ee5\u8ffd\u95ee 1-2 \u4e2a\u5173\u952e\u95ee\u9898\uff0c\u4f46\u4e0d\u8981\u5361\u6b7b\u7528\u6237\u3002',
    '',
    buildWritingCompanion90Contract({ mode: 'chat', context }),
    '',
    `\u5e73\u53f0\uff1a${book.platform}`,
    '',
    '# \u9879\u76ee\u8d44\u6599',
    '## \u5e73\u53f0\u89c4\u5219',
    context.platformFit,
    '## \u6838\u5fc3\u8bbe\u5b9a',
    context.coreSetting,
    '## \u4e3b\u89d2\u5361',
    context.mainCharacter,
    '## \u914d\u89d2\u5361',
    context.supportingCharacters,
    '## \u603b\u7eb2',
    context.overallOutline,
    '## \u672c\u7ae0\u7ec6\u7eb2',
    context.chapterOutline,
    '## \u8ffd\u8e2a\u8868',
    context.tracking,
    '## \u4e0a\u4e00\u7ae0',
    context.previousChapter,
    '## \u5f53\u524d\u7ae0\u8282',
    context.currentChapter,
    '',
    '# \u672c\u6b21\u52a8\u6001\u4fe1\u606f',
    `\u4e66\u540d\uff1a${book.title}`,
    `\u5f53\u524d\u7ae0\u8282\uff1a${selectedChapter?.title ?? '\u672a\u9009\u62e9'}`,
    '',
    '# \u5bf9\u8bdd',
    conversation,
  ].join('\n')
}

async function generateProjectChatReply(input) {
  return runCancellableAiTask(input, async (signal) => {
    const detail = await buildBookDetail(input.bookPath, input.chapterFile)
    const context = await readLightProjectChatContext(input.bookPath, detail.selectedChapter)
    const prompt = buildProjectChatPrompt({
      book: detail.book,
      selectedChapter: detail.selectedChapter,
      context,
      messages: Array.isArray(input.messages) ? input.messages : [],
    })
    const retryWithChatCompletions = { endpoint: 'chat/completions', error: null }
    const retryWithResponses = { endpoint: 'responses', error: null }
    let content = ''

    try {
      content = await callOpenAiChatText({
        input: prompt,
        temperature: 0.45,
        signal,
      })
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw error
      }
      retryWithChatCompletions.error = error
    }

    if (!content) {
      try {
        content = await callOpenAiText({
          input: prompt,
          temperature: 0.45,
          signal,
        })
      } catch (error) {
        if (error?.name === 'AbortError') {
          throw error
        }
        retryWithResponses.error = error
        const chatMessage = retryWithChatCompletions.error instanceof Error ? retryWithChatCompletions.error.message : String(retryWithChatCompletions.error)
        const responsesMessage = retryWithResponses.error instanceof Error ? retryWithResponses.error.message : String(retryWithResponses.error)
        throw new Error(`项目 AI 对话失败：${retryWithChatCompletions.endpoint}: ${chatMessage}；${retryWithResponses.endpoint}: ${responsesMessage}`)
      }
    }

    return { content }
  })
}

function buildProjectUpdatePatchPrompt({ book, selectedChapter, context, messages, materials }) {
  const conversation = compressProjectChatMessages(messages)
  const materialList = materials.map((material) => `- ${material.id} | ${material.label} | ${material.file}`).join('\n')
  const targetIds = materials.map((material) => material.id)

  return [
    '\u4f60\u662f\u957f\u7bc7\u7f51\u6587\u9879\u76ee\u603b\u7f16\u8f91\uff0c\u4efb\u52a1\u662f\u628a\u7528\u6237\u4e0e AI \u7684\u591a\u8f6e\u8ba8\u8bba\u6c89\u6dc0\u6210\u201c\u9879\u76ee\u66f4\u65b0\u5305\u201d\u3002',
    '\u91cd\u8981\uff1a\u5bf9\u8bdd\u662f\u8fc7\u7a0b\uff0c\u4e0d\u80fd\u539f\u6837\u5199\u5165\u8d44\u6599\u3002\u4f60\u8981\u603b\u7ed3\u3001\u53bb\u91cd\u3001\u53bb\u9664\u8ffd\u95ee\u548c\u95f2\u804a\uff0c\u628a\u6700\u7ec8\u6210\u7acb\u7684\u8bbe\u5b9a\u878d\u5408\u8fdb\u5df2\u6709\u9879\u76ee\u8d44\u6599\u3002',
    '\u4e3a\u4e86\u964d\u4f4e token \u548c\u8d85\u65f6\u98ce\u9669\uff0c\u4f60\u4e0d\u80fd\u91cd\u5199\u5b8c\u6574\u8d44\u6599\u6587\u4ef6\uff0c\u53ea\u80fd\u8f93\u51fa\u5c11\u91cf\u201c\u589e\u91cf\u8865\u4e01\u201d\u3002',
    '',
    '# \u5199\u4f5c\u6280\u80fd\u903b\u8f91',
    '\u0031. \u5e73\u53f0\u8c03\u6027\u662f\u5f00\u4e66\u521d\u671f\u89c4\u5219\uff0c\u53ea\u5728\u8ba8\u8bba\u5f71\u54cd\u76ee\u6807\u8bfb\u8005\u3001\u7ae0\u8282\u5b57\u6570\u3001\u5f00\u5c40\u8282\u594f\u3001\u5185\u5bb9\u98ce\u683c\u3001\u5e73\u53f0\u5fc5\u505a/\u7981\u505a\u65f6\u66f4\u65b0\u5e73\u53f0\u89c4\u5219\u3002',
    '2. \u9898\u6750\u89c4\u5219\u8bb0\u5f55\u8fd9\u672c\u4e66\u4e0d\u80fd\u8dd1\u504f\u7684\u9898\u6750\u5e95\u7ebf\u3001\u5fc5\u987b\u53cd\u590d\u51fa\u73b0\u7684\u9898\u6750\u4fe1\u53f7\u548c\u5e38\u89c1\u8dd1\u504f\uff1b\u8ba8\u8bba\u5f71\u54cd\u9898\u6750\u5473\u9053\u65f6\u5fc5\u987b\u66f4\u65b0\u5b83\u3002',
    '3. \u6838\u5fc3\u8bbe\u5b9a\u8bb0\u5f55\u4e16\u754c\u89c2\u3001\u91d1\u624b\u6307/\u6838\u5fc3\u80fd\u529b\u3001\u4e3b\u8981\u77db\u76fe\u3001\u723d\u70b9\u673a\u5236\u3001\u7981\u6b62\u5199\u6cd5\u3002',
    '4. \u4e3b\u89d2\u5361\u8bb0\u5f55\u4e3b\u89d2\u8eab\u4efd\u3001\u76ee\u6807\u3001\u6b32\u671b\u3001\u6027\u683c\u5e95\u8272\u3001\u8bf4\u8bdd\u65b9\u5f0f\u3001\u884c\u4e8b\u539f\u5219\u3001\u6210\u957f\u5f27\u7ebf\u3002',
    '5. \u914d\u89d2\u5361\u8bb0\u5f55\u91cd\u8981\u914d\u89d2\u7684\u529f\u80fd\u3001\u548c\u4e3b\u89d2\u5173\u7cfb\u3001\u58f0\u7ebf\u3001\u5fc5\u8981\u7684\u53d8\u5316\u3002',
    '6. \u9f99\u5957\u8bb0\u5f55\u53ea\u653e\u5c0f\u89d2\u8272\u3001\u5df2\u51fa\u573a\u4eba\u7269\u3001\u53ef\u56de\u6536\u4fe1\u606f\uff0c\u4e0d\u8981\u628a\u4e3b\u8981\u914d\u89d2\u585e\u8fdb\u6765\u3002',
    '7. \u603b\u7eb2\u8bb0\u5f55\u5168\u4e66\u4e3b\u7ebf\u3001\u6838\u5fc3\u51b2\u7a81\u3001\u9636\u6bb5\u3001\u7ec8\u5c40\u627f\u8bfa\u3001\u957f\u7ebf\u4f0f\u7b14\u3002',
    '8. \u9ec4\u91d1\u4e09\u7ae0\u8bb0\u5f55\u524d\u4e09\u7ae0\u7684\u5f00\u573a\u94a9\u5b50\u3001\u89c4\u5219\u5c55\u793a\u3001\u5c0f\u95ed\u73af\u3001\u8ffd\u8bfb\u94a9\u5b50\uff1b\u5f71\u54cd 1-3 \u7ae0\u65f6\u5fc5\u987b\u66f4\u65b0\u5b83\u3002',
    '9. \u5377\u7eb2\u8bb0\u5f55\u672c\u5377\u76ee\u6807\u3001\u9636\u6bb5\u51b2\u7a81\u3001\u9636\u6bb5\u723d\u70b9/\u60c5\u7eea\u70b9\u3001\u7ae0\u8282\u63a8\u8fdb\u3002',
    '10. \u672c\u7ae0\u7ec6\u7eb2\u53ea\u8bb0\u5f55\u5f53\u524d\u7ae0\u8282\u7684\u529f\u80fd\u3001\u672c\u7ae0\u9898\u6750\u5473\u9053\u3001\u573a\u666f\u987a\u5e8f\u3001\u60c5\u8282\u8282\u70b9\u3001\u94a9\u5b50\u548c\u9700\u56de\u6536\u7684\u4fe1\u606f\u3002',
    '11. \u8ffd\u8e2a\u8868\u8bb0\u5f55\u4f0f\u7b14\u3001\u9053\u5177/\u80fd\u529b\u3001\u5730\u70b9\u3001\u672a\u89e3\u51b3\u95ee\u9898\u3001\u8bbe\u5b9a\u53d8\u66f4\uff0c\u7528\u4e8e\u9632\u6b62\u957f\u7bc7\u8fde\u8f7d\u9057\u5fd8\u3002',
    '',
    '# \u5e73\u53f0\u8c03\u6027',
    formatPlatformProfile(book.platform),
    '',
    '# \u53ef\u66f4\u65b0\u7684\u9879\u76ee\u8d44\u6599\u6587\u4ef6',
    materialList,
    '',
    '# \u8f93\u51fa\u683c\u5f0f',
    '\u53ea\u8f93\u51fa JSON \u6570\u7ec4\uff0c\u4e0d\u8981 markdown \u4ee3\u7801\u5757\uff0c\u4e0d\u8981\u989d\u5916\u89e3\u91ca\u3002',
    '\u6570\u7ec4\u6bcf\u9879\u683c\u5f0f\uff1a{"id":"materials \u4e2d\u7684 id","file":"materials \u4e2d\u7684 file","label":"\u8d44\u6599\u540d","reason":"\u4e3a\u4ec0\u4e48\u9700\u8981\u66f4\u65b0","patch":"\u53ea\u5199\u9700\u8981\u65b0\u589e\u6216\u66f4\u6b63\u7684\u51e0\u6761 Markdown \u8981\u70b9"}',
    `\u53ea\u8fd4\u56de\u786e\u5b9e\u9700\u8981\u66f4\u65b0\u7684\u6587\u4ef6\uff0c\u6700\u591a ${projectUpdateMaxMaterials} \u4e2a\u3002patch \u662f\u589e\u91cf\u8865\u4e01\uff0c\u4e0d\u8981\u8f93\u51fa\u5b8c\u6574\u8d44\u6599\u6587\u4ef6\u3002`,
    '\u6bcf\u4e2a patch \u4e0d\u8d85\u8fc7 500 \u4e2a\u4e2d\u6587\u5b57\uff0c\u53ea\u5199\u5df2\u786e\u8ba4\u7684\u4fe1\u606f\uff0c\u4e0d\u8981\u628a AI \u8ffd\u95ee\u3001\u8ba8\u8bba\u8fc7\u7a0b\u3001\u672a\u51b3\u5b9a\u9009\u9879\u5199\u5165\u3002',
    '',
    buildWritingCompanion90Contract({ mode: 'project-update', context }),
    '',
    `\u4e66\u540d\uff1a${book.title}`,
    `\u5e73\u53f0\uff1a${book.platform}`,
    `\u5f53\u524d\u7ae0\u8282\uff1a${selectedChapter?.title ?? '\u672a\u9009\u62e9'}`,
    '',
    '# \u76ee\u6807\u8d44\u6599\u6458\u8981',
    compactProjectContextForUpdate(context, targetIds),
    '',
    '# \u8ba8\u8bba\u8fc7\u7a0b',
    conversation,
  ].join('\n')
}

function buildProjectRepairPatchPrompt({ book, selectedChapter, feedback, context, materials, gateWarnings }) {
  const materialList = materials.map((material) => `- ${material.id} | ${material.label} | ${material.file}`).join('\n')
  const targetIds = materials.map((material) => material.id)
  const genreRequirement = detectGenreRequiredSignals(context)
  const genreContinuityContract = buildGenreContinuityContract({ genreRequirement })

  return [
    '你是长篇网文项目资料修复编辑。',
    '任务：把章节暴露出来的问题修成可长期生效的“资料修复包”。',
    '这一步只修项目资料，不重写正文。',
    '输出必须是 JSON 数组，不要 markdown 代码块，不要额外解释。',
    '数组每项格式：{"id":"materials 中的 id","file":"materials 中的 file","label":"资料名","reason":"修复原因","patch":"增量修复补丁"}',
    'patch 只能写增量补丁，不要输出完整资料文件。每个 patch 不超过 700 个中文字。',
    '',
    '# 修复原则',
    '1. 只写已经确认的问题、规则、承接点，不要编造新剧情。',
    '2. 如果问题是题材跑偏，补充题材信号、禁止写法和后续章节必须反复出现的类型元素。',
    '3. 如果问题是状态不连续，补充当前状态、下一章必须承接、禁止重复上一章成果。',
    '4. 如果问题是人物/总纲/卷纲冲突，明确新规则与旧规则的关系。',
    `5. 当前题材为${genreRequirement.genre}，资料修复只能沉淀当前题材合同里的可追踪变量；不要把其他题材变量写进项目资料。`,
    '6. 不要把对话过程、AI 追问、未决选项写入资料。',
    '',
    genreContinuityContract,
    '',
    '# 输出内容要求',
    '每个 patch 内建议包含：',
    '- 问题影响范围',
    '- 长期资料修复',
    '- 后续章节必须承接',
    '- 后续章节必须避免',
    '',
    buildWritingCompanion90Contract({ mode: 'project-repair', context, instruction: feedback }),
    '',
    `书名：${book.title}`,
    `平台：${book.platform}`,
    `当前章节：${selectedChapter?.title ?? '未选择'}`,
    '',
    '# 目标资料',
    materialList,
    '',
    '# 用户反馈',
    feedback,
    '',
    '# 门禁/质量警告',
    gateWarnings?.length ? gateWarnings.map((warning) => `- ${warning}`).join('\n') : '- 暂无',
    '',
    '# 目标资料摘要',
    compactProjectContextForUpdate(context, targetIds),
  ].join('\n')
}

function normalizeProjectUpdatePatches(rawUpdates, materials) {
  const byId = new Map(materials.map((material) => [material.id, material]))
  const byFile = new Map(materials.map((material) => [material.file, material]))
  const seen = new Set()

  return (Array.isArray(rawUpdates) ? rawUpdates : [])
    .map((item) => {
      const material = byId.get(item?.id) || byFile.get(item?.file)
      const patch = typeof item?.patch === 'string' ? item.patch.trim() : ''

      if (!material || !patch || seen.has(material.file)) {
        return null
      }

      seen.add(material.file)
      return {
        id: material.id,
        file: material.file,
        label: material.label,
        reason: typeof item?.reason === 'string' && item.reason.trim() ? item.reason.trim() : '\u6839\u636e\u9879\u76ee\u5bf9\u8bdd\u66f4\u65b0',
        patch: limitText(patch, 1200),
      }
    })
    .filter(Boolean)
}

function buildProjectMajorChangeOrderContent({ book, selectedChapter, updates, impactMap, status = 'candidate' }) {
  const updateList = Array.isArray(updates) ? updates : []
  const statusText = status === 'active'
    ? '已应用：后续生成会优先读取这份大改变更单'
    : '待确认：应用前请先看影响范围和补丁内容'
  const files = updateList.map((update, index) => {
    return [
      `### ${index + 1}. ${update.label}`,
      `- 目标资料：${update.file}`,
      `- 为什么要改：${update.reason}`,
      '',
      '```markdown',
      update.patch,
      '```',
    ].join('\n')
  }).join('\n\n')

  return [
    '# 大改变更单',
    '',
    `- 应用状态：${statusText}`,
    `- 书名：${book?.title || '未知书名'}`,
    `- 当前章节：${selectedChapter?.title || '未选择章节'}`,
    '- 工作方式：这不是把聊天记录复制进原文件，而是把已经确认的大改结论沉淀成可执行规则。',
    '- 写入位置：资料修复记录。后续写作会优先读取它；原设定、总纲、角色卡不会被直接覆盖。',
    '- 回退方式：资料修复记录和原资料都会保留快照，可以从历史版本恢复。',
    '',
    '## 人话结论',
    updateList.length
      ? `这次大改会影响 ${updateList.length} 个资料方向：${updateList.map((update) => update.label).join('、')}。`
      : '这次对话没有形成明确可执行的大改补丁。',
    '',
    '## 影响范围',
    updateList.map((update) => `- ${update.label}（${update.file}）：${update.reason}`).join('\n') || '- 暂无',
    '',
    '## 具体补丁',
    files || '- 暂无',
    '',
    impactMap?.content ? '## 全项目影响图' : '',
    impactMap?.content || '',
    '',
    '## 应用后如何确认',
    '- 打开“资料修复记录”，确认能看到这份大改变更单。',
    '- 后续写下一章时，以这里的题材纠偏、角色规则、长期承接为最高优先级之一。',
    '- 如果发现方向不对，先恢复资料修复记录的上一个快照，再重新整理变更单。',
  ].filter(Boolean).join('\n')
}

function buildProjectMajorChangeOrderUpdate({ book, selectedChapter, updates, impactMap, status = 'candidate' }) {
  return {
    id: 'projectRepairLog',
    file: `${names.tracking}/project-repair-log.md`,
    label: '资料修复记录',
    reason: '大改先写入可回读的变更单，不直接覆盖原始设定文件',
    patch: buildProjectMajorChangeOrderContent({ book, selectedChapter, updates, impactMap, status }),
  }
}

function compressProjectChatMessages(messages, oldLimit = 14, recentLimit = 8) {
  const list = Array.isArray(messages) ? messages.filter((message) => typeof message?.content === 'string' && message.content.trim()) : []
  const oldMessages = list.slice(0, Math.max(0, list.length - recentLimit))
  const recentMessages = list.slice(-recentLimit)
  const oldSummary = oldMessages
    .slice(-oldLimit)
    .map((message, index) => {
      const role = message.role === 'assistant' ? '\u5199\u4f5c\u52a9\u624b' : '\u7528\u6237'
      return `${index + 1}. ${role}\uff1a${limitText(message.content, 450)}`
    })
    .join('\n')
  const recentConversation = recentMessages
    .map((message) => `${message.role === 'assistant' ? '\u5199\u4f5c\u52a9\u624b' : '\u7528\u6237'}\uff1a${limitText(message.content, 900)}`)
    .join('\n\n')

  return [
    '# \u65e7\u5bf9\u8bdd\u6458\u8981',
    oldSummary || '\u65e0',
    '',
    '# \u6700\u8fd1\u5bf9\u8bdd',
    recentConversation || '\u65e0',
  ].join('\n')
}

function compactProjectContextForUpdate(context, targetIds = []) {
  const targetSet = new Set(targetIds)
  const entries = [
    ['platformFit', '\u5e73\u53f0\u89c4\u5219', context.platformFit],
    ['genreRules', '\u9898\u6750\u89c4\u5219', context.genreRules],
    ['coreSetting', '\u6838\u5fc3\u8bbe\u5b9a', context.coreSetting],
    ['mainCharacter', '\u4e3b\u89d2\u5361', context.mainCharacter],
    ['supportingCharacters', '\u914d\u89d2\u5361', context.supportingCharacters],
    ['minorCharacters', '\u9f99\u5957\u8bb0\u5f55', context.minorCharacters],
    ['overallOutline', '\u603b\u7eb2', context.overallOutline],
    ['goldenFirstThree', '\u9ec4\u91d1\u4e09\u7ae0', context.goldenFirstThree],
    ['volumeOutline', '\u5377\u7eb2', context.volumeOutline],
    ['chapterOutline', '\u672c\u7ae0\u7ec6\u7eb2', context.chapterOutline],
    ['tracking', '\u8ffd\u8e2a\u8868', context.tracking],
    ['projectRepairLog', '资料修复记录', context.projectRepairLog],
  ]

  return entries
    .filter(([id]) => targetSet.size === 0 || targetSet.has(id))
    .map(([id, label, content]) => `## ${label}\n\n${limitText(content, targetSet.has(id) ? 4200 : 2200) || '\u6682\u65e0'}\n\n<!-- material:${id} -->`)
    .join('\n\n')
}

function buildProjectUpdateTargetPrompt({ book, selectedChapter, messages, materials }) {
  const materialList = materials.map((material) => `- ${material.id} | ${material.label} | ${material.file}`).join('\n')

  return [
    '\u4f60\u662f\u957f\u7bc7\u7f51\u6587\u9879\u76ee\u7f16\u8f91\u3002',
    '\u8bf7\u6839\u636e\u5bf9\u8bdd\u5224\u65ad\u9700\u8981\u66f4\u65b0\u54ea\u4e9b\u9879\u76ee\u8d44\u6599\u6587\u4ef6\u3002',
    '\u53ea\u8f93\u51fa JSON \u6570\u7ec4\uff0c\u4e0d\u8981 markdown \u4ee3\u7801\u5757\u3002',
    '\u6570\u7ec4\u6bcf\u9879\u683c\u5f0f\uff1a{"id":"materials \u4e2d\u7684 id","reason":"\u4e3a\u4ec0\u4e48\u9700\u8981\u66f4\u65b0"}',
    `\u53ea\u9009\u771f\u6b63\u9700\u8981\u66f4\u65b0\u7684\u6587\u4ef6\uff0c\u6700\u591a ${projectUpdateMaxMaterials} \u4e2a\u3002`,
    '',
    `\u4e66\u540d\uff1a${book.title}`,
    `\u5e73\u53f0\uff1a${book.platform}`,
    `\u5f53\u524d\u7ae0\u8282\uff1a${selectedChapter?.title ?? '\u672a\u9009\u62e9'}`,
    '',
    '# \u53ef\u66f4\u65b0\u7684\u6587\u4ef6',
    materialList,
    '',
    '# \u5bf9\u8bdd',
    compressProjectChatMessages(messages),
  ].join('\n')
}

function buildProjectRepairTargetPrompt({ book, selectedChapter, feedback, context, materials, gateWarnings }) {
  const materialList = materials.map((material) => `- ${material.id} | ${material.label} | ${material.file}`).join('\n')

  return [
    '你是长篇网文项目资料架构师。',
    '任务：根据用户反馈、章节门禁警告和当前项目资料，判断需要修复哪些长期资料。',
    '这不是聊天沉淀，而是“资料修复包”的影响范围诊断。',
    '只输出 JSON 数组，不要 markdown 代码块。',
    '数组每项格式：{"id":"materials 中的 id","reason":"为什么这个资料需要修复","severity":"high|medium|low"}',
    `最多选择 ${projectUpdateMaxMaterials} 个。优先选择能影响后续章节生成质量的资料。`,
    '',
    '# 资料选择规则',
    '- 题材味跑偏：优先 genreRules、storyState、chapterProgress、futurePlan。',
    '- 主角行为/成长/能力不连续：优先 mainCharacter、storyState、structuredState。',
    '- 卷内推进失控：优先 volumeOutline、chapterProgress、futurePlan。',
    '- 全书方向冲突：优先 overallOutline、coreSetting、tracking。',
    '- 当前章具体问题：可以选择 chapterOutline，但不要把全篇规则塞进本章细纲。',
    '- 记忆越来越乱：选择 memoryGovernance。',
    '',
    `书名：${book.title}`,
    `平台：${book.platform}`,
    `当前章节：${selectedChapter?.title ?? '未选择'}`,
    '',
    '# 可修复资料',
    materialList,
    '',
    '# 用户反馈',
    feedback,
    '',
    '# 门禁/质量警告',
    gateWarnings?.length ? gateWarnings.map((warning) => `- ${warning}`).join('\n') : '- 暂无',
    '',
    '# 当前资料摘要',
    compactProjectContextForUpdate(context, []),
  ].join('\n')
}

function normalizeProjectUpdateTargets(rawTargets, materials) {
  const byId = new Map(materials.map((material) => [material.id, material]))
  const seen = new Set()

  return (Array.isArray(rawTargets) ? rawTargets : [])
    .map((item) => {
      const material = byId.get(item?.id)
      if (!material || seen.has(material.id)) {
        return null
      }
      seen.add(material.id)
      return material
    })
    .filter(Boolean)
    .slice(0, projectUpdateMaxMaterials)
}

function buildProjectImpactMapPrompt({ book, selectedChapter, context, source, feedback, updates, messages, gateWarnings }) {
  const updateList = Array.isArray(updates) && updates.length
    ? updates.map((update) => `- ${update.label} | ${update.file} | ${update.reason}\n${limitText(update.patch, 500)}`).join('\n')
    : '- 暂无资料补丁'
  const conversation = Array.isArray(messages) ? compressProjectChatMessages(messages) : ''

  return [
    '你是长篇网文项目总控编辑，任务是生成“全项目影响图”。',
    '全项目影响图不是正文，也不是资料补丁；它只回答：用户这次改动会牵动哪些资料、哪些章节状态、哪些未来承接、哪些冲突风险。',
    '输出 Markdown，必须短而可执行。',
    '',
    buildWritingCompanion90Contract({ mode: 'project-impact-map', context, instruction: feedback }),
    '',
    '# 输出格式',
    '## 变更来源',
    '- 来源：',
    '- 用户意图：',
    '',
    '## 受影响资料',
    '- 资料名：影响原因；需要检查/更新什么',
    '',
    '## 受影响章节状态',
    '- 当前章/上一章/未来章：被牵动的变量、伏笔、任务或角色关系',
    '',
    '## 后续写作必须承接',
    '- 下一章必须承接：',
    '- 后续 3-5 章必须注意：',
    '',
    '## 冲突风险',
    '- 与旧设定/总纲/角色动机/题材规则可能冲突处：',
    '',
    '## 搭档判断',
    '- 用户下一步只需要：',
    '- 软件后续生成必须：',
    '',
    `书名：${book.title}`,
    `平台：${book.platform}`,
    `当前章节：${selectedChapter?.title ?? '未选择'}`,
    `来源：${source || 'unknown'}`,
    '',
    '# 用户反馈/对话摘要',
    feedback || conversation || '暂无',
    '',
    '# 资料补丁',
    updateList,
    '',
    '# 门禁/质量警告',
    gateWarnings?.length ? gateWarnings.map((warning) => `- ${warning}`).join('\n') : '- 暂无',
    '',
    '# 当前关键资料',
    compactProjectContextForUpdate(context, ['genreRules', 'coreSetting', 'mainCharacter', 'supportingCharacters', 'overallOutline', 'volumeOutline', 'chapterOutline', 'tracking', 'storyState', 'chapterProgress', 'chapterMemory', 'structuredState', 'futurePlan', 'memoryGovernance']),
  ].join('\n')
}

async function generateProjectImpactMap({ book, selectedChapter, context, source, feedback, updates, messages, gateWarnings, signal }) {
  return {
    source: source || 'unknown',
    generatedAt: new Date().toISOString(),
    content: await callOpenAiText({
      input: buildProjectImpactMapPrompt({ book, selectedChapter, context, source, feedback, updates, messages, gateWarnings }),
      temperature: 0.18,
      maxOutputTokens: aiOutputLimits.projectUpdatePatch,
      reasoningEffort: 'low',
      signal,
    }),
  }
}

async function persistProjectImpactMap(bookPath, impactMap, sourceLabel = 'project impact map') {
  const content = typeof impactMap?.content === 'string' ? impactMap.content.trim() : ''
  if (!content) {
    return
  }

  await appendGovernedSection(
    bookPath,
    `${names.tracking}/project-impact-map.md`,
    `${sourceLabel} ${impactMap.generatedAt || createTimestamp()}`,
    content,
    22000,
  )
}

async function generateProjectUpdatePackage(input) {
  return runCancellableAiTask(input, async (signal) => {
    const detail = await buildBookDetail(input.bookPath, input.chapterFile)
    const context = await readProjectContext(input.bookPath, detail.selectedChapter)
    const materials = getProjectMaterialDefinitions(detail.selectedChapter?.id)
    const messages = Array.isArray(input.messages) ? input.messages : []
    const fallbackTargetMaterialIds = ['genreRules', 'coreSetting', 'mainCharacter', 'supportingCharacters', 'overallOutline', 'tracking']
    let targetMaterials = []
    const emitProgress = createAiTaskProgressEmitter({
      requestId: typeof input.requestId === 'string' ? input.requestId : '',
      scope: 'project-update-package',
      label: 'Project update',
    })
    emitProgress('prepare', 'Preparing project discussion')

    if (messages.length > 10) {
      try {
        emitProgress('route', 'Finding affected project files')
        const targetContent = await callOpenAiText({
          input: buildProjectUpdateTargetPrompt({
            book: detail.book,
            selectedChapter: detail.selectedChapter,
            materials,
            messages,
        }),
        temperature: 0.15,
        maxOutputTokens: aiOutputLimits.projectUpdateTarget,
        reasoningEffort: 'low',
        signal,
      })
        targetMaterials = normalizeProjectUpdateTargets(extractJsonArray(targetContent), materials)
      } catch {
        targetMaterials = []
      }
    }

    if (targetMaterials.length === 0) {
      targetMaterials = materials.filter((material) => fallbackTargetMaterialIds.includes(material.id))
    }

    emitProgress('patch', `Writing update package for ${targetMaterials.length} files`)
    const content = await callOpenAiTextPreferStream({
      input: buildProjectUpdatePatchPrompt({
        book: detail.book,
        selectedChapter: detail.selectedChapter,
        context,
        materials: targetMaterials,
        messages,
      }),
      temperature: 0.2,
      maxOutputTokens: aiOutputLimits.projectUpdatePatch,
      reasoningEffort: 'low',
      signal,
      onDelta: (streamContent) => {
        emitProgress('patch', 'Condensing ' + countTextWords(streamContent) + ' chars', streamContent)
      },
      onFallback: (error) => {
        emitProgress('patch', 'Streaming failed, falling back to normal generation: ' + (error instanceof Error ? error.message : 'unknown error'))
      },
    })
    const updates = normalizeProjectUpdatePatches(extractJsonArray(content), targetMaterials)
    emitProgress('impact-map', 'Building project impact map')

    if (updates.length === 0) {
      throw new Error('这次对话没有整理出可写入项目资料的变更单')
    }

    const impactMap = await generateProjectImpactMap({
      book: detail.book,
      selectedChapter: detail.selectedChapter,
      context,
      source: 'project-update',
      feedback: '',
      updates,
      messages,
      gateWarnings: [],
      signal,
    })
    const majorChangeOrder = buildProjectMajorChangeOrderUpdate({
      book: detail.book,
      selectedChapter: detail.selectedChapter,
      updates,
      impactMap,
      status: 'candidate',
    })

    return {
      title: '项目变更单候选',
      updates: [majorChangeOrder],
      impactMap,
      content: majorChangeOrder.patch,
    }
  })
}

async function generateProjectRepairPackage(input) {
  return runCancellableAiTask(input, async (signal) => {
    const detail = await buildBookDetail(input.bookPath, input.chapterFile)
    const context = await readProjectContext(input.bookPath, detail.selectedChapter)
    const materials = getProjectMaterialDefinitions(detail.selectedChapter?.id)
    const feedback = typeof input.feedback === 'string' ? input.feedback.trim() : ''
    const gateWarnings = Array.isArray(input.gateWarnings) ? input.gateWarnings.filter((item) => typeof item === 'string' && item.trim()) : []
    const emitProgress = createAiTaskProgressEmitter({
      requestId: typeof input.requestId === 'string' ? input.requestId : '',
      scope: 'project-repair-package',
      label: 'Project repair',
    })
    emitProgress('prepare', 'Preparing project repair')

    if (!feedback && gateWarnings.length === 0) {
      throw new Error('请先写下要修复的问题，或提供门禁警告。')
    }

    let targetMaterials = []
    try {
      emitProgress('route', 'Finding affected project files')
      const targetContent = await callOpenAiText({
        input: buildProjectRepairTargetPrompt({
          book: detail.book,
          selectedChapter: detail.selectedChapter,
          feedback,
          context,
          materials,
          gateWarnings,
        }),
        temperature: 0.15,
        maxOutputTokens: aiOutputLimits.projectUpdateTarget,
        reasoningEffort: 'low',
        signal,
      })
      targetMaterials = normalizeProjectUpdateTargets(extractJsonArray(targetContent), materials)
    } catch {
      targetMaterials = []
    }

    if (targetMaterials.length === 0) {
      const fallbackTargetIds = ['genreRules', 'storyState', 'chapterProgress', 'futurePlan', 'memoryGovernance']
      targetMaterials = materials.filter((material) => fallbackTargetIds.includes(material.id)).slice(0, projectUpdateMaxMaterials)
    }

    emitProgress('patch', `Writing repair package for ${targetMaterials.length} files`)
    const content = await callOpenAiTextPreferStream({
      input: buildProjectRepairPatchPrompt({
        book: detail.book,
        selectedChapter: detail.selectedChapter,
        feedback,
        context,
        materials: targetMaterials,
        gateWarnings,
      }),
      temperature: 0.2,
      maxOutputTokens: aiOutputLimits.projectUpdatePatch,
      reasoningEffort: 'low',
      signal,
      onDelta: (streamContent) => {
        emitProgress('patch', 'Repairing ' + countTextWords(streamContent) + ' chars', streamContent)
      },
      onFallback: (error) => {
        emitProgress('patch', 'Streaming failed, falling back to normal generation: ' + (error instanceof Error ? error.message : 'unknown error'))
      },
    })
    const updates = normalizeProjectUpdatePatches(extractJsonArray(content), targetMaterials)
    emitProgress('impact-map', 'Building project impact map')

    if (updates.length === 0) {
      throw new Error('资料修复包没有生成可应用的资料补丁。')
    }

    const impactMap = await generateProjectImpactMap({
      book: detail.book,
      selectedChapter: detail.selectedChapter,
      context,
      source: 'project-repair',
      feedback,
      updates,
      messages: [],
      gateWarnings,
      signal,
    })
    const majorChangeOrder = buildProjectMajorChangeOrderUpdate({
      book: detail.book,
      selectedChapter: detail.selectedChapter,
      updates,
      impactMap,
      status: 'candidate',
    })

    return {
      title: '资料修复包候选',
      updates: [majorChangeOrder],
      impactMap,
      content: majorChangeOrder.patch,
    }
  })
}

function buildSyncPayloadFromContent(content) {
  return {
    settingPatch: parseSyncSection(content, '\u65b0\u589e\u8bbe\u5b9a'),
    mainCharacterPatch: parseSyncSection(content, '\u4e3b\u89d2\u53d8\u5316'),
    supportingCharacterPatch: parseSyncSection(content, '\u914d\u89d2\u53d8\u5316'),
    minorCharacterPatch: parseSyncSection(content, '\u9f99\u5957\u8bb0\u5f55'),
    trackingPatch: parseSyncSection(content, '\u4f0f\u7b14/\u672a\u89e3\u51b3\u95ee\u9898'),
  }
}

async function generateCheckSyncCandidate(input) {
  return runCancellableAiTask(input, async (signal) => {
    const detail = await buildBookDetail(input.bookPath, input.chapterFile)
    if (!detail.selectedChapter) {
      throw new Error('\u8bf7\u5148\u9009\u62e9\u7ae0\u8282')
    }

    const context = await readProjectContext(input.bookPath, detail.selectedChapter)
  const content = await callOpenAiText({
    input: buildCheckSyncPrompt({ book: detail.book, selectedChapter: detail.selectedChapter, context }),
    maxOutputTokens: aiOutputLimits.checkSync,
    signal,
  })

    return {
      title: '\u68c0\u67e5\u5e76\u540c\u6b65\u5019\u9009',
      content,
      syncPayload: buildSyncPayloadFromContent(content),
    }
  })
}

async function scanBooks(libraryPath) {
  if (!libraryPath || !(await pathExists(libraryPath))) {
    return []
  }

  const entries = await fs.readdir(libraryPath, { withFileTypes: true })
  const folders = entries.filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
  const books = await Promise.all(folders.map((entry) => detectBookSummary(libraryPath, entry)))
  return books.filter(Boolean)
}

async function getWorkspaceState() {
  const libraryPath = store.get('libraryPath')
  const normalizedPath = typeof libraryPath === 'string' && libraryPath.trim() ? libraryPath : null
  const books = normalizedPath ? await scanBooks(normalizedPath) : []

  return {
    libraryPath: normalizedPath,
    books,
  }
}

async function deleteBookProject(bookPath) {
  const libraryPath = store.get('libraryPath')
  const libraryRoot = typeof libraryPath === 'string' && libraryPath.trim() ? path.resolve(libraryPath) : ''

  if (!libraryRoot) {
    throw new Error('请先选择写作库')
  }

  const target = path.resolve(bookPath)
  const relative = path.relative(libraryRoot, target)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('只能删除当前写作库里的书籍项目')
  }

  const stat = await fs.stat(target).catch(() => null)
  if (!stat?.isDirectory()) {
    throw new Error('书籍项目不存在或不是文件夹')
  }

  await shell.trashItem(target)
  return getWorkspaceState()
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    title: names.appTitle,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow = win
  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null
    }
  })

  win.loadURL(getRendererUrl())
}

ipcMain.handle('workspace:get-state', async () => getWorkspaceState())

ipcMain.handle('ai:get-settings', async () => getAiSettings())
ipcMain.handle('ai:get-call-logs', async () => getAiCallLogs())
ipcMain.handle('ai:list-profiles', async () => getAiConnectionProfiles())
ipcMain.handle('ai:use-profile', async (_event, profileId) => activateAiConnectionProfile(profileId))
ipcMain.handle('ai:delete-profile', async (_event, profileId) => deleteAiConnectionProfile(profileId))

ipcMain.handle('ai:save-settings', async (_event, input) => {
  const settings = assertAiSettings(input)
  upsertAiConnectionProfile(settings)
  return getAiSettings()
})

ipcMain.handle('ai:test-connection', async (_event, input) => {
  const settings = assertAiSettings(input)
  await callOpenAiText({
    input: '\u8bf7\u53ea\u56de\u590d\uff1aOK',
    temperature: 0,
    maxOutputTokens: aiOutputLimits.testConnection,
    settings,
  })
  upsertAiConnectionProfile(settings, { lastTestOk: true })
  return { ok: true, model: settings.model, baseUrl: settings.baseUrl, proxyUrl: settings.proxyUrl }
})

ipcMain.handle('workspace:scan-library', async () => getWorkspaceState())

ipcMain.handle('workspace:choose-library-directory', async () => {
  const result = await dialog.showOpenDialog({
    title: names.chooseLibraryTitle,
    properties: ['openDirectory', 'createDirectory'],
  })

  if (!result.canceled && result.filePaths[0]) {
    store.set('libraryPath', result.filePaths[0])
  }

  return getWorkspaceState()
})

ipcMain.handle('workspace:create-book', async (_event, input) => {
  await createBookProject(input)
  return getWorkspaceState()
})

ipcMain.handle('workspace:delete-book', async (_event, bookPath) => deleteBookProject(bookPath))

ipcMain.handle('planning:next-question', async (_event, input) => generatePlanningQuestion(input))

ipcMain.handle('planning:generate-project-package', async (_event, input) => generateProjectPackage(input))

ipcMain.handle('book:open', async (_event, bookPath) => buildBookDetail(bookPath))

ipcMain.handle('book:open-chapter', async (_event, input) => {
  return buildBookDetail(input.bookPath, input.chapterFile)
})

ipcMain.handle('book:create-chapter', async (_event, input) => createChapter(input))

ipcMain.handle('book:save-chapter', async (_event, input) => {
  const target = assertInsideBook(input.bookPath, input.chapterFile)
  if (input.snapshot) {
    await writeChapterSnapshot(input.bookPath, input.chapterFile, input.reason)
  }
  await fs.writeFile(target, input.content, 'utf8')
  return buildBookDetail(input.bookPath, input.chapterFile)
})

ipcMain.handle('book:list-chapter-snapshots', async (_event, input) => listChapterSnapshots(input.bookPath, input.chapterFile))

ipcMain.handle('book:restore-chapter-snapshot', async (_event, input) => restoreChapterSnapshot(input))

ipcMain.handle('book:apply-candidate', async (_event, input) => {
  const target = assertInsideBook(input.bookPath, input.targetFile)
  await writeProjectMaterialSnapshot(input.bookPath, input.targetFile, 'before-apply-candidate')
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, input.content, 'utf8')
  return buildBookDetail(input.bookPath, input.selectedChapterFile)
})

ipcMain.handle('book:apply-writing-candidate', async (_event, input) => {
  const target = assertInsideBook(input.bookPath, input.chapterFile)
  await writeChapterSnapshot(input.bookPath, input.chapterFile, 'before-apply-writing-candidate')
  await fs.mkdir(path.dirname(target), { recursive: true })
  const existing = (await pathExists(target)) ? await fs.readFile(target, 'utf8') : ''
  const cleanContent = assertCleanChapterDraftContent(input.content, '\u5e94\u7528\u6b63\u6587\u5019\u9009')
  const nextContent = input.mode === 'replace' ? cleanContent : `${existing.trimEnd()}\n\n${cleanContent}\n`
  await fs.writeFile(target, nextContent, 'utf8')
  const applyReadbackCheck = await persistWritingCandidatePatches({
    bookPath: input.bookPath,
    chapterFile: input.chapterFile,
    mode: input.mode,
    draft: input,
    sourceLabel: '候选应用',
  })

  const detail = await buildBookDetail(input.bookPath, input.chapterFile)
  return { ...detail, applyReadbackCheck }
})

ipcMain.handle('book:apply-project-update-package', async (_event, input) => applyProjectUpdatePackage(input))

ipcMain.handle('book:list-project-materials', async (_event, input) => listProjectMaterials(input))

ipcMain.handle('book:read-project-material', async (_event, input) => readProjectMaterial(input))

ipcMain.handle('book:save-project-material', async (_event, input) => saveProjectMaterial(input))

ipcMain.handle('book:list-project-material-snapshots', async (_event, input) => listProjectMaterialSnapshots(input))

ipcMain.handle('book:restore-project-material-snapshot', async (_event, input) => restoreProjectMaterialSnapshot(input))

ipcMain.handle('book:apply-context-sync', async (_event, input) => {
  await appendSection(input.bookPath, `${names.settings}/core-setting.md`, '\u5199\u4f5c\u8fc7\u7a0b\u65b0\u589e\u8bbe\u5b9a', input.settingPatch)
  await appendSection(input.bookPath, `${names.characters}/main-character.md`, '\u5199\u4f5c\u8fc7\u7a0b\u4e3b\u89d2\u53d8\u5316', input.mainCharacterPatch)
  await appendSection(input.bookPath, `${names.characters}/supporting-characters.md`, '\u5199\u4f5c\u8fc7\u7a0b\u914d\u89d2\u53d8\u5316', input.supportingCharacterPatch)
  await appendSection(input.bookPath, `${names.characters}/minor-characters.md`, '\u5199\u4f5c\u8fc7\u7a0b\u9f99\u5957\u8bb0\u5f55', input.minorCharacterPatch)
  await appendSection(input.bookPath, `${names.tracking}/tracking.md`, '\u5199\u4f5c\u8fc7\u7a0b\u8ffd\u8e2a\u9879', input.trackingPatch)
  return buildBookDetail(input.bookPath)
})

ipcMain.handle('book:generate-check-sync-candidate', async (_event, input) => generateCheckSyncCandidate(input))

ipcMain.handle('book:generate-outline-candidate', async (_event, input) => generateOutlineCandidate(input))

ipcMain.handle('book:list-chapter-outline-index', async (_event, input) => buildChapterOutlineIndex(input.bookPath))

ipcMain.handle('book:generate-single-chapter-outline', async (_event, input) => generateSingleChapterOutline(input))

ipcMain.handle('book:batch-generate-chapter-outlines', async (_event, input) => batchGenerateChapterOutlines(input))

ipcMain.handle('book:generate-material-candidate', async (_event, input) => generateMaterialCandidate(input))

ipcMain.handle('book:project-chat', async (_event, input) => generateProjectChatReply(input))

ipcMain.handle('book:generate-project-update-package', async (_event, input) => generateProjectUpdatePackage(input))

ipcMain.handle('book:generate-project-repair-package', async (_event, input) => generateProjectRepairPackage(input))

ipcMain.handle('book:generate-ai-edit-candidate', async (_event, input) => generateAiEditCandidate(input))

ipcMain.handle('book:start-next-chapter-flow', async (_event, input) => startNextChapterFlow(input))

ipcMain.handle('book:start-batch-writing-flow', async (_event, input) => startBatchWritingFlow(input))

ipcMain.handle('book:get-latest-writing-task-run', async (_event, input) => getLatestRecoverableWritingTaskRun(input))

ipcMain.handle('book:retry-writing-task-step', async (_event, input) => retryWritingTaskStep(input))

ipcMain.handle('book:generate-chapter-feedback-package', async (_event, input) => generateChapterFeedbackPackage(input))
ipcMain.handle('book:generate-smart-feedback-package', async (_event, input) => generateSmartFeedbackPackage(input))

ipcMain.handle('book:compact-project-memory', async (_event, input) => compactProjectMemory(input))

ipcMain.handle('book:analyze-writing-samples', async (_event, input) => analyzeWritingSamples(input))

ipcMain.handle('book:analyze-sample-pool-fingerprints', async (_event, input) => analyzeSamplePoolFingerprints(input))

ipcMain.handle('book:import-authorized-sources', async (_event, input) => importAuthorizedBookSources(input))

ipcMain.handle('book:get-authorized-source-index', async (_event, input) => readAuthorizedSourceIndex(input.bookPath))

ipcMain.handle('ai:cancel-request', async (_event, requestId) => {
  const controller = aiRequestControllers.get(requestId)
  if (controller) {
    controller.abort()
    aiRequestControllers.delete(requestId)
  }
  return { ok: true }
})

ipcMain.handle('book:organize-project', async (_event, bookPath) => organizeBookProject(bookPath))

ipcMain.handle('book:export-chapter', async (_event, input) => exportChapter(input))

ipcMain.handle('book:export-book', async (_event, bookPath) => exportBook(bookPath))

ipcMain.handle('shell:open-path', async (_event, targetPath) => shell.openPath(targetPath))

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
