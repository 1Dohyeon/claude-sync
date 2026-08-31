#!/bin/sh
# Notion MCP를 읽기 전용으로 제한한다(PreToolUse). 읽기 계열만 통과시키고 나머지는 거부한다.
#
# 커넥터 접두사는 기기·연결 방식에 따라 달라지므로(mcp__notion__ / mcp__claude_ai_Notion__ 등)
# 접두사가 아니라 마지막 `__` 뒤의 동작 이름으로 판정한다. 접두사로 판정하던 이전 방식은
# 커넥터 이름이 바뀌면서 아무것도 걸리지 않는 상태가 됐다.
#
# JSON은 node로 처리한다(check-task-doc.sh와 동일한 이유): jq는 기기에 따라 없을 수 있지만
# node는 Claude Code 구동에 필요해 항상 있다고 볼 수 있다.

node -e '
let raw = "";
process.stdin.on("data", d => raw += d);
process.stdin.on("end", () => {
  let name = "";
  try { name = JSON.parse(raw).tool_name || ""; } catch {}

  // mcp__claude_ai_Notion__notion-update-page → notion-update-page
  const op = name.split("__").pop();
  const READ = /^(notion-)?(search|fetch|get|list|query|read|view|retrieve)([-_]|$)/;

  // 읽기 계열이면 출력 없이 통과. 이름을 못 읽은 경우도 여기서 걸러져 거부로 떨어진다.
  if (READ.test(op)) process.exit(0);

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Notion MCP는 읽기 전용으로 제한되어 있습니다. write 계열 툴은 차단됩니다."
    }
  }));
});
' 2>/dev/null

exit 0
