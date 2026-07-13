# claude-sync

Claude Code 글로벌 설정입니다. 저장소는 각 컴퓨터에 `clone`으로 받아두고, 실제 사용할 `~/.claude/`는 이 저장소의 **루트**를 가리키도록 심링크합니다.

> 저장소 주소: [1Dohyeon/.claude-sync](https://github.com/1Dohyeon/.claude-sync)

## 연결 방법

1. **Node.js 설치 확인** - `hooks/`의 훅 스크립트가 모두 `.js`로 작성되어 있고 `node`로 실행되므로, 연결할 기기에 Node.js가 먼저 설치되어 있어야 합니다.
2. **clone 후 심링크 연결** - 절차는 [meta/setup.md](meta/setup.md) 참고.

## 구조

```
.claude-sync(~/.claude)/    # ~/.claude로 심링크되는 저장소 루트
├── docs/                   # repo별 작업 문서 - 별도 private repo, 루트 repo에선 gitignore
├── .rules/                 # 작업 시 지켜야 할 규율 (git)
├── .templates/             # 문서 작성 시 참고할 템플릿 (git)
├── hooks/                  # settings.json에 등록된 훅 진입점만 (git)
├── utils/                  # 훅들이 공유하는 헬퍼 로직 (git)
├── agents/                 # 커스텀 서브에이전트 정의 (git)
├── commands/               # 커스텀 슬래시 커맨드 (git)
├── CLAUDE.md               # Claude 응답·행동 규칙 (git)
├── settings.json           # Claude Code 앱 설정 - 테마·업데이트 채널·권한 허용 목록 등 (git)
├── CLAUDE.local.md         # 응답·행동 규칙의 기기별 오버라이드/추가 (gitignore)
└── settings.local.json     # 앱 설정의 기기별 오버라이드 (필요 시, gitignore)
```

> `docs/` 안 폴더 구조는 해당 repository에 없음(private 작업 기록)

## `docs` 구조

`docs/` 폴더는 repo별로 다음 구조대로 정리합니다.

```
.claude-sync(~/.claude)/
└── docs/
    └── <repo>/                     # global 세팅이라 여러 저장소가 공유 - repo별로 분리
```

- **`<repo>` 값**: `git remote get-url origin`로 매번 직접 계산(실제 repo 이름)
  - git 저장소가 아니면 관련 훅은 조용히 통과
- `docs/`는 실제 작업 내용이라 커밋 안 됨

### `docs/<repo>` 구조

```
.claude-sync(~/.claude)/docs/<repo>/
├── overview.md             # 해당 repo의 서비스 도메인 이해를 돕는 정적 문서
└── tasks/
    ├── <branch>.md         # 병렬 task 작업을 위해 branch별로 분리 (진행 중인 task)
    └── done/
        └── <branch>-YYYYMMDD.md   # 완료된 task를 옮겨두는 곳
```

- **`<repo>/overview.md`**: 해당 repo가 어떤 서비스·도메인인지 이해하기 위한 문서.(훅을 통해 세션 시작 시 항상 주입됨)
- **`tasks/<branch>.md`**: 보통 브랜치 하나는 task 하나를 뜻하므로 브랜치 이름으로 task 관리
  - **`<branch>` 값**: `git rev-parse --abbrev-ref HEAD`로 매번 직접 계산(실제 브랜치 이름)
  - 클로드는 해당 브랜치에서 작업하는 일을 설계하여 참고하며 작업
- **`tasks/done/<branch>-YYYYMMDD.md`**: task 완료 시 `tasks/<branch>.md`를 여기로 옮김(`mv`)
  - 나중에 재사용해도 예전 완료 같은 브랜치명을 기록이 안 섞임

> Claude가 tasks를 어떻게 관리하는지는 [CLAUDE.md의 HOW TO WORK](CLAUDE.md#how-to-work)를 참고하세요.
