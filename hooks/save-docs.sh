#!/bin/sh
# worklog/(개인 작업 기록용 별도 private repo)의 "현재 상태"를 스냅샷 커밋/푸시한다.
#   - SessionEnd 훅으로 자동 실행 (인자 없음 → 전체 repo)
#   - /save-docs [repo] 커맨드로 수동 실행 (인자 있으면 그 repo만)
# 목적: task 기록 유실 방지 + 크로스머신 이어작업.
# 원칙(반드시 지킴): 변경 없으면 통과 / 오프라인·충돌·에러여도 세션을 절대 막지 않음.

# 훅 계약상 stdin으로 JSON이 올 수 있으나 여기선 쓰지 않는다(있으면 소진만).
{ command -p cat 2>/dev/null || cat; } >/dev/null 2>&1 || :

worklog_dir="$HOME/.claude/worklog"
repo="$1"                       # 선택: 특정 repo만. 없으면 전체.
scope_label="${repo:-전체}"

git_worklog() {
    git -C "$worklog_dir" "$@"
}

# worklog가 git 저장소가 아니면(이 기기에 worklog repo 미클론 등) 조용히 통과.
# worktree면 .git이 파일이므로 -e로 검사한다.
if [ ! -e "$worklog_dir/.git" ]; then
    echo "snapshot: worklog가 git 저장소가 아님 — 통과"
    exit 0
fi

# repo 스코프 지정 시 해당 폴더 존재 확인
if [ -n "$repo" ] && [ ! -d "$worklog_dir/$repo" ]; then
    echo "snapshot: worklog/$repo 없음 — 통과"
    exit 0
fi

# 변경 확인 (스코프 한정). 없으면 통과 → 빈 커밋 방지
if [ -n "$repo" ]; then
    changes=$(git_worklog status --porcelain -- "$repo" 2>/dev/null)
else
    changes=$(git_worklog status --porcelain 2>/dev/null)
fi
if [ -z "$changes" ]; then
    echo "snapshot($scope_label): 변경 없음 — 통과"
    exit 0
fi

# 현재 상태 그대로 스테이징 (스코프 한정 or 전체)
if [ -n "$repo" ]; then
    git_worklog add "$repo" >/dev/null 2>&1 || :
else
    git_worklog add -A >/dev/null 2>&1 || :
fi

stamp=$(date '+%Y-%m-%d %H:%M')     # 이 기기의 로컬 시각(KST 등)
if [ -n "$repo" ]; then
    msg="chore: save $repo $stamp"
else
    msg="chore: auto-save $stamp"
fi

if git_worklog commit -m "$msg" >/dev/null 2>&1; then
    echo "snapshot($scope_label): 커밋 — $msg"
else
    echo "snapshot($scope_label): 커밋 실패 — 통과(세션엔 영향 없음)"
    exit 0
fi

# push는 실패해도 무시(오프라인/non-fast-forward). 세션 종료가 매달리지 않게 15초 후 kill.
# macOS 기본 환경에는 timeout(1)이 없어 백그라운드 + kill 패턴을 쓴다.
git_worklog push >/dev/null 2>&1 &
push_pid=$!
( sleep 15; kill "$push_pid" 2>/dev/null ) >/dev/null 2>&1 &
killer_pid=$!

if wait "$push_pid" 2>/dev/null; then
    echo "snapshot: push 완료"
else
    echo "snapshot: push 실패/시간초과(오프라인·충돌) — 로컬 커밋만, 다음에 수동 pull/push"
fi

kill "$killer_pid" 2>/dev/null
exit 0
