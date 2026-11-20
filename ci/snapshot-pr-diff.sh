#!/bin/sh
# CI 리뷰의 스냅샷을 라운드 폴더에 뜬다.
# 허용 도구는 명령 접두로만 허가하므로, 리다이렉트·폴더 만들기·조상 확인을 이 스크립트 하나로 묶어 한 번에 허가받는다.
# 사용: snapshot-pr-diff.sh <PR 번호> <라운드 폴더> [직전 HEAD SHA]
set -eu

pr=$1
dir=$2
prev=${3:-}

head=$(gh pr view "$pr" --json headRefOid --jq .headRefOid)
mkdir -p "$dir"

# 직전 SHA가 PR HEAD의 조상일 때만 증분으로 뜬다. 리베이스·강제 푸시 뒤이거나 커밋이 디스크에 없으면 전체로 뜬다.
if [ -n "$prev" ] && git merge-base --is-ancestor "$prev" "$head" 2>/dev/null; then
  range=incremental
  git diff "$prev" "$head" >"$dir/review.diff"
else
  range=full
  gh pr diff "$pr" >"$dir/review.diff"
fi

echo "$head" >"$dir/head.txt"

echo "range: $range"
echo "head: $head"
echo "diff: $dir/review.diff ($(wc -l <"$dir/review.diff" | tr -d ' ') lines)"
