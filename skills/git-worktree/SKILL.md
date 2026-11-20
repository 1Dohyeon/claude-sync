---
description: 작업 브랜치를 만들거나 정리할 때 사용한다. 베이스 브랜치를 고르고, 원격 브랜치 없이 origin/<base>에서 로컬 브랜치를 worktree나 메인 클론에 만든다. 머지된 브랜치와 worktree를 유실 없이 지우는 절차도 담는다.
when_to_use: '예: "worktree 만들어줘", "브랜치 만들어줘", "워크트리 삭제해줘", "브랜치 정리해줘", 베이스 브랜치를 정해야 할 때'
---
# GIT WORKTREE

> [!IMPORTANT]
> 이 문서는 worktree에서 브랜치를 만들거나 정리하는 경우만 다룬다. 메인 클론에 브랜치를 체크아웃해서 작업하면 [`branch.md`](branch.md)만 읽고 이 문서는 따르지 않는다.
> - 만들기: 요청에 위치가 없으면(단순 "개발 진행해" 프롬프트) 묻지 않고 이 문서대로 새 worktree로 만든다. 사용자가 메인 클론을 지정했을 때만 `branch.md`를 따른다.
> - 정리: `git worktree list`에서 지울 브랜치가 메인 클론이 아닌 worktree에 체크아웃되어 있을 때만 이 문서를 따르고, 그 밖에는 `branch.md`를 따른다.

`<main-dir>`은 메인 클론 경로, `<dir>`은 worktree 경로다.

## create worktree

### select base

계획 문서 `requirements.md`에 베이스가 적혀 있으면 그것을 쓴다. 없으면 `git branch -r`로 원격 브랜치를 보고 아래 표로 정한다.

| 순서 | 베이스                                                                                      |
| ---- | ------------------------------------------------------------------------------------------- |
| 1    | 저장소 규칙(`CONTRIBUTING.md`, `CLAUDE.md`, `README.md`, `rules/` 등의 문서)이 정한 브랜치 |
| 2    | 규칙이 없으면 `develop`                                                                     |
| 3    | `develop`이 없으면 `main`                                                                   |

- 어느 것도 원격에 없으면 멈추고 묻는다.
- 정한 베이스와 근거를 보고에 적는다.

### fetch base

`origin/<base>`는 마지막 fetch 때의 사본이라, 만들기 직전에 원격의 최신 상태로 맞춘다.

```sh
git -C <main-dir> fetch origin <base>
```

### choose location

worktree를 둘 위치 `<dir>`은 묻지 않고 아래 순위에서 먼저 해당하는 것으로 정한다. 사용자가 요청에서 경로를 지정했으면 그 경로를 쓴다. 정한 전체 경로를 보고에 적는다.

| 순위 | 위치                                                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1    | 세션을 연 앱이 훅(세션 시작 안내)으로 안내하는 경로                                                                          |
| 2    | `$WORKTREES_PATH/{owner}/{repo}/{branch}/`. 값은 [`rules/common/environments.md`](../../rules/common/environments.md)에 있다 |
| 3    | 메인 클론(`<main-dir>`)과 같은 부모 폴더 아래                                                                                |

- `{owner}`·`{repo}`는 `git remote get-url origin`에서 얻는다. 원격이 없으면 `{owner}`에 `_local`, `{repo}`에 메인 클론 폴더 이름을 쓴다.
- 브랜치 이름의 `/`는 폴더 계층이 된다.

### create

원격 브랜치는 만들지 않는다. 로컬에서 커밋을 쌓고, 처음 push할 때 [`git-push`](../git-push/SKILL.md)가 원격 브랜치를 만든다.

`origin/<base>`에서 worktree와 로컬 브랜치를 함께 만든다.

```sh
git -C <main-dir> worktree add --no-track -b <branch> <dir> origin/<base>
```

- 사유: `--no-track`이 없으면 upstream이 `origin/<base>`로 잡혀, 이후 `git push`·`git pull`이 베이스를 대상으로 동작한다.

### check

```sh
git -C <dir> status -sb
```

`## <branch>`(upstream 없음)로 나와야 한다. `## <branch>...origin/<base>`로 나오면 `git -C <dir> branch --unset-upstream`으로 푼다.

### link orca parent

Orca 안에서 실행 중일 때(`ORCA_CLI_COMMAND`나 `ORCA_TERMINAL_HANDLE` 중 하나라도 비어 있지 않을 때)만 한다. 둘 다 없으면 Orca 밖이므로 건너뛴다.

```sh
"${ORCA_CLI_COMMAND:-orca}" worktree set --worktree path:<dir> --parent-worktree current
```

