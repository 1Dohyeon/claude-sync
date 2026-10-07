#!/bin/sh
# plans/(계획 문서)와 worklog/(작업 일기)가 git 저장소면 각각의 "현재 상태"를 스냅샷 커밋/푸시한다.
#   - SessionEnd 훅으로 자동 실행
#   - /save-docs 커맨드로 수동 실행
#   - 인자로 plans 또는 worklog를 주면 그 저장소만 저장한다(worklog.sh가 일기를 쓴 뒤 worklog만 저장할 때).
# 목적: 문서 유실 방지 + 크로스머신 이어작업.
# 원칙(반드시 지킴): 변경 없으면 통과 / 오프라인·충돌·에러여도 세션을 절대 막지 않음.

# 훅 계약상 stdin으로 JSON이 올 수 있으나 여기선 쓰지 않는다(있으면 소진만).
{ command -p cat 2>/dev/null || cat; } >/dev/null 2>&1 || :

# $1: 저장소 폴더, $2: 출력 접두어
save_repo() {
    dir=$1
    name=$2

    # git 저장소가 아니면(이 기기에 미클론 등) 조용히 통과.
    # worktree면 .git이 파일이므로 -e로 검사한다.
    if [ ! -e "$dir/.git" ]; then
        echo "$name: git 저장소가 아님 — 통과"
        return 0
    fi

    # 변경 확인. 없으면 통과 → 빈 커밋 방지
    # 다만 앞서 푸시하지 못한 커밋이 있으면 커밋은 건너뛰고 푸시만 한다.
    changes=$(git -C "$dir" status --porcelain 2>/dev/null)
    if [ -z "$changes" ]; then
        ahead=$(git -C "$dir" rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)
        if [ "$ahead" -eq 0 ]; then
            echo "$name: 변경 없음 — 통과"
            return 0
        fi
        echo "$name: 변경 없음, 푸시하지 못한 커밋 $ahead개"
        push_repo "$dir" "$name"
        return 0
    fi

    # 현재 상태 그대로 스테이징
    git -C "$dir" add -A >/dev/null 2>&1 || :

    # 추적 파일의 절반 넘게 지워졌으면 체크아웃 실패 등으로 작업 트리가 빈 것으로 보고 멈춘다.
    # 옮긴 파일은 -M으로 이름 변경이 되어 삭제로 세지 않는다.
    tracked=$(git -C "$dir" ls-tree -r --name-only HEAD 2>/dev/null | wc -l)
    deleted=$(git -C "$dir" diff --cached -M --diff-filter=D --name-only 2>/dev/null | wc -l)
    if [ "$tracked" -gt 0 ] && [ $((deleted * 2)) -gt "$tracked" ]; then
        git -C "$dir" reset -q >/dev/null 2>&1 || :
        echo "$name: 추적 파일 $tracked개 중 $deleted개 삭제 — 비정상으로 보고 커밋 안 함"
        return 0
    fi

    stamp=$(date '+%Y-%m-%d %H:%M')     # 이 기기의 로컬 시각(KST 등)
    msg="chore: auto-save $stamp"

    if git -C "$dir" commit -m "$msg" >/dev/null 2>&1; then
        echo "$name: 커밋 — $msg"
    else
        echo "$name: 커밋 실패 — 통과(세션엔 영향 없음)"
        return 0
    fi

    push_repo "$dir" "$name"
    return 0
}

# $1: 저장소 폴더, $2: 출력 접두어
push_repo() {
    dir=$1
    name=$2

    # 다른 기기가 먼저 푸시했으면 push가 거부되므로 원격 커밋 위로 rebase한다.
    # rebase가 충돌하면 되돌리고 로컬 커밋만 남긴다(push는 이어서 거부된다).
    if run_limited git -C "$dir" fetch; then
        git -C "$dir" rebase '@{u}' >/dev/null 2>&1 || git -C "$dir" rebase --abort >/dev/null 2>&1
    fi

    # push는 실패해도 무시(오프라인/non-fast-forward).
    if run_limited git -C "$dir" push; then
        echo "$name: push 완료"
    else
        echo "$name: push 실패/시간초과(오프라인·충돌) — 로컬 커밋만, 다음에 수동 pull/push"
    fi
    return 0
}

# 네트워크 명령이 세션 종료를 매달지 않게 15초 후 kill한다. 인자로 받은 명령의 성공 여부를 돌려준다.
# macOS 기본 환경에는 timeout(1)이 없어 백그라운드 + kill 패턴을 쓴다.
run_limited() {
    "$@" >/dev/null 2>&1 &
    cmd_pid=$!
    ( sleep 15; kill "$cmd_pid" 2>/dev/null ) >/dev/null 2>&1 &
    killer_pid=$!

    wait "$cmd_pid" 2>/dev/null
    status=$?
    kill "$killer_pid" 2>/dev/null
    return $status
}

# 여러 세션이 한꺼번에 끝나면 이 스크립트가 같은 저장소에서 겹쳐 돌아 index.lock 충돌이 나므로,
# 저장소마다 mkdir 락으로 한 번에 하나만 save_repo에 들어가게 한다(mkdir는 Windows Git Bash·macOS 모두 원자적).
# 락을 쥔 채 죽은 프로세스(앱 종료 등)가 있을 수 있어 2분이 넘은 락은 버린다.
# $1: 저장소 폴더, $2: 출력 접두어
save_repo_locked() {
    git_dir=$(git -C "$1" rev-parse --absolute-git-dir 2>/dev/null)
    if [ -z "$git_dir" ]; then
        save_repo "$1" "$2"
        return 0
    fi

    lock="$git_dir/save-docs.lock"
    tries=0
    until mkdir "$lock" 2>/dev/null; do
        tries=$((tries + 1))
        if [ "$tries" -gt 20 ]; then
            echo "$2: 다른 저장 작업이 끝나지 않음 - 통과(다음 실행 때 반영)"
            return 0
        fi
        if [ -n "$(find "$lock" -maxdepth 0 -mmin +2 2>/dev/null)" ]; then
            rmdir "$lock" 2>/dev/null
        else
            sleep 1
        fi
    done

    save_repo "$1" "$2"
    rmdir "$lock" 2>/dev/null
    return 0
}

case ${1:-all} in
    all|plans) save_repo_locked "$HOME/plans" plans ;;
esac
case ${1:-all} in
    all|worklog) save_repo_locked "$HOME/worklog" worklog ;;
esac
exit 0
