# claude(`~/.claude/`)

Claude Code 글로벌 설정입니다. 저장소는 각 컴퓨터에 `clone`으로 받아두고, 실제 사용할 `~/.claude/`는 이 저장소의 **루트**를 가리키도록 심링크합니다.

> 저장소: [1Dohyeon/.claude-sync](https://github.com/1Dohyeon/.claude-sync)

## 연결 방법

1. **기존 설정 백업**

   ```bash
   mv ~/.claude ~/.claude.backup
   ```

   `rm`으로 지우지 마세요. 기존 `~/.claude/`에는 인증정보(`.credentials.json`)와 세션 기록이 들어 있습니다.

2. **심링크 연결 후 확인**

   ```bash
   ln -s /absolute/path/to/claude-sync ~/.claude
   ls -ld ~/.claude
   ```

   반드시 **절대경로**를 씁니다. 상대경로로 걸면 링크가 깨집니다. 1번을 건너뛰면 `ln`이 에러 없이 `~/.claude/claude-sync`라는 중첩 심링크를 만들어, 겉보기엔 성공했는데 아무것도 동작하지 않는 상태가 됩니다 — 그래서 `ls -ld`로 확인합니다.

3. **개인화** — clone한 그대로는 제 설정입니다. 아래 3개만 고치면 자기 것이 됩니다.

   - `CLAUDE.md`의 `RESPONSE RULE` — 응답 언어·톤
   - `settings.json`의 `permissions` — 자동 허용할 명령
   - `docs/` remote — 아래 참고

추가 의존성은 없습니다. 훅이 `sh`와 `git`만 쓰므로 별도 런타임 설치가 필요하지 않습니다.

## 구조

```s
.claude-sync(~/.claude)/    # ~/.claude로 심링크되는 저장소 루트
├── docs/                   # repo별 작업 문서 - 별도 private repo, 루트 repo에선 gitignore
├── .rules/                 # 작업 시 지켜야 할 규율 (git)
├── .templates/             # 문서 작성 시 참고할 템플릿 (git)
├── hooks/                  # settings.json에 등록된 훅 스크립트 (git)
├── agents/                 # 커스텀 서브에이전트 정의 (git)
├── commands/               # 커스텀 슬래시 커맨드 (git)
├── CLAUDE.md               # Claude 응답·행동 규칙 (git)
├── settings.json           # Claude Code 앱 설정 - 테마·권한·훅 등록 등 (git)
└── CLAUDE.local.md         # 응답·행동 규칙의 기기별 오버라이드/추가 (gitignore)
```

> `docs/` 안 폴더 구조는 해당 repository에 없음(private 작업 기록)

`hooks/`에는 두 개가 있습니다.

- **`save-docs.sh`** — `SessionEnd` 훅. 아래 "`docs/` 관리" 참고.
- **`vendor-bridge.sh`** — 서드파티 도구(orca 등)가 등록하는 훅·statusLine의 단일 진입점. 기기·OS마다 다른 스크립트 경로 탐색을 여기서 흡수해 `settings.json`에 절대경로가 남지 않게 합니다. 해당 도구가 없는 기기에서는 조용히 통과합니다.

> **기기별 오버라이드는 `CLAUDE.md`만 가능합니다.** `settings.json`의 캐스케이드는 `~/.claude/settings.json`(user) → `.claude/settings.json`(project) → `.claude/settings.local.json`(project local) 순서라, **`~/.claude/settings.local.json`은 읽히지 않습니다.** 앱 설정의 기기별 차이는 `settings.json`을 기기 무관하게 작성해 흡수하거나(예: `$HOME` 사용), 프로젝트 레벨에 둬야 합니다.

## `docs` 구조

`docs/` 폴더는 repo별로 다음 구조대로 정리합니다.

```
.claude-sync(~/.claude)/
└── docs/
    └── <repo>/                     # global 세팅이라 여러 저장소가 공유 - repo별로 분리
```

- **`<repo>` 값**: `git remote get-url origin`로 매번 직접 계산(실제 repo 이름)
  - git 저장소가 아니면 docs 관련 동작은 건너뜀
- `docs/`는 실제 작업 내용이라 루트 repo에 커밋 안 됨

### `docs/<repo>` 구조

```
.claude-sync(~/.claude)/docs/<repo>/
├── overview.md             # 해당 repo의 서비스 도메인 이해를 돕는 정적 문서
└── tasks/
    ├── <branch>.md         # 병렬 task 작업을 위해 branch별로 분리 (진행 중인 task)
    └── done/
        └── <branch>-YYYYMMDD.md   # 완료된 task를 옮겨두는 곳
```

- **`<repo>/overview.md`**: 해당 repo가 어떤 서비스·도메인인지 이해하기 위한 문서. 세션에서 첫 작업 요청을 받을 때 Claude가 직접 Read 합니다(`CLAUDE.md`의 ROUTING CONVENTION).
- **`tasks/<branch>.md`**: 보통 브랜치 하나는 task 하나를 뜻하므로 브랜치 이름으로 task 관리
  - **`<branch>` 값**: `git rev-parse --abbrev-ref HEAD`로 매번 직접 계산(실제 브랜치 이름)
  - 클로드는 해당 브랜치에서 작업하는 일을 설계하여 참고하며 작업
- **`tasks/done/<branch>-YYYYMMDD.md`**: task 완료 시 `tasks/<branch>.md`를 여기로 옮김(`mv`)
  - 나중에 같은 브랜치명을 재사용해도 예전 완료 기록과 섞이지 않음

> Claude가 tasks를 어떻게 관리하는지는 [CLAUDE.md의 HOW TO WORK](CLAUDE.md#how-to-work)를 참고하세요.

## `docs/` 관리 — 스냅샷

`docs/`를 **git repo로 관리할지는 선택**입니다. 루트 repo에선 gitignore라 커밋되지 않으므로, 자체 remote를 붙여 따로 커밋/푸시하면 여러 기기에서 작업기록이 동기화됩니다. **repo로 안 써도 됩니다**(그냥 로컬 문서로만 둬도 동작).

- **`SessionEnd` → `hooks/save-docs.sh`**: 세션 종료 시 `docs/`의 현재 상태를 커밋·푸시(스냅샷).
- **`/save-docs [repo]`**: 같은 스냅샷을 수동으로 실행(훅 미발동 대비). repo명을 주면 그 repo만, 없으면 전체.

둘 다 다음 원칙을 지킵니다 — **`docs/`가 git repo가 아니면 조용히 통과**, 변경이 없으면 빈 커밋을 만들지 않음, 오프라인·충돌·에러여도 **세션을 절대 막지 않음**(push는 15초 후 중단하고 로컬 커밋만 남김).

> 스냅샷은 push 전용입니다. pull은 하지 않으므로, 여러 기기를 쓴다면 세션 시작 전에 `git -C ~/.claude/docs pull`을 직접 해주는 편이 안전합니다.