- 사유: git으로 직접 만든 worktree는 Orca가 부모를 기록하지 않아 계보가 끊긴다.
- `ORCA_CLI_COMMAND`는 Orca 채팅 세션에만 있고 Orca 터미널에는 없다. 터미널에서는 PATH의 `orca`를 쓴다.
- `current`는 현재 폴더가 아니라 명령을 실행한 터미널·채팅이 속한 워크스페이스로 풀린다. bot이 지휘한 세션이면 bot 홈 폴더가, 메인 클론 세션이면 메인 클론이 부모가 된다.
- bot 사이드바의 Home Chat 아래에는 bot 홈 폴더를 부모로 둔 worktree만 보인다.
- Orca 메타데이터만 바꾸고 git은 건드리지 않는다. `--no-parent`로 되돌릴 수 있다.
- `"${ORCA_CLI_COMMAND:-orca}" worktree show --worktree path:<dir> --json`에서 `parent.selector`(또는 `workspaceLineage.parentWorkspaceKey`)가 기대한 부모인지 확인한다. 부모가 폴더 워크스페이스면 부모 쪽 `childWorktreeIds`에는 나오지 않는다. 부모가 git worktree면 `parentWorktreeId`도 채워진다.
- 실패하면 worktree 작업은 계속하되 오류 원문을 보고에 적는다. 조용히 넘기지 않는다.

### setup

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

## cleanup worktree

### what to delete

"워크트리 삭제해줘"는 worktree 폴더와 그 로컬 브랜치를 지우는 것이다. 로컬 브랜치를 남길지 따로 묻지 않는다.

|                                 | 기본 정리에서                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| worktree 폴더 `<dir>`           | **지운다**                                                                            |
| 로컬 브랜치 `<branch>`          | **지운다**                                                                            |
| 원격 추적 ref `origin/<branch>` | 두고, 건드리지 않는다                                                                 |
| GitHub의 원격 브랜치            | 사용자가 요청할 때만 `git push origin --delete <branch>`로 지우고 `git fetch --prune` |

### check nothing is lost

**로컬에만 있는 것이 없는지 먼저 본다.** 아래 중 하나라도 걸리면 멈추고 보고한다. 조용히 우회하거나 `-D`로 밀지 않는다.

```sh
git -C <dir> status -sb
```

| status 출력                             | 판정                                               |
| --------------------------------------- | -------------------------------------------------- |
| `## <branch>...origin/<branch>` + clean | 통과. 원격과 같다                                  |
| `[behind N]`만                          | 통과. 원격이 앞서 있을 뿐 잃을 것은 없다           |
| `[ahead N]`                             | push하지 않은 커밋이 있다. 멈춘다                  |
| 변경·스테이징된 파일                    | 멈춘다                                             |
| `## <branch>` (upstream 없음)           | 한 번도 push하지 않았다. 아래 "반영 확인"으로 간다 |
| `origin/<branch>: gone`                 | 원격 브랜치가 지워졌다. 아래 "반영 확인"으로 간다  |

```sh
git -C <dir> stash list
```

비어 있어야 한다. stash는 브랜치를 지워도 남지만 되찾을 실마리가 사라진다.

#### 반영 확인

원격 사본이 없으면 베이스에 반영됐는지가 지워도 되는 근거다.

| 확인       | 명령                                             | 판정                   |
| ---------- | ------------------------------------------------ | ---------------------- |
| 조상 여부  | `git -C <dir> branch --merged origin/<base>`     | 목록에 있으면 반영됨   |
| patch 단위 | `git -C <dir> cherry origin/<base> <branch>`     | 모든 줄이 `-`면 반영됨 |

- `--merged`만 믿지 않는다. 머지 전에 리베이스하는 저장소에서는 로컬 tip이 베이스의 조상이 아니다. `git cherry`의 `-`는 같은 patch가 베이스에 있다는 뜻이라 리베이스를 통과한다.
- `+`가 남으면 커밋 제목으로 `git -C <dir> log origin/<base> --oneline --grep=<제목 일부>`를 찾고, 같은 제목이 있으면 `git -C <dir> diff <로컬커밋> <베이스커밋> -- <파일>`이 비는지 본다.
- 어느 것도 확인되지 않으면 로컬에만 있는 커밋이므로 멈추고 보고한다.

### delete

1. worktree를 지운다. 로컬 브랜치보다 먼저 지워야 한다. 순서를 바꾸면 `checked out at ...`으로 거부된다.

```sh
git -C <main-dir> worktree remove <dir>
```

2. 로컬 브랜치를 지운다. 위 "check nothing is lost"를 통과했을 때만 `-D`를 쓴다.

```sh
git -C <main-dir> branch -D <branch>
```

#### Filename too long (Windows)

`git worktree remove`가 `Filename too long`으로 실패하면 긴 경로(`node_modules` 등) 때문에 폴더를 다 못 지운 것이다. 아래 순서로 연결을 끊고 Git Bash의 `rm -rf`로 지운다. **허용하는 삭제 방법은 이 `rm -rf` 한 번뿐이고, 위 확인을 통과한 폴더에만 쓴다.**

```sh
rm -f <dir>/.git
```

```sh
git -C <main-dir> worktree prune
```

```sh
rm -rf <dir>
```

`ls -A <dir>`이 `No such file or directory`로 끝나야 다 지운 것이다. 그래도 남으면 다른 우회(`core.longpaths`, `\\?\` 경로, robocopy 등)를 하지 않고 오류 원문과 남은 경로를 보고한다.

### verify

```sh
git -C <main-dir> worktree list
```

```sh
git -C <main-dir> branch -vv
```

지운 브랜치와 worktree가 목록에서 사라졌는지 확인하고 보고한다. 원격 브랜치를 지우지 않았으면 `git branch -r`에 `origin/<branch>`가 남아 있는 것도 함께 적는다.
