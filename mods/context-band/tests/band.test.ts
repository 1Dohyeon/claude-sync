import type { RenderElement } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import type { ContextSnapshot } from '../types'

const SNAP: ContextSnapshot = {
  model: 'claude-opus-5-5',
  totalTokens: 122_000,
  maxTokens: 1_000_000,
  percentage: 12,
  rows: [
    { name: 'System prompt', tokens: 4_300, color: 'promptBorder', kind: 'used' },
    { name: 'Messages', tokens: 117_700, color: 'permission', kind: 'used' },
    { name: 'Free space', tokens: 845_000, color: 'inactive', kind: 'free' },
    { name: 'Autocompact buffer', tokens: 33_000, color: 'warning', kind: 'buffer' },
  ],
}

const props = (hasSurvey: boolean) => ({
  hasSurvey,
  isWorking: false,
  maxRows: 10,
  bodyColumns: 80,
  scroll: { offset: 0, bodyRows: 10 },
  view: {},
})

// 테스트의 $에는 state가 없어서, mod 아래에서 state.get에 스냅숏을 답해 둔다.
// 이 테스트 키트(2.1.289)는 답의 value를 한 겹 벗겨 mod에 넘기므로 StateRead를 한 번 더 감싼다.
// mod가 그리지 않고 넘긴 band는 엔진 대신 빈 Box로 답한다.
const seed: Parameters<typeof test>[1] = async (_$, on) => {
  on('ui.render', ($, e) => h($.ui.resolve(e).Box, { key: 'engine-default' }) as RenderElement)
  on('state.get', ($, e, next) =>
    e.plugin === 'context-band' && e.key === 'snapshot'
      ? { value: { value: SNAP, version: 1 }, version: 1 }
      : next(e),
  )
}

test('터미널과 Desktop에서 헤더와 막대를 그리고 범례는 그리지 않는다', async ($, on) => {
  await seed($, on)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'context-band', surface, component: 'AbovePrompt', props: props(false) })
    expect(await ui.find({ type: 'Text', text: '122k / 1m (12%) · 남은 공간 845k' })).toBeDefined()
    expect(await ui.find({ key: 'bar' })).toBeDefined()
    expect(await ui.find({ key: 'legend' })).toBeUndefined()
    await ui.unmount()
  }
})

test('막대 조각마다 마우스를 올리면 헤더 줄에 뜨는 숨은 카드가 있다', async ($, on) => {
  await seed($, on)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'context-band', surface, component: 'AbovePrompt', props: props(false) })
    const cardOf = async (name: string) =>
      ((await ui.find({ type: 'Box', key: `bar-${name}` }))?.children as { props?: Record<string, unknown> }[]).find(
        c => c.props?.position === 'absolute',
      )

    expect(await cardOf('Messages')).toMatchObject({
      props: { top: -1, left: 0, display: 'none' },
      hover: { display: 'flex' },
    })
    expect(await cardOf('Free space')).toMatchObject({
      props: { top: -1, right: 0, display: 'none' },
      hover: { display: 'flex' },
    })
    expect(await ui.find({ type: 'Box', key: 'bar-Messages', text: '▕■ 대화 117.7k▏' })).toBeDefined()
    expect(await ui.find({ type: 'Box', key: 'bar-Free space', text: '▕■ 남은 공간 845k▏' })).toBeDefined()
    await ui.unmount()
  }
})

test('Desktop 막대는 글자가 아니라 분류별 배경색 Box로 그린다', async ($, on) => {
  await seed($, on)

  const ui = await $.ui.mount({ plugin: 'context-band', surface: 'desktop', component: 'AbovePrompt', props: props(false) })
  expect(await ui.find({ type: 'Text', text: '█' })).toBeUndefined()
  expect(await ui.find({ type: 'Box', key: 'bar-Free space' })).toBeDefined()
  expect(await ui.find({ type: 'Box', key: 'bar-Autocompact buffer' })).toBeDefined()
  await ui.unmount()
})

test('설문이 band를 쓰는 동안은 그리지 않는다', async ($, on) => {
  await seed($, on)

  const ui = await $.ui.mount({ plugin: 'context-band', surface: 'terminal', component: 'AbovePrompt', props: props(true) })
  expect(await ui.find({ type: 'Text', text: /컨텍스트/ })).toBeUndefined()
  await ui.unmount()
})
