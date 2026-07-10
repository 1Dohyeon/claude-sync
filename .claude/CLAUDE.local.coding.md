# SESSION MD

> 코딩 작업 모드의 마스터. setup 시 워크스페이스 루트에 `CLAUDE.local.md`(SESSION MD)로 복사된다. 사용자는 이 규칙을 'SESSION MD'라고 부른다.
> 절대규칙(`RESPONSE RULE`·`USER REQUESTS`·`GLOBAL RULE`)과 라우팅·setup 절차는 'GLOBAL CLAUDE MD'가 상시 로드하므로 **여기서 반복하지 않는다.** 이 문서엔 코딩 작업 고유 규칙만 둔다.

## USER'S WORKSPACE

작업 공간은 **멀티레포** 또는 **모노레포** 두 형태다.

**멀티레포** — repo가 여러 개
```
work_space/           # 루트 워크 폴더 = 세션 cwd
├── CLAUDE.md         # WORK CLAUDE MD
├── CLAUDE.local.md   # SESSION MD (setup 시 이 파일로 복사·생성됨)
├── .claude/          # 클로드 작업 세팅
├── .claude-docs/     # AI 작업 기록 (아래 ### 참조)
├── .docs/            # 사용자 개인 작업 문서. AI는 안 만들고 참고만. (없을 수도)
├── <repo A>/         # 실제 프로젝트(대체로 git). ex: project-back
│   └── CLAUDE.md
└── <repo B>/         # ex: project-front
    └── CLAUDE.md
```

**모노레포** — repo 하나 안에 app이 여러 개
```
work_space/
├── CLAUDE.md · .claude/ · .claude-docs/ · .docs/   # 멀티레포와 동일
└── <repo>/           # repo 하나
    ├── CLAUDE.md
    └── apps/
        ├── api/      (└ CLAUDE.md)   # ex: 백엔드
        └── web/      (└ CLAUDE.md)   # ex: 프론트
```

- 이 문서에서 **'repo'는 작업이 갈리는 코드베이스 단위**를 뜻한다. 멀티레포면 각 repo, **모노레포면 repo 내부의 app**(워크스페이스, ex: `apps/api`·`apps/web`). 아래 규칙의 'repo'를 상황에 맞게 app으로 읽으면 된다.
- 멀티레포의 `<repo A>`·`<repo B>`, 또는 모노레포의 app들은 대체로 연관있다. (ex: front, back)
- `work_space/CLAUDE.md`: 사용자는 'WORK CLAUDE MD'라고 부른다
- `work_space/CLAUDE.local.md`: 사용자는 'SESSION MD'라고 부른다 (setup이 만드는 이번 세션의 모드 규칙)
- 각 repo(또는 app)의 `CLAUDE.md`: 사용자는 'REPO CLAUDE MD' or 'GIT CLAUDE MD'라고 부른다. (팀 공용: git 올라감)
- 모든 `CLAUDE.md` 파일은 읽기만 한다. 사용자 요청 없이는 생성·수정·삭제·이동하지 않는다. (단 `CLAUDE.local.md`(SESSION MD)는 setup이 관리 — 예외)

작업 시작 전, 아래 순서로 **필요한 문서만** 읽는다 (전부 미리 읽지 않음 — 토큰 절약).

1. 이번 작업이 **어떤 repo(모노레포면 app)를 건드리는지** 판별한다 (사용자 언급 / 대상 파일 경로 기준).
2. 그 repo(또는 app)의 `CLAUDE.md`(REPO CLAUDE MD)를 **반드시 먼저 읽는다.**
    - WORK CLAUDE.md가 라우팅해주지 않아도 항상 읽는다. (자동 로드 안 되므로)
3. **여러 repo/app을 함께** 다루면(ex: front+back) 관련된 것들의 CLAUDE.md를 각각 읽는다.
4. WORK CLAUDE.md에 하위 문서(`.claude-docs/`, 규칙 문서 등) 라우팅 지시가 있으면
   그에 따라 **해당 문서만** 추가로 읽는다.
5. 어떤 repo/app인지 판별이 안 되면 추측하지 말고 사용자에게 확인한다.

### .claude-docs

```
.claude-docs/
├── overview.md               # 도메인·구조 개요 (서비스 설명만 가볍게)
├── progress.md               # 현재 진행 중 목표 (최신·가볍게 유지)
├── chores.md                 # 목표로 안 묶이는 자잘한 단발 [ ] 모음
├── progresses/               # 완료된 progress 스냅샷 (목표 하나당 파일 하나, flat)
│   └── YYYYMMDD-<주제>.md     # 같은 날 주제 충돌 시에만 -HHmm. 여러 repo 걸치면 파일 안 `## [repo]:`로 구분
├── issues/                   # 복잡한 이슈 기록 (YYYYMMDD-<이슈>.md, 충돌 시 -HHmm) — 아래 ISSUE 자산화 참조
└── rules/                         # 현재 작업 공간의 규칙·양식 보관 (선택)
    ├── progress.template.md       # progress 작성 양식
    ├── progress.granularity.md    # progress 작업 단위 끊기 규칙
    └── issues.template.md         # 이슈 기록 양식
