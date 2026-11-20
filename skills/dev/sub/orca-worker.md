# Orca worker 위임

[`dev`](../SKILL.md)의 "위임"에서 맡길 곳이 Orca worker 세션일 때의 절차다. 메인(지휘하는 세션)은 worktree 준비, 지시, 검토, push, 정리를 맡고, 구현과 로컬 커밋은 worker가 맡는다. bot 홈이든 일반 Orca 채팅·터미널이든 같은 절차를 쓴다.

`<dir>`은 worktree 경로, `<id>`는 worker를 띄울 때 받은 dispatch ID다.

## 적용 조건

Orca 안에서 실행 중일 때(`ORCA_CLI_COMMAND`나 `ORCA_TERMINAL_HANDLE` 중 하나라도 비어 있지 않을 때)만 적용한다.

- `ORCA_CLI_COMMAND`는 Orca 채팅 세션에만 있고 Orca 터미널에는 없다. 터미널에서는 PATH의 `orca`를 쓴다.
- 둘 다 없으면 Orca 밖이라 worker를 띄울 수 없다. `dev`의 "위임"에 따라 `task-implementer` 서브에이전트 갈래로 간다.
- 세션이 bot이고 대화에 item이 있으면 아래 절차에서 "bot이면"으로 표시한 단계를 함께 한다. bot이 아니면 그 단계를 건너뛰고 대화로 대신한다.

## 1. 맡길 단위

- 계획은 [`dev-plan`](../../dev-plan/SKILL.md)으로 세우고, 계획 문서 위치도 `dev-plan`을 따른다.
- 한 PR(worktree)의 태스크는 worker 하나가 순차로 맡는다. worker는 1레벨 태스크마다 커밋한다.
- 서로 다른 PR은 worker를 따로 띄워 동시에 진행한다. 여러 저장소에 걸친 작업이면 저장소마다 브랜치와 베이스를 정해 둔다.

## 2. worktree

PR마다 [`git-worktree`](../../git-worktree/SKILL.md)의 "create worktree"로 worktree를 만든다. 그 안의 "link orca parent" 단계가 지휘한 세션의 워크스페이스(`current`)를 Orca 부모로 기록한다. bot이 지휘하면 bot 홈이, 메인 클론 세션이 지휘하면 메인 클론이 부모가 된다.

- `worker-start --worktree new-child`(또는 `new-top-level`)로 Orca가 worktree를 만들게 하지 않는다.
  - 사유: Orca가 직접 만든 worktree에는 위치 규칙(`$WORKTREES_PATH/{owner}/{repo}/{branch}`), `--no-track`, env 심링크가 빠진다.

### 사이드바 배치

- 부모가 bot 홈이면 사이드바에서 그 bot 아래에 보인다.
- 그 bot 안에서는 worker dispatch를 만든 채팅 아래에 보인다. worker 없이 worktree만 만들면 Home Chat 아래로 간다.
- 그래서 worktree를 특정 채팅 아래에 두려면 그 채팅에서 worker를 띄운다.

## 3. worker 실행

지시문을 [`spec-template.md`](spec-template.md)대로 파일에 쓰고, worktree마다 worker를 하나씩 띄운다.

```sh
"${ORCA_CLI_COMMAND:-orca}" orchestration worker-start --worktree path:<dir> --agent <agent> --keep-open --task-title "<제목>" --spec-file <지시문 파일>
```

- 지시문 파일은 세션 임시 폴더에 둔다. worktree 안에 두지 않는다.
  - 사유: worktree 안에 두면 worker의 커밋에 섞일 수 있다.
- `--keep-open`을 기본으로 붙인다.
  - 사유: 기존 worktree에 띄운 worker는 끝나고 약 2분 뒤 스스로 닫혀 맡긴 세션 아래에서 사라지고, 검토·후속 지시·rebase 때 맥락을 잃는다.
- bot이면: item이 있을 때 `--item <n>`을 붙인다. worker가 item에 연결되고 item이 In progress로 바뀐다.
- 받은 dispatch ID를 보고에 적는다. 검토와 정리에서 쓴다.
- worker 상태는 `"${ORCA_CLI_COMMAND:-orca}" orchestration worker-list`로 확인한다. `orca bot work list`는 쓰지 않는다.
  - 사유: `bot work list`는 Slack·Linear·GitHub 대화에서 온 작업만 기록하고 worker는 담지 않는다.
- 띄운 뒤에는 기다리거나 폴링하지 않고 턴을 끝낸다. 결과는 `worker_done` 메일로 온다.
  - 사유: 폴링하는 동안 세션이 묶여 다른 worker의 질문이나 사용자 지시에 답하지 못한다.

## 4. 검토 관문

worker의 `worker_done`을 받으면 보고만 믿지 않고 커밋과 상태를 직접 확인한다.

```sh
git -C <dir> log --oneline origin/<base>..HEAD
```

```sh
git -C <dir> status -sb
```

- 계획 문서가 있으면 `dev`의 "맡긴 범위가 끝난 뒤"를 그대로 한다(바꾼 파일이 `파일:` 범위 안인지, 검증 명령, `tasks.md` 체크박스).
- 작업 트리가 clean한지, 아직 push하지 않았는지(`## <branch>`, upstream 없음) 본다.
- `--outcome failed`이거나 확인 결과가 보고와 다르면 그 차이를 그대로 사용자에게 보고한다.
- push 여부는 사용자가 worktree에서 직접 검토한 뒤 정한다. 메인이 스스로 push하지 않는다.
  - bot이면: item을 Needs you로 두고 버튼(push하고 PR / push만 / 고칠 점 있음)으로 묻는다.
  - bot이 아니면: 확인 결과와 함께 대화로 묻는다.
- 고칠 점이 있으면 새 worker를 띄우지 않고 같은 worker에게 보낸다. 보낸 뒤에는 다시 턴을 끝내고 `worker_done`을 기다린다.

```sh
"${ORCA_CLI_COMMAND:-orca}" orchestration send --to dispatch:<id> --subject "<제목>" --body-file <지시 파일>
```

## 5. push와 PR

사용자가 승인한 것만 한다. "push만"이면 push에서 멈춘다.

- push는 [`git-push`](../../git-push/SKILL.md), PR은 [`git-pr`](../../git-pr/SKILL.md)를 따른다.
- bot이면: PR을 item에 링크한다. PR의 CI·리뷰를 기다리는 Orca 자동화는 bot의 규칙을 따른다.

## 6. 정리

PR이 머지되었거나 작업을 취소했을 때 한다.

1. [`git-worktree`](../../git-worktree/SKILL.md)의 "cleanup worktree"를 따른다. 그 안의 "release orca worker" 단계가 이 worktree에 붙은 worker를 release한다.
2. bot이면: item을 닫는다.
