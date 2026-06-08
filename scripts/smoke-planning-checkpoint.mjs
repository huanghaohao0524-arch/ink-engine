import fs from 'node:fs'

const appSource = fs.readFileSync('src/App.tsx', 'utf8')

const checks = [
  ['tracks explicit checkpoint deepening state', appSource.includes('const [isPlanningCheckpointQuestionOpen, setIsPlanningCheckpointQuestionOpen] = useState(false)')],
  ['tracks latest planning message', appSource.includes('const latestPlanningMessage = planningMessages[planningMessages.length - 1]')],
  ['detects assistant waiting for answer', appSource.includes("const isPlanningAwaitingAnswer = latestPlanningMessage?.role === 'assistant'")],
  ['checkpoint answer box requires explicit deepening', appSource.includes('&& (!isAtPlanningCheckpoint || isPlanningCheckpointQuestionOpen)')],
  ['answer box follows pending assistant question', appSource.includes('{canShowPlanningAnswer ? (')],
  ['project package includes pending answer', appSource.includes('const messagesForPackage = planningMessagesWithPendingAnswer()')],
  ['deepening includes pending answer', appSource.includes('const messagesForNextQuestion = planningMessagesWithPendingAnswer()')],
  ['deepening opens checkpoint question input', appSource.includes('setIsPlanningCheckpointQuestionOpen(true)')],
  ['checkpoint hides answer input after checkpoint is reached', appSource.includes('setIsPlanningCheckpointQuestionOpen(false)')],
  ['continue deepening cannot be clicked twice while a deep question is open', appSource.includes('isAiBusy || isPlanningCheckpointQuestionOpen')],
  ['project package waits for deep answer when a deep question is open', appSource.includes('isPlanningCheckpointQuestionOpen && !planningAnswer.trim()')],
]

const failures = checks.filter(([, passed]) => !passed)

if (failures.length > 0) {
  for (const [label] of failures) {
    console.error(`Planning checkpoint smoke failed: ${label}`)
  }
  process.exit(1)
}

console.log('Planning checkpoint smoke passed.')
