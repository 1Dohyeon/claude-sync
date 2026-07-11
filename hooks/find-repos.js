// 공용 헬퍼: log-progress.js(Stop 훅)와 load-progress.js(SessionStart 훅)가
// "지금 작업 대상 git 저장소가 어디인지"를 판단할 때 공통으로 사용한다.
// 단일 repo에서 실행된 경우뿐 아니라, repo1/repo2를 함께 담은
// 풀스택 루트 폴더에서 실행된 경우까지 감지하기 위한 로직.
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function gitTopLevel(dir) {
  try {
    return execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

// cwd itself if it's inside a git repo; otherwise every immediate
// subdirectory of cwd that is its own git repo (fullstack root case).
function findRepoRoots(cwd) {
  const roots = new Set();

  const ownRoot = gitTopLevel(cwd);
  if (ownRoot) {
    roots.add(path.resolve(ownRoot));
    return Array.from(roots);
  }

  let entries = [];
  try {
    entries = fs.readdirSync(cwd, { withFileTypes: true });
  } catch {
    entries = [];
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const sub = path.join(cwd, entry.name);
    if (fs.existsSync(path.join(sub, '.git'))) {
      roots.add(path.resolve(sub));
    }
  }

  return Array.from(roots);
}

module.exports = { findRepoRoots };
