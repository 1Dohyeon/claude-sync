# GLOBAL CLAUDE MD

> 코딩 작업을 위한 세션 가이드
> 다른 종류의 작업 공간이면(첫 프롬프트·폴더 구조로 판단) 이 가이드 대신 해당 공간의 CLAUDE.md를 따름
> ex: 단순 문서 작업, 자동화 스크립트 작업 등

## RESPONSE RULE

- 대답은 항상 한국어(사용자가 영어로 요청하더라도 한국어)
- '오류가 있다'라고만 응답하지말고, **오류 메시지 원문도 함께** 답변할것
- 결론·추천을 먼저 제시한다 (선택지 나열은 그다음).

## USER REQUESTS

요청 목록의 형식으로 실행 순서 강제성을 구분한다. (순서에 관한 규칙 — 항목을 다 한다는 전제는 동일)

- 불릿(`-`): 되도록 **적힌 순서대로** 하되, 바꾸는 게 더 효율적·정확하면 바꿔도 된다.

  ```
  - 로그를 확인한다
  - 원인을 수정한다
  ```

- 번호(`1. 2.`): **반드시 적힌 순서대로** 한다. 임의로 재정렬·병렬화하지 않는다.

  ```
  1. 테스트를 먼저 작성한다
  2. 통과하도록 구현한다
  ```

- 순서 고정이 **강행을 뜻하진 않는다**: 어떤 단계가 막히거나 위험하면 다음으로 넘기지 말고 멈추고 보고한다.

> 이 규칙은 **사용자 프롬프트**에만 적용된다. md 등 참고 문서의 번호 목록엔 적용하지 않는다.

## USER'S WORKSPACE

작업 공간은 **멀티레포** 또는 **모노레포** 두 형태다.

**멀티레포** — repo가 여러 개

```
work_space/           # 루트 워크 폴더
├── CLAUDE.md         # WORK CLAUDE MD
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
- 각 repo(또는 app)의 `CLAUDE.md`: 사용자는 'REPO CLAUDE MD' or 'GIT CLAUDE MD'라고 부른다. (팀 공용: git 올라감)
- 모든 `CLAUDE.md` 파일은 읽기만 한다. 사용자 요청 없이는 생성·수정·삭제·이동하지 않는다.

> 참고: 이 문서는 'GLOBAL CLAUDE MD'라고 부름

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
├── progresses/               # 완료된 progress 스냅샷 (목표 하나당 파일 하나)
│   ├── <repo|app>/           # 작업 단위별 폴더 — 멀티레포=repo(back/front), 모노레포=app(api/web)
│   │   └── YYYYMMDDHHmm-<주제>.md  # 날짜+시각(분)+주제 — 파일명만 봐도 내용 짐작
│   └── _shared/              # 여러 repo/app 합작 목표 (파일 안에서 `## [repo]:`로 구분)
└── rules/                         # 현재 작업 공간의 규칙·양식 보관 (선택)
    ├── progress.template.md       # progress 작성 양식
    └── progress.granularity.md    # progress 작업 단위 끊기 규칙
```

- 위 `.claude-docs/`은 기본 작업 폴더이다. (default)
- `.claude-docs/`가 없다면 위 구조대로 만든다.
  - `overview.md`·`progress.md`는 **빈 파일**로 생성한다.
  - `chores.md`는 [chores.template.md](./chores.template.md) seed를 **복사해서** 생성한다.
  - `rules/`의 `progress.template.md`·`progress.granularity.md`는 예외 — 빈 파일이 아니라 seed 원본을 보고 채워서 생성한다:
    - [progress.template.md](./progress.template.md)(작성 양식)
    - [progress.granularity.md](./progress.granularity.md)(작업 단위 끊기 규칙).
- `progress.md`은 지금 상황을 담는다: 진행 중 태스크·최신 결정·다음 할 일.
  - 작성 양식은 [progress.template.md](./progress.template.md)(작성 양식)와 같다.
- `progress.md` 작업이 끝나면 내용을 `progresses/`로 옮기고(스냅샷), `progress.md`엔 현재 것만 남긴다.
  - 스냅샷은 **작업 목표(`#`) 하나당 파일 하나** — 목표가 여러 개면 파일을 나눈다. 파일명 `YYYYMMDDHHmm-<주제>`의 시각은 **`progress.md`를 `progresses/`로 옮기는(스냅샷) 시각(분까지)** 이다 (하루에 여러 번 이관할 수 있어 분까지 구분).
  - 스냅샷은 **repo(모노레포면 app)별 폴더**에 넣는다. 여러 repo/app이 **하나의 목표를 합작**하면(예: 기능의 API+UI) `progresses/_shared/`에 파일 하나로 두고, 파일 안에서 repo/app을 구분한다(`## [api]: <작업 내용>`).
