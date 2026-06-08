/// <reference types="vite/client" />

type BookStage = 'idea' | 'setting' | 'outline' | 'drafting' | 'revision' | 'finished' | 'unknown'

interface BookSummary {
  id: string
  title: string
  path: string
  platform: string
  genre: string
  stage: BookStage
  todayTask: string
  risk: string
  isStandard: boolean
}

interface WorkspaceState {
  libraryPath: string | null
  books: BookSummary[]
}

interface ChapterSummary {
  id: string
  title: string
  file: string
  wordCount: number
  targetWords: number
  status: string
}

interface ContextCheckItem {
  key: string
  label: string
  status: 'ready' | 'missing' | 'optional'
  detail: string
}

interface ContextCheck {
  level: 'ready' | 'missing-chapter-outline' | 'missing-volume-outline' | 'incomplete-setup'
  message: string
  primaryAction: string
  items: ContextCheckItem[]
}

interface BookDetail {
  book: BookSummary
  chapters: ChapterSummary[]
  selectedChapter: ChapterSummary | null
  content: string
  contextCheck: ContextCheck
}

interface ChapterOutlineIndexItem {
  chapterId: string
  chapterTitle: string
  chapterFile: string
  outlineFile: string
  exists: boolean
  ready: boolean
  wordCount: number
  preview: string
  updatedAt: string
}

interface ChapterOutlineIndex {
  book: BookSummary
  total: number
  readyCount: number
  missingCount: number
  recommendedTotalChapters?: number
  items: ChapterOutlineIndexItem[]
}

interface BatchChapterOutlineResult {
  detail: BookDetail
  index: ChapterOutlineIndex
  generatedCount: number
  skippedCount: number
  results: Array<{
    chapterId: string
    chapterTitle: string
    chapterFile: string
    outlineFile: string
    status: 'generated' | 'skipped'
    content?: string
  }>
}

interface CreateBookInput {
  title: string
  platform: string
  idea: string
  projectPackage?: ProjectPackage
}

interface PlanningMessage {
  role: 'assistant' | 'user'
  content: string
}

interface ProjectChatMessage {
  role: 'assistant' | 'user'
  content: string
}

interface ProjectPackage {
  title: string
  platform: string
  genre: string
  stage: string
  targetWordsPerChapter: string
  updateStrategy: string
  sellingPoint: string
  synopsis: string
  coreSetting: string
  genreRules: string
  platformFit: string
  overallOutline: string
  goldenFirstThree: string
  mainCharacter: string
  supportingCharacters: string
  minorCharacters: string
  tracking: string
}

interface SaveChapterInput {
  bookPath: string
  chapterFile: string
  content: string
  snapshot?: boolean
  reason?: string
}

