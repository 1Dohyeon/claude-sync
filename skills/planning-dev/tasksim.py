#!/usr/bin/env python3
# 요구사항 원문과 "비슷한 과거 태스크"를 worklog에서 찾는다.
# 태스크를 분석하기 전에 예전에 비슷한 걸 어떻게 풀었는지 참고하는 용도다.
#
#   python3 tasksim.py <repo> <쿼리 텍스트...>
#
# 두 구조를 함께 본다.
#   - 옛 task 문서: ~/.claude/worklog/<repo>/tasks/ 아래의 파일 하나가 문서 하나
#   - 계획 문서: ~/.claude/worklog/planning/{owner}/<repo>/ 와 planning/done/{owner}/<repo>/ 아래에서
#     requirements.md가 있는 폴더 하나가 문서 하나(requirements.md + design.md)
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

worklog_dir = Path.home() / ".claude" / "worklog"
tasks_dir = worklog_dir / repo / "tasks"
planning_dir = worklog_dir / "planning"


def is_primary(path: Path) -> bool:
    if path.name == "INDEX.md":
        return False
    return path.stem.count(".") == 0  # .work. / .api-spec. / .notion. 같은 변형 문서 제외


def plan_repo_dirs() -> list[Path]:
    dirs = []
    for base in (planning_dir, planning_dir / "done"):
        if not base.is_dir():
            continue
        for owner in sorted(base.iterdir()):
            if base == planning_dir and owner.name == "done":
                continue
            if (owner / repo).is_dir():
                dirs.append(owner / repo)
    return dirs


repo_dirs = plan_repo_dirs()
if not tasks_dir.is_dir() and not repo_dirs:
    fail(f"worklog에 {repo} 저장소가 없다 — 유사 태스크 검색을 건너뛴다.")

docs: list[str] = []
names: list[str] = []

if tasks_dir.is_dir():
    for p in sorted(p for p in tasks_dir.rglob("*.md") if is_primary(p)):
        docs.append(p.read_text(encoding="utf-8"))
        names.append(str(p.relative_to(tasks_dir)))

for repo_dir in repo_dirs:
    for req in sorted(repo_dir.rglob("requirements.md")):
        folder = req.parent
        text = req.read_text(encoding="utf-8")
        design = folder / "design.md"
        if design.is_file():
            text += "\n" + design.read_text(encoding="utf-8")
        docs.append(text)
        names.append(str(folder.relative_to(worklog_dir)))

if not docs:
    fail(f"{repo}에 비교할 문서가 없다 — 유사 태스크 검색을 건너뛴다.")

print(f"{repo} · 문서 {len(docs)}개 · 쿼리 \"{query}\"")
for i, sim in rank(docs, query):
    print(f"  {sim:.3f}  {names[i]}")
