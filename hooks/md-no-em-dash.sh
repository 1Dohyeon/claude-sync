#!/bin/sh
# md 파일에 새로 쓰는 내용에 엠대시(U+2014)가 있으면 쓰기를 거부한다(PreToolUse). rules/response.md의 엠대시 금지를 문서에도 강제한다.
#   - Edit는 new_string, Write는 content만 본다. 파일에 원래 있던 엠대시는 보지 않으므로, 엠대시가 남은 옛 문서를 고칠 때 막히지 않는다.
#   - 인라인 코드 안의 엠대시는 규칙을 설명하려고 인용한 것으로 보고 통과시킨다.
#   - 훅 입력 JSON에는 엠대시가 원문 그대로 오거나 —로 이스케이프되어 올 수 있어 둘 다 찾는다.
# JSON을 파싱하지 않는다. old_string 값을 지운 나머지에서 찾는다. 문제가 없으면 아무것도 출력하지 않고 통과한다.

input=$({ command -p cat 2>/dev/null || cat; } 2>/dev/null)

# settings.json의 if 조건이 md 파일만 넘기지만, matcher만으로 불릴 때를 대비해 한 번 더 거른다.
path=$(printf '%s' "$input" | sed -n 's/.*"file_path":"\([^"]*\)".*/\1/p')
case "$path" in
    *.md) ;;
    *) exit 0 ;;
esac

written=$(printf '%s' "$input" | sed -E 's/"old_string":"([^"\\]|\\.)*"//' | sed 's/`[^`]*`//g')

if printf '%s' "$written" | grep -q -e '—' -e '\\u2014'; then
    printf '%s' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"md 문서에 엠대시(U+2014)를 쓰지 않습니다. 쉼표, 콜론(:), 괄호, 붙임표(-)로 바꿔 다시 쓰세요. 규칙을 설명하려고 인용할 때만 인라인 코드로 감쌉니다."}}'
fi

exit 0
