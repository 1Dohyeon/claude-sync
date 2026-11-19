# worktree 만들기와 정리

[`SKILL.md`](SKILL.md)의 "브랜치 만들기"에서 worktree를 골랐을 때 읽는다. `<base>`와 `<branch>`는 거기서 정한 값이고, `<main-dir>`은 메인 클론 경로다.

## worktree 위치 정하기

원격 브랜치를 만들기 전에 worktree를 둘 위치 `<dir>`을 **꼭** `AskUserQuestion`으로 묻는다. 묻지 않고 정하지 않는다. 선택지는 아래 순위대로 두고, 선택지마다 실제로 만들어질 전체 경로를 보여 준다.

| 순위 | 선택지                     | 위치                                                                                                                                                                              |
| ---- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 앱의 훅이 안내하는 위치    | 세션을 연 앱이 훅(세션 시작 안내)으로 안내하는 경로. 안내가 없으면 이 선택지를 빼고, 있으면 추천으로 표시한다                                                                     |
| 2    | worktree 모음 위치         | `$WORKTREES_PATH/{owner}/{repo}/{branch}/`. `WORKTREES_PATH`의 값은 [`rules/common/environments.md`](../../rules/common/environments.md)에 있다. 1순위 선택지가 없으면 이것을 추천으로 표시한다 |
| 3    | 메인 작업 폴더와 형제 위치 | 메인 클론(`<main-dir>`)과 같은 부모 폴더 아래                                                                                                                                     |

- `{owner}`·`{repo}`는 `git remote get-url origin`에서 얻는다. 원격이 없으면 `{owner}` 자리에 `_local`을 쓰고, `{repo}`는 메인 클론의 폴더 이름을 쓴다.
- `{branch}`는 만들 작업 브랜치 이름이다. 브랜치 이름의 `/`는 폴더 계층이 된다.
- `$WORKTREES_PATH`가 없는 기기에서 2순위를 고르면 `git worktree add`가 상위 폴더를 만든다.

세 선택지에 없는 경로는 사용자가 `AskUserQuestion`의 직접 입력으로 적는다.

## 만드는 순서

0. worktree를 둘 위치 `<dir>`을 위 "worktree 위치 정하기"대로 정한다.

1. [`SKILL.md`](SKILL.md)의 "메인 클론에서 만드는 순서" 1단계와 같이 베이스에서 새 브랜치를 원격에 먼저 만든다.

2. 방금 만든 원격 브랜치를 추적하는 worktree를 `<dir>`에 만든다.

```sh
git fetch origin
git worktree add -b <branch> <dir> origin/<branch>
```

`--track`은 붙이지 않는다. 시작점이 `origin/<branch>`라 upstream은 어차피 자동으로 잡히고, git 2.18 미만에서는 `unknown option 'track'`으로 실패한다.

3. [`SKILL.md`](SKILL.md)의 3단계 표대로 upstream을 확인한다. 명령은 `git -C <dir> status -sb`이고, 고칠 때도 `git -C <dir>`로 실행한다.

4. 의존성을 설치한다. 새 worktree엔 `node_modules`가 없어서 이 단계까지 끝내야 바로 쓸 수 있다. 저장소 자체의 패키지 매니저를 쓴다(`bun.lock` → `bun install`, `pnpm-lock.yaml` → `pnpm install` 등).

5. 설치 과정에서 생긴 lockfile 변경은 되돌린다.

```sh
git -C <dir> checkout -- <lockfile>
```

새 worktree는 원래 clean한 상태로 시작하므로, 여기서 생긴 lockfile 변경은 의도된 변경이 아니라 환경 노이즈다(예: 더 최신 패키지 매니저가 메타데이터를 다시 씀). 실제 의존성 버전이 바뀐 경우라면 그대로 되돌리되 보고에서 언급한다.

6. env 파일을 연결한다. `.env`는 gitignore 대상이라 새 worktree엔 없다. 메인 클론(`<main-dir>`)에 실제로 존재하는 `apps/*/.env`, `apps/*/.env.local`을 찾아 새 worktree의 같은 상대경로에 **심링크**로 연결한다. 어떤 경우에도 복사하지 않는다.

대상 파일은 Glob으로 `<main-dir>`에서 `apps/*/.env`와 `apps/*/.env.local` 패턴을 찾는다. 찾은 파일의 상대경로 `<f>`마다 아래 명령을 하나씩 실행한다.

```sh
ln -sf <main-dir>/<f> <dir>/<f>
```

연결한 뒤 `ls -l <dir>/<f>`로 `->` 화살표가 뜨는지 반드시 확인한다. 심링크 생성이 실패하면 복사로 대신하지 않고 오류 원문과 함께 중단하고 보고한다.

Windows에서 심링크를 쓰려면 개발자 모드가 켜져 있어야 한다. 꺼져 있으면 에러 없이 복사본이 생겨 겉보기엔 성공한 것처럼 보이므로, `->` 화살표 확인이 특히 중요하다. 화살표가 없으면 실패로 보고 중단한다.

심링크는 메인 클론의 파일을 가리키므로, 메인 클론에서 값을 바꾸면 모든 worktree에 바로 반영된다. 반대로 worktree에서 이 파일을 고치면 메인 클론의 원본이 바뀐다.

