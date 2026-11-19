# CLEANUP

[`SKILL.md`](SKILL.md)에서 브랜치나 worktree를 지우자고 했을 때 읽는다. `<main-dir>`은 메인 클론 경로, `<dir>`은 worktree 경로다.

## what to delete

"브랜치(또는 워크트리) 삭제해줘"는 로컬 브랜치(와 worktree 폴더)를 지우는 것이다. 로컬 브랜치를 남길지 따로 묻지 않는다.

|                                   | 기본 정리에서                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------ |
| 로컬 브랜치 `<branch>`            | **지운다**                                                                     |
| 원격 추적 ref `origin/<branch>`   | 두고, 건드리지 않는다                                                          |
| GitHub의 원격 브랜치              | 사용자가 요청할 때만 `git push origin --delete <branch>`로 지우고 `git fetch --prune` |

## check nothing is lost

**로컬에만 있는 것이 없는지 먼저 본다.** 아래 중 하나라도 걸리면 멈추고 보고한다. 조용히 우회하거나 `-D`로 밀지 않는다. worktree면 명령마다 `-C <dir>`을 붙인다.

```sh
git status -sb
```

| status 출력                             | 판정                                                          |
| --------------------------------------- | ------------------------------------------------------------- |
| `## <branch>...origin/<branch>` + clean | 통과. 원격과 같다                                             |
| `[behind N]`만                          | 통과. 원격이 앞서 있을 뿐 잃을 것은 없다                      |
| `[ahead N]`                             | push하지 않은 커밋이 있다. 멈춘다                             |
| 변경·스테이징된 파일                    | 멈춘다                                                        |
| `## <branch>` (upstream 없음)           | 한 번도 push하지 않았다. 아래 "반영 확인"으로 간다            |
| `origin/<branch>: gone`                 | 원격 브랜치가 지워졌다. 아래 "반영 확인"으로 간다             |

```sh
git stash list
```

비어 있어야 한다. stash는 브랜치를 지워도 남지만 되찾을 실마리가 사라진다.

### 반영 확인

원격 사본이 없으면 베이스에 반영됐는지가 지워도 되는 근거다.

| 확인       | 명령                                | 판정                   |
| ---------- | ----------------------------------- | ---------------------- |
| 조상 여부  | `git branch --merged origin/<base>` | 목록에 있으면 반영됨   |
| patch 단위 | `git cherry origin/<base> <branch>` | 모든 줄이 `-`면 반영됨 |

- `--merged`만 믿지 않는다. 머지 전에 리베이스하는 저장소에서는 로컬 tip이 베이스의 조상이 아니다. `git cherry`의 `-`는 같은 patch가 베이스에 있다는 뜻이라 리베이스를 통과한다.
- `+`가 남으면 커밋 제목으로 `git log origin/<base> --oneline --grep=<제목 일부>`를 찾고, 같은 제목이 있으면 `git diff <로컬커밋> <베이스커밋> -- <파일>`이 비는지 본다.
- 어느 것도 확인되지 않으면 로컬에만 있는 커밋이므로 멈추고 보고한다.

## delete main clone branch

1. 지울 브랜치가 현재 브랜치이면 다른 브랜치로 먼저 옮긴다.
2. 로컬 브랜치를 지운다. 조상 여부로 반영을 확인했으면 `-d`, 원격 사본이나 patch 단위로 확인했으면 `-D`를 쓴다.

```sh
git branch -d <branch>
```

## delete worktree

1. worktree를 지운다. 로컬 브랜치보다 먼저 지워야 한다. 순서를 바꾸면 `checked out at ...`으로 거부된다.

```sh
git worktree remove <dir>
```

2. 로컬 브랜치를 지운다. 위 "check nothing is lost"를 통과했을 때만 `-D`를 쓴다.

```sh
git -C <main-dir> branch -D <branch>
```

### Filename too long (Windows)

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

## verify

```sh
git -C <main-dir> worktree list
```

```sh
git -C <main-dir> branch -vv
```

지운 브랜치와 worktree가 목록에서 사라졌는지 확인하고 보고한다. 원격 브랜치를 지우지 않았으면 `git branch -r`에 `origin/<branch>`가 남아 있는 것도 함께 적는다.

<!--
정리를 빠뜨리면 로컬 브랜치가 계속 쌓인다.
- 원격 브랜치를 지우고 git fetch --prune을 해도 원격 추적 ref만 사라지고, 로컬 브랜치는 upstream이 ": gone"으로 표시된 채 남는다.
- GitHub Desktop의 BranchPruner는 기본 브랜치(main)에 머지된 브랜치만 정리해서, develop으로 머지하는 저장소에서는 걸리지 않는다.
git branch -vv에서 ": gone"이 붙은 것들이 밀린 정리 후보다.
-->
