#!/usr/bin/env python3
# 요구사항 요약과 비슷한 과거 계획을 찾아, 관련 부분을 원문 그대로 발췌해 낸다.
# 해석하지 않는다. 무엇을 적용할지는 이 결과를 받은 쪽이 정한다.
#
#   python3 plan_research.py --repo <repo> --summary "<요약>" [--model <모델 ID>]
#
# 검색은 같은 폴더의 tasksim.py로 한다. 세션을 연 앱이 검색 기능을 주면 이 스크립트를 쓰지 않는다.
# Messages API 키는 이 저장소 최상위 .env(git 제외)의 ANTHROPIC_API_KEY만 쓴다. 셸 환경변수는 보지 않는다.
# ~/.claude/skills는 이 저장소로 가는 심링크라서, 경로는 이 파일의 실제 위치에서 구한다.
#
# 종료 코드: 0 정상(관련 계획 없음, 검색 실패 포함), 2 인자 오류, 3 키 또는 anthropic 패키지 없음, 4 API 호출 실패

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

HOOKS_DIR = Path(__file__).resolve().parent
ENV_FILE = HOOKS_DIR.parents[2] / ".env"
PLANS_DIR = Path.home() / "plans"
DEFAULT_MODEL = "claude-haiku-5-5"

MAX_PLANS = 3
MAX_QUOTES = 3
MAX_QUOTE_CHARS = 300
MAX_CANDIDATES = 5
TASKSIM_MIN_SCORE = 0.1
COMMAND_TIMEOUT = 60

EXIT_NO_KEY = 3
EXIT_API = 4


def normalize(text):
    return " ".join(text.split())


def verify_quotes(quotes, source):
    """원문에 그대로 있는 인용만 남긴다. 연속 공백 차이는 같은 것으로 본다."""
    normalized_source = normalize(source)
    kept = []
    dropped = 0
    for quote in quotes:
        text = normalize(quote.get("text", ""))
        if not text or len(text) > MAX_QUOTE_CHARS or text not in normalized_source:
            dropped += 1
            continue
        kept.append(quote)
    return kept, dropped


def read_api_key():
    if not ENV_FILE.is_file():
        return None
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("ANTHROPIC_API_KEY="):
            value = line.split("=", 1)[1].strip().strip("'\"")
            return value or None
    return None


def run(command):
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=COMMAND_TIMEOUT)
    except FileNotFoundError as error:
        return False, str(error)
    except subprocess.TimeoutExpired:
        return False, f"{COMMAND_TIMEOUT}초 안에 끝나지 않음"
    output = (result.stdout + result.stderr).strip()
    return result.returncode == 0, output


class Model:
    def __init__(self, client, model):
        self.client = client
        self.model = model
        self.calls = 0
        self.input_tokens = 0
        self.output_tokens = 0

    def ask(self, prompt, schema):
        response = self.client.messages.create(
            model=self.model,
            max_tokens=16000,
            output_config={"effort": "low", "format": {"type": "json_schema", "schema": schema}},
            messages=[{"role": "user", "content": prompt}],
        )
        self.calls += 1
        self.input_tokens += response.usage.input_tokens
        self.output_tokens += response.usage.output_tokens
        if response.stop_reason in ("refusal", "max_tokens"):
            raise RuntimeError(f"모델 응답이 끝나지 않음: stop_reason={response.stop_reason}")
        text = next(block.text for block in response.content if block.type == "text")
        return json.loads(text)


def object_schema(properties):
    return {
        "type": "object",
        "properties": properties,
        "required": list(properties),
        "additionalProperties": False,
    }


QUERIES_SCHEMA = object_schema({"queries": {"type": "array", "items": {"type": "string"}}})

QUOTE_SCHEMA = object_schema({
    "source": {"type": "string"},
    "heading": {"type": "string"},
    "text": {"type": "string"},
})

PLANS_SCHEMA = object_schema({
    "plans": {
        "type": "array",
        "items": object_schema({
            "id": {"type": "string"},
            "title": {"type": "string"},
            "shared": {"type": "string"},
            "reason": {"type": "string"},
            "quotes": {"type": "array", "items": QUOTE_SCHEMA},
        }),
    },
})


def make_queries(model, summary):
    prompt = (
        "아래 작업 요약과 비슷한 과거 계획 문서를 찾으려 한다. 검색 질의를 3~5개 만들어라.\n"
        "- 한국어와 영어, 핵심 용어와 풀어 쓴 표현을 섞는다.\n"
        "- 질의 하나는 2~4단어로 짧게 둔다.\n\n"
        f"작업 요약:\n{summary}"
    )
    queries = [q.strip() for q in model.ask(prompt, QUERIES_SCHEMA)["queries"] if q.strip()]
    return queries[:5]


def search_tasksim(repo, queries):
    """(후보 목록, 실패 이유)를 돌려준다."""
    words = " ".join(queries).split()
    ok, output = run([sys.executable, str(HOOKS_DIR / "tasksim.py"), repo, *words])
    hits = []
    for line in output.splitlines():
        match = re.match(r"^\s+([0-9.]+)\s+(\S.*)$", line)
        if match:
            hits.append((float(match.group(1)), match.group(2).strip()))
    if not ok or not hits:
        return None, "tasksim 실패: " + (output.splitlines()[0] if output else "출력 없음")

    candidates = []
    for score, folder in hits:
        if score < TASKSIM_MIN_SCORE or len(candidates) >= MAX_CANDIDATES:
            continue
        path = PLANS_DIR / folder
        names = ["requirements.md", "design.md"] if (path / "requirements.md").is_file() else ["tasks.md"]
        parts = [f"## {name}\n\n{(path / name).read_text(encoding='utf-8')}" for name in names if (path / name).is_file()]
        if parts:
            candidates.append({"id": folder, "text": "\n\n".join(parts)})
    return candidates, None


