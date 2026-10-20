import { describe, expect, test } from 'claude-code/testing'

import { split } from '../hooks/split'

const GIT_DIFF = [
  'diff --git a/src/a.ts b/src/a.ts',
  'index 1111111..2222222 100644',
  '--- a/src/a.ts',
  '+++ b/src/a.ts',
  '@@ -1,3 +1,3 @@',
  ' const a = 1',
  '-const b = 2',
  '+const b = 3',
  ' const c = 4',
].join('\n')

const fence = (body: string) => '```diff\n' + body + '\n```'

describe('diff-blocks split', () => {
  test('diff 블럭이 없으면 빈 배열을 돌려준다', async () => {
    expect(split('그냥 설명입니다.\n\n```ts\nconst a = 1\n```')).toEqual([])
  })

  test('@@ hunk가 없는 diff 블럭은 건드리지 않는다', async () => {
    expect(split(fence('-a\n+b'))).toEqual([])
  })

  test('앞뒤 텍스트는 markdown, git diff는 파일 경로와 hunk로 나눈다', async () => {
    const segments = split(`변경입니다.\n\n${fence(GIT_DIFF)}\n\n끝입니다.`)

    expect(segments).toEqual([
      { kind: 'markdown', text: '변경입니다.' },
      { kind: 'diff', path: 'src/a.ts', source: GIT_DIFF.slice(GIT_DIFF.indexOf('@@')) },
      { kind: 'markdown', text: '끝입니다.' },
    ])
  })

  test('한 블럭에 파일이 여러 개면 파일마다 나눈다', async () => {
    const second = GIT_DIFF.replaceAll('src/a.ts', 'src/b.ts')
    const segments = split(fence(`${GIT_DIFF}\n${second}`))

    expect(segments.map(s => (s.kind === 'diff' ? s.path : s.kind))).toEqual(['src/a.ts', 'src/b.ts'])
  })

  test('파일 헤더 없이 hunk만 있으면 경로 없이 그린다', async () => {
    const hunk = '@@ -1 +1 @@\n-a\n+b'
    expect(split(fence(hunk))).toEqual([{ kind: 'diff', path: undefined, source: hunk }])
  })
})
