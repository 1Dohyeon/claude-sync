import type { SessionContextBreakdown } from 'claude-code'

import type { ContextRow, ContextSnapshot } from '../types'

// /context가 쓰는 영문 행 이름 → band 라벨. 모르는 이름은 원문 그대로 둔다.
const LABELS: Record<string, string> = {
  'System prompt': '시스템 프롬프트',
  'System tools': '시스템 도구',
  'MCP tools': 'MCP 도구',
  'MCP server instructions': 'MCP 서버 지침',
  'Custom agents': '커스텀 에이전트',
  'Memory files': '메모리 파일',
  Skills: '스킬',
  Messages: '대화',
  'Free space': '남은 공간',
  'Autocompact buffer': '자동 압축 예비 공간',
}

export const labelOf = (name: string): string => LABELS[name] ?? name

// deferred 행은 필요할 때만 불러오는 도구 스키마라 창을 차지하지 않으므로 뺀다.
export const toSnapshot = (b: SessionContextBreakdown): ContextSnapshot => ({
  model: b.model,
  totalTokens: b.totalTokens,
  maxTokens: b.rawMaxTokens,
  percentage: b.percentage,
  rows: b.categories.flatMap(c =>
    c.kind === 'deferred' ? [] : [{ name: c.name, tokens: c.tokens, color: c.color, kind: c.kind }],
  ),
})

const trim = (n: number): string => n.toFixed(1).replace(/\.0$/, '')

export const formatTokens = (n: number): string => {
  if (n < 1000) return String(Math.round(n))
  if (n < 1_000_000) return `${trim(n / 1000)}k`
  return `${trim(n / 1_000_000)}m`
}

export type Segment = { color: string; width: number }

// 누적 경계를 반올림해 나누므로 칸 수의 합이 항상 width와 같다. 0칸인 분류는 막대에서 빠진다.
export const layoutBar = (rows: ContextRow[], width: number): Segment[] => {
  const sum = rows.reduce((acc, r) => acc + r.tokens, 0)
  if (sum <= 0) return []

  let cum = 0
  const segments = rows.map(r => {
    const start = Math.round((cum / sum) * width)
    cum += r.tokens
    const end = Math.round((cum / sum) * width)
    return { color: r.color, width: end - start }
  })
  return segments.filter(s => s.width > 0)
}

export const headerOf = (s: ContextSnapshot): string => {
  const free = s.rows.find(r => r.kind === 'free')
  const parts = [`${formatTokens(s.totalTokens)} / ${formatTokens(s.maxTokens)} (${s.percentage}%)`]
  if (free) parts.push(`남은 공간 ${formatTokens(free.tokens)}`)
  parts.push(s.model)
  return parts.join(' · ')
}
