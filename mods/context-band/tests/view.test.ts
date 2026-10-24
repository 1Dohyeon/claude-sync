import { describe, expect, test } from 'claude-code/testing'

import { cardSide, formatTokens, headerOf, labelOf, layoutBar } from '../hooks/view'
import type { ContextSnapshot } from '../types'

// /context 출력(122k / 1m)을 본뜬 값
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

describe('context-band view', () => {
  test('토큰 수를 k·m 단위로 줄인다', async () => {
    expect(formatTokens(733)).toBe('733')
    expect(formatTokens(4_300)).toBe('4.3k')
    expect(formatTokens(845_000)).toBe('845k')
    expect(formatTokens(1_000_000)).toBe('1m')
  })

  test('헤더에 사용량, 남은 공간, 모델이 들어간다', async () => {
    expect(headerOf(SNAP)).toBe('122k / 1m (12%) · 남은 공간 845k · claude-opus-5-5')
  })

  test('알려진 분류는 한국어로, 모르는 분류는 원문으로', async () => {
    expect(labelOf('Messages')).toBe('대화')
    expect(labelOf('Something new')).toBe('Something new')
  })

  test('가운데가 막대 절반을 넘는 분류만 카드를 오른쪽에 붙인다', async () => {
    expect(SNAP.rows.map(r => cardSide(SNAP.rows, r.name))).toEqual(['left', 'left', 'right', 'right'])
  })

  test('막대 칸 수의 합은 폭과 같다', async () => {
    for (const width of [10, 37, 80, 143]) {
      const total = layoutBar(SNAP.rows, width).reduce((acc, s) => acc + s.width, 0)
      expect(total).toBe(width)
    }
  })

  test('막대 조각은 분류 이름을 함께 가진다', async () => {
    expect(layoutBar(SNAP.rows, 1000).map(s => s.name)).toEqual(SNAP.rows.map(r => r.name))
  })
})
