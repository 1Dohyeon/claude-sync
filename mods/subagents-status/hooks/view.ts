import type { AgentCard, AgentRecord, AgentStatus } from '../types'

type Usage = { input_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number; output_tokens?: number } | null

export const newCard = (x: { id: string; index: number; type: string; model: string; description: string; at: number }): AgentCard => ({
  id: x.id,
  index: x.index,
  type: x.type,
  model: x.model,
  description: x.description,
  status: 'running',
  spawnedAt: x.at,
  endedAt: null,
  ctx: 0,
  out: 0,
  steps: 0,
  lastStop: null,
  waiting: 0,
  denied: 0,
})

// 사용량을 못 받은 요청이 컨텍스트를 0으로 보이게 하지 않도록 ctx는 값이 있을 때만 바꾼다.
export const applyStep = (c: AgentCard, usage: Usage, stopReason: string | null): AgentCard => {
  const u = usage ?? {}
  const ctx = (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0)
  return { ...c, steps: c.steps + 1, ctx: ctx > 0 ? ctx : c.ctx, out: c.out + (u.output_tokens ?? 0), lastStop: stopReason }
}

// 이 기능 전에 저장된 카드에는 waiting·denied가 없을 수 있어 0으로 읽는다.
export const markAsk = (c: AgentCard): AgentCard => ({ ...c, waiting: (c.waiting ?? 0) + 1 })

export const settleCall = (c: AgentCard, x: { wasAsked: boolean; isDenied: boolean }): AgentCard => ({
  ...c,
  waiting: x.wasAsked ? Math.max(0, (c.waiting ?? 0) - 1) : (c.waiting ?? 0),
  denied: (c.denied ?? 0) + (x.isDenied ? 1 : 0),
})

export const finishCard =(c: AgentCard, reason: string, at: number): AgentCard => {
  const status: AgentStatus = reason === 'answer' ? 'done' : reason === 'aborted' ? 'stopped' : 'failed'
  return { ...c, status, endedAt: at }
}

export const prettyModel = (id: string): string => {
  if (!id) return '?'
  const m = /claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?!\d)/i.exec(id)
  if (!m?.[1]) return id
  const family = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase()
  return `${family} ${m[2]}${m[3] ? `.${m[3]}` : ''}`
}

export const formatTokens = (n: number): string =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}m` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)

const timer = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(s / 60)
  return m < 60 ? `${m}:${String(s % 60).padStart(2, '0')}` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`
}

const GLYPH: Record<AgentStatus, string> = { running: '◐', done: '✓', failed: '✗', stopped: '■' }

export const cardLines = (c: AgentCard, now: number): string[] => {
  const usage = c.steps > 0 ? `ctx ${formatTokens(c.ctx)} · out ${formatTokens(c.out)} · ${c.steps} st` : 'starting…'
  const isWaiting = c.status === 'running' && (c.waiting ?? 0) > 0
  return [
    `${c.index}: ${c.description || c.type}`,
    `${c.type} · ${prettyModel(c.model)}`,
    (c.denied ?? 0) > 0 ? `${usage} · 거부 ${c.denied}` : usage,
    `${isWaiting ? '⏸ 승인 대기' : `${GLYPH[c.status]} ${c.status}`} ${timer((c.endedAt ?? now) - c.spawnedAt)}`,
  ]
}

// fs는 ~를 상대 경로로 읽으므로 설정값의 ~는 여기서 홈 디렉터리로 바꾼다.
export const expandHome = (dir: string, home: string): string => (/^~(?=$|[\\/])/.test(dir) ? home + dir.slice(1) : dir)

// 세션마다 자기 파일에만 쓰므로 여러 세션이 동시에 돌아도 서로의 줄을 덮어쓰지 않는다.
export const recordPath = (dir: string, at: number, sessionId: string): string => {
  const d = new Date(at)
  return `${dir}/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${sessionId}.jsonl`
}

export const recordOf = (c: AgentCard, x: { sessionId: string; cwd: string; remote: string | null }): AgentRecord => ({
  endedAt: new Date(c.endedAt ?? 0).toISOString(),
  sessionId: x.sessionId,
  cwd: x.cwd,
  remote: x.remote,
  agentId: c.id,
  type: c.type,
  description: c.description,
  model: c.model,
  status: c.status,
  durationMs: (c.endedAt ?? 0) - c.spawnedAt,
  steps: c.steps,
  ctx: c.ctx,
  out: c.out,
  lastStop: c.lastStop,
})
