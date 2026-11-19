# WORKTREE

[`SKILL.md`](SKILL.md)에서 worktree를 골랐을 때 읽는다. `<base>`, `<branch>`는 거기서 정한 값이고, `<main-dir>`은 메인 클론 경로다.

## choose location

worktree를 둘 위치 `<dir>`을 **꼭** `AskUserQuestion`으로 묻는다. 선택지는 아래 순위대로 두고, 선택지마다 실제로 만들어질 전체 경로를 보여 준다.

| 순위 | 선택지                     | 위치                                                                                                                                                                              |
| ---- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 앱의 훅이 안내하는 위치    | 세션을 연 앱이 훅(세션 시작 안내)으로 안내하는 경로. 안내가 없으면 이 선택지를 빼고, 있으면 추천으로 표시한다                                                                     |
| 2    | worktree 모음 위치         | `$WORKTREES_PATH/{owner}/{repo}/{branch}/`. 값은 [`rules/common/environments.md`](../../rules/common/environments.md)에 있다. 1순위가 없으면 이것을 추천으로 표시한다 |
| 3    | 메인 작업 폴더와 형제 위치 | 메인 클론(`<main-dir>`)과 같은 부모 폴더 아래                                                                                                                                     |

- `{owner}`·`{repo}`는 `git remote get-url origin`에서 얻는다. 원격이 없으면 `{owner}`에 `_local`, `{repo}`에 메인 클론 폴더 이름을 쓴다.
- 브랜치 이름의 `/`는 폴더 계층이 된다.
- 세 선택지에 없는 경로는 사용자가 직접 입력으로 적는다.

## create

`origin/<base>`에서 worktree와 로컬 브랜치를 함께 만든다. `--no-track`을 붙이는 이유는 [`SKILL.md`](SKILL.md)의 "create in main clone"과 같다.

```sh
git worktree add --no-track -b <branch> <dir> origin/<base>
```

`git -C <dir> status -sb`로 `SKILL.md`의 "check"를 그대로 한다.

## setup

1. 의존성을 설치한다. 새 worktree엔 `node_modules`가 없다. 저장소의 패키지 매니저를 쓴다(`bun.lock` → `bun install`, `pnpm-lock.yaml` → `pnpm install` 등).
2. 설치로 생긴 lockfile 변경은 되돌린다. 새 worktree는 clean하게 시작하므로 이 변경은 환경 노이즈다. 실제 의존성 버전이 바뀌었으면 되돌리되 보고에 적는다.

```sh
git -C <dir> checkout -- <lockfile>
```

3. env 파일을 **심링크**로 연결한다. 어떤 경우에도 복사하지 않는다. Glob으로 `<main-dir>`에서 `apps/*/.env`, `apps/*/.env.local`을 찾고, 상대경로 `<f>`마다 아래를 하나씩 실행한다.

```sh
ln -sf <main-dir>/<f> <dir>/<f>
```

- `ls -l <dir>/<f>`로 `->` 화살표를 꼭 확인한다. 실패하면 복사로 대신하지 않고 오류 원문과 함께 멈춘다.
- Windows는 개발자 모드가 꺼져 있으면 에러 없이 복사본이 생긴다. 화살표가 없으면 실패로 본다.
- 심링크는 메인 클론의 원본을 가리키므로, worktree에서 고치면 원본이 바뀐다.

4. `git -C <dir> status -sb`로 작업 트리가 clean한지 확인하고 보고한다.
