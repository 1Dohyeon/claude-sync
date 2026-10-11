import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { AgentCard } from '../types'
import { applyStep, cardLines, expandHome, finishCard, markAsk, newCard, recordOf, recordPath, settleCall, shouldAutoOpen, summaryLine } from './view'

const PANE = 'subagents-status'
const cards = atom({ plugin: 'subagents-status', key: 'cards' } as const, [])

const getCards = async ($: EngineInterface): Promise<AgentCard[]> => (await read($, cards)) ?? []

const openPane = ($: EngineInterface) => $.ui.open({ id: PANE, title: 'Subagents', columns: 48 })
const isPanePlaced = async ($: EngineInterface) => (await $.ui.panes()).some(p => p.id === PANE && p.isPlaced)

// 실행 중인 카드가 있는 동안만 1초마다 다시 그려 경과 시간이 흐르게 한다.
let ticker: Timer | null = null
const syncTicker = async ($: EngineInterface) => {
  const isRunning = (await getCards($)).some(c => c.status === 'running')
  if (isRunning && !ticker) ticker = $.clock.every(1000, () => $.ui.invalidate('ui.render'))
  if (!isRunning && ticker) {
    ticker.cancel()
    ticker = null
  }
}

// 기록 실패가 패널을 멈추게 하지 않도록 오류는 삼킨다.
const recordCard = async ($: EngineInterface, recordDir: string, card: AgentCard) => {
  if (!recordDir) return
  try {
    const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME')) ?? ''
    const [sessionId, cwd, repo] = await Promise.all([$.session.id(), $.session.cwd(), $.session.repo()])
    const path = recordPath(expandHome(recordDir, home), card.endedAt ?? 0, sessionId)
    const before = (await $.fs.exists(path)) ? String(await $.fs.read(path)) : ''
    await $.fs.write(path, `${before}${JSON.stringify(recordOf(card, { sessionId, cwd, remote: repo?.remote ?? null }))}\n`)
  } catch {
    // 권한, 디스크 등
  }
}

const updateCard = async ($: EngineInterface, id: string, fn: (c: AgentCard) => AgentCard) => {
  await update($, cards, list => (list ?? []).map(c => (c.id === id ? fn(c) : c)))
  $.ui.invalidate('ui.render')
}

