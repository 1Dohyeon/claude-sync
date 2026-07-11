#!/usr/bin/env node
// Stop 훅. Claude가 응답을 끝내려 할 때마다 하니스가 이 스크립트를 실행한다.
// 현재 작업 중인 git 저장소(들)에 "이번 세션에서 처음 보는" 변경사항이 있으면
// decision:"block"을 반환해 Claude가 멈추지 못하게 막고, ~/.claude/docs/progresses/<repo>/
// 에 진행 기록을 남기라고 지시한다. 이미 같은 변경사항으로 한 번 기록했거나
// 변경사항 자체가 없으면 {}를 반환해 조용히 통과시켜서 매 응답마다 방해하지 않는다.
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { findRepoRoots } = require('./find-repos');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function output(obj) {
  process.stdout.write(JSON.stringify(obj));
}

let input = {};
try {
  input = JSON.parse(readStdin() || '{}');
} catch {
  input = {};
}
const sessionId = input.session_id || 'unknown-session';

const repoRoots = findRepoRoots(process.cwd());
if (repoRoots.length === 0) {
  output({});
  process.exit(0);
}

const home = os.homedir();
const stateDir = path.join(home, '.claude', 'session-env', 'progress-log-state');
fs.mkdirSync(stateDir, { recursive: true });

const changedRepoNames = [];

for (const repoRoot of repoRoots) {
  const repoName = path.basename(repoRoot);

  let statusOut = '';
  try {
    statusOut = execFileSync('git', ['-C', repoRoot, 'status', '--porcelain'], { encoding: 'utf8' });
  } catch {
    statusOut = '';
  }
  if (!statusOut.trim()) continue;

  // git status 결과를 해시로 "변경 상태 지문"화. 세션+저장소별로 마지막 지문을
  // 저장해뒀다가 같으면 스킵 -> 같은 변경사항으로 매 응답마다 반복 차단하지 않기 위함.
  const sig = crypto
    .createHash('sha1')
    .update(statusOut.split('\n').sort().join('\n'))
    .digest('hex');

  const stateFile = path.join(stateDir, `${sessionId}__${repoName}.sig`);
  let prevSig = '';
  try {
    prevSig = fs.readFileSync(stateFile, 'utf8').trim();
  } catch {
    prevSig = '';
  }
  if (sig === prevSig) continue;

  fs.writeFileSync(stateFile, sig);
  changedRepoNames.push(repoName);
}

if (changedRepoNames.length === 0) {
  output({});
  process.exit(0);
}

for (const repoName of changedRepoNames) {
  fs.mkdirSync(path.join(home, '.claude', 'docs', 'progresses', repoName), { recursive: true });
}

const targets = changedRepoNames.map((n) => `~/.claude/docs/progresses/${n}/`).join(', ');

const reason =
  `다음 저장소에서 파일 변경이 감지되었습니다: ${changedRepoNames.join(', ')}. ` +
  `멈추기 전에 해당 저장소별로 ${targets} 에 진행 상황을 기록하세요 ` +
  `(파일명은 오늘 날짜 YYYY-MM-DD.md, 이미 있으면 이어서 append). ` +
  `저장소별로 무엇을 했는지, 다음에 뭘 해야 하는지 간단히 적고 그 다음에 다시 멈추세요. ` +
  `(이 폴더들은 ~/.claude git 레포에 커밋되어 기기 간 동기화됩니다.)`;

output({ decision: 'block', reason });
process.exit(0);
