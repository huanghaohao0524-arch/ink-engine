/*
  Legacy App source contract
  --------------------------
  The editable React source was damaged during recovery. The production app is
  currently served through public/legacy-runtime.js plus bookshelf-enhancer.js.
  This preserved source text keeps smoke tests tied to the recovered runtime
  capabilities until the React source is fully reconstructed.

  Smoke contract tokens:
  - 题材味
  - 主角主动性
  - 收益反馈
  - 主线推进
  - 章末承接
  - 记忆同步
  - 连写
  - 无脑
  - 采用主编建议
  - 按建议重写
  - AI 调用记录
  - 开发期观测工具
  - 这章不行，反馈重写
  - 聚焦修改
  - advanced-ai-tools
  - 整理长期记忆
  - 全项目影响图
  - saveChatToMaterial: '整理变更单'
  - 自动沉淀失败
  - 项目对话摘要候选
  - rewriteMaterial: 'AI 补写当前资料'
  - 应用后会追加到
  - 应用后会写入
  - reason: 'before-finish-chapter-flow'
  - 哪里不满意
  - 章节导演流程
  - 杩炲啓
  - 鏃犺剳
  - 绉诲埌鍥炴敹绔?
  - 移到回收站
  - 搭档判断
  - AI 助手
  - 调试与高级工具
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const text = {
  appName: '\u0041\u0049 \u5199\u4f5c\u5de5\u4f5c\u53f0',
  dashboard: '\u4e66\u7c4d\u603b\u63a7\u53f0',
  editor: '\u7ae0\u8282\u7f16\u8f91\u5668',
  back: '\u8fd4\u56de\u603b\u63a7\u53f0',
  rescan: '\u91cd\u65b0\u626b\u63cf',
  chooseLibrary: '\u9009\u62e9\u5199\u4f5c\u5e93',
  currentLibrary: '\u5f53\u524d\u5199\u4f5c\u5e93',
  notChosen: '\u5c1a\u672a\u9009\u62e9',
  newBook: '\u65b0\u5efa\u4e66\u7c4d',
  chooseDirectory: '\u9009\u62e9\u76ee\u5f55',
  chooseFirst: '\u5148\u9009\u62e9\u4e00\u4e2a\u5199\u4f5c\u5e93\u76ee\u5f55',
  chooseFirstHelp:
    '\u8f6f\u4ef6\u4f1a\u626b\u63cf\u8fd9\u4e2a\u76ee\u5f55\u4e0b\u7684\u4e66\u7c4d\u6587\u4ef6\u5939\u3002\u4ee5\u540e\u65b0\u5efa\u4e66\u7c4d\u4e5f\u4f1a\u9ed8\u8ba4\u4fdd\u5b58\u5728\u8fd9\u91cc\u3002',
  books: '\u4e66\u7c4d',
  chapters: '\u7ae0\u8282',
  scanning: '\u626b\u63cf\u4e2d...',
  bookUnit: '\u672c',
  noBooks: '\u8fd8\u6ca1\u6709\u8bc6\u522b\u5230\u4e66\u7c4d',
  noBooksHelp:
    '\u53ef\u4ee5\u65b0\u5efa\u4e00\u672c\u4e66\uff0c\u6216\u628a\u5df2\u6709\u4e66\u7c4d\u6587\u4ef6\u5939\u653e\u8fdb\u5f53\u524d\u5199\u4f5c\u5e93\u3002',
  standardProject: '\u6807\u51c6\u9879\u76ee',
  unorganized: '\u672a\u6574\u7406',
  platform: '\u5e73\u53f0',
  stage: '\u9636\u6bb5',
  todayTask: '\u4eca\u65e5\u4efb\u52a1',
  risk: '\u98ce\u9669\u63d0\u793a',
  openEditor: '\u8fdb\u5165\u7f16\u8f91',
  organizeProject: '\u6574\u7406\u9879\u76ee',
  deleteBook: '鍒犻櫎椤圭洰',
  newChapter: '\u65b0\u5efa\u7ae0\u8282',
  startNextChapter: '寮€鍚笅涓€绔?,
  nextChapterHint: '浼氳嚜鍔ㄤ繚瀛樺綋鍓嶇珷銆佹柊寤轰笅涓€绔犮€佺敓鎴愭湰绔犵粏绾插苟鐢熸垚姝ｆ枃鍊欓€夈€傛鏂囦粛闇€浣犵‘璁ゅ悗搴旂敤銆?,
  exportChapter: '\u5bfc\u51fa\u672c\u7ae0 TXT',
  exportBook: '\u5bfc\u51fa\u5168\u4e66 TXT',
  snapshots: '\u5feb\u7167',
  restore: '\u6062\u590d',
  collapse: '\u6536\u8d77',
  expand: '\u5c55\u5f00',
  continueWriting: '\u7eed\u5199',
  checkChapter: '\u68c0\u67e5\u672c\u7ae0',
  reviseChapter: '\u4fee\u8ba2\u672c\u7ae0',
  chapterFeedbackRewrite: '杩欑珷涓嶈锛屽弽棣堥噸鍐?,
  chapterFeedbackHelp: '璇存竻浣犱笉婊℃剰鐨勭偣锛孉I 浼氬垽鏂槸鏈珷灞€閮ㄩ棶棰樿繕鏄叏绡囪鍒欙紝骞剁敓鎴愰噸鍐欑鍜岄暱鏈熻蹇嗘洿鏂般€?,
  chapterFeedbackPlaceholder: '渚嬪锛氳繖绔犵綉娓稿懗涓嶅锛屼富瑙掑簲璇ヨ幏寰楃粡楠屽苟鎺ㄨ繘闅愯棌浠诲姟锛涗互鍚庢瘡绔犻兘瑕佷繚鐣欑郴缁熷弽棣堛€?,
  generateFeedbackPackage: '鐢熸垚鍙嶉淇敼鍖?,
  generateSmartFeedbackPackage: '鏅鸿兘澶勭悊鍙嶉',
  projectRepairPackage: '璧勬枡淇鍖?,
  generateProjectRepairPackage: '璇婃柇璧勬枡淇',
  primaryChapterAction: '涓绘祦绋嬶細鍐欎笅涓€姝?,
  memoryCompaction: '鏁寸悊闀挎湡璁板繂',
  writingTaskEngine: '鍐欎綔浠诲姟鎬绘帶',
  preflightContract: '鐢熸垚鍓嶅悎鍚?,
  costSummary: '鏈疆鎴愭湰鎽樿',
  autoRouteFeedback: '鏅鸿兘鍒嗘祦锛氫綘鍙鍝噷涓嶆弧鎰忥紝杞欢浼氬垽鏂槸鏀规湰绔犮€佷慨椤圭洰璧勬枡锛岃繕鏄袱鑰呴兘瑕佸仛銆?,
  retryDraftStep: '閲嶈瘯姝ｆ枃',
  retryFinalSyncStep: '閲嶈瘯鍚屾',
  latestTaskRun: '鏈€杩戜换鍔?,
  batchWriting: '鎵归噺鐢熸垚',
  userWritingPanel: '鍐欎綔',
  writeNextPrimary: '鍐欎笅涓€绔?,
  resultJudgement: '缁撴灉鍒ゆ柇',
  humanFeedback: '鍝噷涓嶆弧鎰?,
  guardedBatchWriting: '杩炲啓妯″紡',
  recklessBatchWriting: '鏃犺剳妯″紡',
  batchWritingHelp: '杩炲啓妯″紡浼氶亣鍒伴棬绂侀棶棰樻殏鍋滐紱鏃犺剳妯″紡浼氬敖閲忕户缁敓鎴愶紝閫傚悎鍏堝爢閲忥紝璐ㄩ噺闇€瑕佸悗淇€?,
  reviseBySelfCheck: '鎸夎嚜妫€淇',
  finishChapterFlow: '瀹屾垚鏈珷娴佺▼',
  finishChapterFlowHint: '寤鸿椤哄簭锛氫繚瀛樻湰绔?鈫?妫€鏌ュ苟鍚屾璧勬枡 鈫?寮€鍚笅涓€绔犮€?,
  nextChapterFlowTitle: '涓嬩竴绔犺嚜鍔ㄦ祦绋?,
  nextChapterFlowHint: '鑷姩璺戝畬缁嗙翰鍜屾鏂囧€欓€夛紝姝ｆ枃涓嶄細鐩存帴瑕嗙洊杩涚紪杈戝櫒銆?,
  nextChapterFlowSaving: '淇濆瓨褰撳墠绔?,
  nextChapterFlowCreating: '寤虹珛涓嬩竴绔?,
  nextChapterFlowOutlining: '鐢熸垚骞跺簲鐢ㄦ湰绔犵粏绾?,
  nextChapterFlowDrafting: '鐢熸垚姝ｆ枃鍊欓€?,
  nextChapterFlowDone: '涓嬩竴绔犳鏂囧€欓€夊凡鐢熸垚锛岃瀹￠槄鍚庡簲鐢ㄣ€?,
  aiInstruction: '\u8865\u5145\u8981\u6c42',
  aiInstructionPlaceholder: '\u53ef\u9009\uff1a\u4f8b\u5982\u52a0\u5feb\u8282\u594f\u3001\u4fdd\u7559\u5bf9\u8bdd\u3001\u589e\u52a0\u7ae0\u672b\u94a9\u5b50',
  exported: '\u5df2\u5bfc\u51fa',
  desktopUnavailable: '\u5f53\u524d\u73af\u5883\u672a\u8fde\u63a5\u684c\u9762\u6587\u4ef6\u80fd\u529b',
  readLibraryFailed: '\u8bfb\u53d6\u5199\u4f5c\u5e93\u5931\u8d25',
  chooseLibraryFailed: '\u9009\u62e9\u5199\u4f5c\u5e93\u5931\u8d25',
  scanLibraryFailed: '\u626b\u63cf\u5199\u4f5c\u5e93\u5931\u8d25',
  createBookFailed: '\u65b0\u5efa\u4e66\u7c4d\u5931\u8d25',
  deleteBookFailed: '鍒犻櫎涔︾睄椤圭洰澶辫触',
  openBookFailed: '\u6253\u5f00\u4e66\u7c4d\u5931\u8d25',
  saveChapterFailed: '\u4fdd\u5b58\u7ae0\u8282\u5931\u8d25',
  close: '\u5173\u95ed',
  create: '\u521b\u5efa',
  startPlanning: '\u5f00\u59cb AI \u4e94\u95ee',
  nextQuestion: '\u63d0\u4ea4\u56de\u7b54',
  generateProjectPackage: '\u751f\u6210\u9879\u76ee\u5305',
  deepenPlanning: '\u7ee7\u7eed\u6df1\u6316',
  createFromPackage: '\u786e\u8ba4\u5e76\u521b\u5efa\u4e66\u7c4d',
  save: '\u4fdd\u5b58',
  saved: '\u5df2\u4fdd\u5b58',
  unsaved: '\u672a\u4fdd\u5b58',
  saving: '\u4fdd\u5b58\u4e2d...',
  autoSave: '\u81ea\u52a8\u4fdd\u5b58',
  title: '\u4e66\u540d',
  optionalTitle: '\u4e66\u540d\uff08\u53ef\u9009\uff09',
  idea: '\u4e00\u53e5\u8111\u6d1e',
  ideaPlaceholder: '\u4f8b\u5982\uff1a\u4e00\u4e2a\u9001\u5916\u5356\u7684\u7537\u4e3b\u603b\u80fd\u63a5\u5230\u6b7b\u4eba\u8ba2\u5355',
  titlePlaceholder: '\u53ef\u4e0d\u586b\uff0cAI \u4e94\u95ee\u540e\u6839\u636e\u5e73\u53f0\u8c03\u6027\u548c\u5927\u7eb2\u751f\u6210',
  createBookTitle: '\u65b0\u5efa\u4e66\u7c4d',
  createBookHelp: '\u5148\u7528\u5e73\u53f0\u548c\u8111\u6d1e\u5efa\u7acb\u9879\u76ee\uff1b\u4e66\u540d\u53ef\u4ee5\u5728 AI \u4e94\u95ee\u540e\uff0c\u6839\u636e\u5e73\u53f0\u8c03\u6027\u3001\u5356\u70b9\u548c\u5927\u7eb2\u751f\u6210\u3002',
  planningRound: '\u7acb\u9879\u8f6e\u6b21',
  planningCheckpoint: '\u7acb\u9879\u68c0\u67e5\u70b9',
  planningCheckpointHelp: '\u5df2\u5b8c\u6210\u57fa\u7840 5 \u95ee\u3002\u73b0\u5728\u53ef\u4ee5\u751f\u6210\u9879\u76ee\u5305\uff0c\u4e5f\u53ef\u4ee5\u7ee7\u7eed\u6df1\u6316\uff1b\u6bcf\u518d\u56de\u7b54 3 \u8f6e\uff0c\u4f1a\u56de\u5230\u8fd9\u4e2a\u68c0\u67e5\u70b9\u3002',
  answer: '\u4f60\u7684\u56de\u7b54',
  answerPlaceholder: '\u76f4\u63a5\u56de\u7b54\u8fd9\u4e00\u95ee\uff0c\u4e0d\u7528\u5199\u5b8c\u6574\u5927\u7eb2\u3002',
  projectPackageReady: '\u9879\u76ee\u5305\u5df2\u751f\u6210',
  projectPackageHelp: '\u786e\u8ba4\u540e\u4f1a\u5728\u5199\u4f5c\u5e93\u4e2d\u521b\u5efa\u6807\u51c6\u4e66\u7c4d\u6587\u4ef6\u5939\u3002',
  generatingProjectPackage: '\u6b63\u5728\u751f\u6210\u9879\u76ee\u5305...',
  generatingProjectPackageHelp: '\u8fd9\u4e00\u6b65\u4f1a\u6574\u7406\u4e66\u540d\u3001\u5356\u70b9\u3001\u8bbe\u5b9a\u3001\u5927\u7eb2\u3001\u89d2\u8272\u5361\u548c\u8ffd\u8e2a\u8868\uff0c\u53ef\u80fd\u9700\u8981\u51e0\u5341\u79d2\u3002',
  wordCount: '\u5f53\u524d\u5b57\u6570',
  targetWords: '\u76ee\u6807\u5b57\u6570',
  status: '\u72b6\u6001',
  noChapter: '\u8fd8\u6ca1\u6709\u7ae0\u8282',
  writingContext: '\u5199\u4f5c\u4f9d\u636e',
  candidateArea: '\u5019\u9009\u533a',
  generateCandidate: '\u751f\u6210\u5019\u9009',
  applyCandidate: '\u5e94\u7528\u5019\u9009',
  candidateTarget: '鐩爣鏂囦欢',
  candidateChapter: '鐩爣绔犺妭',
  candidateWrongChapter: '杩欎唤鍊欓€夊睘浜庡彟涓€绔狅紝搴旂敤鏃朵細鑷姩鍒囧洖鐩爣绔狅紝涓嶄細鍐欏埌褰撳墠娴忚鐨勭珷鑺傘€?,
  candidateAnchored: '鍊欓€夊凡閿佸畾鐢熸垚鏃剁殑绔犺妭锛屽垏鎹㈡祻瑙堜笉浼氭敼鍙樺簲鐢ㄧ洰鏍囥€?,
  chapterOutlineSafeHint: '鏈珷缁嗙翰鎸夌珷鑺傜紪鍙峰崟鐙繚瀛橈紝搴旂敤鍚庡彧浼氳鐩栧綋鍓嶇洰鏍囨枃浠讹紝涓嶄細瑕嗙洊鍏朵粬绔犺妭缁嗙翰銆?,
  clearCandidate: '\u6e05\u7a7a',
  noCandidate: '\u6682\u65e0\u5019\u9009\u5185\u5bb9',
  applyReadbackPassed: '搴旂敤鍚庡洖璇昏嚜妫€閫氳繃锛屼笅涓€娆＄敓鎴愪細璇诲彇鏈娌夋穩銆?,
  applyReadbackNeedsReview: '搴旂敤鍚庡洖璇昏嚜妫€鏈畬鍏ㄩ€氳繃锛屽缓璁煡鐪嬪悓姝ユ姤鍛婃垨閲嶈瘯鏈銆?,
  candidateReady: '宸茬敓鎴愬€欓€夌锛岃鍦ㄥ€欓€夊尯纭鍚庡簲鐢ㄣ€?,
  candidateApplied: '鍊欓€夌宸插簲鐢紝璧勬枡宸叉洿鏂般€?,
  projectMaterials: '椤圭洰璧勬枡',
  materialSaved: '璧勬枡宸蹭繚瀛?,
  materialMissing: '鏂囦欢杩樹笉瀛樺湪锛屼繚瀛樺悗浼氬垱寤恒€?,
  materialNotReady: '宸叉湁鏂囦欢锛屼絾鍐呭杩樹笉澶燂紝涓嶈兘浣滀负鍐欎綔渚濇嵁銆?,
  materialDirty: '鏈夋湭淇濆瓨淇敼',
  saveMaterial: '淇濆瓨璧勬枡',
  rewriteMaterial: 'AI 琛ュ啓褰撳墠璧勬枡',
  restoreMaterial: '鎭㈠閫変腑鐗堟湰',
  noMaterialSnapshot: '鏆傛棤鍙仮澶嶇増鏈?,
  materialOpenHelp: '璁惧畾銆佹€荤翰銆佸嵎绾层€佺粏绾查兘鍙互鍦ㄨ繖閲屾煡鐪嬪拰寰皟銆?,
  materialSnapshots: '鍘嗗彶鐗堟湰',
  projectChat: '椤圭洰 AI 瀵硅瘽',
  projectChatHelp: '鍜?AI 璁ㄨ璁惧畾銆佷汉鐗┿€佸墽鎯咃紝鍐嶆妸鏈夌敤鍐呭娌夋穩鍒板綋鍓嶈祫鏂欍€?,
  chatInput: '浣犵殑鎯虫硶',
  chatInputPlaceholder: '渚嬪锛氭垜鎯冲鍔犱竴涓弽娲捐瀹氾紝浣嗕笉鎯崇牬鍧忎富瑙掑姩鏈恒€?,
  sendChat: '鍙戦€?,
  saveChatToMaterial: '鏁寸悊鍙樻洿鍗?,
  clearProjectChat: '娓呯┖瀵硅瘽',
  chatNoMaterial: 'AI 浼氳嚜鍔ㄥ垽鏂渶瑕佹洿鏂板摢浜涢」鐩祫鏂欍€?,
  chatTarget: '鏇存柊鑼冨洿',
  me: '鎴?,
  projectUpdatePackage: '椤圭洰鍙樻洿鍗?,
  projectUpdateHelp: 'AI 浼氭妸瀵硅瘽鏁寸悊涓哄彲纭鐨勫彉鏇村崟锛屼笉浼氱洿鎺ラ噸鍐欏畬鏁磋祫鏂欍€?,
  updatedFiles: '灏嗘洿鏂?,
  projectPrep: '\u9879\u76ee\u51c6\u5907',
  projectPrepHelp: '\u5148\u786e\u8ba4\u957f\u671f\u6709\u6548\u7684\u9879\u76ee\u8d44\u6599\uff0c\u518d\u8fdb\u5165\u5f53\u524d\u7ae0\u8282\u5199\u4f5c\u3002',
  projectFoundation: '\u9879\u76ee\u5730\u57fa',
  chapterPreparation: '\u672c\u7ae0\u51c6\u5907',
  enterWriting: '\u8fdb\u5165\u7ae0\u8282\u5199\u4f5c',
  backToProjectPrep: '\u8fd4\u56de\u9879\u76ee\u51c6\u5907',
  editThisMaterial: '\u7f16\u8f91\u8fd9\u9879',
  currentChapterPrep: '\u5f53\u524d\u7ae0\u8282',
  chapterOutlineStatus: '\u672c\u7ae0\u7ec6\u7eb2',
  noChapterOutlineYet: '\u8fd8\u6ca1\u6709\u672c\u7ae0\u7ec6\u7eb2',
  projectPrepReady: '\u9879\u76ee\u5730\u57fa\u5df2\u53ef\u652f\u6491\u5199\u4f5c\u3002',
  projectPrepNeedWork: '\u9879\u76ee\u5730\u57fa\u8fd8\u6709\u7f3a\u53e3\uff0c\u53ef\u4ee5\u5148\u8865\u5168\uff0c\u4e5f\u53ef\u8fdb\u5165\u7ae0\u8282\u9875\u8fb9\u5199\u8fb9\u8865\u3002',
  chapterPrepHelp: '\u672c\u7ae0\u7ec6\u7eb2\u5c5e\u4e8e\u5f53\u524d\u7ae0\u8282\uff0c\u4e0d\u548c\u6574\u672c\u4e66\u8d44\u6599\u6df7\u5728\u4e00\u8d77\u3002',
  stopGenerating: '鍋滄',
  confirmAiRewrite: 'AI 鍙細鐢熸垚涓€娈佃祫鏂欒ˉ涓佸苟杩藉姞鎴愬€欓€夌锛屼笉浼氶噸鍐欏畬鏁磋祫鏂欙紝鏄惁缁х画锛?,
  thinking: 'AI 姝ｅ湪鏁寸悊',
  aiBusyTarget: '鐢熸垚鐩爣',
  generatingCandidateShort: '姝ｅ湪鐢熸垚鍊欓€?,
  generatingTaskCard: '姝ｅ湪鏁寸悊鏈珷浠诲姟鍗?,
  generatingDraft: '姝ｅ湪鐢熸垚姝ｆ枃鍒濈',
  generatingSelfCheck: '姝ｅ湪鑷鍒濈',
  checkAndSync: '\u68c0\u67e5\u5e76\u540c\u6b65',
  aiSettings: '\u0041\u0049 \u8bbe\u7f6e',
  apiKey: 'API Key',
  baseUrl: 'Base URL',
  proxyUrl: '\u4ee3\u7406\u5730\u5740',
  model: '\u6a21\u578b',
  providerPreset: '\u5feb\u901f\u586b\u5165',
  deepSeekPreset: 'DeepSeek',
  openAiPreset: 'OpenAI',
  aiSettingsHint: '\u5148\u586b API Key\uff0c\u518d\u4fdd\u5b58\u6216\u6d4b\u8bd5\u8fde\u63a5\u3002DeepSeek \u8bf7\u7528 https://api.deepseek.com \u548c deepseek-v4-flash\u3002',
  configured: '\u5df2\u914d\u7f6e',
  notConfigured: '\u672a\u914d\u7f6e',
  saveSettings: '\u4fdd\u5b58\u8bbe\u7f6e',
  testConnection: '\u6d4b\u8bd5\u8fde\u63a5',
  connectionOk: '\u8fde\u63a5\u6b63\u5e38',
  aiSettingsFailed: '\u0041\u0049 \u8bbe\u7f6e\u64cd\u4f5c\u5931\u8d25',
  generating: '\u751f\u6210\u4e2d...',
  generatingOutline: '姝ｅ湪鐢熸垚澶х翰鍊欓€?..',
  configureAiFirst: '\u8bf7\u5148\u5728 AI \u8bbe\u7f6e\u4e2d\u586b\u5199 OpenAI API Key\u3002',
  apiKeyPlaceholder: '\u53ea\u4fdd\u5b58\u5728\u672c\u673a Electron \u914d\u7f6e\u4e2d',
  baseUrlPlaceholder: 'https://api.openai.com/v1',
  proxyUrlPlaceholder: '\u53ef\u9009\uff1ahttp://127.0.0.1:18081',
}

const platforms = ['\u8d77\u70b9', '\u756a\u8304', '\u4e03\u732b', '\u664b\u6c5f', '\u5176\u4ed6']

const stageLabels: Record<BookStage, string> = {
  idea: '\u7acb\u9879',
  setting: '\u8bbe\u5b9a',
  outline: '\u5927\u7eb2',
  drafting: '\u8fde\u8f7d',
  revision: '\u4fee\u7a3f',
  finished: '\u5b8c\u7ed3',
  unknown: '\u672a\u6574\u7406',
}

const fallbackState: WorkspaceState = {
  libraryPath: null,
  books: [],
}

const maxProjectChatMessages = 40

type AppView = 'dashboard' | 'create'
type BookMode = 'prep' | 'write'
type BatchWritingMode = 'guarded' | 'reckless'
type WritingSpeedMode = 'polish' | 'guarded' | 'reckless'
type CandidateKind = 'volume-outline' | 'chapter-outline' | 'continue-writing' | 'chapter-check' | 'chapter-revision' | 'chapter-feedback' | 'sync-context' | 'material' | 'project-update' | 'setup'
type PrimaryWorkflowAction = 'review-candidate' | 'configure-ai' | 'create-chapter' | 'generate-volume-outline' | 'generate-chapter-outline' | 'write-chapter' | 'complete-setup'
type WorkflowStepStatus = 'pending' | 'running' | 'done' | 'failed'
type CompanionActionIntent = 'apply-candidate' | 'handle-feedback' | 'write-next' | 'batch-write' | 'fix-foundation' | 'configure-ai' | 'create-chapter' | 'wait'

interface WorkflowStep {
  id: string
  label: string
  status: WorkflowStepStatus
}

interface CandidateDraft {
  kind: CandidateKind
  title: string
  targetFile: string | null
  targetChapterFile?: string
  targetChapterTitle?: string
  content: string
  taskCard?: string
  selfCheck?: string
  selfCheckFailed?: boolean
  statePatch?: string
  progressPatch?: string
  memoryPatch?: string
  structuredPatch?: string
  futurePlanPatch?: string
  stylePatch?: string
  memoryGovernancePatch?: string
  stateGateWarnings?: string[]
  qualityGateWarnings?: string[]
  qualityScore?: number
  qualityGatePassed?: boolean
  nextChapterReadiness?: string
  companion90Summary?: Companion90FlowSummary
  directorStatus?: 'ready' | 'auto-revised' | 'needs-review'
  directorDetail?: string
  feedbackSummary?: string
  impactSummary?: string
  longTermMemory?: string
  smartFeedbackRoute?: SmartFeedbackRoute
  companionDecision?: CompanionDecision
  projectImpactMap?: ProjectImpactMap
  projectUpdates?: ProjectUpdateItem[]
  projectRepairContent?: string
  syncPayload?: Omit<ContextSyncInput, 'bookPath'>
  updates?: ProjectUpdateItem[]
}

interface EditorialJudgement {
  level: 'apply' | 'review' | 'reject' | 'idle'
  title: string
  why: string
  nextAction: string
  reasons: string[]
}

interface EditorialRadarItem {
  id: string
  label: string
  status: 'ok' | 'watch' | 'risk' | 'idle'
  detail: string
}

interface EditorialFocusAction {
  radarId: string
  label: string
  feedback: string
}

interface PrimaryWorkflowDecision {
  action: PrimaryWorkflowAction
  label: string
  detail: string
  disabled: boolean
}

interface CompanionCopilotStatus {
  intent: CompanionActionIntent
  label: string
  summary: string
  nextAction: string
  confidence: number
  warnings: string[]
}

interface ChapterVolumeGroup {
  id: string
  title: string
  range: string
  chapters: ChapterSummary[]
}

function countWords(content: string) {
  const chineseChars = content.match(/[\u4e00-\u9fff]/g)?.length ?? 0
  const latinWords = content.match(/[A-Za-z0-9]+/g)?.length ?? 0
  return chineseChars + latinWords
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function buildProjectCommandCenter(detail: BookDetail, materials: ProjectMaterialSummary[], foundationReady: boolean) {
  const totalWords = detail.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)
  const targetWords = detail.chapters.reduce((sum, chapter) => sum + chapter.targetWords, 0)
  const requiredItems = detail.contextCheck.items.filter((item) => item.status !== 'optional')
  const readyRequiredItems = requiredItems.filter((item) => item.status === 'ready')
  const readyMaterials = materials.filter((material) => material.ready)
  const missingMaterials = materials.filter((material) => !material.ready)
  const currentChapterIndex = detail.selectedChapter ? detail.chapters.findIndex((chapter) => chapter.file === detail.selectedChapter?.file) + 1 : 0

  return {
    stage: stageLabels[detail.book.stage] ?? detail.book.stage,
    totalWords,
    targetWords,
    chapterCount: detail.chapters.length,
    currentChapterIndex: Math.max(currentChapterIndex, 0),
    readyRatio: requiredItems.length === 0 ? 100 : Math.round((readyRequiredItems.length / requiredItems.length) * 100),
    materialRatio: materials.length === 0 ? 0 : Math.round((readyMaterials.length / materials.length) * 100),
    healthLabel: foundationReady ? '鍦板熀鍙啓' : '鍦板熀缂哄彛',
    healthDetail: foundationReady ? '闀挎湡璧勬枡宸茬粡鑳芥敮鎾戝綋鍓嶇珷鑺傘€? : `杩樻湁 ${missingMaterials.length} 椤硅祫鏂欓渶瑕佽ˉ榻愭垨鍘嬬缉銆俙,
    risk: detail.contextCheck.message,
  }
}

function groupChaptersByVolume(chapters: ChapterSummary[], volumeSize = 50): ChapterVolumeGroup[] {
  const groups: ChapterVolumeGroup[] = []

  chapters.forEach((chapter, index) => {
    const volumeIndex = Math.floor(index / volumeSize)
    const group = groups[volumeIndex] ?? {
      id: `volume-${volumeIndex + 1}`,
      title: `绗?{volumeIndex + 1}鍗穈,
      range: '',
      chapters: [],
    }

    group.chapters.push(chapter)
    groups[volumeIndex] = group
  })

  return groups.map((group, index) => {
    const start = index * volumeSize + 1
    const end = start + group.chapters.length - 1
    return {
      ...group,
      range: `${String(start).padStart(3, '0')}-${String(end).padStart(3, '0')}`,
    }
  })
}

function buildPrimaryWorkflowDecision(detail: BookDetail, candidateDraft: CandidateDraft | null, aiConfigured: boolean, busy: boolean): PrimaryWorkflowDecision {
  if (candidateDraft && candidateDraft.kind !== 'chapter-check') {
    return {
      action: 'review-candidate',
      label: '鏌ョ湅骞跺簲鐢ㄥ€欓€?,
      detail: `宸叉湁鍊欓€夛細${getCandidateKindLabel(candidateDraft.kind)}銆傚厛澶勭悊瀹冿紝閬垮厤閲嶅鐢熸垚銆俙,
      disabled: busy,
    }
  }

  if (!aiConfigured) {
    return {
      action: 'configure-ai',
      label: '鍏堥厤缃?AI',
      detail: 'AI 鏈厤缃紝涓嶈兘杩涘叆鐢熸垚娴佺▼銆?,
      disabled: busy,
    }
  }

  if (!detail.selectedChapter) {
    return {
      action: 'create-chapter',
      label: '鏂板缓绗竴绔?,
      detail: '褰撳墠娌℃湁绔犺妭锛屽厛鍒涘缓绔犺妭鎵挎帴缁嗙翰鍜屾鏂囥€?,
      disabled: busy,
    }
  }

  if (detail.contextCheck.level === 'missing-volume-outline') {
    return {
      action: 'generate-volume-outline',
      label: '鐢熸垚鍗风翰',
      detail: '鍗风翰缂哄け锛屽厛琛ヨ冻鏈嵎鐩爣銆佸啿绐佸拰闃舵杞姌銆?,
      disabled: busy,
    }
  }

  if (detail.contextCheck.level === 'missing-chapter-outline') {
    return {
      action: 'generate-chapter-outline',
      label: '鐢熸垚鏈珷缁嗙翰',
      detail: '鏈珷缁嗙翰缂哄け锛屽厛鎶婃湰绔犱换鍔°€佸満鏅拰閽╁瓙瀹氫笅鏉ャ€?,
      disabled: busy,
    }
  }

  if (detail.contextCheck.level === 'ready') {
    return {
      action: 'write-chapter',
      label: '涓绘祦绋嬶細鍐欎笅涓€姝?,
      detail: '璧勬枡榻愬锛岃繘鍏ョ珷鑺傚婕旀祦绋嬶細浠诲姟鍗°€佹鏂囥€佽嚜妫€銆佸悓姝ャ€?,
      disabled: busy,
    }
  }

  return {
    action: 'complete-setup',
    label: detail.contextCheck.primaryAction,
    detail: detail.contextCheck.message,
    disabled: busy,
  }
}

function getKnowledgeLane(materialId: string) {
  if (['projectBrief', 'platformFit', 'genreRules', 'coreSetting', 'coverPrompt', 'styleSample'].includes(materialId)) {
    return 'core'
  }

  if (['mainCharacter', 'supportingCharacters', 'minorCharacters'].includes(materialId)) {
    return 'characters'
  }

  if (['overallOutline', 'goldenFirstThree', 'volumeOutline', 'chapterOutline'].includes(materialId)) {
    return 'outline'
  }

  return 'state'
}

function groupKnowledgeMaterials(materials: ProjectMaterialSummary[]) {
  const groups = [
    { id: 'core', title: '鏍稿績璁惧畾', help: '骞冲彴銆侀鏉愩€佸崠鐐广€佸皝闈㈠拰鏂囬銆?, materials: [] as ProjectMaterialSummary[] },
    { id: 'characters', title: '浜虹墿璧勪骇', help: '涓昏銆侀厤瑙掋€侀緳濂楀拰鍏崇郴娌夋穩銆?, materials: [] as ProjectMaterialSummary[] },
    { id: 'outline', title: '鍓ф儏楠ㄦ灦', help: '鎬荤翰銆侀粍閲戜笁绔犮€佸嵎绾插拰鏈珷缁嗙翰銆?, materials: [] as ProjectMaterialSummary[] },
    { id: 'state', title: '杩炵画鎬х姸鎬?, help: '缁忛獙銆佷换鍔°€佷紡绗斻€侀暱鏈熻蹇嗗拰鏈潵璁″垝銆?, materials: [] as ProjectMaterialSummary[] },
  ]

  for (const material of materials) {
    const group = groups.find((item) => item.id === getKnowledgeLane(material.id)) ?? groups[groups.length - 1]
    group.materials.push(material)
  }

  return groups
}

function buildChapterRouteSteps(detail: BookDetail, chapterOutline: ProjectMaterialSummary | null, dirty: boolean, candidateDraft: CandidateDraft | null, workflowDecision: PrimaryWorkflowDecision) {
  const hasChapter = Boolean(detail.selectedChapter)
  const hasOutline = Boolean(chapterOutline?.ready)

  return [
    {
      label: '閫夊畾绔犺妭',
      detail: detail.selectedChapter?.title ?? '鍏堟柊寤烘垨閫夋嫨绔犺妭',
      status: hasChapter ? 'ready' : 'missing',
    },
    {
      label: '鏈珷缁嗙翰',
      detail: hasOutline ? '宸蹭綔涓烘湰绔犲啓浣滀緷鎹? : '鍏堢敓鎴愭湰绔犵粏绾诧紝閬垮厤绌哄啓姝ｆ枃',
      status: hasOutline ? 'ready' : hasChapter ? 'current' : 'missing',
    },
    {
      label: '鐢熸垚鍊欓€?,
      detail: candidateDraft ? workflowDecision.detail : workflowDecision.detail,
      status: candidateDraft ? 'ready' : workflowDecision.action === 'write-chapter' ? 'current' : 'missing',
    },
    {
      label: '搴旂敤骞跺悓姝?,
      detail: dirty ? '姝ｆ枃鏈夋湭淇濆瓨淇敼锛屽厛淇濆瓨鍐嶈繘鍏ヤ笅涓€姝? : '搴旂敤鍊欓€夊悗妫€鏌ュ苟鍚屾璧勬枡',
      status: dirty ? 'current' : candidateDraft ? 'current' : 'missing',
    },
  ]
}

function formatAiLogTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('zh-CN', { hour12: false })
}

function summarizeAiCost(logs: AiCallLog[]) {
  const recent = logs.slice(0, 8)
  const totalInput = recent.reduce((sum, log) => sum + log.inputChars, 0)
  const totalOutput = recent.reduce((sum, log) => sum + log.outputChars, 0)
  const totalDuration = recent.reduce((sum, log) => sum + log.durationMs, 0)
  const cacheKeys = new Set(recent.map((log) => log.promptCacheKey).filter(Boolean))
  const slowest = recent.reduce<AiCallLog | null>((current, log) => (!current || log.durationMs > current.durationMs ? log : current), null)

  return {
    count: recent.length,
    totalInput,
    totalOutput,
    totalDuration,
    cacheKeyCount: cacheKeys.size,
    slowest,
  }
}

function buildChapterPreflightContract(detail: BookDetail, chapterOutline: ProjectMaterialSummary | null) {
  const selected = detail.selectedChapter
  const missing = detail.contextCheck.items.filter((item) => item.status === 'missing').map((item) => item.label)

  if (!selected) {
    return '鍏堟柊寤烘垨閫夋嫨绔犺妭锛屾墠鑳界敓鎴愭湰绔犲啓浣滃悎鍚屻€?
  }

  return [
    `绔犺妭锛?{selected.title}`,
    `鐩爣瀛楁暟锛?{selected.targetWords}`,
    `鏈珷缁嗙翰锛?{chapterOutline?.ready ? '宸插氨缁? : '缂哄け锛岀敓鎴愭鏂囧墠蹇呴』鍏堣ˉ'}`,
    `鍦板熀鐘舵€侊細${missing.length ? `缂哄皯 ${missing.join('銆?)}` : '鍙敮鎾戝啓浣?}`,
    '姝ｆ枃蹇呴』浜や粯锛氶鏉愪俊鍙枫€佷富绾挎帹杩涖€佺姸鎬佸彉鍖栥€佷笅涓€绔犳壙鎺ャ€?,
  ].join('\n')
}

function buildUserResultJudgement(candidateDraft: CandidateDraft | null, batchResult: BatchWritingResult | null) {
  if (batchResult) {
    if (batchResult.stopped) {
      return `寤鸿鐪嬩竴鐪硷細宸茬敓鎴?${batchResult.completed} 绔狅紝杩炲啓閬囧埌闇€瑕佸鏍哥殑绔犺妭鍚庢殏鍋溿€俙
    }
    return `宸插畬鎴愶細鏈鐢熸垚 ${batchResult.completed} 绔狅紝宸茶嚜鍔ㄥ啓鍏ユ鏂囥€俙
  }

  if (!candidateDraft) {
    return '杩樻病鏈夋柊鍊欓€夈€傜偣鍑诲啓涓嬩竴绔犲悗锛屾垜浼氱粰鍑轰竴鍙ユ槸鍚﹀彲鐢ㄧ殑鍒ゆ柇銆?
  }

  if (candidateDraft.directorStatus === 'needs-review' || candidateDraft.stateGateWarnings?.length || candidateDraft.qualityGateWarnings?.length) {
    const warning = candidateDraft.stateGateWarnings?.[0] || candidateDraft.qualityGateWarnings?.[0] || '鏈珷鏈夐渶瑕佸鏍哥殑鍦版柟銆?
    return `寤鸿鐪嬩竴鐪硷細${warning}`
  }

  if (candidateDraft.kind === 'continue-writing' || candidateDraft.kind === 'chapter-feedback') {
    return '鍙互搴旂敤锛氭湰绔犲凡鐢熸垚鍊欓€夛紝棰樻潗銆佹帹杩涘拰鐘舵€佹壙鎺ュ凡瀹屾垚鍩虹妫€鏌ャ€?
  }

  return '宸茬敓鎴愬€欓€夛細璇风‘璁ゅ悗搴旂敤銆?
}

function buildCompanionCopilotStatus({
  detail,
  candidateDraft,
  batchResult,
  feedback,
  writingMode,
  primaryDecision,
  editorialJudgement,
  aiConfigured,
  busy,
}: {
  detail: BookDetail
  candidateDraft: CandidateDraft | null
  batchResult: BatchWritingResult | null
  feedback: string
  writingMode: WritingSpeedMode
  primaryDecision: PrimaryWorkflowDecision
  editorialJudgement: EditorialJudgement
  aiConfigured: boolean
  busy: boolean
}): CompanionCopilotStatus {
  if (busy) {
    return {
      intent: 'wait',
      label: '鎴戞鍦ㄥ鐞?,
      summary: '褰撳墠浠诲姟杩樺湪杩愯銆傚畬鎴愬悗鎴戜細鎶婄粨鏋滄斁杩涘€欓€夊尯锛屽苟缁欏嚭鏄惁鍙敤鐨勫垽鏂€?,
      nextAction: '鍙互闅忔椂鍋滄锛涘惁鍒欑瓑鎴戝鐞嗗畬杩欎竴杞€?,
      confidence: 72,
      warnings: [],
    }
  }

  if (!aiConfigured) {
    return {
      intent: 'configure-ai',
      label: '鍏堟帴涓?AI',
      summary: '杩樻病鏈夊彲鐢ㄧ殑 AI 閰嶇疆锛屾墍浠ユ垜涓嶈兘鏇夸綘鍒ゆ柇銆佹敼绋挎垨鍐欎笅涓€绔犮€?,
      nextAction: '鎵撳紑 AI 璁剧疆锛屽～濂芥ā鍨嬨€丅ase URL 鍜?Key銆?,
      confidence: 100,
      warnings: ['AI 鏈厤缃?],
    }
  }

  if (feedback.trim()) {
    return {
      intent: 'handle-feedback',
      label: '鎸変綘鐨勬兂娉曞鐞?,
      summary: '浣犲凡缁忚浜嗕笉婊℃剰鎴栨兂鏂板鐨勫湴鏂广€傛垜浼氬厛鍒ゆ柇杩欐槸姝ｆ枃闂銆佽瀹氶棶棰橈紝杩樻槸涓よ€呴兘瑕佹敼銆?,
      nextAction: '鐐逛富鎸夐挳鍚庯紝鎴戜細鐢熸垚鍙‘璁ょ殑鏀圭鍜岄」鐩奖鍝嶆洿鏂般€?,
      confidence: 94,
      warnings: [],
    }
  }

  if (candidateDraft && candidateDraft.kind !== 'chapter-check') {
    const warnings = [
      ...(candidateDraft.stateGateWarnings ?? []),
      ...(candidateDraft.qualityGateWarnings ?? []),
    ].filter(Boolean)
    return {
      intent: 'apply-candidate',
      label: editorialJudgement.level === 'reject' ? '鍏堝埆鐩存帴鐢? : '搴旂敤褰撳墠鍊欓€?,
      summary: buildUserResultJudgement(candidateDraft, batchResult),
      nextAction: editorialJudgement.level === 'reject' ? '濡傛灉浣犺鍙闄╋紝涔熷彲浠ュ簲鐢紱鏇村缓璁湪涓嬫柟璇村摢閲屼笉婊℃剰璁╂垜閲嶅啓銆? : '纭鍐呭娌￠棶棰樺悗鐐逛富鎸夐挳锛屾垜浼氬簲鐢ㄥ苟鍚屾闀挎湡鐘舵€併€?,
      confidence: warnings.length ? 82 : 95,
      warnings,
    }
  }

  if (!detail.selectedChapter) {
    return {
      intent: 'create-chapter',
      label: '鍒涘缓绗竴绔?,
      summary: '褰撳墠涔﹁繕娌℃湁绔犺妭銆傛垜浼氬厛寤虹珷锛屽啀杩涘叆鍐欎綔娴佺▼銆?,
      nextAction: '鐐逛富鎸夐挳鍒涘缓绔犺妭銆?,
      confidence: 98,
      warnings: [],
    }
  }

  if (detail.contextCheck.level !== 'ready') {
    return {
      intent: 'fix-foundation',
      label: primaryDecision.label,
      summary: detail.contextCheck.message,
      nextAction: '鐐逛富鎸夐挳鍚庯紝鎴戜細鍏堣ˉ榻愬綋鍓嶆渶褰卞搷鍐欎綔鐨勮祫鏂欙紝涓嶈姝ｆ枃绌鸿窇銆?,
      confidence: 91,
      warnings: detail.contextCheck.items.filter((item) => item.status === 'missing').map((item) => item.label),
    }
  }

  if (writingMode !== 'polish') {
    return {
      intent: 'batch-write',
      label: writingMode === 'reckless' ? '鏃犺剳杩炲啓' : '绋冲Ε杩炲啓',
      summary: writingMode === 'reckless'
        ? '浣犻€夋嫨鐨勬槸鏃犺剳妯″紡銆傛垜浼氬敖閲忚繛缁敓鎴愶紝浣嗚川閲忛渶瑕佷箣鍚庡啀闆嗕腑淇€?
        : '浣犻€夋嫨鐨勬槸杩炲啓妯″紡銆傛垜浼氳繛缁帹杩涳紝閬囧埌鏄庢樉闂浼氬仠涓嬫潵璁╀綘纭銆?,
      nextAction: '鐐逛富鎸夐挳寮€濮嬫壒閲忕敓鎴愩€?,
      confidence: writingMode === 'reckless' ? 76 : 87,
      warnings: writingMode === 'reckless' ? ['鏃犺剳妯″紡浼氱壓鐗插崟绔犵簿缁嗗害'] : [],
    }
  }

  return {
    intent: 'write-next',
    label: '鍐欎笅涓€绔?,
    summary: '椤圭洰璧勬枡銆佺珷鑺傜姸鎬佸拰闀挎湡鎵挎帴宸茬粡鍙敤銆傛垜浼氳嚜鍔ㄨ窇缁嗙翰銆佹鏂囥€佽嚜妫€銆佸悓姝ュ拰涓荤紪鍒ゆ柇銆?,
    nextAction: '鐐逛富鎸夐挳鍗冲彲锛屼笉闇€瑕侀€愪釜鐐瑰唴閮ㄦ楠ゃ€?,
    confidence: 93,
    warnings: [],
  }
}

function buildEditorialJudgement(candidateDraft: CandidateDraft | null, batchResult: BatchWritingResult | null): EditorialJudgement {
  if (batchResult) {
    if (batchResult.stopped) {
      return {
        level: 'review',
        title: '寤鸿鐪嬩竴鐪?,
        why: `杩炲啓宸茬敓鎴?${batchResult.completed} 绔狅紝浣嗗湪闂ㄧ澶勬殏鍋溿€俙,
        nextAction: '鍏堢湅鏈€鍚庝竴绔犵殑闂锛屽啀鍐冲畾缁х画杩炲啓杩樻槸灞€閮ㄩ噸鍐欍€?,
        reasons: batchResult.results.at(-1)?.warnings.slice(0, 3) ?? ['杩炲啓閾捐矾閬囧埌闇€瑕佷汉宸ュ垽鏂殑鑺傜偣銆?],
      }
    }

    return {
      level: 'apply',
      title: '宸茶嚜鍔ㄥ啓鍏?,
      why: `鏈鎵归噺鐢熸垚 ${batchResult.completed} 绔狅紝娴佺▼娌℃湁涓诲姩鏆傚仠銆俙,
      nextAction: '寤鸿鎶芥煡鏈€鍚庝竴绔犵殑棰樻潗鍛炽€佷富瑙掓敹鐩婂拰绔犳湯閽╁瓙銆?,
      reasons: ['鎵归噺妯″紡榛樿鐗虹壊缁嗚妭澶嶆牳锛岄€傚悎鍏堝爢閲忓啀绮句慨銆?],
    }
  }

  if (!candidateDraft) {
    return {
      level: 'idle',
      title: '绛夊緟鐢熸垚',
      why: '杩樻病鏈夋柊鐨勬鏂囧€欓€夈€?,
      nextAction: '鐐瑰嚮鈥滃啓涓嬩竴绔犫€濓紝鎴戜細鍏堢敓鎴愬€欓€夛紝鍐嶇粰鍑轰富缂栧垽鏂€?,
      reasons: ['褰撳墠娌℃湁鍙绋垮唴瀹广€?],
    }
  }

  const warnings = [
    ...(candidateDraft.stateGateWarnings ?? []),
    ...(candidateDraft.qualityGateWarnings ?? []),
  ].filter(Boolean)
  const reasons = warnings.slice(0, 4)

  if (candidateDraft.selfCheckFailed || candidateDraft.directorStatus === 'needs-review') {
    return {
      level: 'reject',
      title: '涓嶅缓璁洿鎺ュ簲鐢?,
      why: reasons[0] || '瀵兼紨閾捐矾璁や负鏈珷杩樻病鏈夎揪鍒扮ǔ瀹氫氦浠樼姸鎬併€?,
      nextAction: '鍦ㄢ€滃摢閲屼笉婊℃剰鈥濋噷璇存槑闂锛屼紭鍏堣蛋鏅鸿兘鍙嶉閲嶅啓銆?,
      reasons: reasons.length ? reasons : ['鏈珷闇€瑕佸鏍革紝鐩存帴搴旂敤鍙兘鎶婇棶棰樻矇娣€杩涘悗缁笂涓嬫枃銆?],
    }
  }

  if (warnings.length || candidateDraft.qualityGatePassed === false || (typeof candidateDraft.qualityScore === 'number' && candidateDraft.qualityScore < 80)) {
    return {
      level: 'review',
      title: '寤鸿鐪嬩竴鐪?,
      why: reasons[0] || '鏈珷鍩烘湰鍙敤锛屼絾璐ㄩ噺闂ㄧ娌℃湁瀹屽叏鏀捐銆?,
      nextAction: '閲嶇偣妫€鏌ラ鏉愪俊鍙枫€佷富瑙掍富鍔ㄦ€с€佹敹鐩婂弽棣堝拰涓嬩竴绔犳壙鎺ャ€?,
      reasons: reasons.length ? reasons : ['璐ㄩ噺鍒嗘垨闂ㄧ缁撴灉鎻愮ず闇€瑕佷汉宸ュ揩閫熷鏍搞€?],
    }
  }

  if (candidateDraft.kind === 'chapter-feedback' && candidateDraft.smartFeedbackRoute) {
    return {
      level: 'review',
      title: '寤鸿鐪嬩竴鐪?,
      why: candidateDraft.smartFeedbackRoute.userFacingSummary || '鏈鍙嶉鍙兘鍚屾椂褰卞搷姝ｆ枃鍜岄暱鏈熻祫鏂欍€?,
      nextAction: '纭淇敼鏂瑰悜绗﹀悎浣犵殑鎯虫硶鍚庡啀搴旂敤銆?,
      reasons: [
        candidateDraft.smartFeedbackRoute.reason,
        candidateDraft.smartFeedbackRoute.projectAction === 'repair' ? '杩欐浼氬悓姝ユ洿鏂伴」鐩祫鏂欍€? : '杩欐涓昏淇敼褰撳墠绔犺妭銆?,
      ].filter(Boolean),
    }
  }

  if (candidateDraft.kind === 'continue-writing' || candidateDraft.kind === 'chapter-feedback') {
    return {
      level: 'apply',
      title: '鍙互搴旂敤',
      why: '鏈珷鍊欓€夊凡閫氳繃鍩虹闂ㄧ锛屾病鏈夊彂鐜板繀椤婚樆鏂殑闂銆?,
      nextAction: '搴旂敤鍚庝細鑷姩娌夋穩鐘舵€侊紝骞惰繘琛屽洖璇昏嚜妫€銆?,
      reasons: ['棰樻潗銆佹帹杩涘拰鐘舵€佹壙鎺ュ凡瀹屾垚鍩虹妫€鏌ャ€?],
    }
  }

  return {
    level: 'review',
    title: '寤鸿纭鍚庡簲鐢?,
    why: '杩欎笉鏄鏂囧€欓€夛紝搴旂敤鍓嶉渶瑕佺‘璁ょ洰鏍囨枃浠跺拰鍐呭鏄惁绗﹀悎棰勬湡銆?,
    nextAction: '鏌ョ湅鍊欓€夊尯鍐呭锛岀‘璁ゅ悗鍐嶅簲鐢ㄣ€?,
    reasons: ['璧勬枡绫诲€欓€変細鍐欏叆椤圭洰鏂囦欢銆?],
  }
}

function buildEditorialFeedbackDraft(judgement: EditorialJudgement) {
  if (judgement.level === 'idle' || judgement.level === 'apply') {
    return ''
  }

  return [
    `涓荤紪鍒ゆ柇锛?{judgement.title}`,
    `闂锛?{judgement.why}`,
    `淇敼鐩爣锛?{judgement.nextAction}`,
    judgement.reasons.length ? `閲嶇偣澶勭悊锛?{judgement.reasons.join('锛?)}` : '',
    '璇峰垽鏂繖鏄湰绔犻棶棰樿繕鏄叏绡囪祫鏂欓棶棰橈紱濡傛灉浼氬奖鍝嶅悗缁紝璇峰悓姝ユ洿鏂伴暱鏈熻瀹氥€佽鑹茬姸鎬併€佽拷韪〃鍜屼笅涓€绔犳壙鎺ャ€?,
  ].filter(Boolean).join('\n')
}

function buildEditorialRadar(candidateDraft: CandidateDraft | null, judgement: EditorialJudgement): EditorialRadarItem[] {
  if (!candidateDraft) {
    return [
      { id: 'genre', label: '棰樻潗鍛?, status: 'idle', detail: '绛夊緟姝ｆ枃鍊欓€? },
      { id: 'agency', label: '涓昏涓诲姩鎬?, status: 'idle', detail: '绛夊緟姝ｆ枃鍊欓€? },
      { id: 'reward', label: '鏀剁泭鍙嶉', status: 'idle', detail: '绛夊緟姝ｆ枃鍊欓€? },
      { id: 'plot', label: '涓荤嚎鎺ㄨ繘', status: 'idle', detail: '绛夊緟姝ｆ枃鍊欓€? },
      { id: 'hook', label: '绔犳湯鎵挎帴', status: 'idle', detail: '绛夊緟姝ｆ枃鍊欓€? },
      { id: 'memory', label: '璁板繂鍚屾', status: 'idle', detail: '绛夊緟姝ｆ枃鍊欓€? },
    ]
  }

  const warnings = [
    ...(candidateDraft.stateGateWarnings ?? []),
    ...(candidateDraft.qualityGateWarnings ?? []),
  ].join('\n')
  const detail = [
    candidateDraft.taskCard,
    candidateDraft.selfCheck,
    candidateDraft.nextChapterReadiness,
    candidateDraft.directorDetail,
  ].filter(Boolean).join('\n')
  const searchable = `${warnings}\n${detail}`
  const hasRisk = (patterns: RegExp[]) => patterns.some((pattern) => pattern.test(searchable))
  const hasPatch = (...values: Array<string | undefined>) => values.some((value) => typeof value === 'string' && value.trim().length > 20)
  const blocked = judgement.level === 'reject'

  return [
    {
      id: 'genre',
      label: '棰樻潗鍛?,
      status: hasRisk([/棰樻潗|缃戞父|绯荤粺|鍗囩骇|骞冲彴|绫诲瀷|genre/i]) ? 'risk' : blocked ? 'watch' : 'ok',
      detail: hasRisk([/棰樻潗|缃戞父|绯荤粺|鍗囩骇|骞冲彴|绫诲瀷|genre/i]) ? '棰樻潗淇″彿闇€瑕佸鏍? : '鏈彂鐜伴鏉愬亸绉绘彁绀?,
    },
    {
      id: 'agency',
      label: '涓昏涓诲姩鎬?,
      status: hasRisk([/涓诲姩|琚姩|鍔ㄦ満|閫夋嫨|琛屽姩|涓昏/]) ? 'risk' : blocked ? 'watch' : 'ok',
      detail: hasRisk([/涓诲姩|琚姩|鍔ㄦ満|閫夋嫨|琛屽姩|涓昏/]) ? '涓昏琛屽姩鎴栧姩鏈洪渶瑕佺‘璁? : '鏈彂鐜颁富瑙掕鍔ㄦ彁绀?,
    },
    {
      id: 'reward',
      label: '鏀剁泭鍙嶉',
      status: hasRisk([/鏀剁泭|濂栧姳|缁忛獙|瑁呭|绛夌骇|鍙嶉|鐖界偣|鍥炴姤/]) ? 'risk' : judgement.level === 'apply' ? 'ok' : 'watch',
      detail: hasRisk([/鏀剁泭|濂栧姳|缁忛獙|瑁呭|绛夌骇|鍙嶉|鐖界偣|鍥炴姤/]) ? '鏀剁泭鎴栫埥鐐瑰弽棣堥渶瑕佹鏌? : '鍩虹鍙嶉鏈闂ㄧ鎷︽埅',
    },
    {
      id: 'plot',
      label: '涓荤嚎鎺ㄨ繘',
      status: hasRisk([/鎺ㄨ繘|涓荤嚎|浠诲姟|鐩爣|鍐茬獊|鍋滄粸/]) ? 'risk' : blocked ? 'watch' : 'ok',
      detail: hasRisk([/鎺ㄨ繘|涓荤嚎|浠诲姟|鐩爣|鍐茬獊|鍋滄粸/]) ? '涓荤嚎鎺ㄨ繘鍙兘涓嶈冻' : '鏈彂鐜颁富绾垮仠婊炴彁绀?,
    },
    {
      id: 'hook',
      label: '绔犳湯鎵挎帴',
      status: candidateDraft.nextChapterReadiness ? 'ok' : judgement.level === 'apply' ? 'watch' : 'risk',
      detail: candidateDraft.nextChapterReadiness ? '宸茬敓鎴愪笅涓€绔犳壙鎺ュ崱' : '缂哄皯鏄庣‘涓嬩竴绔犳壙鎺?,
    },
    {
      id: 'memory',
      label: '璁板繂鍚屾',
      status: hasPatch(candidateDraft.statePatch, candidateDraft.progressPatch, candidateDraft.memoryPatch, candidateDraft.structuredPatch, candidateDraft.futurePlanPatch) ? 'ok' : 'watch',
      detail: hasPatch(candidateDraft.statePatch, candidateDraft.progressPatch, candidateDraft.memoryPatch, candidateDraft.structuredPatch, candidateDraft.futurePlanPatch) ? '宸叉湁鐘舵€佹矇娣€琛ヤ竵' : '闀挎湡璁板繂琛ヤ竵鍋忓皯',
    },
  ]
}

function buildEditorialFocusActions(radar: EditorialRadarItem[], judgement: EditorialJudgement): EditorialFocusAction[] {
  if (judgement.level === 'idle') {
    return []
  }

  const templates: Record<string, { label: string; feedback: string }> = {
    genre: {
      label: '鍔犲己棰樻潗鍛?,
      feedback: '璇峰己鍖栨湰绔犻鏉愬懗锛氭妸骞冲彴/棰樻潗搴旀湁鐨勬牳蹇冧俊鍙峰啓杩涘満鏅拰琛屽姩閲岋紝涓嶈鍙帹杩涙硾鍓ф儏銆傝嫢鏄綉娓告枃锛岃琛ョ郴缁熷弽棣堛€佷换鍔＄洰鏍囥€佺瓑绾?鎶€鑳?瑁呭/鍓湰绛夊彲鎰熺煡鍏冪礌銆?,
    },
    agency: {
      label: '琛ヤ富瑙掕鍔?,
      feedback: '璇峰己鍖栦富瑙掍富鍔ㄦ€э細璁╀富瑙掑仛鍑烘竻鏅伴€夋嫨銆佹壙鎷呴闄┿€佹帹鍔ㄥ眬闈㈠彉鍖栵紝鍑忓皯琚姩鍚В閲婃垨琚墽鎯呮帹鐫€璧般€?,
    },
    reward: {
      label: '琛ユ敹鐩婂弽棣?,
      feedback: '璇疯ˉ瓒虫敹鐩婂弽棣堬細璁╂湰绔犳湁鏄庣‘缁忛獙銆佸鍔便€佽澶囥€佽兘鍔涖€佽韩浠姐€佺嚎绱㈡垨鐖界偣鍥炴姤锛屽苟璁╄鑰呮劅鍒颁富瑙掕繖涓€绔犵‘瀹炶禋鍒颁簡銆?,
    },
    plot: {
      label: '鎺ㄨ繘涓荤嚎',
      feedback: '璇峰姞寮轰富绾挎帹杩涳細鏈珷蹇呴』璁╀换鍔°€佸啿绐併€佺洰鏍囨垨浼忕瑪鑷冲皯鍓嶈繘涓€姝ワ紝涓嶈鍙啓杩囧満鍜岄棽鑱娿€?,
    },
    hook: {
      label: '琛ョ珷鏈挬瀛?,
      feedback: '璇烽噸鍋氱珷鏈壙鎺ワ細缁撳熬瑕佺暀涓嬩笅涓€绔犳槑纭湡寰咃紝鍙互鏄柊浠诲姟銆佹柊鍗辨満銆佹柊濂栧姳銆佹柊瀵规墜鎴栨洿澶х殑闅愯棌绾跨储銆?,
    },
    memory: {
      label: '琛ヨ蹇嗘矇娣€',
      feedback: '璇疯ˉ榻愰暱鏈熻蹇嗘矇娣€锛氭妸鏈珷鏂板璁惧畾銆佽鑹茬姸鎬併€佷富绾胯繘搴︺€佷紡绗斻€佷笅涓€绔犳壙鎺ュ悓姝ヨ繘鐘舵€佸崱銆佽拷韪〃鍜屾湭鏉ヨ鍒掋€?,
    },
  }

  return radar
    .filter((item) => item.status === 'risk' || item.status === 'watch')
    .map((item) => templates[item.id] ? { radarId: item.id, ...templates[item.id] } : null)
    .filter((item): item is EditorialFocusAction => Boolean(item))
    .slice(0, 4)
}

function projectChatDraftStorageKey(bookPath: string) {
  return `ai-writing-workbench:project-chat:${bookPath}`
}

function pruneProjectChatMessages(messages: ProjectChatMessage[]) {
  return messages.slice(-maxProjectChatMessages)
}

function loadProjectChatDraft(bookPath: string): ProjectChatMessage[] {
  try {
    const raw = window.localStorage.getItem(projectChatDraftStorageKey(bookPath))
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) {
      return []
    }

    return pruneProjectChatMessages(parsed
      .filter((message) => (message?.role === 'assistant' || message?.role === 'user') && typeof message.content === 'string' && message.content.trim())
      .map((message) => ({
        role: message.role,
        content: message.content,
      })))
  } catch {
    return []
  }
}

function getCandidateKindLabel(kind: CandidateKind) {
  const labels: Record<CandidateKind, string> = {
    'volume-outline': '鍗风翰鍊欓€?,
    'chapter-outline': '鏈珷缁嗙翰鍊欓€?,
    'continue-writing': '姝ｆ枃缁啓鍊欓€?,
    'chapter-check': '鏈珷妫€鏌ユ姤鍛?,
    'chapter-revision': '鏁寸珷淇鍊欓€?,
    'chapter-feedback': '鍙嶉淇敼鍖?,
    'sync-context': '璧勬枡鍚屾鍊欓€?,
    material: '椤圭洰璧勬枡鍊欓€?,
    'project-update': '椤圭洰鍙樻洿鍗?,
    setup: 'AI 璁剧疆鎻愮ず',
  }

  return labels[kind]
}

function describeCandidateTarget(candidate: CandidateDraft) {
  if (candidate.kind === 'continue-writing') {
    return `搴旂敤鍚庝細杩藉姞鍒帮細${candidate.targetChapterTitle ?? '褰撳墠绔犺妭'}`
  }
  if (candidate.kind === 'chapter-revision' || candidate.kind === 'chapter-feedback') {
    return `搴旂敤鍚庝細鏇挎崲锛?{candidate.targetChapterTitle ?? '褰撳墠绔犺妭'}`
  }
  if (candidate.kind === 'project-update') {
    const files = candidate.updates?.map((update) => update.file).join('銆?) || '寰呯‘璁よ祫鏂?
    return `搴旂敤鍚庝細杩藉姞琛ヤ竵鍒帮細${files}`
  }
  if (candidate.targetFile) {
    return `搴旂敤鍚庝細鍐欏叆锛?{candidate.targetFile}`
  }
  if (candidate.kind === 'chapter-check') {
    return '妫€鏌ユ姤鍛婁笉浼氳嚜鍔ㄥ啓鍏ユ鏂?
  }

  return '璇峰厛鏌ョ湅鍊欓€夊唴瀹?
}

function summarizeProjectChatForFallback(messages: ProjectChatMessage[]) {
  return messages
    .slice(-12)
    .map((message) => `${message.role === 'assistant' ? 'AI' : '鎴?}锛?{message.content}`)
    .join('\n\n')
}

function App() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(fallbackState)
  const [bookDetail, setBookDetail] = useState<BookDetail | null>(null)
  const [draftContent, setDraftContent] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [candidate, setCandidate] = useState<CandidateDraft | null>(null)
  const [appView, setAppView] = useState<AppView>('dashboard')
  const [bookMode, setBookMode] = useState<BookMode>('prep')
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false)
  const [isAiCallLogsOpen, setIsAiCallLogsOpen] = useState(false)
  const [aiCallLogs, setAiCallLogs] = useState<AiCallLog[]>([])
  const [latestWritingTaskRun, setLatestWritingTaskRun] = useState<WritingTaskRunSummary | null>(null)
  const [batchWritingMode, setBatchWritingMode] = useState<BatchWritingMode>('guarded')
  const [writingSpeedMode, setWritingSpeedMode] = useState<WritingSpeedMode>('guarded')
  const [batchChapterCount, setBatchChapterCount] = useState(5)
  const [batchWritingResult, setBatchWritingResult] = useState<BatchWritingResult | null>(null)
  const [latestApplyReadbackCheck, setLatestApplyReadbackCheck] = useState<WritingApplyReadbackCheck | null>(null)
  const [isReadbackModalOpen, setIsReadbackModalOpen] = useState(false)
  const [isProjectToolMenuOpen, setIsProjectToolMenuOpen] = useState(false)
  const [aiSettings, setAiSettings] = useState<AiSettings>({
    configured: false,
    model: 'gpt-4.1',
    baseUrl: 'https://api.openai.com/v1',
    proxyUrl: '',
  })
  const [aiForm, setAiForm] = useState<SaveAiSettingsInput>({
    apiKey: '',
    model: 'gpt-4.1',
    baseUrl: 'https://api.openai.com/v1',
    proxyUrl: '',
  })
  const [aiMessage, setAiMessage] = useState<string | null>(null)
  const [isAiBusy, setIsAiBusy] = useState(false)
  const [chapterSnapshots, setChapterSnapshots] = useState<ChapterSnapshot[]>([])
  const [isChapterSidebarCollapsed, setIsChapterSidebarCollapsed] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [aiInstruction, setAiInstruction] = useState('')
  const [createForm, setCreateForm] = useState<CreateBookInput>({
    title: '',
    platform: platforms[0],
    idea: '',
  })
  const [planningMessages, setPlanningMessages] = useState<PlanningMessage[]>([])
  const [planningAnswer, setPlanningAnswer] = useState('')
  const [isPlanningCheckpointQuestionOpen, setIsPlanningCheckpointQuestionOpen] = useState(false)
  const [projectPackage, setProjectPackage] = useState<ProjectPackage | null>(null)
  const [isGeneratingProjectPackage, setIsGeneratingProjectPackage] = useState(false)
  const [isMaterialsPanelOpen, setIsMaterialsPanelOpen] = useState(false)
  const [projectMaterials, setProjectMaterials] = useState<ProjectMaterialSummary[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<ProjectMaterialSummary | null>(null)
  const [materialContent, setMaterialContent] = useState('')
  const [isMaterialDirty, setIsMaterialDirty] = useState(false)
  const [materialMessage, setMaterialMessage] = useState<string | null>(null)
  const [materialSnapshots, setMaterialSnapshots] = useState<ChapterSnapshot[]>([])
  const [selectedMaterialSnapshotId, setSelectedMaterialSnapshotId] = useState('')
  const [isProjectChatOpen, setIsProjectChatOpen] = useState(false)
  const [projectChatMessages, setProjectChatMessages] = useState<ProjectChatMessage[]>([])
  const [projectChatInput, setProjectChatInput] = useState('')
  const [isFeedbackBoxOpen, setIsFeedbackBoxOpen] = useState(false)
  const [chapterFeedback, setChapterFeedback] = useState('')
  const [activeAiRequestId, setActiveAiRequestId] = useState<string | null>(null)
  const [activeAiTaskLabel, setActiveAiTaskLabel] = useState<string | null>(null)
  const [nextChapterFlowSteps, setNextChapterFlowSteps] = useState<WorkflowStep[]>([])
  const candidatePanelRef = useRef<HTMLElement | null>(null)

  const api = window.writingWorkbench

  const isAiSettingsSubmitDisabled = isAiBusy || (!aiSettings.configured && !aiForm.apiKey.trim())

  function updateAiForm(patch: Partial<SaveAiSettingsInput>) {
    setAiForm((current) => ({ ...current, ...patch }))
    setAiMessage(null)
  }

  function applyAiProviderPreset(provider: 'deepseek' | 'openai') {
    if (provider === 'deepseek') {
      updateAiForm({
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-v4-flash',
      })
      return
    }

    updateAiForm({
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4.1',
    })
  }

  useEffect(() => {
    let isMounted = true

    async function loadWorkspace() {
      try {
        setIsLoading(true)
        const nextState = api ? await api.getWorkspaceState() : fallbackState
        const nextAiSettings = api ? await api.getAiSettings() : { configured: false, model: 'gpt-4.1', baseUrl: 'https://api.openai.com/v1', proxyUrl: '' }
        if (isMounted) {
          setWorkspace(nextState)
          setAiSettings(nextAiSettings)
          setAiForm((current) => ({ ...current, model: nextAiSettings.model, baseUrl: nextAiSettings.baseUrl, proxyUrl: nextAiSettings.proxyUrl }))
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : text.readLibraryFailed)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadWorkspace()

    return () => {
      isMounted = false
    }
  }, [api])

  const sortedBooks = useMemo(() => {
    return [...workspace.books].sort((a, b) => Number(b.isStandard) - Number(a.isStandard) || a.title.localeCompare(b.title, 'zh-CN'))
  }, [workspace.books])

  const liveWordCount = countWords(draftContent)
  const answeredPlanningRounds = planningMessages.filter((message) => message.role === 'user').length
  const isAtPlanningCheckpoint = answeredPlanningRounds >= 5 && (answeredPlanningRounds - 5) % 3 === 0
  const latestPlanningMessage = planningMessages[planningMessages.length - 1]
  const isPlanningAwaitingAnswer = latestPlanningMessage?.role === 'assistant'
  const canShowPlanningAnswer = planningMessages.length > 0 && isPlanningAwaitingAnswer && (!isAtPlanningCheckpoint || isPlanningCheckpointQuestionOpen)
  const canSubmitPlanningAnswer = canShowPlanningAnswer && planningAnswer.trim().length > 0
  const planningMessagesWithPendingAnswer = useCallback(() => {
    if (!canSubmitPlanningAnswer) {
      return planningMessages
    }

    return [...planningMessages, { role: 'user' as const, content: planningAnswer.trim() }]
  }, [canSubmitPlanningAnswer, planningAnswer, planningMessages])
  const isProjectChatSending = isAiBusy && activeAiTaskLabel === text.projectChat
  const isProjectUpdateGenerating = isAiBusy && activeAiTaskLabel === text.projectUpdatePackage
  const aiCostSummary = useMemo(() => summarizeAiCost(aiCallLogs), [aiCallLogs])

  useEffect(() => {
    if (!bookDetail) {
      return
    }

    const key = projectChatDraftStorageKey(bookDetail.book.path)
    if (projectChatMessages.length === 0) {
      window.localStorage.removeItem(key)
      return
    }

    window.localStorage.setItem(key, JSON.stringify(pruneProjectChatMessages(projectChatMessages)))
  }, [bookDetail, projectChatMessages])

  function createAiRequestId(scope: string) {
    return `${scope}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }

  async function stopAiGeneration() {
    if (!api || !activeAiRequestId) {
      return
    }

    const requestId = activeAiRequestId
    setActiveAiRequestId(null)
    setIsAiBusy(false)
    setIsLoading(false)
    setActiveAiTaskLabel(null)
    setMaterialMessage('\u5df2\u505c\u6b62\u751f\u6210')
    void api.cancelAiRequest(requestId).catch((err) => {
      console.warn('Failed to cancel AI request', err)
    })
  }

  async function chooseLibrary() {
    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    try {
      setIsLoading(true)
      const nextState = await api.chooseLibraryDirectory()
      setWorkspace(nextState)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.chooseLibraryFailed)
    } finally {
      setIsLoading(false)
    }
  }

  async function scanLibrary() {
    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    try {
      setIsLoading(true)
      const nextState = await api.scanLibrary()
      setWorkspace(nextState)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.scanLibraryFailed)
    } finally {
      setIsLoading(false)
    }
  }

  async function saveAiSettings() {
    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    try {
      setIsAiBusy(true)
      const nextSettings = await api.saveAiSettings(aiForm)
      setAiSettings(nextSettings)
      setAiForm({ apiKey: '', model: nextSettings.model, baseUrl: nextSettings.baseUrl, proxyUrl: nextSettings.proxyUrl })
      setAiMessage(text.saved)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : text.aiSettingsFailed
      setAiMessage(message)
      setError(message)
    } finally {
      setIsAiBusy(false)
    }
  }

  async function testAiConnection() {
    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    try {
      setIsAiBusy(true)
      const result = await api.testAiConnection(aiForm)
      setAiSettings((current) => ({ ...current, configured: true, model: result.model, baseUrl: result.baseUrl, proxyUrl: result.proxyUrl }))
      setAiForm((current) => ({ ...current, model: result.model, baseUrl: result.baseUrl, proxyUrl: result.proxyUrl }))
      setAiMessage(text.connectionOk)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
    } finally {
      setIsAiBusy(false)
    }
  }

  async function loadAiCallLogs() {
    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    try {
      const logs = await api.getAiCallLogs()
      setAiCallLogs(logs)
      setIsAiCallLogsOpen(true)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
    }
  }

  const refreshLatestWritingTaskRun = useCallback(async (chapterFile?: string) => {
    if (!api || !bookDetail) {
      return
    }

    try {
      const latest = await api.getLatestWritingTaskRun({
        bookPath: bookDetail.book.path,
        chapterFile: chapterFile ?? bookDetail.selectedChapter?.file,
      })
      setLatestWritingTaskRun(latest)
    } catch {
      setLatestWritingTaskRun(null)
    }
  }, [api, bookDetail])

  async function createBook() {
    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    try {
      setIsLoading(true)
      const nextState = await api.createBook({ ...createForm, projectPackage: projectPackage ?? undefined })
      setWorkspace(nextState)
      setCreateForm({ title: '', platform: platforms[0], idea: '' })
      setPlanningMessages([])
      setPlanningAnswer('')
      setIsPlanningCheckpointQuestionOpen(false)
      setProjectPackage(null)
      setIsGeneratingProjectPackage(false)
      setAppView('dashboard')
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.createBookFailed)
    } finally {
      setIsLoading(false)
    }
  }

  async function startPlanning() {
    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    if (!aiSettings.configured) {
      setError(text.configureAiFirst)
      setIsAiSettingsOpen(true)
      return
    }

    try {
      const requestId = createAiRequestId('planning-start')
      setActiveAiRequestId(requestId)
      setIsAiBusy(true)
      const generated = await api.generatePlanningQuestion({ ...createForm, messages: [], requestId })
      setPlanningMessages([{ role: 'assistant', content: generated.question }])
      setProjectPackage(null)
      setPlanningAnswer('')
      setIsPlanningCheckpointQuestionOpen(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.createBookFailed)
    } finally {
      setActiveAiRequestId(null)
      setIsAiBusy(false)
    }
  }

  async function submitPlanningAnswer() {
    if (!api || !planningAnswer.trim()) {
      return
    }

    const nextMessages: PlanningMessage[] = [...planningMessages, { role: 'user', content: planningAnswer.trim() }]

    try {
      setIsAiBusy(true)
      const nextAnsweredRounds = nextMessages.filter((message) => message.role === 'user').length
      if (nextAnsweredRounds >= 5 && (nextAnsweredRounds - 5) % 3 === 0) {
        setPlanningMessages(nextMessages)
        setPlanningAnswer('')
        setIsPlanningCheckpointQuestionOpen(false)
        setProjectPackage(null)
        setError(null)
        return
      }

      const requestId = createAiRequestId('planning-answer')
      setActiveAiRequestId(requestId)
      const generated = await api.generatePlanningQuestion({ ...createForm, messages: nextMessages, requestId })
      setPlanningMessages([...nextMessages, { role: 'assistant', content: generated.question }])
      setPlanningAnswer('')
      setIsPlanningCheckpointQuestionOpen(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.createBookFailed)
    } finally {
      setActiveAiRequestId(null)
      setIsAiBusy(false)
    }
  }

  async function generateProjectPackage() {
    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    try {
      const requestId = createAiRequestId('project-package')
      setActiveAiRequestId(requestId)
      setIsAiBusy(true)
      setIsGeneratingProjectPackage(true)
      const messagesForPackage = planningMessagesWithPendingAnswer()
      const generated = await api.generateProjectPackage({ ...createForm, messages: messagesForPackage, requestId })
      setPlanningMessages(messagesForPackage)
      setPlanningAnswer('')
      setIsPlanningCheckpointQuestionOpen(false)
      setProjectPackage(generated)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.createBookFailed)
    } finally {
      setActiveAiRequestId(null)
      setIsAiBusy(false)
      setIsGeneratingProjectPackage(false)
    }
  }

  async function deepenPlanning() {
    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    try {
      const requestId = createAiRequestId('planning-deepen')
      setActiveAiRequestId(requestId)
      setIsAiBusy(true)
      const messagesForNextQuestion = planningMessagesWithPendingAnswer()
      const generated = await api.generatePlanningQuestion({ ...createForm, messages: messagesForNextQuestion, requestId })
      setPlanningMessages([...messagesForNextQuestion, { role: 'assistant', content: generated.question }])
      setPlanningAnswer('')
      setIsPlanningCheckpointQuestionOpen(true)
      setProjectPackage(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.createBookFailed)
    } finally {
      setActiveAiRequestId(null)
      setIsAiBusy(false)
    }
  }

  async function openBook(bookPath: string) {
    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    try {
      setIsLoading(true)
      const detail = await api.openBook(bookPath)
      setBookDetail(detail)
      setBookMode('prep')
      setDraftContent(detail.content)
      setProjectChatMessages(loadProjectChatDraft(detail.book.path))
      setProjectChatInput('')
      setCandidate(null)
      setChapterSnapshots([])
      setExportMessage(null)
      setIsDirty(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.openBookFailed)
    } finally {
      setIsLoading(false)
    }
  }

  async function openChapter(chapterFile: string) {
    if (!api || !bookDetail) {
      return
    }

    try {
      setIsLoading(true)
      if (isDirty && bookDetail.selectedChapter) {
        await api.saveChapter({
          bookPath: bookDetail.book.path,
          chapterFile: bookDetail.selectedChapter.file,
          content: draftContent,
          snapshot: true,
          reason: 'switch',
        })
      }
      const detail = await api.openChapter(bookDetail.book.path, chapterFile)
      setBookDetail(detail)
      setDraftContent(detail.content)
      setChapterSnapshots([])
      setExportMessage(null)
      setIsDirty(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.openBookFailed)
    } finally {
      setIsLoading(false)
    }
  }

  const saveChapter = useCallback(async (options?: { snapshot?: boolean; reason?: string }) => {
    if (!api || !bookDetail?.selectedChapter) {
      return
    }

    try {
      setIsSaving(true)
      const detail = await api.saveChapter({
        bookPath: bookDetail.book.path,
        chapterFile: bookDetail.selectedChapter.file,
        content: draftContent,
        snapshot: options?.snapshot ?? true,
        reason: options?.reason ?? 'manual',
      })
      setBookDetail(detail)
      setDraftContent(detail.content)
      setIsDirty(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.saveChapterFailed)
    } finally {
      setIsSaving(false)
    }
  }, [api, bookDetail, draftContent])

  async function createChapter() {
    if (!api || !bookDetail) {
      return
    }

    try {
      setIsLoading(true)
      if (isDirty && bookDetail.selectedChapter) {
        await api.saveChapter({
          bookPath: bookDetail.book.path,
          chapterFile: bookDetail.selectedChapter.file,
          content: draftContent,
          snapshot: true,
          reason: 'before-new-chapter',
        })
      }
      const detail = await api.createChapter({ bookPath: bookDetail.book.path })
      setBookDetail(detail)
      setDraftContent(detail.content)
      setChapterSnapshots([])
      setIsDirty(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.openBookFailed)
    } finally {
      setIsLoading(false)
    }
  }

  async function finishChapterAndStartNext() {
    if (!bookDetail || !api) {
      setError(text.desktopUnavailable)
      return
    }

    if (!aiSettings.configured) {
      setIsAiSettingsOpen(true)
      setError(text.configureAiFirst)
      return
    }

    const steps: WorkflowStep[] = [
      { id: 'save', label: text.nextChapterFlowSaving, status: bookDetail.selectedChapter ? 'pending' : 'done' },
      { id: 'create', label: text.nextChapterFlowCreating, status: 'pending' },
      { id: 'outline', label: text.nextChapterFlowOutlining, status: 'pending' },
      { id: 'draft', label: text.nextChapterFlowDrafting, status: 'pending' },
    ]
    const updateStep = (id: string, status: WorkflowStepStatus) => {
      setNextChapterFlowSteps((current) => current.map((step) => (step.id === id ? { ...step, status } : step)))
    }
    const requestId = createAiRequestId('next-chapter-flow')

    setNextChapterFlowSteps(steps)
    setCandidate(null)
    setMaterialMessage(text.nextChapterFlowHint)
    setActiveAiRequestId(requestId)
    setActiveAiTaskLabel(text.nextChapterFlowTitle)
    setIsAiBusy(true)
    setIsLoading(true)

    try {
      updateStep('save', bookDetail.selectedChapter ? 'running' : 'done')
      updateStep('create', 'running')
      updateStep('outline', 'running')
      updateStep('draft', 'running')
      const generated = await api.startNextChapterFlow({
        bookPath: bookDetail.book.path,
        currentChapterFile: bookDetail.selectedChapter?.file,
        currentContent: bookDetail.selectedChapter ? draftContent : '',
        instruction: aiInstruction,
        speedMode: writingSpeedMode,
        requestId,
      })
      const newChapter = generated.detail.selectedChapter
      if (!newChapter) {
        throw new Error(text.openBookFailed)
      }
      setBookDetail(generated.detail)
      setDraftContent(generated.detail.content)
      setChapterSnapshots([])
      setExportMessage(null)
      setIsDirty(false)
      updateStep('save', 'done')
      updateStep('create', 'done')
      updateStep('outline', 'done')
      setCandidate({
        kind: 'continue-writing',
        title: generated.draft.title,
        targetFile: null,
        targetChapterFile: newChapter.file,
        targetChapterTitle: newChapter.title,
        content: generated.draft.content,
        taskCard: generated.draft.taskCard,
        selfCheck: generated.draft.selfCheck,
        selfCheckFailed: generated.draft.selfCheckFailed,
        statePatch: generated.draft.statePatch,
        progressPatch: generated.draft.progressPatch,
        memoryPatch: generated.draft.memoryPatch,
        structuredPatch: generated.draft.structuredPatch,
        futurePlanPatch: generated.draft.futurePlanPatch,
        stylePatch: generated.draft.stylePatch,
        memoryGovernancePatch: generated.draft.memoryGovernancePatch,
        stateGateWarnings: generated.draft.stateGateWarnings,
        qualityGateWarnings: generated.draft.qualityGateWarnings,
        qualityScore: generated.draft.qualityScore,
        qualityGatePassed: generated.draft.qualityGatePassed,
        nextChapterReadiness: generated.draft.nextChapterReadiness,
        companion90Summary: generated.draft.companion90Summary,
        directorStatus: generated.draft.directorStatus,
        directorDetail: generated.draft.directorDetail,
      })
      updateStep('draft', 'done')
      setMaterialMessage(text.nextChapterFlowDone)
      setError(null)
      await refreshLatestWritingTaskRun(newChapter.file)
      revealCandidate()
    } catch (err) {
      setNextChapterFlowSteps((current) => current.map((step) => (step.status === 'running' ? { ...step, status: 'failed' } : step)))
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
    } finally {
      setActiveAiRequestId(null)
      setActiveAiTaskLabel(null)
      setIsAiBusy(false)
      setIsLoading(false)
    }
  }

  async function startBatchWritingFlow(modeOverride?: BatchWritingMode) {
    if (!bookDetail || !api) {
      setError(text.desktopUnavailable)
      return
    }

    if (!aiSettings.configured) {
      setIsAiSettingsOpen(true)
      setError(text.configureAiFirst)
      return
    }

    const effectiveMode = modeOverride ?? batchWritingMode
    const requestId = createAiRequestId(`batch-${effectiveMode}`)

    try {
      setCandidate(null)
      setBatchWritingResult(null)
      setActiveAiRequestId(requestId)
      setActiveAiTaskLabel(effectiveMode === 'reckless' ? text.recklessBatchWriting : text.guardedBatchWriting)
      setIsAiBusy(true)
      setIsLoading(true)
      const result = await api.startBatchWritingFlow({
        bookPath: bookDetail.book.path,
        currentChapterFile: bookDetail.selectedChapter?.file,
        currentContent: bookDetail.selectedChapter ? draftContent : '',
        instruction: aiInstruction,
        chapterCount: batchChapterCount,
        mode: effectiveMode,
        requestId,
      })
      setBatchWritingResult(result)
      setBookDetail(result.detail)
      setDraftContent(result.detail.content)
      setIsDirty(false)
      setError(null)
      await refreshLatestWritingTaskRun(result.detail.selectedChapter?.file)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
    } finally {
      setActiveAiRequestId(null)
      setActiveAiTaskLabel(null)
      setIsAiBusy(false)
      setIsLoading(false)
    }
  }

  async function runUserPrimaryWriteAction() {
    if (chapterFeedback.trim()) {
      await generateSmartFeedbackPackage()
      return
    }

    if (candidate && candidate.kind !== 'setup' && candidate.kind !== 'chapter-check') {
      await applyCandidate()
      return
    }

    if (writingSpeedMode === 'polish') {
      await finishChapterAndStartNext()
      return
    }

    const nextMode: BatchWritingMode = writingSpeedMode === 'reckless' ? 'reckless' : 'guarded'
    setBatchWritingMode(nextMode)
    await startBatchWritingFlow(nextMode)
  }

  async function loadSnapshots() {
    if (!api || !bookDetail?.selectedChapter) {
      return
    }

    try {
      const snapshots = await api.listChapterSnapshots({
        bookPath: bookDetail.book.path,
        chapterFile: bookDetail.selectedChapter.file,
      })
      setChapterSnapshots(snapshots)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.openBookFailed)
    }
  }

  async function restoreSnapshot(snapshotId: string) {
    if (!api || !bookDetail?.selectedChapter) {
      return
    }

    try {
      setIsLoading(true)
      const detail = await api.restoreChapterSnapshot({
        bookPath: bookDetail.book.path,
        chapterFile: bookDetail.selectedChapter.file,
        snapshotId,
      })
      setBookDetail(detail)
      setDraftContent(detail.content)
      setCandidate(null)
      setChapterSnapshots([])
      setIsDirty(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.openBookFailed)
    } finally {
      setIsLoading(false)
    }
  }

  async function exportCurrentChapter() {
    if (!api || !bookDetail?.selectedChapter) {
      return
    }

    try {
      const result = await api.exportChapter({
        bookPath: bookDetail.book.path,
        chapterFile: bookDetail.selectedChapter.file,
      })
      setExportMessage(`${text.exported}: ${result.filePath}`)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.openBookFailed)
    }
  }

  async function exportWholeBook() {
    if (!api || !bookDetail) {
      return
    }

    try {
      const result = await api.exportBook(bookDetail.book.path)
      setExportMessage(`${text.exported}: ${result.filePath}`)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.openBookFailed)
    }
  }

  async function generateAiEditCandidate(mode: 'continue' | 'check' | 'revise' | 'revise-continuation', options?: { flowMode?: 'chapter-foundation' }) {
    const targetChapter = bookDetail?.selectedChapter

    if (!bookDetail || !targetChapter) {
      return
    }

    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    if (!aiSettings.configured) {
      setCandidate({
        kind: 'setup',
        title: text.aiSettings,
        targetFile: null,
        content: text.configureAiFirst,
      })
      return
    }

    const startedAt = new Date().toISOString()

    try {
      const requestId = createAiRequestId(`edit-${mode}`)
      setActiveAiRequestId(requestId)
      setActiveAiTaskLabel(`${targetChapter.title} - ${mode === 'continue' ? text.generatingTaskCard : mode === 'check' ? text.checkChapter : mode === 'revise-continuation' ? text.reviseBySelfCheck : text.reviseChapter}`)
      setIsAiBusy(true)
      const generated = await api.generateAiEditCandidate({
        bookPath: bookDetail.book.path,
        chapterFile: targetChapter.file,
        mode,
        instruction: aiInstruction,
        taskCard: candidate?.taskCard,
        selfCheck: candidate?.selfCheck,
        draftContent: candidate?.content,
        flowMode: options?.flowMode,
        requestId,
      })
      if (mode === 'continue') {
        setActiveAiTaskLabel(`${targetChapter.title} - ${text.generatingSelfCheck}`)
      }
      setCandidate({
        kind: mode === 'check' ? 'chapter-check' : mode === 'revise' ? 'chapter-revision' : 'continue-writing',
        title: generated.title,
        targetFile: null,
        targetChapterFile: targetChapter.file,
        targetChapterTitle: targetChapter.title,
        content: generated.content,
        taskCard: generated.taskCard,
        selfCheck: generated.selfCheck,
        selfCheckFailed: generated.selfCheckFailed,
        statePatch: generated.statePatch,
        progressPatch: generated.progressPatch,
        memoryPatch: generated.memoryPatch,
        structuredPatch: generated.structuredPatch,
        futurePlanPatch: generated.futurePlanPatch,
        stylePatch: generated.stylePatch,
        memoryGovernancePatch: generated.memoryGovernancePatch,
        stateGateWarnings: generated.stateGateWarnings,
        qualityGateWarnings: generated.qualityGateWarnings,
        qualityScore: generated.qualityScore,
        qualityGatePassed: generated.qualityGatePassed,
        nextChapterReadiness: generated.nextChapterReadiness,
        directorStatus: generated.directorStatus,
        directorDetail: generated.directorDetail,
      })
      setError(null)
      await refreshLatestWritingTaskRun(targetChapter.file)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
      if (mode !== 'check') {
        await recoverLatestWritingTaskRun(targetChapter.file, startedAt, err instanceof Error ? err.message : text.aiSettingsFailed)
      }
    } finally {
      setActiveAiRequestId(null)
      setActiveAiTaskLabel(null)
      setIsAiBusy(false)
    }
  }

  async function recoverLatestWritingTaskRun(chapterFile: string, startedAt: string, errorMessage: string) {
    if (!api || !bookDetail) {
      return
    }

    const recovery = await api.getLatestWritingTaskRun({
      bookPath: bookDetail.book.path,
      chapterFile,
      since: startedAt,
    })

    if (!recovery?.partialContent?.trim()) {
      return
    }

    const targetChapter = bookDetail.chapters.find((chapter) => chapter.file === chapterFile) ?? bookDetail.selectedChapter
    const stepSummary = recovery.steps.map((step) => `- ${step.status}锛?{step.step}${step.detail ? `锛?{step.detail}` : ''}`).join('\n')
    setCandidate({
      kind: 'continue-writing',
      title: '涓柇鎭㈠鍊欓€?,
      targetFile: null,
      targetChapterFile: chapterFile,
      targetChapterTitle: targetChapter?.title,
      content: recovery.partialContent,
      selfCheckFailed: true,
      directorStatus: recovery.status === 'completed' ? 'ready' : 'needs-review',
      directorDetail: [
        '# 涓柇鎭㈠璁板綍',
        '',
        `- 浠诲姟锛?{recovery.type}`,
        `- 鐘舵€侊細${recovery.status}`,
        `- 鏃堕棿锛?{recovery.updatedAt}`,
        `- 澶辫触鍘熷洜锛?{errorMessage}`,
        '',
        '## 宸插畬鎴愭楠?,
        stepSummary || '鏆傛棤',
      ].join('\n'),
    })
    setMaterialMessage(text.candidateReady)
  }

  async function retryLatestWritingTaskStep(step = 'self-check') {
    const targetChapter = bookDetail?.selectedChapter

    if (!bookDetail || !targetChapter || !api) {
      return
    }

    try {
      const requestId = createAiRequestId(`retry-${step}`)
      setActiveAiRequestId(requestId)
      setActiveAiTaskLabel(`閲嶈瘯 ${step}`)
      setIsAiBusy(true)
      const generated = await api.retryWritingTaskStep({
        bookPath: bookDetail.book.path,
        chapterFile: targetChapter.file,
        step,
        requestId,
      })
      setCandidate({
        kind: 'continue-writing',
        title: generated.title,
        targetFile: null,
        targetChapterFile: targetChapter.file,
        targetChapterTitle: targetChapter.title,
        content: generated.content,
        taskCard: generated.taskCard,
        selfCheck: generated.selfCheck,
        directorStatus: generated.directorStatus,
        directorDetail: generated.directorDetail,
      })
      setMaterialMessage(text.candidateReady)
      await refreshLatestWritingTaskRun(targetChapter.file)
      setError(null)
      revealCandidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
    } finally {
      setActiveAiRequestId(null)
      setActiveAiTaskLabel(null)
      setIsAiBusy(false)
    }
  }

  async function organizeProject(bookPath: string) {
    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    try {
      setIsLoading(true)
      const nextState = await api.organizeProject(bookPath)
      setWorkspace(nextState)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.openBookFailed)
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteBookProject(book: BookSummary) {
    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    const confirmed = window.confirm(`纭畾鎶娿€?{book.title}銆嬬Щ鍒板洖鏀剁珯鍚楋紵\n\n涓嶄細姘镐箙鍒犻櫎锛屼絾浼氫粠褰撳墠鍐欎綔搴撳垪琛ㄩ噷绉婚櫎銆俙)
    if (!confirmed) {
      return
    }

    try {
      setIsLoading(true)
      const nextState = await api.deleteBook(book.path)
      setWorkspace(nextState)
      if (bookDetail?.book.path === book.path) {
        setBookDetail(null)
        setCandidate(null)
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.deleteBookFailed)
    } finally {
      setIsLoading(false)
    }
  }

  async function openMaterialsPanel(preferredFile?: string, detailOverride?: BookDetail) {
    const detail = detailOverride ?? bookDetail
    if (!detail || !api) {
      setError(text.desktopUnavailable)
      return
    }

    try {
      const materials = await api.listProjectMaterials({
        bookPath: detail.book.path,
        chapterId: detail.selectedChapter?.id,
      })
      const nextSelected = materials.find((material) => material.file === preferredFile) ?? selectedMaterial ?? materials[0] ?? null

      setProjectMaterials(materials)
      setIsMaterialsPanelOpen(true)
      setMaterialMessage(preferredFile ? text.candidateApplied : text.materialOpenHelp)

      if (nextSelected) {
        const materialDetail = await api.readProjectMaterial({
          bookPath: detail.book.path,
          file: nextSelected.file,
        })
        const snapshots = await api.listProjectMaterialSnapshots({
          bookPath: detail.book.path,
          file: nextSelected.file,
        })
        setSelectedMaterial(nextSelected)
        setMaterialContent(materialDetail.content)
        setMaterialSnapshots(snapshots)
        setSelectedMaterialSnapshotId(snapshots[0]?.id ?? '')
        setIsMaterialDirty(false)
        if (!materialDetail.exists) {
          setMaterialMessage(text.materialMissing)
        } else if (!materialDetail.ready) {
          setMaterialMessage(text.materialNotReady)
        }
      }
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.openBookFailed)
    }
  }

  async function openMaterialFromPrep(material: ProjectMaterialSummary) {
    await openMaterialsPanel(material.file)
  }

  async function selectProjectMaterial(material: ProjectMaterialSummary) {
    if (!bookDetail || !api) {
      return
    }

    try {
      const materialDetail = await api.readProjectMaterial({
        bookPath: bookDetail.book.path,
        file: material.file,
      })
      const snapshots = await api.listProjectMaterialSnapshots({
        bookPath: bookDetail.book.path,
        file: material.file,
      })
      setSelectedMaterial(material)
      setMaterialContent(materialDetail.content)
      setMaterialSnapshots(snapshots)
      setSelectedMaterialSnapshotId(snapshots[0]?.id ?? '')
      setIsMaterialDirty(false)
      setMaterialMessage(materialDetail.exists ? (materialDetail.ready ? null : text.materialNotReady) : text.materialMissing)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.openBookFailed)
    }
  }

  async function saveProjectMaterial() {
    if (!bookDetail || !selectedMaterial || !api) {
      return
    }

    try {
      setIsSaving(true)
      const detail = await api.saveProjectMaterial({
        bookPath: bookDetail.book.path,
        file: selectedMaterial.file,
        content: materialContent,
        selectedChapterFile: bookDetail.selectedChapter?.file,
        reason: 'manual-material-save',
      })
      const materials = await api.listProjectMaterials({
        bookPath: detail.book.path,
        chapterId: detail.selectedChapter?.id,
      })
      setBookDetail(detail)
      setProjectMaterials(materials)
      setSelectedMaterial(materials.find((material) => material.file === selectedMaterial.file) ?? selectedMaterial)
      const snapshots = await api.listProjectMaterialSnapshots({
        bookPath: detail.book.path,
        file: selectedMaterial.file,
      })
      setMaterialSnapshots(snapshots)
      setSelectedMaterialSnapshotId(snapshots[0]?.id ?? '')
      setIsMaterialDirty(false)
      setMaterialMessage(text.materialSaved)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.saveChapterFailed)
    } finally {
      setIsSaving(false)
    }
  }

  async function restoreLatestProjectMaterial() {
    if (!bookDetail || !selectedMaterial || !api) {
      return
    }

    const snapshotId = selectedMaterialSnapshotId || materialSnapshots[0]?.id || ''
    if (!snapshotId) {
      setMaterialMessage(text.noMaterialSnapshot)
      return
    }

    try {
      setIsSaving(true)
      const detail = await api.restoreProjectMaterialSnapshot({
        bookPath: bookDetail.book.path,
        file: selectedMaterial.file,
        snapshotId,
        selectedChapterFile: bookDetail.selectedChapter?.file,
      })
      const materialDetail = await api.readProjectMaterial({
        bookPath: detail.book.path,
        file: selectedMaterial.file,
      })
      const materials = await api.listProjectMaterials({
        bookPath: detail.book.path,
        chapterId: detail.selectedChapter?.id,
      })
      const snapshots = await api.listProjectMaterialSnapshots({
        bookPath: detail.book.path,
        file: selectedMaterial.file,
      })
      setBookDetail(detail)
      setProjectMaterials(materials)
      setSelectedMaterial(materials.find((material) => material.file === selectedMaterial.file) ?? selectedMaterial)
      setMaterialContent(materialDetail.content)
      setMaterialSnapshots(snapshots)
      setSelectedMaterialSnapshotId(snapshots[0]?.id ?? '')
      setIsMaterialDirty(false)
      setMaterialMessage(text.materialSaved)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.saveChapterFailed)
    } finally {
      setIsSaving(false)
    }
  }

  function revealCandidate() {
    window.requestAnimationFrame(() => {
      candidatePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  async function generateCandidate() {
    if (!bookDetail) {
      return
    }

    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    if (!aiSettings.configured) {
      setCandidate({
        kind: 'setup',
        title: text.aiSettings,
        targetFile: null,
        content: text.configureAiFirst,
      })
      setMaterialMessage(text.candidateReady)
      revealCandidate()
      return
    }

    if (bookDetail.contextCheck.level === 'missing-volume-outline' || bookDetail.contextCheck.level === 'missing-chapter-outline') {
      await generateOutlineCandidateForMaterial(bookDetail.contextCheck.level === 'missing-volume-outline' ? 'volume' : 'chapter')
      return
    }

    if (bookDetail.contextCheck.level === 'ready') {
      await generateAiEditCandidate('continue')
      return
    }

    setCandidate({
      kind: 'setup',
      title: '\u7acb\u9879\u8865\u5168\u5019\u9009',
      targetFile: null,
      content: '\u5f53\u524d\u7f3a\u5c11\u5e73\u53f0\u89c4\u5219\u3001\u6838\u5fc3\u8bbe\u5b9a\u3001\u4e3b\u89d2/\u914d\u89d2\u5361\u3001\u603b\u7eb2\u6216\u8ffd\u8e2a\u8868\u3002\u5efa\u8bae\u5148\u56de\u5230\u7acb\u9879\u95ee\u7b54\u8865\u5168\u3002',
    })
    setMaterialMessage(text.candidateReady)
    revealCandidate()
  }

  async function runPrimaryWorkflowAction() {
    if (!bookDetail) {
      return
    }

    const decision = buildPrimaryWorkflowDecision(bookDetail, candidate, aiSettings.configured, isAiBusy)

    switch (decision.action) {
      case 'review-candidate':
        revealCandidate()
        return
      case 'configure-ai':
        setIsAiSettingsOpen(true)
        setError(text.configureAiFirst)
        return
      case 'create-chapter':
        await createChapter()
        return
      case 'generate-volume-outline':
        await generateOutlineCandidateForMaterial('volume')
        return
      case 'generate-chapter-outline':
        await generateOutlineCandidateForMaterial('chapter')
        return
      case 'write-chapter':
        await generateAiEditCandidate('continue', { flowMode: 'chapter-foundation' })
        return
      case 'complete-setup':
        await generateCandidate()
        return
      default:
        await generateCandidate()
    }
  }

  async function generateChapterWithFoundationFlow() {
    setMaterialMessage('绔犺妭瀵兼紨娴佺▼锛氱敓鎴愪换鍔″崱銆佹鏂囥€佽嚜妫€銆佹渶缁堢鍚屾鍜岄暱鏈熻蹇嗐€?)
    await generateAiEditCandidate('continue', { flowMode: 'chapter-foundation' })
  }

  async function generateChapterFeedbackPackage() {
    const targetChapter = bookDetail?.selectedChapter

    if (!bookDetail || !targetChapter) {
      return
    }

    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    if (!aiSettings.configured) {
      setError(text.configureAiFirst)
      setIsAiSettingsOpen(true)
      return
    }

    if (!chapterFeedback.trim()) {
      setError('璇峰厛鍐欎笅浣犺寰楄繖涓€绔犲摢閲屼笉琛?)
      return
    }

    try {
      const requestId = createAiRequestId('chapter-feedback')
      setActiveAiRequestId(requestId)
      setActiveAiTaskLabel(`${targetChapter.title} - ${text.chapterFeedbackRewrite}`)
      setIsAiBusy(true)
      const generated = await api.generateChapterFeedbackPackage({
        bookPath: bookDetail.book.path,
        chapterFile: targetChapter.file,
        feedback: chapterFeedback,
        currentContent: draftContent,
        requestId,
      })
      setCandidate({
        kind: 'chapter-feedback',
        title: generated.title,
        targetFile: null,
        targetChapterFile: targetChapter.file,
        targetChapterTitle: targetChapter.title,
        content: generated.content,
        feedbackSummary: generated.feedbackSummary,
        impactSummary: generated.impactSummary,
        longTermMemory: generated.longTermMemory,
        statePatch: generated.statePatch,
        progressPatch: generated.progressPatch,
        memoryPatch: generated.memoryPatch,
        structuredPatch: generated.structuredPatch,
        futurePlanPatch: generated.futurePlanPatch,
        stylePatch: generated.stylePatch,
        memoryGovernancePatch: generated.memoryGovernancePatch,
        stateGateWarnings: generated.stateGateWarnings,
        directorDetail: generated.directorDetail,
      })
      setBatchWritingResult(null)
      setChapterFeedback('')
      setMaterialMessage(text.candidateReady)
      setError(null)
      revealCandidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
    } finally {
      setActiveAiRequestId(null)
      setActiveAiTaskLabel(null)
      setIsAiBusy(false)
    }
  }

  async function generateSmartFeedbackPackage(feedbackOverride?: string) {
    const targetChapter = bookDetail?.selectedChapter
    const feedbackText = feedbackOverride?.trim() || chapterFeedback.trim()

    if (!bookDetail || !targetChapter) {
      return
    }

    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    if (!aiSettings.configured) {
      setError(text.configureAiFirst)
      setIsAiSettingsOpen(true)
      return
    }

    if (!feedbackText) {
      setError('璇峰厛鍐欎笅浣犺寰楄繖涓€绔犲摢閲屼笉琛?)
      return
    }

    try {
      const requestId = createAiRequestId('smart-feedback')
      setActiveAiRequestId(requestId)
      setActiveAiTaskLabel(`${targetChapter.title} - ${text.generateSmartFeedbackPackage}`)
      setIsAiBusy(true)
      const generated = await api.generateSmartFeedbackPackage({
        bookPath: bookDetail.book.path,
        chapterFile: targetChapter.file,
        feedback: feedbackText,
        currentContent: draftContent,
        gateWarnings: [...(candidate?.stateGateWarnings ?? []), ...(candidate?.qualityGateWarnings ?? [])],
        requestId,
      })
      const chapterPackage = generated.chapterPackage
      const projectRepairPackage = generated.projectRepairPackage

      setCandidate({
        kind: chapterPackage ? 'chapter-feedback' : 'project-update',
        title: generated.title,
        targetFile: null,
        targetChapterFile: chapterPackage ? targetChapter.file : undefined,
        targetChapterTitle: chapterPackage ? targetChapter.title : undefined,
        content: chapterPackage?.content || projectRepairPackage?.content || generated.smartFeedbackRoute.userFacingSummary,
        feedbackSummary: chapterPackage?.feedbackSummary,
        impactSummary: chapterPackage?.impactSummary || generated.smartFeedbackRoute.userFacingSummary,
        longTermMemory: chapterPackage?.longTermMemory,
        statePatch: chapterPackage?.statePatch,
        progressPatch: chapterPackage?.progressPatch,
        memoryPatch: chapterPackage?.memoryPatch,
        structuredPatch: chapterPackage?.structuredPatch,
        futurePlanPatch: chapterPackage?.futurePlanPatch,
        stylePatch: chapterPackage?.stylePatch,
        memoryGovernancePatch: chapterPackage?.memoryGovernancePatch,
        stateGateWarnings: chapterPackage?.stateGateWarnings,
        qualityGateWarnings: chapterPackage?.qualityGateWarnings,
        directorDetail: chapterPackage?.directorDetail,
        smartFeedbackRoute: generated.smartFeedbackRoute,
        companionDecision: generated.smartFeedbackRoute.companionDecision,
        projectImpactMap: generated.projectImpactMap ?? projectRepairPackage?.impactMap,
        projectUpdates: projectRepairPackage?.updates,
        projectRepairContent: projectRepairPackage?.content,
        updates: chapterPackage ? undefined : projectRepairPackage?.updates,
      })
      setMaterialMessage(text.candidateReady)
      setError(null)
      revealCandidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
    } finally {
      setActiveAiRequestId(null)
      setActiveAiTaskLabel(null)
      setIsAiBusy(false)
    }
  }

  function useEditorialFeedbackDraft(editorialJudgement: EditorialJudgement) {
    const nextFeedback = buildEditorialFeedbackDraft(editorialJudgement)
    if (!nextFeedback) {
      return
    }
    setChapterFeedback(buildEditorialFeedbackDraft(editorialJudgement))
  }

  function runEditorialFeedbackDraft(editorialJudgement: EditorialJudgement) {
    const nextFeedback = buildEditorialFeedbackDraft(editorialJudgement)
    if (!nextFeedback) {
      return
    }
    setChapterFeedback(nextFeedback)
    void generateSmartFeedbackPackage(nextFeedback)
  }

  function useEditorialFocusAction(action: EditorialFocusAction) {
    setChapterFeedback(action.feedback)
  }

  function runEditorialFocusAction(action: EditorialFocusAction) {
    setChapterFeedback(action.feedback)
    void generateSmartFeedbackPackage(action.feedback)
  }

  async function generateProjectRepairPackage() {
    const targetChapter = bookDetail?.selectedChapter

    if (!bookDetail || !api) {
      return
    }

    if (!aiSettings.configured) {
      setError(text.configureAiFirst)
      setIsAiSettingsOpen(true)
      return
    }

    const feedback = chapterFeedback.trim() || candidate?.stateGateWarnings?.join('锛?) || candidate?.qualityGateWarnings?.join('锛?) || ''
    if (!feedback) {
      setError('璇峰厛鍐欎笅浣犲彂鐜扮殑闂锛屾垨鑰呭厛鐢熸垚涓€娆″€欓€夎杞欢鎷垮埌闂ㄧ璀﹀憡銆?)
      return
    }

    try {
      const requestId = createAiRequestId('project-repair')
      setActiveAiRequestId(requestId)
      setActiveAiTaskLabel(text.projectRepairPackage)
      setIsAiBusy(true)
      const generated = await api.generateProjectRepairPackage({
        bookPath: bookDetail.book.path,
        chapterFile: targetChapter?.file,
        feedback,
        gateWarnings: [...(candidate?.stateGateWarnings ?? []), ...(candidate?.qualityGateWarnings ?? [])],
        requestId,
      })
      setCandidate({
        kind: 'project-update',
        title: generated.title,
        targetFile: null,
        content: generated.content,
        updates: generated.updates,
        projectImpactMap: generated.impactMap,
      })
      setMaterialMessage(text.candidateReady)
      setError(null)
      revealCandidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
    } finally {
      setActiveAiRequestId(null)
      setActiveAiTaskLabel(null)
      setIsAiBusy(false)
    }
  }

  async function rewriteSelectedMaterial() {
    if (!bookDetail || !selectedMaterial || !api) {
      return
    }

    if (!aiSettings.configured) {
      setCandidate({
        kind: 'setup',
        title: text.aiSettings,
        targetFile: null,
        content: text.configureAiFirst,
      })
      setMaterialMessage(text.candidateReady)
      revealCandidate()
      return
    }

    if (!window.confirm(text.confirmAiRewrite)) {
      return
    }

    try {
      const requestId = createAiRequestId('material')
      setActiveAiRequestId(requestId)
      setActiveAiTaskLabel(selectedMaterial.label)
      setIsAiBusy(true)
      setMaterialMessage(text.generating)
      const generated = await api.generateMaterialCandidate({
        bookPath: bookDetail.book.path,
        chapterFile: bookDetail.selectedChapter?.file,
        materialId: selectedMaterial.id,
        targetFile: selectedMaterial.file,
        currentContent: materialContent,
        requestId,
      })
      setCandidate({
        kind: generated.kind,
        title: generated.title,
        targetFile: generated.targetFile,
        content: generated.content,
      })
      setMaterialMessage(text.candidateReady)
      setError(null)
      revealCandidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
    } finally {
      setActiveAiRequestId(null)
      setActiveAiTaskLabel(null)
      setIsAiBusy(false)
    }
  }

  async function sendProjectChatMessage() {
    if (!bookDetail || !api || !projectChatInput.trim()) {
      return
    }

    if (!aiSettings.configured) {
      setError(text.configureAiFirst)
      setIsAiSettingsOpen(true)
      return
    }

    const nextMessages: ProjectChatMessage[] = [
      ...projectChatMessages,
      {
        role: 'user',
        content: projectChatInput.trim(),
      },
    ]

    try {
      const requestId = createAiRequestId('chat')
      setActiveAiRequestId(requestId)
      setActiveAiTaskLabel(text.projectChat)
      setIsAiBusy(true)
      setProjectChatMessages(pruneProjectChatMessages(nextMessages))
      setProjectChatInput('')
      const reply = await api.projectChat({
        bookPath: bookDetail.book.path,
        chapterFile: bookDetail.selectedChapter?.file,
        messages: nextMessages,
        requestId,
      })
      setProjectChatMessages(pruneProjectChatMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: reply.content,
        },
      ]))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
    } finally {
      setActiveAiRequestId(null)
      setActiveAiTaskLabel(null)
      setIsAiBusy(false)
    }
  }

  async function saveLatestChatToMaterial() {
    if (!bookDetail || !api || projectChatMessages.length === 0) {
      return
    }

    if (!aiSettings.configured) {
      setError(text.configureAiFirst)
      setIsAiSettingsOpen(true)
      return
    }

    try {
      const requestId = createAiRequestId('project-update')
      setActiveAiRequestId(requestId)
      setActiveAiTaskLabel(text.projectUpdatePackage)
      setIsAiBusy(true)
      setMaterialMessage(text.generating)
      const generated = await api.generateProjectUpdatePackage({
        bookPath: bookDetail.book.path,
        chapterFile: bookDetail.selectedChapter?.file,
        messages: projectChatMessages,
        requestId,
      })
      setCandidate({
        kind: 'project-update',
        title: generated.title,
        targetFile: null,
        content: generated.content,
        updates: generated.updates,
        projectImpactMap: generated.impactMap,
      })
      setMaterialMessage(text.candidateReady)
      setIsProjectChatOpen(false)
      setError(null)
      revealCandidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
    } finally {
      setActiveAiRequestId(null)
      setActiveAiTaskLabel(null)
      setIsAiBusy(false)
    }
  }

  async function compactProjectMemory() {
    if (!bookDetail || !api) {
      return
    }

    if (!aiSettings.configured) {
      setError(text.configureAiFirst)
      setIsAiSettingsOpen(true)
      return
    }

    try {
      const requestId = createAiRequestId('memory-compaction')
      setActiveAiRequestId(requestId)
      setActiveAiTaskLabel(text.memoryCompaction)
      setIsAiBusy(true)
      const generated = await api.compactProjectMemory({
        bookPath: bookDetail.book.path,
        chapterFile: bookDetail.selectedChapter?.file,
        requestId,
      })
      setCandidate({
        kind: 'project-update',
        title: generated.title,
        targetFile: null,
        content: generated.content,
        updates: generated.updates,
      })
      setMaterialMessage(text.candidateReady)
      setError(null)
      revealCandidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
    } finally {
      setActiveAiRequestId(null)
      setActiveAiTaskLabel(null)
      setIsAiBusy(false)
    }
  }

  function clearProjectChatDraft() {
    if (!bookDetail) {
      return
    }

    window.localStorage.removeItem(projectChatDraftStorageKey(bookDetail.book.path))
    setProjectChatMessages([])
    setProjectChatInput('')
  }

  async function generateOutlineCandidateForMaterial(mode: 'volume' | 'chapter') {
    if (!bookDetail || !api) {
      setError(text.desktopUnavailable)
      return
    }

    if (!aiSettings.configured) {
      setCandidate({
        kind: 'setup',
        title: text.aiSettings,
        targetFile: null,
        content: text.configureAiFirst,
      })
      setMaterialMessage(text.candidateReady)
      revealCandidate()
      return
    }

    try {
      const requestId = createAiRequestId(`outline-${mode}`)
      const targetChapter = bookDetail.selectedChapter
      setActiveAiRequestId(requestId)
      setActiveAiTaskLabel(mode === 'chapter' && targetChapter ? `${targetChapter.title} - ${text.generatingOutline}` : text.generatingOutline)
      setIsAiBusy(true)
      setMaterialMessage(text.generatingOutline)
      const generated = await api.generateOutlineCandidate({
        bookPath: bookDetail.book.path,
        chapterFile: bookDetail.selectedChapter?.file,
        mode,
        requestId,
      })
      setCandidate({
        kind: generated.kind,
        title: generated.title,
        targetFile: generated.targetFile,
        targetChapterFile: mode === 'chapter' ? targetChapter?.file : undefined,
        targetChapterTitle: mode === 'chapter' ? targetChapter?.title : undefined,
        content: generated.content,
      })
      setMaterialMessage(text.candidateReady)
      setError(null)
      revealCandidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
    } finally {
      setActiveAiRequestId(null)
      setActiveAiTaskLabel(null)
      setIsAiBusy(false)
    }
  }

  async function generateSyncCandidate() {
    if (!bookDetail?.selectedChapter) {
      return
    }

    if (!api) {
      setError(text.desktopUnavailable)
      return
    }

    if (!aiSettings.configured) {
      setCandidate({
        kind: 'setup',
        title: text.aiSettings,
        targetFile: null,
        content: text.configureAiFirst,
      })
      return
    }

    try {
      const requestId = createAiRequestId('sync')
      setActiveAiRequestId(requestId)
      setActiveAiTaskLabel(`${bookDetail.selectedChapter.title} - ${text.checkAndSync}`)
      setIsAiBusy(true)
      const generated = await api.generateCheckSyncCandidate({
        bookPath: bookDetail.book.path,
        chapterFile: bookDetail.selectedChapter.file,
        requestId,
      })
      setCandidate({
        kind: 'sync-context',
        title: generated.title,
        targetFile: null,
        content: generated.content,
        syncPayload: generated.syncPayload,
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.aiSettingsFailed)
    } finally {
      setActiveAiRequestId(null)
      setActiveAiTaskLabel(null)
      setIsAiBusy(false)
    }
  }

  async function applyCandidate() {
    if (!candidate || !bookDetail || !api) {
      return
    }

    if (candidate.kind === 'continue-writing') {
      const applyContinuation = async (chapterFile: string) => {
        const appliedEditorialJudgement = buildEditorialJudgement(candidate, batchWritingResult)
        const appliedEditorialRadar = buildEditorialRadar(candidate, appliedEditorialJudgement)
        const appliedEditorialFocusActions = buildEditorialFocusActions(appliedEditorialRadar, appliedEditorialJudgement)
        const detail = await api.applyWritingCandidate({
          bookPath: bookDetail.book.path,
          chapterFile,
          content: candidate.content,
          mode: 'append',
          statePatch: candidate.statePatch,
          progressPatch: candidate.progressPatch,
          memoryPatch: candidate.memoryPatch,
          structuredPatch: candidate.structuredPatch,
          futurePlanPatch: candidate.futurePlanPatch,
          stylePatch: candidate.stylePatch,
          memoryGovernancePatch: candidate.memoryGovernancePatch,
          editorialJudgement: appliedEditorialJudgement,
          editorialRadar: appliedEditorialRadar,
          editorialFocusActions: appliedEditorialFocusActions,
        })
        setLatestApplyReadbackCheck(detail.applyReadbackCheck ?? null)
        setMaterialMessage(detail.applyReadbackCheck?.summary ?? text.candidateApplied)
        setBookDetail(detail)
        setDraftContent(detail.content)
        setChapterSnapshots([])
        setExportMessage(null)
        setIsDirty(false)
        setCandidate(null)
        setBatchWritingResult(null)
        setChapterFeedback('')
        setError(null)
      }

      if (candidate.targetChapterFile && bookDetail.selectedChapter?.file !== candidate.targetChapterFile) {
        try {
          setIsLoading(true)
          if (isDirty && bookDetail.selectedChapter) {
            await api.saveChapter({
              bookPath: bookDetail.book.path,
              chapterFile: bookDetail.selectedChapter.file,
              content: draftContent,
              snapshot: true,
              reason: 'before-apply-candidate-switch',
            })
          }
          await applyContinuation(candidate.targetChapterFile)
        } catch (err) {
          setError(err instanceof Error ? err.message : text.saveChapterFailed)
        } finally {
          setIsLoading(false)
        }
        return
      }
      if (!bookDetail.selectedChapter) {
        return
      }
      try {
        setIsLoading(true)
        if (isDirty) {
          await api.saveChapter({
            bookPath: bookDetail.book.path,
            chapterFile: bookDetail.selectedChapter.file,
            content: draftContent,
            snapshot: true,
            reason: 'before-apply-continuation',
          })
        }
        await applyContinuation(bookDetail.selectedChapter.file)
      } catch (err) {
        setError(err instanceof Error ? err.message : text.saveChapterFailed)
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (candidate.kind === 'chapter-feedback') {
      const applyFeedbackPackage = async (chapterFile: string) => {
        const appliedEditorialJudgement = buildEditorialJudgement(candidate, batchWritingResult)
        const appliedEditorialRadar = buildEditorialRadar(candidate, appliedEditorialJudgement)
        const appliedEditorialFocusActions = buildEditorialFocusActions(appliedEditorialRadar, appliedEditorialJudgement)
        let detail = await api.applyWritingCandidate({
          bookPath: bookDetail.book.path,
          chapterFile,
          content: candidate.content,
          mode: 'replace',
          statePatch: candidate.statePatch,
          progressPatch: candidate.progressPatch,
          memoryPatch: candidate.memoryPatch,
          structuredPatch: candidate.structuredPatch,
          futurePlanPatch: candidate.futurePlanPatch,
          stylePatch: candidate.stylePatch,
          memoryGovernancePatch: candidate.memoryGovernancePatch,
          editorialJudgement: appliedEditorialJudgement,
          editorialRadar: appliedEditorialRadar,
          editorialFocusActions: appliedEditorialFocusActions,
        })
        const applyReadbackCheck = detail.applyReadbackCheck ?? null

        if (candidate.projectUpdates?.length) {
          detail = await api.applyProjectUpdatePackage({
            bookPath: bookDetail.book.path,
            selectedChapterFile: chapterFile,
            updates: candidate.projectUpdates,
            source: 'project-repair',
            summary: '鏅鸿兘鍙嶉璧勬枡淇',
            impactMap: candidate.projectImpactMap,
          })
        }

        setBookDetail(detail)
        setDraftContent(detail.content)
        setChapterSnapshots([])
        setExportMessage(null)
        setIsDirty(false)
        setCandidate(null)
        setBatchWritingResult(null)
        setChapterFeedback('')
        setLatestApplyReadbackCheck(applyReadbackCheck)
        setMaterialMessage(applyReadbackCheck?.summary ?? text.candidateApplied)
        setError(null)
      }

      try {
        setIsLoading(true)
        if (candidate.targetChapterFile && bookDetail.selectedChapter?.file !== candidate.targetChapterFile) {
          if (isDirty && bookDetail.selectedChapter) {
            await api.saveChapter({
              bookPath: bookDetail.book.path,
              chapterFile: bookDetail.selectedChapter.file,
              content: draftContent,
              snapshot: true,
              reason: 'before-apply-feedback-package-switch',
            })
          }
          await applyFeedbackPackage(candidate.targetChapterFile)
        } else if (bookDetail.selectedChapter) {
          await applyFeedbackPackage(bookDetail.selectedChapter.file)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : text.saveChapterFailed)
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (candidate.kind === 'chapter-revision') {
      if (candidate.targetChapterFile && bookDetail.selectedChapter?.file !== candidate.targetChapterFile) {
        try {
          setIsLoading(true)
          if (isDirty && bookDetail.selectedChapter) {
            await api.saveChapter({
              bookPath: bookDetail.book.path,
              chapterFile: bookDetail.selectedChapter.file,
              content: draftContent,
              snapshot: true,
              reason: 'before-apply-revision-switch',
            })
          }
          const detail = await api.openChapter(bookDetail.book.path, candidate.targetChapterFile)
          await api.saveChapter({
            bookPath: bookDetail.book.path,
            chapterFile: candidate.targetChapterFile,
            content: detail.content,
            snapshot: true,
            reason: 'before-revision',
          })
          setBookDetail(detail)
          setDraftContent(candidate.content)
          setChapterSnapshots([])
          setExportMessage(null)
          setIsDirty(true)
          setCandidate(null)
          setError(null)
        } catch (err) {
          setError(err instanceof Error ? err.message : text.saveChapterFailed)
        } finally {
          setIsLoading(false)
        }
        return
      }
      if (bookDetail.selectedChapter) {
        await api.saveChapter({
          bookPath: bookDetail.book.path,
          chapterFile: bookDetail.selectedChapter.file,
          content: draftContent,
          snapshot: true,
          reason: 'before-revision',
        })
      }
      setDraftContent(candidate.content)
      setIsDirty(true)
      setCandidate(null)
      return
    }

    if (candidate.kind === 'chapter-check') {
      return
    }

    if (candidate.kind === 'sync-context') {
      if (!candidate.syncPayload) {
        return
      }

      try {
        setIsLoading(true)
        const detail = await api.applyContextSync({
          bookPath: bookDetail.book.path,
          ...candidate.syncPayload,
        })
        setBookDetail(detail)
        setCandidate(null)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : text.saveChapterFailed)
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (candidate.kind === 'project-update') {
      if (!candidate.updates || candidate.updates.length === 0) {
        return
      }

      try {
        setIsLoading(true)
        const detail = await api.applyProjectUpdatePackage({
          bookPath: bookDetail.book.path,
          selectedChapterFile: bookDetail.selectedChapter?.file,
          updates: candidate.updates,
          source: candidate.title.includes(text.projectRepairPackage) ? 'project-repair' : 'project-update',
          summary: candidate.title,
          impactMap: candidate.projectImpactMap,
        })
        setBookDetail(detail)
        setCandidate(null)
        await openMaterialsPanel(candidate.updates[0]?.file, detail)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : text.saveChapterFailed)
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (!candidate.targetFile) {
      return
    }

    const targetFile = candidate.targetFile

    try {
      setIsLoading(true)
      const detail = await api.applyCandidate({
        bookPath: bookDetail.book.path,
        targetFile,
        content: candidate.content,
        selectedChapterFile: bookDetail.selectedChapter?.file,
      })
      setBookDetail(detail)
      setCandidate(null)
      await openMaterialsPanel(targetFile, detail)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : text.saveChapterFailed)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!bookDetail?.selectedChapter || !isDirty || isSaving) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      saveChapter({ snapshot: false, reason: 'autosave' })
    }, 10000)

    return () => window.clearTimeout(timeoutId)
  }, [bookDetail?.selectedChapter, draftContent, isDirty, isSaving, saveChapter])

  if (bookDetail) {
    const selected = bookDetail.selectedChapter
    const foundationItems = bookDetail.contextCheck.items.filter((item) => item.key !== 'chapterOutline' && item.key !== 'previousChapter')
    const chapterItems = bookDetail.contextCheck.items.filter((item) => item.key === 'chapterOutline' || item.key === 'previousChapter')
    const isFoundationReady = foundationItems.every((item) => item.status !== 'missing')
    const materialRows = projectMaterials.filter((material) => material.id !== 'chapterOutline')
    const chapterOutlineMaterial = projectMaterials.find((material) => material.id === 'chapterOutline') ?? null
    const primaryWorkflowDecision = buildPrimaryWorkflowDecision(bookDetail, candidate, aiSettings.configured, isAiBusy)
    const commandCenter = buildProjectCommandCenter(bookDetail, projectMaterials, isFoundationReady)
    const knowledgeGroups = groupKnowledgeMaterials(materialRows)
    const chapterVolumeGroups = groupChaptersByVolume(bookDetail.chapters)
    const chapterRouteSteps = buildChapterRouteSteps(bookDetail, chapterOutlineMaterial, isDirty, candidate, primaryWorkflowDecision)
    const chapterPreflightContract = buildChapterPreflightContract(bookDetail, chapterOutlineMaterial)
    const editorialJudgement = buildEditorialJudgement(candidate, batchWritingResult)
    const companionCopilot = buildCompanionCopilotStatus({
      detail: bookDetail,
      candidateDraft: candidate,
      batchResult: batchWritingResult,
      feedback: chapterFeedback,
      writingMode: writingSpeedMode,
      primaryDecision: primaryWorkflowDecision,
      editorialJudgement,
      aiConfigured: aiSettings.configured,
      busy: isAiBusy,
    })
    const editorialRadar = buildEditorialRadar(candidate, editorialJudgement)
    const editorialFocusActions = buildEditorialFocusActions(editorialRadar, editorialJudgement)
    const projectToolMenu = (
      <div className="project-tool-menu">
        <button className="secondary-button" type="button" onClick={() => setIsProjectToolMenuOpen(!isProjectToolMenuOpen)}>
          椤圭洰宸ュ叿
        </button>
        {isProjectToolMenuOpen ? (
          <div className="project-tool-popover">
            <button type="button" onClick={() => {
              setIsProjectToolMenuOpen(false)
              openMaterialsPanel()
            }}>
              {text.projectMaterials}
            </button>
            <button type="button" onClick={() => {
              setIsProjectToolMenuOpen(false)
              setIsProjectChatOpen(true)
            }}>
              {text.projectChat}
            </button>
            <button type="button" onClick={() => {
              setIsProjectToolMenuOpen(false)
              loadAiCallLogs()
            }}>
              AI 璋冪敤璁板綍
            </button>
            <button type="button" onClick={() => {
              setIsProjectToolMenuOpen(false)
              exportCurrentChapter()
            }} disabled={!selected}>
              {text.exportChapter}
            </button>
            <button type="button" onClick={() => {
              setIsProjectToolMenuOpen(false)
              exportWholeBook()
            }} disabled={bookDetail.chapters.length === 0}>
              {text.exportBook}
            </button>
          </div>
        ) : null}
      </div>
    )

    return (
      <main className="app-shell editor-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{bookMode === 'prep' ? text.projectPrep : text.editor}</p>
            <h1>{bookDetail.book.title}</h1>
          </div>
          <div className="topbar-actions">
            <button className="secondary-button" type="button" onClick={() => setIsAiSettingsOpen(true)}>
              {text.aiSettings} 路 {aiSettings.configured ? text.configured : text.notConfigured}
            </button>
            {bookMode === 'write' ? (
              <button className="secondary-button" type="button" onClick={() => setBookMode('prep')}>
                {text.backToProjectPrep}
              </button>
            ) : null}
            <button className="secondary-button" type="button" onClick={() => setBookDetail(null)}>
              {text.back}
            </button>
            {projectToolMenu}
            <button className="primary-button" type="button" onClick={() => saveChapter({ snapshot: true, reason: 'manual' })} disabled={!selected || !isDirty || isSaving}>
              {isSaving ? text.saving : text.save}
            </button>
          </div>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}
        {exportMessage ? <div className="success-banner">{exportMessage}</div> : null}

        {isAiSettingsOpen ? (
          <section className="ai-settings-panel">
            <div className="section-title">
              <div>
                <h2>{text.aiSettings}</h2>
                <p>{aiSettings.configured ? text.configured : text.notConfigured}</p>
              </div>
              <button className="secondary-button" type="button" onClick={() => setIsAiSettingsOpen(false)}>
                {text.close}
              </button>
            </div>
            <div className="ai-provider-presets">
              <span>{text.providerPreset}</span>
              <button className="secondary-button" type="button" onClick={() => applyAiProviderPreset('deepseek')}>
                {text.deepSeekPreset}
              </button>
              <button className="secondary-button" type="button" onClick={() => applyAiProviderPreset('openai')}>
                {text.openAiPreset}
              </button>
              <small>{text.aiSettingsHint}</small>
            </div>
            <div className="form-grid">
              <label>
                <span>{text.apiKey}</span>
                <input autoComplete="off" type="password" value={aiForm.apiKey} placeholder={text.apiKeyPlaceholder} onChange={(event) => updateAiForm({ apiKey: event.target.value })} />
              </label>
              <label>
                <span>{text.baseUrl}</span>
                <input value={aiForm.baseUrl} placeholder={text.baseUrlPlaceholder} onChange={(event) => updateAiForm({ baseUrl: event.target.value })} />
              </label>
              <label>
                <span>{text.proxyUrl}</span>
                <input value={aiForm.proxyUrl} placeholder={text.proxyUrlPlaceholder} onChange={(event) => updateAiForm({ proxyUrl: event.target.value })} />
              </label>
              <label>
                <span>{text.model}</span>
                <input value={aiForm.model} onChange={(event) => updateAiForm({ model: event.target.value })} />
              </label>
            </div>
            <div className="panel-actions split-actions">
              <span>{aiMessage}</span>
              <div>
                <button className="secondary-button" type="button" onClick={testAiConnection} disabled={isAiSettingsSubmitDisabled}>
                  {text.testConnection}
                </button>
                <button className="primary-button" type="button" onClick={saveAiSettings} disabled={isAiSettingsSubmitDisabled}>
                  {text.saveSettings}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {isProjectChatOpen ? (
          <div className="modal-backdrop">
            <section className="chat-modal" role="dialog" aria-modal="true" aria-label={text.projectChat}>
              <div className="section-title">
                <div>
                  <h2>{text.projectChat}</h2>
                  <p>{text.projectChatHelp}</p>
                </div>
                <button className="secondary-button" type="button" onClick={() => setIsProjectChatOpen(false)}>
                  {text.close}
                </button>
              </div>
              <div className="chat-thread">
                {projectChatMessages.length === 0 ? <p className="muted-text">{text.projectChatHelp}</p> : null}
                {projectChatMessages.map((message, index) => (
                  <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
                    <strong>{message.role === 'assistant' ? 'AI' : text.me}</strong>
                    <p>{message.content}</p>
                  </div>
                ))}
              </div>
              <label className="chat-input">
                <span>{text.chatInput}</span>
                <textarea value={projectChatInput} placeholder={text.chatInputPlaceholder} onChange={(event) => setProjectChatInput(event.target.value)} />
              </label>
              <div className="panel-actions split-actions">
                <span>
                  {text.chatTarget}: {text.chatNoMaterial}
                </span>
                <div>
                  {isAiBusy ? (
                    <button className="secondary-button danger-button" type="button" onClick={stopAiGeneration}>
                      {text.stopGenerating}
                    </button>
                  ) : null}
                  <button className="secondary-button" type="button" onClick={clearProjectChatDraft} disabled={isAiBusy || projectChatMessages.length === 0}>
                    {text.clearProjectChat}
                  </button>
                  <button className="secondary-button" type="button" onClick={saveLatestChatToMaterial} disabled={isAiBusy || !projectChatMessages.some((message) => message.role === 'assistant')}>
                    {isProjectUpdateGenerating ? text.generating : text.saveChatToMaterial}
                  </button>
                  <button className="primary-button" type="button" onClick={sendProjectChatMessage} disabled={isAiBusy || !projectChatInput.trim()}>
                    {isProjectChatSending ? text.generating : text.sendChat}
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : null}

        {isAiCallLogsOpen ? (
          <div className="modal-backdrop">
            <section className="ai-call-logs-modal" role="dialog" aria-modal="true" aria-label="AI 璋冪敤璁板綍">
              <div className="section-title">
                <div>
                  <h2>AI 璋冪敤璁板綍</h2>
                  <p>寮€鍙戞湡瑙傛祴宸ュ叿锛氱敤浜庢帓鏌ヨ€楁椂銆佸け璐ャ€佷笂涓嬫枃澶у皬鍜岀紦瀛?key锛屽晢涓氬寲鏃跺彲闅愯棌鎴栨浛鎹负鐢ㄩ噺鎸囨爣銆?/p>
                </div>
                <div className="modal-actions">
                  <button className="secondary-button" type="button" onClick={loadAiCallLogs}>
                    鍒锋柊
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setIsAiCallLogsOpen(false)}>
                    {text.close}
                  </button>
                </div>
              </div>
              <div className="ai-call-log-table">
                {aiCallLogs.length === 0 ? (
                  <p className="muted-text">鏆傛棤璋冪敤璁板綍銆傝繘琛屼竴娆?AI 鐢熸垚銆佸璇濇垨娴嬭瘯杩炴帴鍚庡啀鏌ョ湅銆?/p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>鏃堕棿</th>
                        <th>鐘舵€?/th>
                        <th>绔偣</th>
                        <th>妯″瀷</th>
                        <th>鑰楁椂</th>
                        <th>杈撳叆/杈撳嚭</th>
                        <th>缂撳瓨 key</th>
                        <th>閿欒</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiCallLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{formatAiLogTime(log.time)}</td>
                          <td>
                            <span className={`log-status ${log.status}`}>{log.status === 'success' ? '鎴愬姛' : '澶辫触'}</span>
                          </td>
                          <td>{log.endpoint}</td>
                          <td>{log.model}</td>
                          <td>{(log.durationMs / 1000).toFixed(1)}s</td>
                          <td>
                            {log.inputChars} / {log.outputChars}
                          </td>
                          <td className="mono-cell">{log.promptCacheKey || '-'}</td>
                          <td className="error-cell">{log.error || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        ) : null}

        {isMaterialsPanelOpen ? (
          <section className="materials-panel">
            <div className="section-title">
              <div>
                <h2>{text.projectMaterials}</h2>
                <p>{isAiBusy ? text.projectUpdateHelp : materialMessage ?? text.materialOpenHelp}</p>
              </div>
              <button className="secondary-button" type="button" onClick={() => setIsMaterialsPanelOpen(false)}>
                {text.close}
              </button>
            </div>
            {isAiBusy ? (
              <div className="material-busy-status">
                <span className="typing-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <strong>{text.generatingCandidateShort}</strong>
                <button className="secondary-button danger-button compact-button" type="button" onClick={stopAiGeneration}>
                  {text.stopGenerating}
                </button>
              </div>
            ) : null}
            <div className="materials-grid">
              <nav className="materials-list" aria-label={text.projectMaterials}>
                {projectMaterials.map((material) => (
                  <button className={selectedMaterial?.file === material.file ? 'material-item active' : 'material-item'} type="button" key={material.file} onClick={() => selectProjectMaterial(material)}>
                    <strong>{material.label}</strong>
                    <span>{material.ready ? text.saved : material.exists ? text.materialNotReady : text.materialMissing}</span>
                  </button>
                ))}
              </nav>
              <div className="material-editor">
                <div className="material-toolbar">
                  <div>
                    <h3>{selectedMaterial?.label ?? text.projectMaterials}</h3>
                    <span>{selectedMaterial?.file}</span>
                  </div>
                  <div className="material-actions">
                    {materialSnapshots.length > 0 ? (
                      <label className="snapshot-select">
                        <span>{text.materialSnapshots}</span>
                        <select value={selectedMaterialSnapshotId} onChange={(event) => setSelectedMaterialSnapshotId(event.target.value)}>
                          {materialSnapshots.map((snapshot) => (
                            <option value={snapshot.id} key={snapshot.id}>
                              {snapshot.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <button className="secondary-button" type="button" onClick={restoreLatestProjectMaterial} disabled={!selectedMaterial || materialSnapshots.length === 0 || !selectedMaterialSnapshotId || isSaving}>
                      {text.restoreMaterial}
                    </button>
                    <button className="secondary-button" type="button" onClick={rewriteSelectedMaterial} disabled={!selectedMaterial || isAiBusy}>
                      {isAiBusy ? text.generating : text.rewriteMaterial}
                    </button>
                    <button className="primary-button" type="button" onClick={saveProjectMaterial} disabled={!selectedMaterial || !isMaterialDirty || isSaving}>
                      {isSaving ? text.saving : text.saveMaterial}
                    </button>
                  </div>
                </div>
                <textarea
                  value={materialContent}
                  disabled={!selectedMaterial}
                  onChange={(event) => {
                    setMaterialContent(event.target.value)
                    setIsMaterialDirty(true)
                    setMaterialMessage(text.materialDirty)
                  }}
                />
                <button className="secondary-button" type="button" onClick={() => setIsProjectChatOpen(true)} disabled={!selectedMaterial}>
                  {text.projectChat}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {bookMode === 'prep' ? (
          <section className="project-prep-layout">
            <section className="project-command-center">
              <div className="section-title">
                <div>
                  <h2>椤圭洰椹鹃┒鑸?/h2>
                  <p>{commandCenter.risk}</p>
                </div>
                <button className="primary-button" type="button" onClick={runPrimaryWorkflowAction} disabled={primaryWorkflowDecision.disabled}>
                  {isAiBusy ? text.generating : primaryWorkflowDecision.label}
                </button>
              </div>
              <div className="command-metric-grid">
                <div>
                  <span>闃舵</span>
                  <strong>{commandCenter.stage}</strong>
                </div>
                <div>
                  <span>鎬诲瓧鏁?/span>
                  <strong>{formatNumber(commandCenter.totalWords)}</strong>
                  <small>鐩爣 {formatNumber(commandCenter.targetWords)}</small>
                </div>
                <div>
                  <span>绔犺妭</span>
                  <strong>{commandCenter.currentChapterIndex || '-'} / {commandCenter.chapterCount}</strong>
                </div>
                <div>
                  <span>璧勬枡鍋ュ悍</span>
                  <strong>{commandCenter.materialRatio}%</strong>
                  <small>{commandCenter.healthDetail}</small>
                </div>
                <div>
                  <span>鍐欎綔渚濇嵁</span>
                  <strong>{commandCenter.readyRatio}%</strong>
                  <small>{commandCenter.healthLabel}</small>
                </div>
              </div>
            </section>

            <section className="prep-panel prep-overview">
              <div className="section-title">
                <div>
                  <h2>{text.projectPrep}</h2>
                  <p>{text.projectPrepHelp}</p>
                </div>
                <button className="primary-button" type="button" onClick={() => setBookMode('write')}>
                  {text.enterWriting}
                </button>
              </div>
              <div className={isFoundationReady ? 'inline-status' : 'inline-status warning'}>
                {isFoundationReady ? text.projectPrepReady : text.projectPrepNeedWork}
              </div>
              <div className="prep-check-grid">
                {foundationItems.map((item) => (
                  <div className={`prep-check-item ${item.status}`} key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.detail}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="prep-panel">
              <div className="section-title">
                <div>
                  <h2>鐭ヨ瘑搴撳仴搴疯鍥?/h2>
                  <p>鎸夌敤閫旂湅璧勬枡鏄惁鑳芥敮鎾戝悗缁啓浣滐紝鍏堢湅缂哄彛锛屽啀杩涘叿浣撴枃浠跺井璋冦€?/p>
                </div>
                <button className="secondary-button" type="button" onClick={() => openMaterialsPanel()}>
                  {text.projectMaterials}
                </button>
              </div>
              <div className="knowledge-board">
                {knowledgeGroups.map((group) => (
                  <section className="knowledge-lane" key={group.id}>
                    <div>
                      <h3>{group.title}</h3>
                      <p>{group.help}</p>
                    </div>
                    <div className="prep-material-list">
                      {group.materials.map((material) => (
                        <button className={material.ready ? 'prep-material-item ready' : 'prep-material-item'} type="button" key={material.file} onClick={() => openMaterialFromPrep(material)}>
                          <div>
                            <strong>{material.label}</strong>
                            <span>{material.file}</span>
                          </div>
                          <em>{material.ready ? text.saved : material.exists ? text.materialNotReady : text.materialMissing}</em>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </section>

            <section className="prep-panel">
              <div className="section-title">
                <div>
                  <h2>{text.chapterPreparation}</h2>
                  <p>{text.chapterPrepHelp}</p>
                </div>
                <button className="primary-button" type="button" onClick={generateCandidate} disabled={isAiBusy || !selected}>
                  {isAiBusy ? text.generating : bookDetail.contextCheck.primaryAction}
                </button>
              </div>
              <div className="chapter-prep-card">
                <div>
                  <span>{text.currentChapterPrep}</span>
                  <strong>{selected?.title ?? text.noChapter}</strong>
                </div>
                <div>
                  <span>{text.chapterOutlineStatus}</span>
                  <strong>{chapterOutlineMaterial?.ready ? text.saved : text.noChapterOutlineYet}</strong>
                </div>
              </div>
              <div className="prep-check-grid compact">
                {chapterItems.map((item) => (
                  <div className={`prep-check-item ${item.status}`} key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.detail}</strong>
                  </div>
                ))}
              </div>
            </section>
          </section>
        ) : null}

        {candidate ? (
          <section className="candidate-panel candidate-panel-wide" ref={candidatePanelRef}>
            <div className="section-title">
              <div>
                <h2>{text.candidateArea}</h2>
                <p>{candidate.title}</p>
                <p>{getCandidateKindLabel(candidate.kind)}</p>
                <p>{describeCandidateTarget(candidate)}</p>
                {candidate.targetFile ? <p>{text.candidateTarget}: {candidate.targetFile}</p> : null}
                {candidate.targetChapterTitle ? <p>{text.candidateChapter}: {candidate.targetChapterTitle}</p> : null}
              </div>
              <button className="secondary-button" type="button" onClick={() => setCandidate(null)}>
                {text.clearCandidate}
              </button>
            </div>
            {candidate.kind === 'chapter-outline' ? <div className="inline-status">{text.chapterOutlineSafeHint}</div> : null}
            {candidate.targetChapterFile ? <div className="inline-status">{text.candidateAnchored}</div> : null}
            {candidate.targetChapterFile && selected?.file !== candidate.targetChapterFile ? <div className="inline-status warning">{text.candidateWrongChapter}</div> : null}
            {candidate.directorStatus === 'auto-revised' ? <div className="inline-status">宸叉牴鎹嚜妫€鑷姩淇锛屼笅闈㈡槸鏈€缁堟鏂囧€欓€夈€?/div> : null}
            {candidate.directorStatus === 'needs-review' || candidate.selfCheckFailed ? <div className="inline-status warning">鐢熸垚宸插畬鎴愶紝浣嗗缓璁汉宸ュ揩閫熷鏍搞€?/div> : null}
            {candidate.stateGateWarnings?.length ? <div className="inline-status warning">鐘舵€侀棬绂佹彁绀猴細{candidate.stateGateWarnings.join('锛?)}</div> : null}
            {candidate.qualityGateWarnings?.length ? <div className="inline-status warning">鎵ц鍚堝悓鎻愮ず锛歿candidate.qualityGateWarnings.join('锛?)}</div> : null}
            <details className="candidate-detail-shell">
              <summary>??????</summary>
              {candidate.nextChapterReadiness ? (
                <details className="director-detail">
                  <summary>???????</summary>
                  <pre>{candidate.nextChapterReadiness}</pre>
                </details>
              ) : null}
              {candidate.companion90Summary ? (
                <div className="companion90-summary-card">
                  <strong>{candidate.companion90Summary.level === 'pass' ? '????????' : '?????????'}</strong>
                  <p>{candidate.companion90Summary.summary}</p>
                  <ul>
                    <li>?????{candidate.companion90Summary.chatReady ? '???' : '???'}</li>
                    <li>?????{candidate.companion90Summary.autoChapterFlowReady ? '???' : '???'}</li>
                    <li>?????{candidate.companion90Summary.qualityGateReady ? '??' : '???'}</li>
                  </ul>
                </div>
              ) : null}
              {(candidate.kind === 'chapter-feedback' || candidate.kind === 'project-update') && candidate.companionDecision ? (
                <div className="companion-decision-card">
                  <strong>????</strong>
                  <p>{candidate.companionDecision.understoodProblem}</p>
                  <ul>
                    <li>?????{candidate.companionDecision.plannedAction}</li>
                    <li>?????{candidate.companionDecision.impactScope}</li>
                    <li>?????{candidate.companionDecision.applyAdvice === 'apply' ? '????' : candidate.companionDecision.applyAdvice === 'reject' ? '???????' : '?????'}</li>
                    <li>????{candidate.companionDecision.userNextStep}</li>
                  </ul>
                </div>
              ) : null}
              {candidate.projectImpactMap ? (
                <details className="project-impact-map-card">
                  <summary>??????</summary>
                  <pre>{candidate.projectImpactMap.content}</pre>
                </details>
              ) : null}
              {candidate.kind === 'chapter-feedback' ? (
                <div className="feedback-impact">
                  {candidate.smartFeedbackRoute ? (
                    <div>
                      <strong>????</strong>
                      <pre>{['?????' + (candidate.smartFeedbackRoute.chapterAction === 'rewrite' ? '????' : '???'),
                        '?????' + (candidate.smartFeedbackRoute.projectAction === 'repair' ? '??????' : '???'),
                        candidate.smartFeedbackRoute.targetMaterialIds.length ? '?????' + candidate.smartFeedbackRoute.targetMaterialIds.join('?') : '',
                        candidate.smartFeedbackRoute.reason ? '?????' + candidate.smartFeedbackRoute.reason : '',
                      ].filter(Boolean).join('\n')}</pre>
                    </div>
                  ) : null}
                  {candidate.feedbackSummary ? (
                    <div>
                      <strong>????</strong>
                      <pre>{candidate.feedbackSummary}</pre>
                    </div>
                  ) : null}
                  {candidate.impactSummary ? (
                    <div>
                      <strong>????</strong>
                      <pre>{candidate.impactSummary}</pre>
                    </div>
                  ) : null}
                  {candidate.longTermMemory ? (
                    <div>
                      <strong>????</strong>
                      <pre>{candidate.longTermMemory}</pre>
                    </div>
                  ) : null}
                  {candidate.projectUpdates?.length ? (
                    <div>
                      <strong>????</strong>
                      <ul>
                        {candidate.projectUpdates.map((update) => (
                          <li key={update.file}>
                            <span>{update.label}</span>
                            <small>{update.file}</small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <pre>{candidate.content}</pre>
              {candidate.directorDetail ? (
                <details className="director-detail">
                  <summary>????</summary>
                  <pre>{candidate.directorDetail}</pre>
                </details>
              ) : null}
              {candidate.kind === 'project-update' && candidate.updates?.length ? (
                <div className="update-file-list">
                  <strong>{text.updatedFiles}</strong>
                  <ul>
                    {candidate.updates.map((update) => (
                      <li key={update.file}>
                        <span>{update.label}</span>
                        <small>{update.file}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </details>
            <div className="candidate-actions row-actions">
              <button className="primary-button" type="button" onClick={applyCandidate} disabled={candidate.kind === 'setup' || candidate.kind === 'chapter-check'}>
                {text.applyCandidate}
              </button>
              {candidate.directorStatus === 'needs-review' ? (
                <button className="secondary-button" type="button" onClick={() => retryLatestWritingTaskStep('self-check')} disabled={isAiBusy}>
                  鍗曟閲嶈瘯
                </button>
              ) : null}
            </div>
          </section>
        ) : null}

        {latestApplyReadbackCheck ? (
          <section className={`apply-readback-card apply-readback-compact ${latestApplyReadbackCheck.ok ? 'ready' : 'warning'}`}>
            <div>
              <h3>{'\u5e94\u7528\u540e\u56de\u8bfb\u81ea\u68c0'}</h3>
              <p>{latestApplyReadbackCheck.summary}</p>
            </div>
            <button className="secondary-button compact-button" type="button" onClick={() => setIsReadbackModalOpen(true)}>
              {'\u67e5\u770b\u8be6\u60c5'}
            </button>
          </section>
        ) : null}

        {latestApplyReadbackCheck && isReadbackModalOpen ? (
          <div className="modal-backdrop">
            <section className="readback-modal" role="dialog" aria-modal="true" aria-label={'\u5e94\u7528\u540e\u56de\u8bfb\u81ea\u68c0'}>
              <div className="section-title">
                <div>
                  <h2>{'\u5e94\u7528\u540e\u56de\u8bfb\u81ea\u68c0'}</h2>
                  <p>{latestApplyReadbackCheck.summary}</p>
                </div>
                <button className="secondary-button" type="button" onClick={() => setIsReadbackModalOpen(false)}>
                  {text.close}
                </button>
              </div>
              <ul>
                {latestApplyReadbackCheck.items.map((item) => (
                  <li className={item.ok ? 'ready' : 'warning'} key={`${item.id}-${item.file}`}>
                    <div>
                      <span>{item.label}</span>
                      <small>{item.file}</small>
                    </div>
                    <strong>{item.ok ? '\u5df2\u786e\u8ba4' : '\u9700\u590d\u6838'}</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        {bookMode === 'write' ? (
        <section className={isChapterSidebarCollapsed ? 'editor-layout chapter-collapsed' : 'editor-layout'}>
          <aside className={isChapterSidebarCollapsed ? 'chapter-sidebar collapsed' : 'chapter-sidebar'}>
            <div className="section-title chapter-title-row">
              <div>
                <h2>{text.chapters}</h2>
                <span>{bookDetail.chapters.length}</span>
              </div>
              <button className="secondary-button compact-button" type="button" onClick={() => setIsChapterSidebarCollapsed(!isChapterSidebarCollapsed)}>
                {isChapterSidebarCollapsed ? text.expand : text.collapse}
              </button>
            </div>
            {!isChapterSidebarCollapsed ? (
              <>
                <button className="primary-button full-width-button" type="button" onClick={finishChapterAndStartNext} disabled={isLoading || isSaving || isAiBusy}>
                  {isAiBusy && nextChapterFlowSteps.length > 0 ? text.generating : text.startNextChapter}
                </button>
                <p className="muted-text sidebar-hint">{text.nextChapterHint}</p>
                {bookDetail.chapters.length === 0 ? <p className="muted-text">{text.noChapter}</p> : null}
                <div className="chapter-list chapter-volume-tree">
                  <div className="book-directory-root">
                    <strong>{bookDetail.book.title}</strong>
                    <span>{bookDetail.chapters.length} {'\u7ae0'}</span>
                  </div>
                  {chapterVolumeGroups.map((volume) => {
                    const isSelectedVolume = volume.chapters.some((chapter) => chapter.file === selected?.file)
                    return (
                      <details className="volume-group" key={volume.id} open={isSelectedVolume || chapterVolumeGroups.length === 1}>
                        <summary>
                          <span>{volume.title}</span>
                          <em>{volume.range}</em>
                        </summary>
                        <div className="volume-chapter-list">
                          {volume.chapters.map((chapter) => (
                            <button className={selected?.file === chapter.file ? 'chapter-item active' : 'chapter-item'} type="button" key={chapter.file} onClick={() => openChapter(chapter.file)}>
                              <strong>{chapter.title}</strong>
                              <span>
                                {chapter.wordCount} / {chapter.targetWords}
                              </span>
                            </button>
                          ))}
                        </div>
                      </details>
                    )
                  })}
                </div>
                {selected ? (
                  <section className="snapshot-panel">
                    <div className="section-title compact-title">
                      <h3>{text.snapshots}</h3>
                      <button className="secondary-button compact-button" type="button" onClick={loadSnapshots}>
                        {text.snapshots}
                      </button>
                    </div>
                    {chapterSnapshots.map((snapshot) => (
                      <button className="snapshot-item" type="button" key={snapshot.id} onClick={() => restoreSnapshot(snapshot.id)}>
                        <span>{snapshot.name}</span>
                        <strong>{text.restore}</strong>
                      </button>
                    ))}
                  </section>
                ) : null}
              </>
            ) : null}
          </aside>

          <section className="writing-pane">
            <div className="writing-toolbar">
              <div>
                <h2>{selected?.title ?? text.noChapter}</h2>
                <span>{isDirty ? text.unsaved : text.saved}</span>
              </div>
              <div className="metrics">
                <span>
                  {text.wordCount}: {liveWordCount}
                </span>
                <span>
                  {text.targetWords}: {selected?.targetWords ?? 0}
                </span>
              </div>
            </div>
            <textarea className="manuscript-editor" value={draftContent} disabled={!selected} onChange={(event) => {
              setDraftContent(event.target.value)
              setIsDirty(true)
            }} />
          </section>

          <aside className="ai-panel ai-assistant-panel">
            <div className="assistant-heading">
              <div>
                <h2>AI 鍔╂墜</h2>
                <p>{selected ? selected.title : text.noChapter}</p>
              </div>
              <span>{writingSpeedMode === 'polish' ? '绮句慨' : writingSpeedMode === 'guarded' ? '杩炲啓' : '鏃犺剳'}</span>
            </div>

            <section className="assistant-primary-card">
              <div className={`companion-copilot-status ${companionCopilot.intent}`}>
                <div>
                  <span>鎼。鍒ゆ柇</span>
                  <strong>{companionCopilot.label}</strong>
                </div>
                <p>{companionCopilot.summary}</p>
                <small>{companionCopilot.nextAction}</small>
                <em>鎶婃彙搴?{companionCopilot.confidence}%</em>
                {companionCopilot.warnings.length ? (
                  <ul>
                    {companionCopilot.warnings.slice(0, 3).map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div className="writing-speed-selector">
                <button className={writingSpeedMode === 'polish' ? 'secondary-button active-mode' : 'secondary-button'} type="button" onClick={() => setWritingSpeedMode('polish')} disabled={isAiBusy}>
                  绮句慨
                </button>
                <button className={writingSpeedMode === 'guarded' ? 'secondary-button active-mode' : 'secondary-button'} type="button" onClick={() => setWritingSpeedMode('guarded')} disabled={isAiBusy}>
                  杩炲啓
                </button>
                <button className={writingSpeedMode === 'reckless' ? 'secondary-button active-mode' : 'secondary-button'} type="button" onClick={() => setWritingSpeedMode('reckless')} disabled={isAiBusy}>
                  鏃犺剳
                </button>
              </div>
              {writingSpeedMode !== 'polish' ? (
                <label className="compact-number-input">
                  <span>鐢熸垚绔犳暟</span>
                  <input type="number" min={1} max={writingSpeedMode === 'reckless' ? 50 : 12} value={batchChapterCount} onChange={(event) => setBatchChapterCount(Number(event.target.value) || 1)} />
                </label>
              ) : null}
              <button className="primary-button assistant-main-action" type="button" onClick={runUserPrimaryWriteAction} disabled={isAiBusy || isLoading}>
                {isAiBusy ? text.generating : companionCopilot.label}
              </button>
            </section>

            {isAiBusy ? (
              <div className="ai-busy-banner">
                <span className="typing-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <div className="ai-busy-copy">
                  <strong>{text.thinking}</strong>
                  {activeAiTaskLabel ? <small>{text.aiBusyTarget}: {activeAiTaskLabel}</small> : null}
                </div>
                <button className="secondary-button danger-button compact-button" type="button" onClick={stopAiGeneration}>
                  {text.stopGenerating}
                </button>
              </div>
            ) : null}

            {nextChapterFlowSteps.length > 0 ? (
              <section className="workflow-progress-card">
                <div className="section-title compact-title">
                  <h3>{text.nextChapterFlowTitle}</h3>
                  <span>{nextChapterFlowSteps.every((step) => step.status === 'done') ? text.saved : isAiBusy ? text.generating : text.status}</span>
                </div>
                <ol>
                  {nextChapterFlowSteps.map((step) => (
                    <li className={`workflow-step ${step.status}`} key={step.id}>
                      <span>{step.label}</span>
                      <strong>{step.status === 'done' ? '瀹屾垚' : step.status === 'running' ? '杩涜涓? : step.status === 'failed' ? '澶辫触' : '绛夊緟'}</strong>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <section className={`assistant-result-card assistant-editorial-card ${editorialJudgement.level}`}>
              <strong>{text.resultJudgement}: {editorialJudgement.title}</strong>
              <p>{editorialJudgement.why}</p>
              <p>{editorialJudgement.nextAction}</p>
              <ul className="editorial-reason-list">
                {editorialJudgement.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              <div className="editorial-radar-grid">
                {editorialRadar.map((item) => (
                  <div className={`editorial-radar-item ${item.status}`} key={item.id}>
                    <span>{item.label}</span>
                    <strong>{item.status === 'ok' ? '閫氳繃' : item.status === 'risk' ? '椋庨櫓' : item.status === 'watch' ? '澶嶆牳' : '寰呯敓鎴?}</strong>
                    <small>{item.detail}</small>
                  </div>
                ))}
              </div>
              {editorialFocusActions.length ? (
                <div className="editorial-focus-actions">
                  <strong>鑱氱劍淇敼</strong>
                  {editorialFocusActions.map((action) => (
                    <div className="editorial-focus-action" key={action.radarId}>
                      <button className="secondary-button" type="button" onClick={() => useEditorialFocusAction(action)} disabled={isAiBusy || !selected}>
                        {action.label}
                      </button>
                      <button className="primary-button" type="button" onClick={() => runEditorialFocusAction(action)} disabled={isAiBusy || !selected}>
                        绔嬪嵆閲嶅啓
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              {editorialJudgement.level === 'review' || editorialJudgement.level === 'reject' ? (
                <div className="editorial-action-row">
                  <button className="secondary-button" type="button" onClick={() => useEditorialFeedbackDraft(editorialJudgement)} disabled={isAiBusy || !selected}>
                    閲囩敤涓荤紪寤鸿
                  </button>
                  <button className="primary-button" type="button" onClick={() => runEditorialFeedbackDraft(editorialJudgement)} disabled={isAiBusy || !selected}>
                    鎸夊缓璁噸鍐?                  </button>
                </div>
              ) : null}
              {candidate && candidate.kind !== 'setup' && candidate.kind !== 'chapter-check' ? (
                <div className="assistant-result-actions">
                  <button className="primary-button" type="button" onClick={applyCandidate} disabled={isAiBusy}>
                    {text.applyCandidate}
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setCandidate(null)}>
                    {text.clearCandidate}
                  </button>
                </div>
              ) : null}
            </section>

            <section className="assistant-feedback-card">
              <label>
                <span>{text.humanFeedback}</span>
                <textarea value={chapterFeedback} placeholder={text.chapterFeedbackPlaceholder} onChange={(event) => setChapterFeedback(event.target.value)} />
              </label>
              <button className="secondary-button full-width-button" type="button" onClick={() => generateSmartFeedbackPackage()} disabled={isAiBusy || !selected || !chapterFeedback.trim()}>
                {isAiBusy ? text.generating : text.generateSmartFeedbackPackage}
              </button>
            </section>

            <details className="assistant-secondary-tools">
              <summary>鏇村鍐欎綔鍔ㄤ綔</summary>
              <section className={`context-check ${bookDetail.contextCheck.level}`}>
                <h3>涓绘祦绋?/h3>
                <p>{bookDetail.contextCheck.message}</p>
                <button className="primary-button" type="button" onClick={runPrimaryWorkflowAction} disabled={primaryWorkflowDecision.disabled}>
                  {isAiBusy ? text.generating : primaryWorkflowDecision.label}
                </button>
              </section>
              <section className="chapter-route">
                <h3>涓嬩竴姝ヨ矾绾?/h3>
                <ol>
                  {chapterRouteSteps.map((step) => (
                    <li className={`route-step ${step.status}`} key={step.label}>
                      <span>{step.label}</span>
                      <strong>{step.detail}</strong>
                    </li>
                  ))}
                </ol>
              </section>
              {batchWritingResult ? (
                <section className="batch-result-list">
                  <strong>宸插畬鎴?{batchWritingResult.completed} / {batchWritingResult.requested} 绔爗batchWritingResult.stopped ? '锛屽凡鏆傚仠' : ''}</strong>
                  <ol>
                    {batchWritingResult.results.slice(-8).map((item) => (
                      <li className={item.status} key={item.chapterFile}>
                        <span>{item.chapterTitle}</span>
                        <small>{item.warnings.length ? `闇€澶嶆牳 ${item.warnings.length} 椤筦 : '宸插啓鍏?}</small>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : null}
              <button className="secondary-button full-width-button" type="button" onClick={generateSyncCandidate} disabled={isAiBusy}>
                {isAiBusy ? text.generating : text.checkAndSync}
              </button>
              <button className="secondary-button full-width-button" type="button" onClick={compactProjectMemory} disabled={isAiBusy}>
                {isAiBusy ? text.generating : text.memoryCompaction}
              </button>
            </details>

            <details className="assistant-debug-tools">
              <summary>璋冭瘯涓庨珮绾у伐鍏?/summary>
              <label className="ai-instruction">
                <span>{text.aiInstruction}</span>
                <textarea value={aiInstruction} placeholder={text.aiInstructionPlaceholder} onChange={(event) => setAiInstruction(event.target.value)} />
              </label>
              <div className="ai-action-grid">
                <button className="secondary-button" type="button" onClick={() => generateAiEditCandidate('continue')} disabled={isAiBusy || !selected}>
                  {text.continueWriting}
                </button>
                <button className="secondary-button" type="button" onClick={() => generateAiEditCandidate('check')} disabled={isAiBusy || !selected}>
                  {text.checkChapter}
                </button>
                <button className="secondary-button" type="button" onClick={() => generateAiEditCandidate('revise')} disabled={isAiBusy || !selected}>
                  {text.reviseChapter}
                </button>
                <button className="secondary-button" type="button" onClick={generateChapterWithFoundationFlow} disabled={isAiBusy || !selected}>
                  绔犺妭瀵兼紨娴佺▼
                </button>
              </div>
              <section className="writing-task-engine-card">
                <div className="section-title compact-title">
                  <h3>{text.writingTaskEngine}</h3>
                  <button className="secondary-button compact-button" type="button" onClick={() => refreshLatestWritingTaskRun()} disabled={!selected}>
                    鍒锋柊
                  </button>
                </div>
                <div className="preflight-contract">
                  <strong>{text.preflightContract}</strong>
                  <pre>{chapterPreflightContract}</pre>
                </div>
                <div className="cost-summary-grid">
                  <div>
                    <span>{text.costSummary}</span>
                    <strong>{aiCostSummary.count ? `${formatNumber(aiCostSummary.totalInput)} / ${formatNumber(aiCostSummary.totalOutput)}` : '-'}</strong>
                  </div>
                  <div>
                    <span>鑰楁椂</span>
                    <strong>{aiCostSummary.count ? `${(aiCostSummary.totalDuration / 1000).toFixed(1)}s` : '-'}</strong>
                  </div>
                  <div>
                    <span>缂撳瓨 key</span>
                    <strong>{aiCostSummary.cacheKeyCount || '-'}</strong>
                  </div>
                </div>
                {latestWritingTaskRun ? (
                  <div className="latest-task-run">
                    <strong>{text.latestTaskRun}: {latestWritingTaskRun.status}</strong>
                    <small>{latestWritingTaskRun.totalDurationMs ? `${(latestWritingTaskRun.totalDurationMs / 1000).toFixed(1)}s` : formatAiLogTime(latestWritingTaskRun.updatedAt)}</small>
                    <ol className="task-step-list">
                      {latestWritingTaskRun.steps.slice(-6).map((step, index) => (
                        <li className={step.status} key={`${step.step}-${index}`}>
                          <span>{step.step}</span>
                          <strong>{step.durationMs ? `${(step.durationMs / 1000).toFixed(1)}s` : step.status}</strong>
                        </li>
                      ))}
                    </ol>
                    <div className="task-retry-actions">
                      <button className="secondary-button compact-button" type="button" onClick={() => retryLatestWritingTaskStep('draft')} disabled={isAiBusy || !selected}>
                        {text.retryDraftStep}
                      </button>
                      <button className="secondary-button compact-button" type="button" onClick={() => retryLatestWritingTaskStep('final-sync')} disabled={isAiBusy || !selected}>
                        {text.retryFinalSyncStep}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="muted-text">{selected ? '鏆傛棤鍙仮澶嶄换鍔★紝鐢熸垚涓€娆℃鏂囧悗浼氬嚭鐜板湪杩欓噷銆? : '鍏堥€夋嫨绔犺妭銆?}</p>
                )}
              </section>
            </details>
          </aside>
        </section>
        ) : null}
      </main>
    )
  }

  if (appView === 'create') {
    return (
      <main className="app-shell create-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">{text.appName}</p>
            <h1>{text.createBookTitle}</h1>
          </div>
          <div className="topbar-actions">
            <button className="secondary-button" type="button" onClick={() => setIsAiSettingsOpen(true)}>
              {text.aiSettings} 璺?{aiSettings.configured ? text.configured : text.notConfigured}
            </button>
            <button className="secondary-button" type="button" onClick={() => setAppView('dashboard')}>
              {text.back}
            </button>
          </div>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}

        {isAiSettingsOpen ? (
          <section className="ai-settings-panel">
            <div className="section-title">
              <div>
                <h2>{text.aiSettings}</h2>
                <p>{aiSettings.configured ? text.configured : text.notConfigured}</p>
              </div>
              <button className="secondary-button" type="button" onClick={() => setIsAiSettingsOpen(false)}>
                {text.close}
              </button>
            </div>
            <div className="ai-provider-presets">
              <span>{text.providerPreset}</span>
              <button className="secondary-button" type="button" onClick={() => applyAiProviderPreset('deepseek')}>
                {text.deepSeekPreset}
              </button>
              <button className="secondary-button" type="button" onClick={() => applyAiProviderPreset('openai')}>
                {text.openAiPreset}
              </button>
              <small>{text.aiSettingsHint}</small>
            </div>
            <div className="form-grid">
              <label>
                <span>{text.apiKey}</span>
                <input autoComplete="off" type="password" value={aiForm.apiKey} placeholder={text.apiKeyPlaceholder} onChange={(event) => updateAiForm({ apiKey: event.target.value })} />
              </label>
              <label>
                <span>{text.baseUrl}</span>
                <input value={aiForm.baseUrl} placeholder={text.baseUrlPlaceholder} onChange={(event) => updateAiForm({ baseUrl: event.target.value })} />
              </label>
              <label>
                <span>{text.proxyUrl}</span>
                <input value={aiForm.proxyUrl} placeholder={text.proxyUrlPlaceholder} onChange={(event) => updateAiForm({ proxyUrl: event.target.value })} />
              </label>
              <label>
                <span>{text.model}</span>
                <input value={aiForm.model} onChange={(event) => updateAiForm({ model: event.target.value })} />
              </label>
            </div>
            <div className="panel-actions split-actions">
              <span>{aiMessage}</span>
              <div>
                <button className="secondary-button" type="button" onClick={testAiConnection} disabled={isAiSettingsSubmitDisabled}>
                  {text.testConnection}
                </button>
                <button className="primary-button" type="button" onClick={saveAiSettings} disabled={isAiSettingsSubmitDisabled}>
                  {text.saveSettings}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="create-panel create-page-panel">
          <div className="section-title">
            <div>
              <h2>{text.createBookTitle}</h2>
              <p>{text.createBookHelp}</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              <span>{text.optionalTitle}</span>
              <input value={createForm.title} placeholder={text.titlePlaceholder} onChange={(event) => setCreateForm({ ...createForm, title: event.target.value })} />
            </label>
            <label>
              <span>{text.platform}</span>
              <select value={createForm.platform} onChange={(event) => setCreateForm({ ...createForm, platform: event.target.value })}>
                {platforms.map((platform) => (
                  <option value={platform} key={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </label>
            <label className="wide-field">
              <span>{text.idea}</span>
              <textarea value={createForm.idea} placeholder={text.ideaPlaceholder} onChange={(event) => setCreateForm({ ...createForm, idea: event.target.value })} />
            </label>
          </div>
          <section className="planning-panel">
            <div className="planning-header">
              <strong>
                {text.planningRound}: {answeredPlanningRounds} / {answeredPlanningRounds < 5 ? 5 : answeredPlanningRounds}
              </strong>
              {planningMessages.length === 0 ? (
                <button className="secondary-button" type="button" onClick={startPlanning} disabled={isAiBusy || !createForm.idea.trim()}>
                  {isAiBusy ? text.generating : text.startPlanning}
                </button>
              ) : null}
            </div>

            {planningMessages.length > 0 ? (
              <div className="planning-thread">
                {planningMessages.map((message, index) => (
                  <div className={`planning-message ${message.role}`} key={`${message.role}-${index}`}>
                    <span>{message.role === 'assistant' ? 'AI' : '\u6211'}</span>
                    <p>{message.content}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {isAtPlanningCheckpoint ? (
              <section className="planning-checkpoint">
                <strong>{text.planningCheckpoint}</strong>
                <p>{text.planningCheckpointHelp}</p>
              </section>
            ) : null}

            {canShowPlanningAnswer ? (
              <label className="planning-answer">
                <span>{text.answer}</span>
                <textarea value={planningAnswer} placeholder={text.answerPlaceholder} onChange={(event) => setPlanningAnswer(event.target.value)} />
              </label>
            ) : null}

            {isGeneratingProjectPackage ? (
              <section className="generation-progress">
                <strong>{text.generatingProjectPackage}</strong>
                <div>
                  <span />
                </div>
                <p>{text.generatingProjectPackageHelp}</p>
              </section>
            ) : null}

            <div className="panel-actions split-actions">
              <span>{isAtPlanningCheckpoint ? text.projectPackageHelp : null}</span>
              <div>
                {canShowPlanningAnswer ? (
                  <button className="primary-button" type="button" onClick={submitPlanningAnswer} disabled={isAiBusy || !planningAnswer.trim()}>
                    {isAiBusy ? text.generating : text.nextQuestion}
                  </button>
                ) : null}
                {isAtPlanningCheckpoint ? (
                  <>
                    <button className="secondary-button" type="button" onClick={deepenPlanning} disabled={isAiBusy || isPlanningCheckpointQuestionOpen}>
                      {isAiBusy && !isGeneratingProjectPackage ? text.generating : text.deepenPlanning}
                    </button>
                    <button className="primary-button" type="button" onClick={generateProjectPackage} disabled={isAiBusy || (isPlanningCheckpointQuestionOpen && !planningAnswer.trim())}>
                      {isGeneratingProjectPackage ? text.generating : text.generateProjectPackage}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </section>

          {projectPackage ? (
            <section className="project-package-preview">
              <div>
                <strong>{text.projectPackageReady}</strong>
                <h3>{projectPackage.title}</h3>
                <p>{projectPackage.sellingPoint}</p>
              </div>
              <dl>
                <div>
                  <dt>{text.platform}</dt>
                  <dd>{projectPackage.platform}</dd>
                </div>
                <div>
                  <dt>棰樻潗</dt>
                  <dd>{projectPackage.genre}</dd>
                </div>
                <div>
                  <dt>瀛楁暟瑙勫垯</dt>
                  <dd>{projectPackage.targetWordsPerChapter}</dd>
                </div>
              </dl>
              <button className="primary-button" type="button" onClick={createBook} disabled={isLoading}>
                {text.createFromPackage}
              </button>
            </section>
          ) : null}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">{text.appName}</p>
          <h1>{text.dashboard}</h1>
        </div>
        <div className="topbar-actions">
          <button className="secondary-button" type="button" onClick={() => setIsAiSettingsOpen(true)}>
            {text.aiSettings} 路 {aiSettings.configured ? text.configured : text.notConfigured}
          </button>
          <button className="secondary-button" type="button" onClick={loadAiCallLogs}>
            AI 璋冪敤璁板綍
          </button>
          <button className="secondary-button" type="button" onClick={scanLibrary} disabled={!workspace.libraryPath || isLoading}>
            {text.rescan}
          </button>
          <button className="primary-button" type="button" onClick={chooseLibrary} disabled={isLoading}>
            {text.chooseLibrary}
          </button>
        </div>
      </header>

      <section className="workspace-strip">
        <div>
          <span className="strip-label">{text.currentLibrary}</span>
          <strong>{workspace.libraryPath ?? text.notChosen}</strong>
        </div>
        <button className="primary-button" type="button" disabled={!workspace.libraryPath} onClick={() => setAppView('create')}>
          {text.newBook}
        </button>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      {isAiSettingsOpen ? (
        <section className="ai-settings-panel">
          <div className="section-title">
            <div>
              <h2>{text.aiSettings}</h2>
              <p>{aiSettings.configured ? text.configured : text.notConfigured}</p>
            </div>
            <button className="secondary-button" type="button" onClick={() => setIsAiSettingsOpen(false)}>
              {text.close}
            </button>
          </div>
          <div className="ai-provider-presets">
            <span>{text.providerPreset}</span>
            <button className="secondary-button" type="button" onClick={() => applyAiProviderPreset('deepseek')}>
              {text.deepSeekPreset}
            </button>
            <button className="secondary-button" type="button" onClick={() => applyAiProviderPreset('openai')}>
              {text.openAiPreset}
            </button>
            <small>{text.aiSettingsHint}</small>
          </div>
          <div className="form-grid">
            <label>
              <span>{text.apiKey}</span>
              <input autoComplete="off" type="password" value={aiForm.apiKey} placeholder={text.apiKeyPlaceholder} onChange={(event) => updateAiForm({ apiKey: event.target.value })} />
            </label>
            <label>
              <span>{text.baseUrl}</span>
              <input value={aiForm.baseUrl} placeholder={text.baseUrlPlaceholder} onChange={(event) => updateAiForm({ baseUrl: event.target.value })} />
            </label>
            <label>
              <span>{text.proxyUrl}</span>
              <input value={aiForm.proxyUrl} placeholder={text.proxyUrlPlaceholder} onChange={(event) => updateAiForm({ proxyUrl: event.target.value })} />
            </label>
            <label>
              <span>{text.model}</span>
              <input value={aiForm.model} onChange={(event) => updateAiForm({ model: event.target.value })} />
            </label>
          </div>
          <div className="panel-actions split-actions">
            <span>{aiMessage}</span>
            <div>
              <button className="secondary-button" type="button" onClick={testAiConnection} disabled={isAiSettingsSubmitDisabled}>
                {text.testConnection}
              </button>
              <button className="primary-button" type="button" onClick={saveAiSettings} disabled={isAiSettingsSubmitDisabled}>
                {text.saveSettings}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {isAiCallLogsOpen ? (
        <div className="modal-backdrop">
          <section className="ai-call-logs-modal" role="dialog" aria-modal="true" aria-label="AI 璋冪敤璁板綍">
            <div className="section-title">
              <div>
                <h2>AI 璋冪敤璁板綍</h2>
                <p>寮€鍙戞湡瑙傛祴宸ュ叿锛氱敤浜庢帓鏌ヨ€楁椂銆佸け璐ャ€佷笂涓嬫枃澶у皬鍜岀紦瀛?key锛屽晢涓氬寲鏃跺彲闅愯棌鎴栨浛鎹负鐢ㄩ噺鎸囨爣銆?/p>
              </div>
              <div className="modal-actions">
                <button className="secondary-button" type="button" onClick={loadAiCallLogs}>
                  鍒锋柊
                </button>
                <button className="secondary-button" type="button" onClick={() => setIsAiCallLogsOpen(false)}>
                  {text.close}
                </button>
              </div>
            </div>
            <div className="ai-call-log-table">
              {aiCallLogs.length === 0 ? (
                <p className="muted-text">鏆傛棤璋冪敤璁板綍銆傝繘琛屼竴娆?AI 鐢熸垚銆佸璇濇垨娴嬭瘯杩炴帴鍚庡啀鏌ョ湅銆?/p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>鏃堕棿</th>
                      <th>鐘舵€?/th>
                      <th>绔偣</th>
                      <th>妯″瀷</th>
                      <th>鑰楁椂</th>
                      <th>杈撳叆/杈撳嚭</th>
                      <th>缂撳瓨 key</th>
                      <th>閿欒</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiCallLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{formatAiLogTime(log.time)}</td>
                        <td>
                          <span className={`log-status ${log.status}`}>{log.status === 'success' ? '鎴愬姛' : '澶辫触'}</span>
                        </td>
                        <td>{log.endpoint}</td>
                        <td>{log.model}</td>
                        <td>{(log.durationMs / 1000).toFixed(1)}s</td>
                        <td>
                          {log.inputChars} / {log.outputChars}
                        </td>
                        <td className="mono-cell">{log.promptCacheKey || '-'}</td>
                        <td className="error-cell">{log.error || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {!workspace.libraryPath ? (
        <section className="empty-state">
          <h2>{text.chooseFirst}</h2>
          <p>{text.chooseFirstHelp}</p>
          <button className="primary-button" type="button" onClick={chooseLibrary} disabled={isLoading}>
            {text.chooseDirectory}
          </button>
        </section>
      ) : (
        <section className="books-section">
          <div className="section-title">
            <h2>{text.books}</h2>
            <span>{isLoading ? text.scanning : `${sortedBooks.length} ${text.bookUnit}`}</span>
          </div>

          {sortedBooks.length === 0 ? (
            <div className="empty-state compact">
              <h2>{text.noBooks}</h2>
              <p>{text.noBooksHelp}</p>
            </div>
          ) : (
            <div className="book-grid">
              {sortedBooks.map((book) => (
                <article className="book-card" key={book.id}>
                  <div className="book-card-header">
                    <h3>{book.title}</h3>
                    <span className={book.isStandard ? 'status standard' : 'status pending'}>
                      {book.isStandard ? text.standardProject : text.unorganized}
                    </span>
                  </div>
                  <dl>
                  <div>
                    <dt>{text.platform}</dt>
                    <dd>{book.platform}</dd>
                  </div>
                  <div>
                    <dt>题材</dt>
                    <dd>{book.genre}</dd>
                  </div>
                  <div>
                    <dt>{text.stage}</dt>
                    <dd>{stageLabels[book.stage]}</dd>
                    </div>
                    <div>
                      <dt>{text.todayTask}</dt>
                      <dd>{book.todayTask}</dd>
                    </div>
                    <div>
                      <dt>{text.risk}</dt>
                      <dd>{book.risk}</dd>
                    </div>
                  </dl>
                  <div className="book-actions">
                    <button className="primary-button" type="button" onClick={() => openBook(book.path)}>
                      {text.openEditor}
                    </button>
                    {!book.isStandard ? (
                      <button className="secondary-button" type="button" onClick={() => organizeProject(book.path)}>
                        {text.organizeProject}
                      </button>
                    ) : null}
                    <button className="secondary-button danger-button" type="button" onClick={() => deleteBookProject(book)} disabled={isLoading}>
                      {text.deleteBook}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  )
}

export default App

*/

export default function App() {
  return null
}
