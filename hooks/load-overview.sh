#!/bin/sh
# worklog/<repo>/overview.md가 있으면 세션 시작 시 컨텍스트로 주입한다.
# 원칙(save-docs.sh와 동일): 없거나 에러여도 세션을 절대 막지 않고 조용히 통과.

# 훅 계약상 stdin으로 JSON이 올 수 있으나 여기선 쓰지 않는다(있으면 소진만).
{ command -p cat 2>/dev/null || cat; } >/dev/null 2>&1 || :

repo=$(git remote get-url origin 2>/dev/null | sed 's#.*/##; s/\.git$//')
[ -n "$repo" ] || exit 0

overview="$HOME/.claude/worklog/$repo/overview.md"
[ -f "$overview" ] && [ -r "$overview" ] || exit 0

# JSON 이스케이프는 node로 처리한다(sed/awk는 macOS BSD 계열과 이스케이프 문법이 갈려 신뢰 못함).
node -e '
const fs = require("fs");
const content = fs.readFileSync(process.argv[1], "utf8");
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: content
  }
}));
' "$overview" 2>/dev/null

exit 0
