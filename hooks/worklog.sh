#!/bin/sh
# 세션이 끝나면 그 세션의 transcript로 /worklog 스킬을 헤드리스로 돌려 작업 일기를 남긴다.
#   - SessionEnd 훅으로 자동 실행
# 원칙(반드시 지킴): 조건이 안 맞거나 에러여도 세션을 절대 막지 않음. claude -p는 백그라운드로 띄우고 바로 끝낸다.

# 이 훅이 띄운 claude -p도 끝날 때 SessionEnd를 일으키므로, 자식에서는 다시 띄우지 않는다.
if [ -n "$WORKLOG_HOOK" ]; then
    exit 0
fi

worklog_dir="$HOME/worklog"
min_prompts=3

input=$({ command -p cat 2>/dev/null || cat; } 2>/dev/null)

# JSON 문자열 안의 \\ 를 \ 로 되돌린다(Windows 경로).
transcript=$(printf '%s' "$input" | sed -n 's/.*"transcript_path":"\([^"]*\)".*/\1/p' | sed 's/\\\\/\\/g')
if [ -z "$transcript" ] || [ ! -f "$transcript" ]; then
    echo "worklog: transcript 없음 - 통과"
    exit 0
fi

# 대화 중에 /worklog를 이미 불렀으면 수동으로 쓴 것이므로 건너뛴다.
# 따옴표가 이스케이프되지 않은 형태라 대화에 이 문자열을 적은 경우와는 겹치지 않는다.
if grep -q -e '"content":"<command-message>worklog</command-message>' -e '"name":"Skill","input":{"skill":"worklog"' "$transcript"; then
    echo "worklog: 이번 세션에서 이미 작성 - 통과"
    exit 0
fi

# 사용자가 직접 입력한 메시지는 content가 문자열이다(도구 결과는 배열).
prompts=$(grep -c '"type":"user","message":{"role":"user","content":"' "$transcript")
if [ "$prompts" -lt "$min_prompts" ]; then
    echo "worklog: 사용자 메시지 ${prompts}개 - 짧은 세션이라 통과"
    exit 0
fi

if ! command -v claude >/dev/null 2>&1; then
    echo "worklog: claude 명령 없음 - 통과"
    exit 0
fi

mkdir -p "$worklog_dir"

WORKLOG_HOOK=1 nohup claude -p "/worklog $transcript" \
    --model sonnet \
    --no-session-persistence \
    --permission-prompts none \
    --add-dir "$HOME/.claude/projects" "$worklog_dir" \
    --allowedTools "Read Grep Glob Edit(~/worklog/**) Bash(date:*)" \
    >/dev/null 2>&1 &

echo "worklog: 백그라운드로 작성 시작"
exit 0
