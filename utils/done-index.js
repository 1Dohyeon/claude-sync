#!/usr/bin/env node
// docs/<repo>/tasks/done/ 의 완료 task 문서들을 훑어 repo별 INDEX.md(원장)를 생성/갱신한다.
// 결정적(LLM 불필요): 파일명에서 날짜·task명, 본문에서 제목·완료요약을 뽑는다.
// /done-index [repo] 커맨드로 수동 실행. repo 미지정 시 전체 repo.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const DATE_RE = /-(\d{4})(\d{2})(\d{2})\.md$/;

// done 문서 1개에서 메타 추출 (날짜·task명·제목·완료요약)
function parseDoneFile(dir, filename) {
    let text = "";
    try {
        text = fs.readFileSync(path.join(dir, filename), "utf8");
    } catch {
        return null;
    }

    const m = filename.match(DATE_RE);
    const date = m ? `${m[1]}-${m[2]}-${m[3]}` : "";
    const task = filename.replace(/\.md$/, "").replace(/-\d{8}$/, ""); // 날짜 접미 제거

    const lines = text.split(/\r?\n/);

    // 제목: 첫 '# ' 헤딩
    let title = "";
    for (const ln of lines) {
        const t = ln.match(/^#\s+(.+)/);
        if (t) {
            title = t[1].trim();
            break;
        }
    }

    // 요약: '## 완료' 아래 첫 의미 있는 줄, 없으면 제목으로 폴백
    let summary = "";
    const doneIdx = lines.findIndex((ln) => /^##\s+완료/.test(ln));
    if (doneIdx >= 0) {
        for (let i = doneIdx + 1; i < lines.length; i++) {
            const ln = lines[i].trim();
            if (!ln || ln.startsWith("#")) continue;
            summary = ln.replace(/^[-*>]\s*/, "");
            break;
        }
    }
    if (!summary) summary = title;

    // 표 안전화: 파이프·개행 제거, 길이 제한
    const clean = (s) => s.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
    summary = clean(summary);
    if (summary.length > 100) summary = summary.slice(0, 99) + "…";

    return { date, task, filename, title: clean(title), summary };
}

// 한 done 디렉터리의 INDEX.md 생성(내용 바뀔 때만 write) → 갱신되면 true
function buildIndexForDir(doneDir) {
    let files = [];
    try {
        files = fs.readdirSync(doneDir).filter((f) => f.endsWith(".md") && f !== "INDEX.md");
    } catch {
        return false; // done 디렉터리 없음
    }

    const rows = files
        .map((f) => parseDoneFile(doneDir, f))
        .filter(Boolean)
        .sort((a, b) => (b.date || "").localeCompare(a.date || "")); // 날짜 내림차순

    if (rows.length === 0) return false; // 완료 task 없으면 INDEX 만들지 않음

    const header =
        "# 완료 task 색인 (done index)\n\n" +
        "> 자동 생성 — 직접 수정 금지. `/done-index`로 갱신.\n\n" +
        "| 날짜 | task | 요약 |\n|---|---|---|\n";
    const body = rows
        .map((r) => `| ${r.date || "-"} | [${r.task}](${r.filename}) | ${r.summary} |`)
        .join("\n");
    const content = header + body + "\n";

    const indexPath = path.join(doneDir, "INDEX.md");
    let prev = "";
    try {
        prev = fs.readFileSync(indexPath, "utf8");
    } catch {
        /* 없으면 신규 */
    }
    if (prev === content) return false; // 동일하면 스킵(멱등)

    fs.writeFileSync(indexPath, content);
    return true;
}

// docs/ 아래 repo들의 tasks/done/ 순회. repoFilter 주면 그 repo만. 갱신된 INDEX 경로 목록 반환.
function generateAllIndexes(docsDir, repoFilter) {
    const base = docsDir || path.join(os.homedir(), ".claude", "docs");
    let repos = [];
    try {
        repos = fs
            .readdirSync(base, { withFileTypes: true })
            .filter((e) => e.isDirectory())
            .map((e) => e.name);
    } catch {
        return [];
    }
    if (repoFilter) repos = repos.filter((r) => r === repoFilter); // 특정 repo만

    const updated = [];
    for (const repo of repos) {
        const doneDir = path.join(base, repo, "tasks", "done");
        if (buildIndexForDir(doneDir)) updated.push(`${repo}/tasks/done/INDEX.md`);
    }
    return updated;
}

module.exports = { generateAllIndexes, buildIndexForDir, parseDoneFile };

// 직접 실행 시: node done-index.js [repo]
if (require.main === module) {
    const repo = (process.argv[2] || "").trim() || undefined;
    const scope = repo || "전체";
    const updated = generateAllIndexes(undefined, repo);
    if (updated.length === 0) {
        console.log(`done-index(${scope}): 변경 없음 (또는 완료 task 없음)`);
    } else {
        console.log(`done-index(${scope}): 갱신됨\n` + updated.map((u) => "  - " + u).join("\n"));
    }
}