def extract(model, summary, candidates):
    blocks = "\n\n".join(f"<plan id=\"{c['id']}\">\n{c['text']}\n</plan>" for c in candidates)
    prompt = (
        "아래 작업 요약과 관련 있는 과거 계획을 골라, 관련 부분을 원문 그대로 옮겨라.\n"
        f"- 관련 있는 계획만 최대 {MAX_PLANS}개 고른다. 관련 있다는 것은 같은 기능, 같은 데이터, 같은 코드 영역을 다뤄서 "
        "이번 작업에 그대로 참고할 결정이 있다는 뜻이다. 주제나 단어가 비슷해 보이기만 하거나, 후보 가운데 그나마 가까운 것은 넣지 않는다. "
        "확실하지 않으면 뺀다. 그런 계획이 없으면 plans를 비운다.\n"
        "- shared에는 작업 요약과 그 계획이 함께 다루는 구체적인 대상(기능 이름, 테이블, API, 화면, 모듈)을 적는다. "
        "'배지', '알림', '검색'처럼 단어만 같고 대상이 다르면 함께 다루는 것이 아니다. 적을 대상이 없으면 빈 문자열로 둔다.\n"
        "- id는 <plan id=\"...\">의 값을 그대로 쓴다. title은 저장소와 브랜치를 알 수 있으면 그것으로, 아니면 id로 쓴다.\n"
        "- reason에는 왜 관련 있는지 한 줄만 쓴다.\n"
        f"- quotes는 계획마다 최대 {MAX_QUOTES}개, 하나는 {MAX_QUOTE_CHARS}자 이내다. text는 원문을 한 글자도 바꾸지 않고 연속된 부분을 그대로 옮긴다. "
        "줄이거나 바꿔 쓰거나 중간을 생략하지 않는다. source는 그 인용이 있는 파일이나 문서 이름, heading은 가장 가까운 제목이다.\n"
        "- 이번 작업에 무엇을 적용할지, 권고, 요약은 쓰지 않는다.\n\n"
        f"작업 요약:\n{summary}\n\n{blocks}"
    )
    return model.ask(prompt, PLANS_SCHEMA)["plans"]


def render(route, reason, queries, plans, checked, dropped, model):
    lines = [f"경로: {route} ({reason})", "질의: " + ", ".join(f'"{q}"' for q in queries), ""]
    if route == "검색 실패":
        lines.append("검색 실패")
    elif not plans:
        lines.append("관련 계획 없음")
    for index, plan in enumerate(plans, 1):
        lines += [
            f"### {index}. {plan['title']}",
            f"- 식별자: {plan['id']}",
            f"- 함께 다루는 대상: {plan['shared']}",
            f"- 관련 근거: {plan['reason']}",
            "- 발췌:",
        ]
        for quote in plan["quotes"]:
            lines += [f"  - [{quote['source']}] {quote['heading']}", f"    > {normalize(quote['text'])}"]
        lines.append("")
    if checked:
        lines.append(f"검증: 인용 {checked}개 중 {checked - dropped}개 원문 일치 (버림 {dropped})")
    lines.append(
        f"사용량: 입력 {model.input_tokens:,} / 출력 {model.output_tokens:,} 토큰 ({model.model}, 호출 {model.calls}회)"
    )
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="과거 계획에서 관련 부분을 원문 그대로 발췌한다.")
    parser.add_argument("--repo", required=True)
    parser.add_argument("--summary", required=True)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    args = parser.parse_args()

    try:
        import anthropic
    except ImportError:
        print("anthropic 패키지가 없다. python3 -m pip install anthropic", file=sys.stderr)
        return EXIT_NO_KEY
    api_key = read_api_key()
    if not api_key:
        print(f"{ENV_FILE}에 ANTHROPIC_API_KEY가 없다", file=sys.stderr)
        return EXIT_NO_KEY

    model = Model(anthropic.Anthropic(api_key=api_key), args.model)
    try:
        queries = make_queries(model, args.summary)

        candidates, failure = search_tasksim(args.repo, queries)
        if candidates is None:
            print(render("검색 실패", failure, queries, [], 0, 0, model))
            return 0

        plans, checked, dropped = [], 0, 0
        if candidates:
            sources = {c["id"]: c["text"] for c in candidates}
            for plan in extract(model, args.summary, candidates)[:MAX_PLANS]:
                if plan["id"] not in sources or not plan["shared"].strip():
                    continue
                quotes = plan["quotes"][:MAX_QUOTES]
                kept, lost = verify_quotes(quotes, sources[plan["id"]])
                checked += len(quotes)
                dropped += lost
                if kept:
                    plans.append({**plan, "quotes": kept})
    except anthropic.APIError as error:
        print(f"Messages API 호출 실패: {error}", file=sys.stderr)
        return EXIT_API
    except RuntimeError as error:
        print(str(error), file=sys.stderr)
        return EXIT_API

    print(render("tasksim", "tasksim.py로 찾음", queries, plans, checked, dropped, model))
    return 0


if __name__ == "__main__":
    sys.exit(main())
