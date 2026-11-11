#!/bin/sh
# 세션이 시작되면 ~/ffc(규칙 위반 기록)에서 60일 넘게 수정되지 않은 기록을 지운다.
#   - SessionStart 훅으로 자동 실행
# 원칙(반드시 지킴): 에러여도 세션을 절대 막지 않음.
# SessionStart 훅의 표준 출력은 Claude 컨텍스트에 들어가므로 아무것도 출력하지 않는다.

{ command -p cat 2>/dev/null || cat; } >/dev/null 2>&1 || :

if [ -z "${HOME-}" ]; then
    exit 0
fi

. "$(dirname "$0")/environment-path.sh"
ffc_dir=$(environment_path FFC_PATH "$HOME/ffc")
max_days=60

if [ ! -d "$ffc_dir" ]; then
    exit 0
fi

find "$ffc_dir" -type f -name '*.md' -mtime +"$max_days" -delete >/dev/null 2>&1 || :
# 기록이 모두 지워진 연·월 폴더를 정리한다. ffc 폴더 자체는 남긴다.
find "$ffc_dir" -mindepth 1 -type d -empty -delete >/dev/null 2>&1 || :
exit 0