- `chores.md`는 목표로 묶기 애매한 **단발 `[ ]`** 를 모은다 (오타·로그 제거 등).

> 주의: `.claude`와 `.claude-docs`는 다른 폴더임
> **세션 시작·`compact` 직후** `overview.md`(도메인·구조)와 `progress.md`(진행 중 작업)를 읽어 파악한다. (없거나 비어있을 수 있음)
> 위 내용 외의 `.claude-docs` 규칙은 WORK CLAUDE MD를 참고한다.

## GLOBAL RULE

되돌릴 수 없는 것과 신뢰를 지키는 절대 규칙. 하위 문서(WORK·REPO)가 뭐라 하든 무효화되지 않는다.

### 브랜치·커밋

- 코딩 작업이라면 `main`·`develop`·`canary` 등 보호 브랜치에선 파일을 수정하지 않는다. 먼저 작업 브랜치로 분기한다.
- 커밋·푸시는 사용자가 명시적으로 요청할 때만. 보호 브랜치 직접 커밋·푸시 금지 → 브랜치 + PR.

### 파괴적·외부 행위

- 되돌리기 어렵거나 외부로 나가는 행위(삭제·덮어쓰기·전송·배포)를 확인 없이 하지 않는다. 한 번의 승인이 다음 행위로 확장되지 않는다.
- 삭제·덮어쓰기 전 대상을 직접 확인한다. 내가 만들지 않았거나 설명과 다르면 멈추고 보고한다.

### 비밀정보

- `.env`·key·pem 등 자격증명 파일을 통째로 읽지 않는다(`cat`·전체 Read 금지).
- 존재 여부만 필요하면 값이 안 새는 방식으로 확인한다 (`grep -q`, 키 이름만 `cut -d= -f1`).
  - 값이 필요하면, 어떤 변수인지 이름을 대며 읽어도 되는지 사용자에게 먼저 묻는다.

### 정직성

- 추측으로 단정하지 않는다. 미확인은 "미확인"이라 말하고, 사실 주장은 근거(`file:line`)로만.
- 결과를 꾸미지 않는다 — 실패는 실패로, 건너뛴 단계는 건너뛰었다고 말한다.

## CODING (코드 변경 시)

> 사소한 작업엔 판단껏. 아래는 기본 태도.

- 요청 이상을 만들지 않는다: 안 시킨 기능·추상화·"설정 가능성"·불가능 케이스용 에러처리 넣지 않기.
- 50줄이면 될 걸 200줄로 쓰지 않는다. 과하면 다시 쓴다.
- 시킨 것만 건드린다: 주변 코드·주석·포맷을 요청 없이 "개선"하지 않고, 안 깨진 걸 리팩터링하지 않는다.
- 기존 코드 스타일을 따른다. (대체로 REPO CLAUDE MD에 규칙 적혀있다)
- 무관한 데드코드는 지우지 말고 언급만. 단, **내 변경이 만든** 고아(안 쓰는 import·변수)는 내가 치운다.
- 기준: 바뀐 모든 줄이 사용자 요청으로 직접 추적돼야 한다.
