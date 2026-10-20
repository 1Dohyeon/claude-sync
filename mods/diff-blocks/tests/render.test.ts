import type { RenderElement } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const DIFF = '```diff\n--- a/x.ts\n+++ b/x.ts\n@@ -1 +1 @@\n-a\n+b\n```'

const props = (text: string) => ({ text, isFirstOfReply: true })

// mod가 그리지 않고 넘긴 답변은 엔진 대신 빈 Box로 답한다.
const seed: Parameters<typeof test>[1] = async (_$, on) => {
  on('ui.render', ($, e) => h($.ui.resolve(e).Box, { key: 'engine-default' }) as RenderElement)
}

test('diff 블럭은 Code(diff)로, 나머지는 Markdown으로 그린다', async ($, on) => {
  await seed($, on)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'diff-blocks',
      surface,
      component: 'AssistantMessage',
      props: props(`설명입니다.\n\n${DIFF}`),
    })
    const code = await ui.find({ type: 'Code' })
    expect(code?.props.format).toBe('diff')
    expect(code?.text).toBe('@@ -1 +1 @@\n-a\n+b')
    expect(await ui.find({ type: 'Markdown', text: '설명입니다.' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'x.ts' })).toBeDefined()
    await ui.unmount()
  }
})

test('diff 블럭이 없는 답변은 엔진에 넘긴다', async ($, on) => {
  await seed($, on)

  const ui = await $.ui.mount({
    plugin: 'diff-blocks',
    surface: 'terminal',
    component: 'AssistantMessage',
    props: props('diff 없는 답변입니다.'),
  })
  expect(await ui.find({ key: 'engine-default' })).toBeDefined()
  expect(await ui.find({ type: 'Code' })).toBeUndefined()
  await ui.unmount()
})
