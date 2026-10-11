export type ContextRow = {
  name: string
  tokens: number
  color: string
  kind: 'used' | 'free' | 'buffer'
}

export type ContextSnapshot = {
  model: string
  totalTokens: number
  maxTokens: number
  percentage: number
  rows: ContextRow[]
}

declare module 'claude-code' {
  interface PluginState {
    'context-band': { snapshot: ContextSnapshot | null }
  }
}
