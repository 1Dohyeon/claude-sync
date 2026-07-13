#!/usr/bin/env node
// 세션 종료 훅. docs/(별도 private repo: .claude-sync-docs)의 task 기록 변경을
// 자동 커밋/푸시한다. 크로스머신 이어작업 + 기록 유실 방지가 목적.
// 원칙(반드시 지킴): 변경 없으면 통과 / 오프라인·충돌·에러여도 세션을 절대 막지 않음.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

// 훅 계약상 stdin으로 JSON이 올 수 있으나 여기선 쓰지 않는다(있으면 소진만).
try {
    fs.readFileSync(0, "utf8");
} catch {
    // ignore
}

const docsDir = path.join(os.homedir(), ".claude", "docs");

function git(args, timeoutMs) {
    return execFileSync("git", ["-C", docsDir, ...args], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: timeoutMs || undefined,
    });
}

try {
    // docs가 git 저장소가 아니면(이 기기에 docs repo 미클론 등) 조용히 통과
    if (!fs.existsSync(path.join(docsDir, ".git"))) process.exit(0);

    // 변경 없으면 통과
    const status = git(["status", "--porcelain"]).trim();
    if (!status) process.exit(0);

    git(["add", "-A"]);
    const d = new Date(); // 이 기기의 로컬 시각(KST 등)
    const p = (n) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    git(["commit", "-m", `chore: auto-snapshot ${stamp}`]);

    // push는 실패해도 무시(오프라인/non-fast-forward). 세션 종료가 매달리지 않게 타임아웃.
    try {
        git(["push"], 15000);
    } catch {
        // 로컬 커밋만 남기고 통과 — 다음에 수동 pull/push
    }
} catch {
    // 훅은 절대 세션을 막지 않는다
}

process.exit(0);