export const register: Register = (on, options) => {
  const recordDir = typeof options.recordDir === 'string' ? options.recordDir : ''
  // tool.check의 agentId는 v2.1.290부터라, 그보다 먼저 도는 tool.call에서 호출 id로 서브에이전트를 기억해 둔다.
  const callAgent = new Map<string, string>()
  const asked = new Set<string>()
  // 사용자가 닫은 패널은 새 서브에이전트가 시작될 때까지 다시 자동으로 열지 않는다.
  let isDismissed = false
  // 엔진의 패널에는 접기가 없어, 맨 윗줄의 [-]/[+] 버튼으로 카드를 접고 편다.
  let isCollapsed = false

  // 사용자의 프롬프트에서 연 패널은 사용자가 연 것으로 쳐서 폭과 상관없이 배치된다(110칸부터 옆, 그 아래는 프롬프트 위).
  on('prompt.submit', async ($, e, next) => {
    try {
      if (shouldAutoOpen({ isPlaced: await isPanePlaced($), isDismissed })) await openPane($)
    } catch {
      // 패널을 못 열어도 프롬프트는 그대로 보낸다
    }
    return next(e)
  })

  on('ui.close', async ($, e, next) => {
    if (e.id === PANE && e.origin.kind === 'person') isDismissed = true
    return next(e)
  })

  // 승인 대기와 거부는 호출이 끝나야 정해지므로, 서브에이전트 호출을 감싸 결과를 카드에 반영한다.
  on('tool.call', async ($, e, next) => {
    const id = e.agentId
    if (!id) return next(e)
    callAgent.set(e.tool_use_id, id)
    let isDenied = false
    try {
      const ran = await next(e)
      isDenied = ran.deny !== undefined
      return ran
    } finally {
      const wasAsked = asked.delete(e.tool_use_id)
      callAgent.delete(e.tool_use_id)
      if (wasAsked || isDenied) await updateCard($, id, c => settleCall(c, { wasAsked, isDenied })).catch(() => undefined)
    }
  })

  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    const id = e.agentId ?? (e.tool_use_id ? callAgent.get(e.tool_use_id) : undefined)
    if (id && e.tool_use_id && verdict.decision === 'ask') {
      asked.add(e.tool_use_id)
      await updateCard($, id, markAsk).catch(() => undefined)
    }
    return verdict
  })

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: PANE, description: '서브에이전트 카드 패널을 열거나 닫는다' })
    return next(e)
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await update($, cards, () => [])
      await syncTicker($)
    }
    return next(e)
  })

  on('command.run', { command: PANE }, async $ => {
    if (await isPanePlaced($)) {
      await $.ui.close({ id: PANE })
      isDismissed = true
      return { text: '서브에이전트 패널을 닫았습니다.' }
    }
    isDismissed = false
    const opened = await openPane($)
    return { text: opened.isPlaced ? '서브에이전트 패널을 열었습니다.' : `패널을 아직 그리지 못했습니다: ${opened.reason}` }
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if (started.deny !== undefined || !started.agentId) return started
    const id = started.agentId
    // 서브에이전트는 이미 시작됐으므로, 카드 쪽 실패가 시작 결과를 바꾸지 않게 한다.
    try {
      const at = await $.clock.now()
      await update($, cards, list => {
        const prev = list ?? []
        return [...prev, newCard({ id, index: prev.length + 1, type: e.name ?? e.subagentType, model: started.model, description: e.description, at })]
      })
      // 이미 열려 있으면 그대로이고, 좁은 터미널에서는 배치를 기다리다 다음 프롬프트에서 다시 연다.
      isDismissed = false
      await openPane($).catch(() => undefined)
      await syncTicker($)
      $.ui.invalidate('ui.render')
    } catch {
      // 카드 없이 진행
    }
    return started
  })

  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    const id = e.agentId
    if (id && (await getCards($)).some(c => c.id === id)) {
      await update($, cards, list => (list ?? []).map(c => (c.id === id ? applyStep({ ...c, model: c.model || e.model }, result.usage, result.stopReason) : c)))
    }
    return result
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    const id = e.agentId
    const card = id ? (await getCards($)).find(c => c.id === id) : undefined
    if (card) {
      const finished = finishCard(card, e.reason, await $.clock.now())
      await update($, cards, list => (list ?? []).map(c => (c.id === id ? finished : c)))
      await recordCard($, recordDir, finished)
      await syncTicker($)
      $.ui.invalidate('ui.render')
    }
    return done
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const [list, now] = await Promise.all([getCards($), $.clock.now()])
    const width = Math.max(24, e.props.bodyColumns)
    const toggle = () => {
      isCollapsed = !isCollapsed
      $.ui.invalidate('ui.render')
    }
    return (
      <Box flexDirection="column" width={width}>
        <Box key="summary">
          <Button key="toggle" label={isCollapsed ? '[+]' : '[-]'} plain onPress={toggle} />
          <Text dimColor> {summaryLine(list)}</Text>
        </Box>
        {!isCollapsed && list.map(c => {
          const [title, kind, usage, state] = cardLines(c, now)
          const color =
            c.status === 'failed'
              ? 'error'
              : c.status === 'done'
                ? 'success'
                : c.status === 'stopped'
                  ? 'inactive'
                  : (c.waiting ?? 0) > 0
                    ? 'warning'
                    : 'suggestion'
          return (
            <Box
              key={`card-${c.id}`}
              flexDirection="column"
              borderStyle="round"
              borderColor={c.lastStop === 'max_tokens' ? 'error' : 'suggestion'}
              borderDimColor={c.status !== 'running'}
              paddingX={1}
              width={width}
            >
              <Text bold wrap="truncate">
                {title}
              </Text>
              <Text dimColor wrap="truncate">
                {kind}
              </Text>
              <Text dimColor wrap="truncate">
                {usage}
              </Text>
              <Text color={color}>{state}</Text>
            </Box>
          )
        })}
      </Box>
    )
  })
}
