export type Segment =
  | { kind: 'markdown'; text: string }
  | { kind: 'diff'; path: string | undefined; source: string }

const FENCE = /^```diff[ \t]*\n([\s\S]*?)\n```[ \t]*$/gm
const HUNK = /^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/m

const pathOf = (header: string): string | undefined => {
  const plus = header.match(/^\+\+\+ (?:b\/)?(.+)$/m)
  if (plus && plus[1] !== '/dev/null') return plus[1]
  const git = header.match(/^diff --git a\/.+ b\/(.+)$/m)
  return git?.[1]
}

const filesOf = (body: string): Segment[] => {
  const parts = body.split(/^(?=diff --git )/m).filter(part => part.trim() !== '')

  return parts.flatMap((part): Segment[] => {
    const hunk = part.search(HUNK)
    if (hunk < 0) return []
    return [{ kind: 'diff', path: pathOf(part.slice(0, hunk)), source: part.slice(hunk).replace(/\n+$/, '') }]
  })
}

export const split = (text: string): Segment[] => {
  const segments: Segment[] = []
  let rest = 0

  for (const match of text.matchAll(FENCE)) {
    const files = filesOf(match[1] ?? '')
    if (files.length === 0) continue

    const before = text.slice(rest, match.index).trim()
    if (before !== '') segments.push({ kind: 'markdown', text: before })
    segments.push(...files)
    rest = (match.index ?? 0) + match[0].length
  }

  if (segments.length === 0) return []

  const after = text.slice(rest).trim()
  if (after !== '') segments.push({ kind: 'markdown', text: after })
  return segments
}
