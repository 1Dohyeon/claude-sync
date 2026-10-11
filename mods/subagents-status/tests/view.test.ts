import { describe, expect, test } from 'claude-code/testing'

import {
  applyStep,
  cardLines,
  expandHome,
  finishCard,
  formatTokens,
  markAsk,
  newCard,
  prettyModel,
  settleCall,
  recordOf,
  recordPath,
} from '../hooks/view'

const SPAWNED = newCard({ id: 'ag1', index: 1, type: 'general-purpose', model: 'claude-sonnet-5-5', description: '미완료 설계 문서 읽기', at: 1_000 })

describe('subagents-status view', () => {
  test('새 카드는 실행 중이고 토큰과 단계가 0이다', async () => {
    expect([SPAWNED.status, SPAWNED.ctx, SPAWNED.out, SPAWNED.steps, SPAWNED.endedAt, SPAWNED.waiting, SPAWNED.denied]).toEqual(['running', 0, 0, 0, null, 0, 0])
  })

  test('ctx는 마지막 요청의 입력 전체이고 out은 쌓인다', async () => {
    let c = applyStep(SPAWNED, { input_tokens: 10, cache_read_input_tokens: 30_000, cache_creation_input_tokens: 2_000, output_tokens: 500 }, 'tool_use')
    c = applyStep(c, { input_tokens: 5, cache_read_input_tokens: 40_000, output_tokens: 700 }, 'max_tokens')
    expect([c.ctx, c.out, c.steps, c.lastStop]).toEqual([40_005, 1_200, 2, 'max_tokens'])
  })

  test('사용량이 없는 요청은 단계만 늘리고 ctx는 그대로 둔다', async () => {
    const c = applyStep({ ...SPAWNED, ctx: 9_000 }, null, null)
    expect([c.ctx, c.out, c.steps]).toEqual([9_000, 0, 1])
  })

  test('턴이 끝난 이유로 상태를 정한다', async () => {
    expect(finishCard(SPAWNED, 'answer', 5_000)).toMatchObject({ status: 'done', endedAt: 5_000 })
    expect(finishCard(SPAWNED, 'aborted', 5_000).status).toBe('stopped')
    expect(finishCard(SPAWNED, 'error', 5_000).status).toBe('failed')
  })

  test('모델 id를 사람이 부르는 이름으로 줄인다', async () => {
    expect(prettyModel('claude-sonnet-5-5')).toBe('Sonnet 5.5')
    expect(prettyModel('claude-opus-5-5[1m]')).toBe('Opus 5.5')
    expect(prettyModel('claude-haiku-5')).toBe('Haiku 5')
    expect(prettyModel('gpt-x')).toBe('gpt-x')
    expect(prettyModel('')).toBe('?')
  })

  test('토큰은 k·m 단위 정수로 줄인다', async () => {
    expect([formatTokens(733), formatTokens(3_435), formatTokens(50_579), formatTokens(1_250_000)]).toEqual(['733', '3k', '51k', '1.3m'])
  })

  test('끝난 카드는 네 줄로 그린다', async () => {
    const c = finishCard({ ...SPAWNED, ctx: 50_579, out: 3_435, steps: 3 }, 'answer', 24_000)
    expect(cardLines(c, 99_000)).toEqual(['1: 미완료 설계 문서 읽기', 'general-purpose · Sonnet 5.5', 'ctx 51k · out 3k · 3 st', '✓ done 0:23'])
  })

  test('실행 중인 카드는 지금까지의 시간을 쓰고, 첫 요청 전에는 starting으로 쓴다', async () => {
    const lines = cardLines(SPAWNED, 66_000)
    expect(lines[2]).toBe('starting…')
    expect(lines[3]).toBe('◐ running 1:05')
  })

  test('승인을 물은 호출은 끝날 때 대기에서 빠지고, 거부된 호출은 거부 수에 더한다', async () => {
    let c = markAsk(markAsk(SPAWNED))
    expect([c.waiting, c.denied]).toEqual([2, 0])
    c = settleCall(c, { wasAsked: true, isDenied: false })
    c = settleCall(c, { wasAsked: true, isDenied: true })
    c = settleCall(c, { wasAsked: false, isDenied: true })
    expect([c.waiting, c.denied]).toEqual([0, 2])
    expect(settleCall(SPAWNED, { wasAsked: true, isDenied: false }).waiting).toBe(0)
  })

  test('실행 중에 승인을 기다리면 상태 줄을 승인 대기로 바꾼다', async () => {
    expect(cardLines(markAsk(SPAWNED), 66_000)[3]).toBe('⏸ 승인 대기 1:05')
    expect(cardLines(finishCard(markAsk(SPAWNED), 'aborted', 5_000), 66_000)[3]).toBe('■ stopped 0:04')
  })

  test('거부가 있을 때만 셋째 줄 끝에 거부 수를 붙인다', async () => {
    const used = { ...SPAWNED, ctx: 12_000, out: 1_000, steps: 2 }
    expect(cardLines(used, 2_000)[2]).toBe('ctx 12k · out 1k · 2 st')
    expect(cardLines({ ...used, denied: 1 }, 2_000)[2]).toBe('ctx 12k · out 1k · 2 st · 거부 1')
    expect(cardLines({ ...SPAWNED, denied: 1 }, 2_000)[2]).toBe('starting… · 거부 1')
  })

  test('설명이 없으면 제목에 종류를 쓴다', async () => {
    expect(cardLines({ ...SPAWNED, description: '' }, 1_000)[0]).toBe('1: general-purpose')
  })

  test('맨 앞의 ~만 홈 아래로 펼친다', async () => {
    expect(expandHome('~/worklog/agents', 'C:\\Users\\me')).toBe('C:\\Users\\me/worklog/agents')
    expect(expandHome('~', '/home/me')).toBe('/home/me')
    expect(expandHome('/var/log', '/home/me')).toBe('/var/log')
    expect(expandHome('~other/x', '/home/me')).toBe('~other/x')
  })

  test('기록 파일은 연/월 폴더 아래 세션마다 하나다', async () => {
    const at = new Date(2026, 9, 11, 12, 0, 0).getTime()
    expect(recordPath('/w/agents', at, 's1')).toBe('/w/agents/2026/10/s1.jsonl')
  })

  test('끝난 카드는 소요 시간과 토큰을 담은 기록 한 줄이 된다', async () => {
    const c = finishCard({ ...SPAWNED, ctx: 50_579, out: 3_435, steps: 3, lastStop: 'end_turn' }, 'answer', 24_686)
    expect(recordOf(c, { sessionId: 's1', cwd: '/repo', remote: 'https://github.com/o/r.git' })).toEqual({
      endedAt: new Date(24_686).toISOString(),
      sessionId: 's1',
      cwd: '/repo',
      remote: 'https://github.com/o/r.git',
      agentId: 'ag1',
      type: 'general-purpose',
      description: '미완료 설계 문서 읽기',
      model: 'claude-sonnet-5-5',
      status: 'done',
      durationMs: 23_686,
      steps: 3,
      ctx: 50_579,
      out: 3_435,
      lastStop: 'end_turn',
    })
  })
})
