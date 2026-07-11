#!/usr/bin/env node
// SessionStart 훅. 새 세션이 시작될 때 하니스가 이 스크립트를 실행한다.
// log-progress.js(Stop 훅)가 ~/.claude/docs/progresses/<repo>/에 남겨둔 가장 최근
// 진행 기록을 찾아서, additionalContext로 세션 컨텍스트에 자동 주입한다.
// 다른 기기에서 이 repo를 clone/pull 받아 이어작업할 때, 직전 기기에서
// 어디까지 했는지 별도 요청 없이 바로 파악할 수 있게 하기 위함.
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { findRepoRoots } = require("./find-repos");

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
    const repoName = path.basename(repoRoot);
    const progressDir = path.join(home, ".claude", "docs", "progresses", repoName);

    let files = [];
    try {
        files = fs
            .readdirSync(progressDir)
            .filter((f) => f.endsWith(".md"))
            .sort();
    } catch {
        files = [];
    }
    if (files.length === 0) continue;

    // 파일명이 YYYY-MM-DD.md 규칙이므로 정렬 후 마지막 항목 = 가장 최근 기록.
    const latest = files[files.length - 1];
    const content = fs.readFileSync(path.join(progressDir, latest), "utf8");
    sections.push(`### '${repoName}' (${latest})\n\n${content}`);
}

if (sections.length === 0) {
    output({});
    process.exit(0);
}

const context = `[진행 기록] 다른 기기에서 이어작업 중일 수 있으니 참고하세요:\n\n` + sections.join("\n\n---\n\n");

output({
    hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: context,
    },
});
process.exit(0);
