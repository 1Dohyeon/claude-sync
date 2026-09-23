#!/usr/bin/env python3
# 요구사항 원문과 "비슷한 과거 태스크"를 worklog에서 찾는다.
# 태스크를 분석하기 전에 예전에 비슷한 걸 어떻게 풀었는지 참고하는 용도다.
#
#   python3 tasksim.py <repo> <쿼리 텍스트...>
#
# repo는 ~/.claude/worklog/<repo>/tasks/ 아래를 대상으로 한다.
# 여기서는 문서를 모으기만 하고, 순위 계산은 tasksim_core.py가 맡는다.
# git 커밋·PR은 보지 않는다(비슷한 PR·커밋은 prsim.py, 파일 동반 관계는 cochange.js의 몫).

import sys
from pathlib import Path

from tasksim_core import fail, rank

args = sys.argv[1:]
if len(args) < 2:
    fail("사용법: python3 tasksim.py <repo> <쿼리 텍스트...>")

repo, *query_parts = args
query = " ".join(query_parts)

tasks_dir = Path.home() / ".claude" / "worklog" / repo / "tasks"
if not tasks_dir.is_dir():
    fail(f"worklog에 {repo} 저장소가 없다 — 유사 태스크 검색을 건너뛴다.")


def is_primary(path: Path) -> bool:
    if path.name == "INDEX.md":
        return False
    return path.stem.count(".") == 0  # .work. / .api-spec. / .notion. 같은 변형 문서 제외


paths = sorted(p for p in tasks_dir.rglob("*.md") if is_primary(p))
if not paths:
    fail(f"{repo}에 비교할 task 문서가 없다 — 유사 태스크 검색을 건너뛴다.")

docs = [p.read_text(encoding="utf-8") for p in paths]
names = [str(p.relative_to(tasks_dir)) for p in paths]

print(f"{repo} · 문서 {len(paths)}개 · 쿼리 \"{query}\"")
for i, sim in rank(docs, query):
    print(f"  {sim:.3f}  {names[i]}")
