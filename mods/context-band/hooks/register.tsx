import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { formatTokens, headerOf, labelOf, layoutBar, legendRows, toSnapshot } from './view'

const snapshot = atom({ plugin: 'context-band', key: 'snapshot' } as const, null)

// summary는 로컬 추정이라 API 호출이 없다. 실패하면 band는 직전 값을 그대로 보여준다.
const refresh = async ($: EngineInterface): Promise<void> => {
  try {
    const { context } = await $.session.usage({ breakdown: 'summary' })
    if (!context.breakdown) return
    const value = toSnapshot(context.breakdown)
    await update($, snapshot, () => value)
  } catch {
    // 세션이 아직 묶이지 않은 시점 등
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await refresh($)
    return result
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    await refresh($)
    return result
  })

  // 압축을 막는 일이 없도록, 실패하면 재생 안전한 next로 원래 결과를 돌려준다.
  on('session.compact', async ($, e, next) => {
    const result = await next(e)
    await refresh($)
    return result
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const snap = await read($, snapshot)
    if (e.props.hasSurvey || snap === null) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)

    // 터미널은 글자 한 개가 한 칸이라 █를 칸 수만큼 잇는다.
    // Desktop은 글꼴 폭이 칸과 달라 글자 막대가 넘쳐 접히므로, 배경색 Box를 토큰 비율로 나눈다.
    // flexGrow는 10000 이하만, 퍼센트 폭은 소수점 없이만 받아서 만분율 정수로 넣는다.
    const sum = snap.rows.reduce((acc, r) => acc + r.tokens, 0) || 1
    const bar =
      e.surface === 'terminal' ? (
        <Box key="bar">
          {layoutBar(snap.rows, Math.max(10, e.props.bodyColumns)).map((s, i) => (
            <Text key={`bar-${i}`} color={s.color}>
              {'█'.repeat(s.width)}
            </Text>
          ))}
        </Box>
      ) : (
        <Box key="bar" width="100%" height={1}>
          {snap.rows.map(r => (
            <Box
              key={`bar-${r.name}`}
              flexGrow={Math.round((r.tokens / sum) * 10000)}
              width={0}
              height={1}
              backgroundColor={r.color}
            />
          ))}
        </Box>
      )

    return (
      <Box flexDirection="column">
        <Text>
          <Text bold>컨텍스트</Text> <Text dimColor>{headerOf(snap)}</Text>
        </Text>
        {bar}
        <Box key="legend" flexWrap="wrap">
          {legendRows(snap.rows).map(r => (
            <Box key={`legend-${r.name}`} marginRight={2}>
              <Text color={r.color}>■ </Text>
              <Text dimColor>
                {labelOf(r.name)} {formatTokens(r.tokens)}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    )
  })
}
