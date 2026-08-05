#!/bin/sh
# settings.json에 등록된 벤더 훅(orca 등)의 단일 진입점.
# 훅 이벤트 10개 + statusLine이 모두 이 스크립트 하나를 호출하고, 기기·OS마다 다른
# 벤더 스크립트 경로 탐색은 여기서 흡수한다 → settings.json에 절대경로가 남지 않는다.
#
# 사용: sh vendor-bridge.sh <name>    (<name> = claude-hook | claude-statusline)
# 원칙: 벤더 스크립트가 없으면 stdin을 비우고 조용히 통과한다. 훅은 절대 세션을 막지 않는다.

name="${1:-claude-hook}"

for base in "$HOME/.orca/agent-hooks" "$USERPROFILE/.orca/agent-hooks"; do
    [ -d "$base" ] || continue

    # POSIX 셸 스크립트 (macOS/Linux, Windows git-bash)
    if [ -f "$base/$name.sh" ] && [ -r "$base/$name.sh" ]; then
        exec /bin/sh "$base/$name.sh"
    fi

    # Windows 배치 파일
    if [ -f "$base/$name.cmd" ] && [ -r "$base/$name.cmd" ]; then
        exec "$base/$name.cmd"
    fi
done

# 벤더 훅 없음 — stdin을 소진해 파이프가 막히지 않게 한 뒤 통과.
{ command -p cat 2>/dev/null || cat; } >/dev/null 2>&1 || :
exit 0
