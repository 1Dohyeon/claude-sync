#!/bin/sh
# worklog/<repo>/overview.md와 현재 브랜치의 작업 문서를 세션 시작 시 컨텍스트로 주입한다.
# 보고서(tasks/<branch>.md)는 넣지 않는다. 진행에 필요한 것은 작업 목록과 검증이고,
# 배경 서술은 필요할 때 작업 문서에서 따라가 읽으면 된다.
# 보고서만 있고 작업 문서가 없으면 짝이 깨진 것이므로 만들라고 알린다.
# 원칙(save-docs.sh와 동일): 없거나 에러여도 세션을 절대 막지 않고 조용히 통과.

# 훅 계약상 stdin으로 JSON이 올 수 있으나 여기선 쓰지 않는다(있으면 소진만).
{ command -p cat 2>/dev/null || cat; } >/dev/null 2>&1 || :

repo=$(git remote get-url origin 2>/dev/null | sed 's#.*/##; s/\.git$//')
[ -n "$repo" ] || exit 0

root="$HOME/.claude/worklog/$repo"

# 주입할 파일을 위치 인자로 모은다. 하나도 없으면 아무것도 내보내지 않는다.
set --

[ -f "$root/overview.md" ] && [ -r "$root/overview.md" ] && set -- "$@" "$root/overview.md"

# detached HEAD면 브랜치명 자리에 HEAD가 나오므로 건너뛴다.
# 브랜치명의 `/`는 그대로 경로가 된다 (feat/foo → tasks/feat/foo.work.md).
missing=
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ -n "$branch" ] && [ "$branch" != HEAD ]; then
  work="$root/tasks/$branch.work.md"
  if [ -f "$work" ] && [ -r "$work" ]; then
    set -- "$@" "$work"
  elif [ -f "$root/tasks/$branch.md" ]; then
    missing="$work"
  fi
fi

[ "$#" -gt 0 ] || [ -n "$missing" ] || exit 0

# JSON 이스케이프는 node로 처리한다(sed/awk는 macOS BSD 계열과 이스케이프 문법이 갈려 신뢰 못함).
MISSING_WORK="$missing" node -e '
const fs = require("fs");
const parts = process.argv
  .slice(1)
  .map(f => fs.readFileSync(f, "utf8"));

const missing = process.env.MISSING_WORK;
if (missing) {
  parts.push(
    "[worklog] 보고서는 있는데 작업 문서가 없습니다: " + missing +
    "\n작업 문서는 보고서와 짝이므로 항상 함께 있어야 합니다." +
    "\n`~/.claude/templates/task-work.md`를 이 경로로 복사하고 `## 작업 목록`을 채우세요." +
    "\n규칙은 `~/.claude/rules/worklog.md`에 있습니다."
  );
}

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: parts.join("\n\n---\n\n")
  }
}));
' "$@" 2>/dev/null

exit 0
