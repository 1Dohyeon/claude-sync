#!/usr/bin/env node
// SessionStart 훅. repo가 fork(= 'upstream' 리모트 존재)이고 현재 브랜치가
// 컨트리뷰트 브랜치(origin owner/*)가 아닐 때만 ~/.claude/FORK.md를 주입한다.
//   - fork 판별: 'upstream' 리모트 존재 여부 (repo명 하드코딩 없이 범용)
//   - 컨트리뷰트 브랜치: origin URL의 owner로 시작하는 브랜치(예: 1Dohyeon/*) → 주입 안 함
//   - 그 외 커스텀 브랜치(develop, feature/* 등) → FORK.md 주입
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");
const { findRepoRoots, getCurrentBranch } = require("../utils/find-repos");

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

function git(dir, args) {
    try {
        return execFileSync("git", ["-C", dir, ...args], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();
    } catch {
        return "";
    }
}

function hasUpstreamRemote(dir) {
    return git(dir, ["remote"]).split("\n").includes("upstream");
}

// origin URL(https://github.com/OWNER/repo.git, git@github.com:OWNER/repo.git)에서 owner 추출
function originOwner(dir) {
    const url = git(dir, ["config", "--get", "remote.origin.url"]);
    const match = url.match(/[/:]([^/:]+)\/[^/]+?(\.git)?$/);
    return match ? match[1] : "";
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

const forkFile = path.join(os.homedir(), ".claude", "FORK.md");
let forkContent = "";
try {
    forkContent = fs.readFileSync(forkFile, "utf8");
} catch {
    output({});
    process.exit(0);
}
if (!forkContent.trim()) {
    output({});
    process.exit(0);
}

// fork이면서 커스텀 브랜치인 repo가 하나라도 있으면 주입
let inject = false;
for (const repoRoot of repoRoots) {
    if (!hasUpstreamRemote(repoRoot)) continue;
    const branch = getCurrentBranch(repoRoot);
    const owner = originOwner(repoRoot);
    const isContribute = owner && branch.startsWith(`${owner}/`);
    if (!isContribute) {
        inject = true;
        break;
    }
}

if (!inject) {
    output({});
    process.exit(0);
}

output({
    hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext:
            `[FORK 규칙] 이 repo는 fork이며 지금은 커스텀 브랜치다. 아래 규칙을 따를 것:\n\n` +
            forkContent,
    },
});
process.exit(0);
