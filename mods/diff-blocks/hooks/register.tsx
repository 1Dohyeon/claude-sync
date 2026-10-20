import type { Register } from 'claude-code'

import { split } from './split'

export const register: Register = on => {
  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    if (e.props.isSummary) return next(e)

    const segments = split(e.props.text)
    if (segments.length === 0) return next(e)

    const { Box, Text, Markdown, Code } = $.ui.resolve(e)

    return (
      <Box flexDirection="column" gap={1}>
        {segments.map((segment, i) =>
          segment.kind === 'markdown' ? (
            <Markdown key={`md-${i}`} text={segment.text} />
          ) : (
            <Box key={`diff-${i}`} flexDirection="column">
              {segment.path !== undefined && <Text dimColor>{segment.path}</Text>}
              <Code source={segment.source} path={segment.path} format="diff" />
            </Box>
          ),
        )}
      </Box>
    )
  })
}