interface ApplyCandidateInput {
  bookPath: string
  targetFile: string
  content: string
  selectedChapterFile?: string
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

interface ApplyWritingCandidateInput {
  bookPath: string
  chapterFile: string
  content: string
  mode: 'append' | 'replace'
  statePatch?: string
  progressPatch?: string
  memoryPatch?: string
  structuredPatch?: string
  futurePlanPatch?: string
  stylePatch?: string
  memoryGovernancePatch?: string
  stateGateWarnings?: string[]
  qualityGateWarnings?: string[]
  editorialJudgement?: EditorialJudgement
  editorialRadar?: EditorialRadarItem[]
  editorialFocusActions?: EditorialFocusAction[]
}

interface WritingApplyReadbackItem {
  id: string
  label: string
  file: string
  ok: boolean
  message: string
}

interface WritingApplyReadbackCheck {
  checkedAt: string
  sourceLabel?: string
  chapterFile?: string
  ok: boolean
  summary: string
  items: WritingApplyReadbackItem[]
}

interface ProjectMaterialSummary {
  id: string
  label: string
  file: string
  exists: boolean
  ready: boolean
}

interface ProjectMaterialDetail {
  file: string
  content: string
  exists: boolean
  ready: boolean
}

interface ContextSyncInput {
  bookPath: string
  settingPatch: string
  mainCharacterPatch: string
  supportingCharacterPatch: string
  minorCharacterPatch: string
  trackingPatch: string
}

interface ChapterSnapshot {
  id: string
  file: string
  name: string
}

interface ExportResult {
  filePath: string
  folderPath: string
}

interface AiSettings {
  configured: boolean
  model: string
  baseUrl: string
  proxyUrl: string
  profiles?: AiConnectionProfile[]
  activeProfileId?: string
  settingsUiMode?: {
    visible: boolean
    commercialMode: boolean
  }
}

interface SaveAiSettingsInput {
  apiKey: string
  model: string
  baseUrl: string
  proxyUrl: string
  profileId?: string
  label?: string
}

interface AiConnectionProfile {
  id: string
  label: string
  model: string
  baseUrl: string
  proxyUrl: string
  configured: boolean
  lastTestOk: boolean
  lastTestedAt: string
  createdAt: string
  updatedAt: string
}

interface AiCallLog {
  id: string
  time: string
  endpoint: string
  status: 'success' | 'failed'
  model: string
  baseUrl: string
  durationMs: number
  inputChars: number
  outputChars: number
  maxOutputTokens: number | null
  reasoningEffort: string
  promptCacheKey: string
  error: string
}

interface AiTaskProgressEvent {
  requestId: string
  scope: string
  phase: string
  label: string
  detail: string
  preview: string
  status: 'running' | 'done' | 'failed' | string
}

interface WritingTaskRunSummary {
  id: string
  type: string
  status: 'running' | 'failed' | 'needs-review' | 'completed'
  recoverable: boolean
  partialContent: string
  chapterFile?: string
  updatedAt: string
  totalDurationMs?: number
  steps: Array<{
    step: string
    status: string
    detail: string
    at: string
    durationMs?: number
  }>
}

interface GeneratedCheckSyncCandidate {
  title: string
  content: string
  syncPayload: Omit<ContextSyncInput, 'bookPath'>
}

interface GeneratedOutlineCandidate {
  kind: 'volume-outline' | 'chapter-outline'
  title: string
  targetFile: string
  content: string
}

interface GeneratedMaterialCandidate {
  kind: 'volume-outline' | 'chapter-outline' | 'material'
  title: string
  targetFile: string
  content: string
}

interface ProjectUpdateItem {
  id: string
  file: string
  label: string
  reason: string
  patch: string
}

interface ProjectImpactMap {
  source: string
  generatedAt: string
  content: string
}

interface GeneratedProjectUpdatePackage {
  title: string
  content: string
  updates: ProjectUpdateItem[]
  impactMap?: ProjectImpactMap
}

interface ProjectUpdateApplyReport {
  ok: boolean
  summary: string
  appliedFiles: string[]
  reviewFile: string
  nextStep: string
}

interface GeneratedChapterFeedbackPackage {
  title: string
  content: string
  feedbackSummary?: string
  impactSummary?: string
  longTermMemory?: string
  statePatch?: string
  progressPatch?: string
  memoryPatch?: string
  structuredPatch?: string
  futurePlanPatch?: string
  stylePatch?: string
  memoryGovernancePatch?: string
  stateGateWarnings?: string[]
  qualityGateWarnings?: string[]
  directorDetail?: string
}

interface Companion90FlowSummary {
  level: 'pass' | 'review'
  chatReady: boolean
  autoChapterFlowReady: boolean
  qualityGateReady: boolean
  summary: string
  warnings: string[]
}

interface SmartFeedbackRoute {
  chapterAction: 'rewrite' | 'none'
  projectAction: 'repair' | 'none'
  targetMaterialIds: string[]
  reason: string
  userFacingSummary: string
  companionDecision?: CompanionDecision
}

interface CompanionDecision {
  understoodProblem: string
  plannedAction: string
  impactScope: string
  applyAdvice: 'apply' | 'review' | 'reject'
  userNextStep: string
}

interface GeneratedSmartFeedbackPackage {
  title: string
  smartFeedbackRoute: SmartFeedbackRoute
  chapterPackage?: GeneratedChapterFeedbackPackage | null
  projectRepairPackage?: GeneratedProjectUpdatePackage | null
  projectImpactMap?: ProjectImpactMap | null
}

interface BatchWritingResult {
  mode: 'guarded' | 'reckless'
  requested: number
  completed: number
  stopped: boolean
  detail: BookDetail
  results: Array<{
    chapterFile: string
    chapterTitle: string
    status: 'applied' | 'needs-review'
    warnings: string[]
    directorStatus?: 'ready' | 'auto-revised' | 'needs-review'
    readbackOk?: boolean
  }>
}

interface AiRequestInput {
  requestId?: string
}

interface AuthorizedSourceIndex {
  sourceUrl: string
  importedAt: string
  authorization: string
  sourceCount: number
  groupCounts: Record<string, number>
  sources: Array<{
    id: string
    name: string
    group: string
    sourceUrl: string
    type: number
    enabled: boolean
    enabledExplore: boolean
    hasSearch: boolean
    hasExplore: boolean
    bookUrlPattern: string
    comment: string
  }>
}

interface SamplePoolFingerprintResult {
  detail: BookDetail
  index: {
    generatedAt: string
    sourcePath: string
    rule: string
    boundary: string
    groups: Array<{
      platform: string
      genre: string
      file: string
      sampleCount: number
      totalWords: number
      sourceFiles: string[]
    }>
  }
}

interface ElectronApi {
  getWorkspaceState: () => Promise<WorkspaceState>
  chooseLibraryDirectory: () => Promise<WorkspaceState>
  scanLibrary: () => Promise<WorkspaceState>
  createBook: (input: CreateBookInput) => Promise<WorkspaceState>
  deleteBook: (bookPath: string) => Promise<WorkspaceState>
  generatePlanningQuestion: (input: CreateBookInput & { messages: PlanningMessage[] } & AiRequestInput) => Promise<{ question: string }>
  generateProjectPackage: (input: CreateBookInput & { messages: PlanningMessage[] } & AiRequestInput) => Promise<ProjectPackage>
  openBook: (bookPath: string) => Promise<BookDetail>
  openChapter: (bookPath: string, chapterFile: string) => Promise<BookDetail>
  createChapter: (input: { bookPath: string; title?: string; targetWords?: number }) => Promise<BookDetail>
  saveChapter: (input: SaveChapterInput) => Promise<BookDetail>
  listChapterSnapshots: (input: { bookPath: string; chapterFile: string }) => Promise<ChapterSnapshot[]>
  restoreChapterSnapshot: (input: { bookPath: string; chapterFile: string; snapshotId: string }) => Promise<BookDetail>
  applyCandidate: (input: ApplyCandidateInput) => Promise<BookDetail>
  listProjectMaterials: (input: { bookPath: string; chapterId?: string }) => Promise<ProjectMaterialSummary[]>
  readProjectMaterial: (input: { bookPath: string; file: string }) => Promise<ProjectMaterialDetail>
  saveProjectMaterial: (input: { bookPath: string; file: string; content: string; selectedChapterFile?: string; reason?: string }) => Promise<BookDetail>
  listProjectMaterialSnapshots: (input: { bookPath: string; file: string }) => Promise<ChapterSnapshot[]>
  restoreProjectMaterialSnapshot: (input: { bookPath: string; file: string; snapshotId: string; selectedChapterFile?: string }) => Promise<BookDetail>
  applyContextSync: (input: ContextSyncInput) => Promise<BookDetail>
  generateAiEditCandidate: (input: { bookPath: string; chapterFile: string; mode: 'continue' | 'check' | 'revise' | 'revise-continuation'; instruction?: string; taskCard?: string; selfCheck?: string; draftContent?: string; flowMode?: 'chapter-foundation' } & AiRequestInput) => Promise<{ title: string; content: string; taskCard?: string; selfCheck?: string; selfCheckFailed?: boolean; statePatch?: string; progressPatch?: string; memoryPatch?: string; structuredPatch?: string; futurePlanPatch?: string; stylePatch?: string; memoryGovernancePatch?: string; stateGateWarnings?: string[]; qualityGateWarnings?: string[]; qualityScore?: number; qualityGatePassed?: boolean; nextChapterReadiness?: string; directorStatus?: 'ready' | 'auto-revised' | 'needs-review'; directorDetail?: string }>
  startNextChapterFlow: (input: { bookPath: string; currentChapterFile?: string; currentContent?: string; instruction?: string; speedMode?: 'polish' | 'guarded' | 'reckless' } & AiRequestInput) => Promise<{ detail: BookDetail; outline: GeneratedOutlineCandidate; draft: { title: string; content: string; taskCard?: string; selfCheck?: string; selfCheckFailed?: boolean; statePatch?: string; progressPatch?: string; memoryPatch?: string; structuredPatch?: string; futurePlanPatch?: string; stylePatch?: string; memoryGovernancePatch?: string; stateGateWarnings?: string[]; qualityGateWarnings?: string[]; qualityScore?: number; qualityGatePassed?: boolean; nextChapterReadiness?: string; companion90Summary?: Companion90FlowSummary; directorStatus?: 'ready' | 'auto-revised' | 'needs-review'; directorDetail?: string } }>
  startBatchWritingFlow: (input: { bookPath: string; currentChapterFile?: string; currentContent?: string; instruction?: string; chapterCount: number; mode: 'guarded' | 'reckless' } & AiRequestInput) => Promise<BatchWritingResult>
  getLatestWritingTaskRun: (input: { bookPath: string; chapterFile?: string; since?: string }) => Promise<WritingTaskRunSummary | null>
  retryWritingTaskStep: (input: { bookPath: string; chapterFile?: string; step?: string; since?: string } & AiRequestInput) => Promise<{ title: string; content: string; taskCard?: string; selfCheck?: string; directorStatus?: 'ready' | 'auto-revised' | 'needs-review'; directorDetail?: string }>
  generateChapterFeedbackPackage: (input: { bookPath: string; chapterFile: string; feedback: string; currentContent: string } & AiRequestInput) => Promise<GeneratedChapterFeedbackPackage>
  generateSmartFeedbackPackage: (input: { bookPath: string; chapterFile: string; feedback: string; currentContent: string; gateWarnings?: string[] } & AiRequestInput) => Promise<GeneratedSmartFeedbackPackage>
  applyWritingCandidate: (input: ApplyWritingCandidateInput) => Promise<BookDetail & { applyReadbackCheck?: WritingApplyReadbackCheck }>
  organizeProject: (bookPath: string) => Promise<WorkspaceState>
  exportChapter: (input: { bookPath: string; chapterFile: string }) => Promise<ExportResult>
  exportBook: (bookPath: string) => Promise<ExportResult>
  openPath: (targetPath: string) => Promise<string>
  getAiSettings: () => Promise<AiSettings>
  getAiCallLogs: () => Promise<AiCallLog[]>
  listAiProfiles: () => Promise<AiConnectionProfile[]>
  useAiProfile: (profileId: string) => Promise<AiSettings>
  deleteAiProfile: (profileId: string) => Promise<AiSettings>
  saveAiSettings: (input: SaveAiSettingsInput) => Promise<AiSettings>
  testAiConnection: (input: SaveAiSettingsInput) => Promise<{ ok: boolean; model: string; baseUrl: string; proxyUrl: string }>
  cancelAiRequest: (requestId: string) => Promise<{ ok: boolean }>
  onAiTaskProgress: (callback: (event: AiTaskProgressEvent) => void) => () => void
  generateCheckSyncCandidate: (input: { bookPath: string; chapterFile: string } & AiRequestInput) => Promise<GeneratedCheckSyncCandidate>
  generateOutlineCandidate: (input: { bookPath: string; chapterFile?: string; mode: 'volume' | 'chapter' } & AiRequestInput) => Promise<GeneratedOutlineCandidate>
  listChapterOutlineIndex: (input: { bookPath: string }) => Promise<ChapterOutlineIndex>
  generateSingleChapterOutline: (input: { bookPath: string; chapterFile: string; overwrite?: boolean } & AiRequestInput) => Promise<{ detail: BookDetail; outline: ChapterOutlineIndexItem & { content: string }; index: ChapterOutlineIndex }>
  batchGenerateChapterOutlines: (input: { bookPath: string; targetTotalChapters: number; overwrite?: boolean } & AiRequestInput) => Promise<BatchChapterOutlineResult>
  generateMaterialCandidate: (input: { bookPath: string; chapterFile?: string; materialId: string; targetFile: string; currentContent?: string } & AiRequestInput) => Promise<GeneratedMaterialCandidate>
  projectChat: (input: { bookPath: string; chapterFile?: string; messages: ProjectChatMessage[] } & AiRequestInput) => Promise<{ content: string }>
  generateProjectUpdatePackage: (input: { bookPath: string; chapterFile?: string; messages: ProjectChatMessage[] } & AiRequestInput) => Promise<GeneratedProjectUpdatePackage>
  generateProjectRepairPackage: (input: { bookPath: string; chapterFile?: string; feedback: string; gateWarnings?: string[] } & AiRequestInput) => Promise<GeneratedProjectUpdatePackage>
  applyProjectUpdatePackage: (input: { bookPath: string; selectedChapterFile?: string; updates: ProjectUpdateItem[]; source?: 'project-update' | 'project-repair' | 'memory-compaction'; summary?: string; impactMap?: ProjectImpactMap | null }) => Promise<BookDetail & { projectUpdateApplyReport?: ProjectUpdateApplyReport }>
  compactProjectMemory: (input: { bookPath: string; chapterFile?: string } & AiRequestInput) => Promise<GeneratedProjectUpdatePackage>
  analyzeWritingSamples: (input: { bookPath: string; chapterFile?: string; sourcePath?: string }) => Promise<{ detail: BookDetail; targetFile: string; content: string; analysis: { sampleCount: number; totalWords: number; paragraphCount: number; sentenceCount: number; avgParagraph: number; avgSentence: number; dialogueRatio: number; hookDensity: number; genreDensity: number; summaryDensity: number; sampleNames: string[] } }>
  analyzeSamplePoolFingerprints: (input: { bookPath: string; chapterFile?: string; sourcePath?: string }) => Promise<SamplePoolFingerprintResult>
  importAuthorizedSources: (input: { bookPath: string; chapterFile?: string; sourceUrl?: string }) => Promise<{ detail: BookDetail; index: AuthorizedSourceIndex }>
  getAuthorizedSourceIndex: (input: { bookPath: string }) => Promise<AuthorizedSourceIndex | null>
}

interface Window {
  writingWorkbench?: ElectronApi
}
