export type AgentStatus = 'running' | 'done' | 'failed' | 'stopped'

export type AgentCard = {
  id: string
  /** 이 세션에서 몇 번째로 시작한 서브에이전트인지, 1부터 */
  index: number
  type: string
  model: string
  description: string
  status: AgentStatus
  spawnedAt: number
  endedAt: number | null
  /** 마지막 요청의 입력 전체(입력 + 캐시 읽기 + 캐시 쓰기) */
  ctx: number
  /** 요청마다 출력 토큰을 더한 값 */
  out: number
  steps: number
  lastStop: string | null
}

/** 끝난 서브에이전트 하나, 세션 기록 파일의 한 줄 */
export type AgentRecord = {
  endedAt: string
  sessionId: string
  cwd: string
  remote: string | null
  agentId: string
  type: string
  description: string
  model: string
  status: AgentStatus
  durationMs: number
  steps: number
  ctx: number
  out: number
  lastStop: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'subagents-status': { cards: AgentCard[] }
  }
}
