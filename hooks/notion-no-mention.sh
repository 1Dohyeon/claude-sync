#!/bin/sh
# Notion MCP 툴 입력에 사람 멘션이 있으면 호출을 거부한다(PreToolUse). 멘션은 상대에게 알림이 가기 때문이다.
#   - 사용자 멘션(mention-user)과 그룹 멘션(mention-group)을 막는다. 그룹 멘션은 지금 Notion 마크다운 명세에 없지만 생기면 바로 걸리도록 미리 넣어 둔다.
#   - 페이지·날짜 멘션과 본문에 쓴 "@" 글자는 알림이 가지 않으므로 통과시킨다.
# 툴 입력은 훅 JSON 안의 문자열이라 파싱하지 않고 태그 이름만 찾는다. 멘션이 없으면 아무것도 출력하지 않고 통과한다.

input=$({ command -p cat 2>/dev/null || cat; } 2>/dev/null)

if printf '%s' "$input" | grep -q -e 'mention-user' -e 'mention-group'; then
    printf '%s' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Notion에는 사람 멘션(mention-user·mention-group)을 넣지 않습니다. 멘션을 빼고 이름이 필요하면 평문으로 써서 다시 호출하세요."}}'
fi

exit 0
