#!/bin/sh
# git commit 메시지에 AI 작성 표기가 있으면 커밋을 거부한다(PreToolUse). CLAUDE.local.md의 커밋 규칙을 모든 기기에서 강제한다.
#   - Co-Authored-By 트레일러(대상과 관계없이), "Generated with", noreply@anthropic.com, 로봇 이모지, "written by Claude", "Claude가 작성" 같은 표기를 막는다.
#   - CLAUDE.md, CLAUDE_CODE_*, claude -p처럼 이름으로 쓴 Claude는 통과시킨다. 단어 하나만으로 판정하지 않는다.
#   - 메시지는 -m이든 heredoc이든 명령 문자열 안에 있으므로 명령 전체에서 찾는다. -F <파일>이면 그 파일도 본다.
# 문제가 없으면 아무것도 출력하지 않고 통과한다.

input=$({ command -p cat 2>/dev/null || cat; } 2>/dev/null)

pattern='co-authored-by:|generated with|noreply@anthropic\.com|🤖|\\ud83e\\udd16|written by (claude|ai)|claude(가|로) ?작성'

found=0
if printf '%s' "$input" | grep -q -i -E "$pattern"; then
    found=1
fi

file=$(printf '%s' "$input" | sed -n 's/.* -F  *\([^ "]*\).*/\1/p')
if [ "$found" = 0 ] && [ -n "$file" ] && [ "$file" != "-" ] && [ -f "$file" ]; then
    if grep -q -i -E "$pattern" "$file"; then
        found=1
    fi
fi

if [ "$found" = 1 ]; then
    printf '%s' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"커밋 메시지에 co-author나 AI 작성 표기(Co-Authored-By, Generated with, noreply@anthropic.com, 로봇 이모지, Claude가 작성 등)를 넣지 않습니다. 그 줄을 빼고 다시 커밋하세요."}}'
fi

exit 0
