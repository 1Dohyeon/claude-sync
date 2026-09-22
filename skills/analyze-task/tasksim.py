#!/usr/bin/env python3
# 요구사항 원문과 "비슷한 과거 태스크"를 worklog에서 찾는다.
# 태스크를 분석하기 전에 예전에 비슷한 걸 어떻게 풀었는지 참고하는 용도다.
#
#   python tasksim.py <repo> <쿼리 텍스트...>
#
# repo는 ~/.claude/worklog/<repo>/tasks/ 아래를 대상으로 한다.
# 문서 전체(제목+본문)를 Kiwi로 형태소 분석해 TF-IDF로 벡터화하고,
# 쿼리와 코사인 유사도가 높은 순으로 낸다. git 커밋과는 무관하다(그건 cochange.js의 몫).
#
# attention 기반 임베딩(문단 평균 풀링)도 시도해봤으나, 구체적 키워드 신호가
# 문서 전체 문체에 묻혀 변별력이 떨어지고 속도도 느려서 TF-IDF로 되돌렸다.
#
# kiwipiepy·scikit-learn·scipy가 없으면 분석을 멈추지 않고, 없다는 사실만 알리고 끝낸다.

import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

TOP_N = 8


def fail(msg: str):
    print(msg)
    sys.exit(0)  # 분석을 멈추게 하지 않는다. 신호가 없다는 것도 결과다.


try:
    from kiwipiepy import Kiwi
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError as e:
    fail(f"필요한 라이브러리가 없다({e.name}) — 유사 태스크 검색을 건너뛴다.")

args = sys.argv[1:]
if len(args) < 2:
    fail("사용법: python tasksim.py <repo> <쿼리 텍스트...>")

repo, *query_parts = args
query = " ".join(query_parts)

tasks_dir = Path.home() / ".claude" / "worklog" / repo / "tasks"
if not tasks_dir.is_dir():
    fail(f"worklog에 {repo} 저장소가 없다 — 유사 태스크 검색을 건너뛴다.")

CODE_BLOCK = re.compile(r"```[\s\S]*?```")


def is_primary(path: Path) -> bool:
    if path.name == "INDEX.md":
        return False
    return path.stem.count(".") == 0  # .work. / .api-spec. / .notion. 같은 변형 문서 제외


paths = sorted(p for p in tasks_dir.rglob("*.md") if is_primary(p))
if not paths:
    fail(f"{repo}에 비교할 task 문서가 없다 — 유사 태스크 검색을 건너뛴다.")

kiwi = Kiwi()
KEEP_TAGS = {"NNG", "NNP", "SL"}  # 일반명사·고유명사·외국어(영문 식별자)


def tokenize(text: str) -> str:
    text = CODE_BLOCK.sub(" ", text)
    tokens = [t.form for t in kiwi.tokenize(text) if t.tag in KEEP_TAGS and len(t.form) > 1]
    return " ".join(tokens)


docs = [tokenize(p.read_text(encoding="utf-8")) for p in paths]
names = [str(p.relative_to(tasks_dir)) for p in paths]

vec = TfidfVectorizer(min_df=1)
X = vec.fit_transform(docs)

query_vec = vec.transform([tokenize(query)])
sims = cosine_similarity(query_vec, X).ravel()
order = sims.argsort()[::-1]

print(f"{repo} · 문서 {len(paths)}개 · 쿼리 \"{query}\"")
for i in order[:TOP_N]:
    if sims[i] <= 0:
        break
    print(f"  {sims[i]:.3f}  {names[i]}")