```

- 위 `.claude-docs/`은 기본 작업 폴더이다. (default)
- 위 구조는 **setup이 만든다**(GLOBAL의 SESSION SETUP 절차 참조). 세션 중엔 없는 항목만 추가로 채운다.
    - `overview.md`·`progress.md`는 **빈 파일**로 생성한다.
    - `chores.md`는 [chores.template.md](./chores.template.md) seed를 **복사해서** 생성한다.
    - `rules/`의 `progress.template.md`·`progress.granularity.md`·`issues.template.md`는 예외 — 빈 파일이 아니라 seed 원본을 보고 채워서 생성한다:
        - [progress.template.md](./progress.template.md)(작성 양식)
        - [progress.granularity.md](./progress.granularity.md)(작업 단위 끊기 규칙)
        - [issues.template.md](./issues.template.md)(이슈 기록 양식).
- `progress.md`은 지금 상황을 담는다: 진행 중 태스크·최신 결정·다음 할 일.
    - 작성 양식은 [progress.template.md](./progress.template.md)(작성 양식)와 같다. 
- `progress.md` 작업이 끝나면 내용을 `progresses/`로 옮기고(스냅샷), `progress.md`엔 현재 것만 남긴다.
    - 스냅샷은 **작업 목표(`#`) 하나당 파일 하나** — 목표가 여러 개면 파일을 나눈다.
    - 파일명은 `YYYYMMDD-<주제>` (날짜 = 이관 시각). **같은 날 같은 주제로 충돌할 때만** `-HHmm`을 덧붙인다.
    - **폴더로 나누지 않는다(flat).** 스냅샷이 여러 repo/app에 걸치면 파일 안에서 `## [repo]:`(모노레포면 `## [api]:`)로 구분한다.
- `chores.md`는 목표로 묶기 애매한 **단발 `[ ]`** 를 모은다 (오타·로그 제거 등).

> 주의: `.claude`와 `.claude-docs`는 다른 폴더임
> **세션 시작·`compact` 직후** `overview.md`(도메인·구조)와 `progress.md`(진행 중 작업)를 읽어 파악한다. (없거나 비어있을 수 있음)
> 위 내용 외의 `.claude-docs` 규칙은 WORK CLAUDE MD를 참고한다.

## ISSUE 자산화

1. `progress.md` 작업 중 이슈(에러)가 발생하면 중단하고 보고한다.
    - 단, 다음 작업을 해야만 에러가 해결된다면 다음 작업을 진행.(ex: 타입 미선언 이슈)
2. 보고 후 `chores.md`에 `[repo] issue:` 형태로 작성하고, 이슈 해결을 먼저 진행한다.(repo 구분 없다면 생략 가능)
    - 모노레포라면 `[api] issue:` 등 영역별로 구분.
3. 이슈가 간단하지 않거나, 바로 해결되지 않는 이슈라면 `.claude-docs/issues/YYYYMMDD-<이슈 내용>.md`로, `rules/issues.template.md` 양식에 맞춰 기록한다.
    - 간단한 이슈는 해결 후 체크박스 체크.
    - 이슈 해결 이후 '어떻게' 기준으로 해결 방법을 기록.

### '간단한 이슈'의 기준이란?

다음을 **모두** 만족하면 간단한 이슈 — `chores.md` 체크만 하고 `issues/` 파일은 만들지 않음.

- 원인이 바로 보인다 (조사 불필요)
- 한두 단계로 즉시 해결된다 (ex: 타입 미선언, import 누락, 오타, 린트 에러)
- 재발해도 다시 보면 바로 알 수 있어 따로 기록해둘 가치가 낮다

하나라도 어긋나면(원인 조사 필요 · 여러 번 시도 · 재발 대비 가치 있음) → `issues/` 파일로 기록.

## CODING (코드 변경 시)

> 사소한 작업엔 판단껏. 아래는 기본 태도.

- 요청 이상을 만들지 않는다: 안 시킨 기능·추상화·"설정 가능성"·불가능 케이스용 에러처리 넣지 않기.
- 50줄이면 될 걸 200줄로 쓰지 않는다. 과하면 다시 쓴다.
- 시킨 것만 건드린다: 주변 코드·주석·포맷을 요청 없이 "개선"하지 않고, 안 깨진 걸 리팩터링하지 않는다.
- 기존 코드 스타일을 따른다. (대체로 REPO CLAUDE MD에 규칙 적혀있다)
- 무관한 데드코드는 지우지 말고 언급만. 단, **내 변경이 만든** 고아(안 쓰는 import·변수)는 내가 치운다.
- 기준: 바뀐 모든 줄이 사용자 요청으로 직접 추적돼야 한다.
