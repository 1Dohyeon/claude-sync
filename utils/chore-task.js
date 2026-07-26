#!/usr/bin/env node
// docs/<repo>/tasks/ 아래 활성 task 문서들을 정리한다: '## 완료'가 있으면 done/, 없으면
// 파일 끝에 '## 중단'을 추가하고 stalled/로 옮긴다. 완료 여부 판단은 세션(사람)의 몫 —
// 이 스크립트는 이미 '## 완료'가 쓰여 있는지만 기계적으로 확인한다.
// /chore-task [repo] 커맨드로 수동 실행. repo 미지정 시 전체 repo.
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

function todayStr() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
}

// tasksDir 아래 done/, stalled/ 를 제외한 모든 .md 파일(중첩 폴더 포함)을 찾는다.
function walkTaskFiles(tasksDir) {
    let results = [];
    let entries;
    try {
        entries = fs.readdirSync(tasksDir, { withFileTypes: true });
    } catch {
        return results;
    }
    for (const e of entries) {
        if (e.name === "done" || e.name === "stalled") continue; // 이미 정리된 것들은 건드리지 않음
        const full = path.join(tasksDir, e.name);
        if (e.isDirectory()) {
            results = results.concat(walkTaskFiles(full));
        } else if (e.isFile() && e.name.endsWith(".md") && e.name !== "INDEX.md") {
            results.push(full);
        }
    }
    return results;
}

// tasks/feature/remove-image.md -> feature-remove-image (done/stalled은 1-depth 평탄 구조)
function flattenTaskName(tasksDir, fullPath) {
    const rel = path.relative(tasksDir, fullPath).replace(/\\/g, "/");
    return rel.replace(/\.md$/, "").replace(/\//g, "-");
}

// 이름 충돌 시 -2, -3 ... 접미
function uniqueDestPath(dir, baseName) {
    let n = 1;
    let candidate = path.join(dir, `${baseName}.md`);
    while (fs.existsSync(candidate)) {
        n += 1;
        candidate = path.join(dir, `${baseName}-${n}.md`);
    }
    return candidate;
}

// git mv 우선 시도(히스토리 보존), 추적 안 된 파일이면 일반 rename으로 폴백
function moveFile(repoRoot, srcAbs, destAbs) {
    fs.mkdirSync(path.dirname(destAbs), { recursive: true });
    const srcRel = path.relative(repoRoot, srcAbs);
    const destRel = path.relative(repoRoot, destAbs);
    try {
        execFileSync("git", ["mv", srcRel, destRel], { cwd: repoRoot, stdio: "pipe" });
    } catch {
        fs.renameSync(srcAbs, destAbs);
    }
}

function processRepo(docsDir, repo) {
    const tasksDir = path.join(docsDir, repo, "tasks");
    const doneDir = path.join(tasksDir, "done");
    const stalledDir = path.join(tasksDir, "stalled");
    const files = walkTaskFiles(tasksDir);
    const date = todayStr();

    const doneMoved = [];
    const stalledMoved = [];

    for (const file of files) {
        let text;
        try {
            text = fs.readFileSync(file, "utf8");
        } catch {
            continue;
        }
        const base = flattenTaskName(tasksDir, file);
        const isDone = /^##\s+완료/m.test(text);

        if (isDone) {
            const dest = uniqueDestPath(doneDir, `${base}-${date}`);
            moveFile(docsDir, file, dest);
            doneMoved.push(path.relative(docsDir, dest).replace(/\\/g, "/"));
        } else {
            if (!/^##\s+중단/m.test(text)) {
                const sep = text.endsWith("\n") ? "" : "\n";
                text = `${text}${sep}\n## 중단\n`;
                fs.writeFileSync(file, text);
            }
            const dest = uniqueDestPath(stalledDir, `${base}-${date}`);
            moveFile(docsDir, file, dest);
            stalledMoved.push(path.relative(docsDir, dest).replace(/\\/g, "/"));
        }
    }

    return { doneMoved, stalledMoved };
}

// docs/ 아래 repo들을 순회하며 정리. repoFilter 주면 그 repo만. { repo: { doneMoved, stalledMoved } } 반환.
function choreTask(docsDir, repoFilter) {
    const base = docsDir || path.join(os.homedir(), ".claude", "docs");
    let repos = [];
    try {
        repos = fs
            .readdirSync(base, { withFileTypes: true })
            .filter((e) => e.isDirectory())
            .map((e) => e.name);
    } catch {
        return {};
    }
    if (repoFilter) repos = repos.filter((r) => r === repoFilter);

    const result = {};
    for (const repo of repos) {
        const { doneMoved, stalledMoved } = processRepo(base, repo);
        if (doneMoved.length || stalledMoved.length) {
            result[repo] = { doneMoved, stalledMoved };
        }
    }
    return result;
}

module.exports = { choreTask, processRepo, walkTaskFiles, flattenTaskName };

// 직접 실행 시: node chore-task.js [repo]
if (require.main === module) {
    const repo = (process.argv[2] || "").trim() || undefined;
    const scope = repo || "전체";
    const result = choreTask(undefined, repo);
    const repos = Object.keys(result);

    if (repos.length === 0) {
        console.log(`chore-task(${scope}): 변경 없음 (정리할 task 없음)`);
    } else {
        for (const r of repos) {
            const { doneMoved, stalledMoved } = result[r];
            console.log(`chore-task(${r}):`);
            if (doneMoved.length) {
                console.log("  done/ 이동:\n" + doneMoved.map((f) => "    - " + f).join("\n"));
            }
            if (stalledMoved.length) {
                console.log("  stalled/ 이동:\n" + stalledMoved.map((f) => "    - " + f).join("\n"));
            }
        }
    }
}