7. 마지막으로 확인하고 보고한다.

```sh
git -C <dir> status -sb
```

작업 트리가 clean해야 한다.

## worktree 정리

**"워크트리 삭제해줘" = 워크트리 폴더 + 로컬 브랜치를 지우고, 원격은 그대로 둔다.** 둘은 한 묶음이라 로컬 브랜치를 남길지 따로 묻지 않는다.

worktree로 만든 브랜치는 그 worktree에서만 작업한다. 그래서 worktree가 사라지면 그 로컬 브랜치는 쓸 곳이 없어 정리 대상이다. 원격 브랜치는 PR과 사본을 들고 있는 쪽이므로, 사용자가 요청하지 않으면 손대지 않는다. 지울 것과 두는 것은 [`SKILL.md`](SKILL.md)의 "브랜치 정리" 표와 같다.

worktree 제거만으로는 로컬 브랜치가 남는다. worktree 제거는 작업 디렉터리와 `.git/worktrees/<name>/` 메타데이터만 없애고 브랜치 ref는 건드리지 않는다(브랜치의 점유만 풀린다). 그래서 아래 2·3단계를 둘 다 해야 정리가 끝난다.

### 1. 유실 확인

**로컬에만 있는 것이 없는지 먼저 본다.** 원격에 사본이 있다는 것이 로컬 브랜치를 지워도 되는 근거다. 아래 중 하나라도 걸리면 중단하고 보고한다. 조용히 우회하거나 `-D`로 밀지 않는다.

```sh
git -C <dir> status -sb
```

| status 출력                             | 판정                                                                                   |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| `## <branch>...origin/<branch>` + clean | 통과. 원격과 동일하다                                                                  |
| `[ahead N]`                             | 미푸시 커밋이 있다 → 푸시 승인이 필요하므로 중단·보고                                  |
| 변경·스테이징된 파일                    | 중단·보고                                                                              |
| `[behind N]`만                          | 통과. 원격이 앞서 있을 뿐 잃을 것은 없다                                               |
| `origin/<branch>: gone`                 | 원격 사본이 없다 → [`SKILL.md`](SKILL.md)의 "원격이 이미 삭제된 경우"로 반영을 확인한다 |

```sh
git -C <dir> stash list
```

비어 있어야 한다. stash는 브랜치를 지워도 남지만 되찾을 실마리가 사라지므로 중단·보고한다.

### 2. worktree 제거

```sh
git worktree remove <dir>
```

`git worktree remove`는 git 2.17부터다. 그 미만에서는 `usage: git worktree add ...`(exit 129)로 실패하므로 디렉터리를 지우고 prune한다.

```sh
rm -rf <dir>
```

```sh
git -C <main-dir> worktree prune
```

오류에 `Filename too long`이 있으면 경로가 긴 파일(`node_modules` 등) 때문에 폴더를 다 지우지 못한 것이다. git은 이때 이미 `.git` 파일과 등록 정보를 지웠을 수 있다. 아래 순서로 연결을 끊은 뒤 남은 폴더를 Git Bash의 `rm -rf`로 지운다. Git Bash의 `rm`은 긴 경로도 지운다. **허용하는 삭제 방법은 이 `rm -rf` 한 번뿐이다. 그 밖의 우회는 하지 않는다.**

```sh
rm -f <dir>/.git
```

```sh
git -C <main-dir> worktree prune
```

```sh
rm -rf <dir>
```

```sh
ls -A <dir>
```

`ls`가 `No such file or directory`로 끝나야 다 지운 것이다. `rm -rf`가 실패하거나 폴더가 남으면 **다른 우회(`core.longpaths`, `\\?\` 경로, robocopy, 다른 삭제 명령 등)를 시도하지 않는다.** 오류 원문과 남은 폴더 경로를 보고에 적고 다음 단계로 간다. 빈 부모 폴더(`fix/`, `feature/` 등)는 다음 worktree가 다시 쓰므로 지우지 않는다.

이 `rm -rf`는 1단계에서 로컬에만 있는 것이 없다고 확인한 폴더에만 쓴다. 1단계를 건너뛰었으면 쓰지 않는다.

### 3. 로컬 브랜치 삭제

```sh
git -C <main-dir> branch -D <branch>
```

`-d`가 아니라 `-D`다. 이 브랜치는 베이스에 머지되지 않았거나 머지 전에 리베이스돼 조상이 아니어서 `-d`는 거부된다. `-D`를 쓰는 근거는 1단계에서 원격 사본을 확인한 것이며, 확인 없이 `-D`를 쓰지 않는다.

2단계보다 먼저 실행하면 `checked out at ...`으로 거부된다. 순서를 지킨다.

### 4. 검증

```sh
git -C <main-dir> worktree list
```

```sh
git -C <main-dir> branch -vv
```

```sh
git -C <main-dir> branch -r
```

worktree 목록과 로컬 브랜치 목록에서 `<branch>`가 사라지고, `origin/<branch>`는 **그대로 남아 있어야** 한다. 마지막 항목이 "로컬만 지웠다"의 증거이므로 보고에 함께 적는다.
