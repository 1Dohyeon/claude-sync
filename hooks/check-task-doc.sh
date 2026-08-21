#!/bin/sh
# worklog task 문서의 섹션 스키마를 검사한다(PostToolUse: Write|Edit).
# 원칙(load-overview.sh와 동일): 대상이 아니거나 에러여도 세션을 절대 막지 않고 조용히 통과.
#
# 정규식·JSON은 node로 처리한다. jq는 기기에 따라 없을 수 있지만 node는 Claude Code 구동에 필요해
# 항상 있다고 볼 수 있고, BSD sed와 GNU sed는 이스케이프 문법이 갈려 신뢰할 수 없다.

node -e '
const fs = require("fs");

const REPORT = ["지금 무엇이 문제인가", "어떻게 바꾸는가", "어떤 효과가 있는가", "함께 손대는 곳", "확인 방법"];
const WORK = ["작업 목록", "진행", "검증", "완료"];

let raw;
try { raw = fs.readFileSync(0, "utf8"); } catch { process.exit(0); }

let file;
try { file = JSON.parse(raw).tool_input.file_path; } catch { process.exit(0); }
if (typeof file !== "string" || !file.endsWith(".md")) process.exit(0);

// 대상은 진행 중인 task 문서뿐이다. 완결된 기록(done·stalled)과 overview·INDEX는 검사하지 않는다.
if (!/\/worklog\/[^/]+\/tasks\//.test(file)) process.exit(0);
if (/\/(done|stalled)\//.test(file)) process.exit(0);
if (/\/(overview|INDEX)\.md$/.test(file)) process.exit(0);

let text;
try { text = fs.readFileSync(file, "utf8"); } catch { process.exit(0); }

const isWork = file.endsWith(".work.md");
const allowed = isWork ? WORK : REPORT;
const list = allowed.map(h => "## " + h);

// 안내 주석과 코드블록은 본문이 아니므로 검사에서 뺀다.
const body = text.replace(/<!--[\s\S]*?-->/g, "").replace(/^```[\s\S]*?^```/gm, "");
const found = [...body.matchAll(/^## +(.+?)[ \t]*$/gm)].map(m => m[1]);
const bad = [];

const unknown = found.filter(h => !allowed.includes(h));
if (unknown.length) {
  bad.push("허용되지 않은 제목: " + unknown.map(h => "## " + h).join(", ") +
    " — 쓸 수 있는 제목은 " + list.join(" / ") + " 뿐이다.");
}

const order = found.filter(h => allowed.includes(h)).map(h => allowed.indexOf(h));
if (order.some((v, i) => i > 0 && v <= order[i - 1])) {
  bad.push("제목 순서가 템플릿과 다르다. 순서는 " + list.join(" → ") + " 다.");
}

if (!isWork) {
  if (/^[ \t]*[-*] \[[ xX]\]/m.test(body)) {
    bad.push("보고서에 체크박스를 쓰지 않는다. 작업 목록은 같은 이름의 .work.md로 옮긴다.");
  }
  const hash = body.match(/\b[0-9a-f]{7,40}\b/);
  if (hash) {
    bad.push("커밋 해시(" + hash[0] + ")를 보고서에 쓰지 않는다. 시점이 지나면 거짓이 되는 값은 .work.md에만 남긴다.");
  }
  if (!found.length) {
    bad.push("섹션이 하나도 없다. " + list.join(" / ") + " 중 해당하는 것을 쓴다.");
  }
}

if (!bad.length) process.exit(0);

const msg = "[task 문서 규칙] " + file + "\n" + bad.map(b => "- " + b).join("\n");
process.stdout.write(JSON.stringify({
  systemMessage: msg,
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: msg + "\n위 항목을 고쳐서 다시 저장하세요. 템플릿은 ~/.claude/templates/task.md 와 task-work.md 입니다."
  }
}));
' 2>/dev/null || :

exit 0
