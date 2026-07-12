#!/usr/bin/env node
// SessionStart 훅. 새 세션이 시작될 때 하니스가 이 스크립트를 실행한다.
// 두 가지를 additionalContext로 주입한다:
//   1. docs/<repo>/overview.md — 해당 repo의 서비스 도메인 이해를 돕는 정적 문서 (있으면 항상 주입)
//   2. docs/<repo>/tasks/<branch>.md — 브랜치 = task 단위이므로 현재 체크아웃된 브랜치의
//      기록 파일 하나를 그대로 읽음. 다른 기기 또는 세션에서 이어작업할 때 직전까지
//      어디까지 했는지 별도 요청 없이 바로 파악할 수 있게 하기 위함.
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { findRepoRoots, getRepoName, getCurrentBranch } = require("../utils/find-repos");

function readStdin() {
    try {
        return fs.readFileSync(0, "utf8");
    } catch {
        return "";
    }
}

function output(obj) {
    process.stdout.write(JSON.stringify(obj));
}

try {
    JSON.parse(readStdin() || "{}");
} catch {
    // ignore malformed/empty stdin
}

const repoRoots = findRepoRoots(process.cwd());
if (repoRoots.length === 0) {
    output({});
    process.exit(0);
}

const home = os.homedir();
const sections = [];

for (const repoRoot of repoRoots) {
    const repoName = getRepoName(repoRoot);
    const branch = getCurrentBranch(repoRoot) || "HEAD";
    const repoDocsDir = path.join(home, ".claude", "docs", repoName);

    // 1. overview.md — 브랜치 무관, repo 레벨 도메인 이해 문서. 순수 읽기만 함(파일 생성 안 함).
    const overviewFile = path.join(repoDocsDir, "overview.md");
    try {
        const overview = fs.readFileSync(overviewFile, "utf8");
        if (overview.trim()) {
            sections.push(`### '${repoName}' overview\n\n${overview}`);
        }
    } catch {
        sections.push(`### '${repoName}' overview\n\n(docs/${repoName}/overview.md 없음)`);
    }

    // 2. 현재 브랜치의 task 기록 (브랜치당 파일 하나, 날짜로 안 쪼갬)
    const taskFile = path.join(repoDocsDir, "tasks", `${branch}.md`);
    try {
        const content = fs.readFileSync(taskFile, "utf8");
        if (content.trim()) {
            sections.push(`### '${repoName}' [${branch}]\n\n${content}`);
        }
    } catch {
        // task 파일 없으면 조용히 스킵
    }
}

if (sections.length === 0) {
    output({});
    process.exit(0);
}

const context = `[task 기록] 다른 기기 또는 세션에서 이어작업 중일 수 있으니 참고하세요:\n\n` + sections.join("\n\n---\n\n");

output({
    hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: context,
    },
});
process.exit(0);
