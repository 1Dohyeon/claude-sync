import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

// 기록은 실제 파일 시스템에서 확인하므로, 여기서는 꺼서 worklog에 쓰지 않게 한다.
const OFF = { options: { recordDir: '' } }

const pane = {
  plugin: 'subagents-status',
  component: 'Pane' as const,
  requestId: 'subagents-status',
  props: { title: 'Subagents', isFocused: false, bodyColumns: 60, placement: 'dock' as const, scroll: { offset: 0, bodyRows: 40 }, view: {} },
}

let n = 0
const spawn = (subagentType: string, description: string) => ({
  prompt: description,
  description,
  subagentType,
  tool_use_id: `tu${++n}`,
  provider: { plugin: 'engine', tier: 'core' as const },
  parentModel: 'claude-opus-5-5',
  background: true,
  fork: false,
})

// 엔진 대신 답해 둔다: 서브에이전트 시작, 턴 종료, 패널 열기
const engine = (on: On, model = 'claude-sonnet-5-5') => {
  mock.clock(on)
  let id = 0
  on('agent.spawn', () => ({ model, agentId: `ag${++id}` }))
  on('turn.complete', () => ({ text: '' }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
}

test('서브에이전트가 없으면 빈 안내만 그린다', OFF, async ($, on) => {
  engine(on)
  const ui = await $.ui.mount({ ...pane, surface: 'terminal' })
  expect(await ui.find({ text: '서브에이전트 없음' })).toBeDefined()
  await ui.unmount()
})

test('시작한 순서대로 카드를 쌓고, 끝난 카드는 done으로 바꾼다', OFF, async ($, on) => {
  engine(on)
  await $.agent.spawn(spawn('logic-reviewer', 'logic 축 리뷰'))
  await $.agent.spawn(spawn('architecture-reviewer', '아키텍처 축 리뷰'))
  await $.turn.complete({ answer: 'ok', durationMs: 10, isAborted: false, turnId: 'T1', agentId: 'ag1', reason: 'answer' })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...pane, surface })
    expect(await ui.find({ text: '1: logic 축 리뷰' })).toBeDefined()
    expect(await ui.find({ text: '2: 아키텍처 축 리뷰' })).toBeDefined()
    expect(await ui.find({ text: 'architecture-reviewer · Sonnet 5.5' })).toBeDefined()
    expect(await ui.find({ text: /^✓ done / })).toBeDefined()
    expect(await ui.find({ text: /^◐ running / })).toBeDefined()
    await ui.unmount()
  }
})

test('[-]를 누르면 카드를 접어 요약 한 줄만 남기고, [+]를 누르면 다시 편다', OFF, async ($, on) => {
  engine(on)
  await $.agent.spawn(spawn('Explore', 'look around'))
  const ui = await $.ui.mount({ ...pane, surface: 'terminal' })
  expect(await ui.find({ text: '1: look around' })).toBeDefined()

  await ui.press({ key: 'toggle' })
  expect(await ui.find({ text: '1: look around' })).toBeUndefined()
  expect(await ui.find({ text: '◐ 1' })).toBeDefined()

  await ui.press({ key: 'toggle' })
  expect(await ui.find({ text: '1: look around' })).toBeDefined()
  await ui.unmount()
})

test('/clear 하면 카드를 비운다', OFF, async ($, on) => {
  engine(on)
  on('session.end', (_$, e) => ({ sessionId: e.sessionId }))
  await $.agent.spawn(spawn('Explore', 'look around'))
  await $.session.end({ reason: 'clear', sessionId: 's' } as never)
  const ui = await $.ui.mount({ ...pane, surface: 'terminal' })
  expect(await ui.find({ text: /look around/ })).toBeUndefined()
  await ui.unmount()
})
