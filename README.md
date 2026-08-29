# claude-sync

Claude Code 글로벌 설정 저장소. `~/.claude/`는 실제 폴더로 두고, 관리 대상 항목만 그 안으로 **심링크**한다. Claude Code는 항상 `~/.claude/` 아래 고정 경로에서 읽으므로, 저장소를 어디에 clone하든(기기마다 달라도) 심링크가 그 위치 차이를 흡수한다.

## SETTINGS

1. 이 저장소를 fork하고, 원하는 곳에 clone
2. Claude Code 설치 및 로그인
3. Claude에게 **"SETTING_GUIDE.md 읽고 실행"** 명령

Claude sync 세팅은 Claude가 [SETTING_GUIDE.md](SETTING_GUIDE.md)를 따라 처리한다.

> [SETTING_GUIDE.md](SETTING_GUIDE.md)은 `ln`·`mv`·`mkdir`·`find`·`git` 명령으로 이루어진다. 기존 settings.json의 `permissions.deny`에 이 명령들(또는 `Bash(*)`, `Write(//Users/…/.claude/**)` 같은 넓은 규칙)이 걸려 있으면 **3단계가 중간에 멈춘다.**


## STRUCTURE

### GLOBAL CLAUDE `~/.claude/`

```s
~/.claude/                                                    # 실제 폴더
├── agents/ commands/ hooks/ rules/ skills/ templates/        → claude-sync로 심링크
├── CLAUDE.md  settings.json                                  → claude-sync로 심링크
├── CLAUDE.local.md  settings.local.json                      → claude-sync로 심링크 (gitignore 대상)
└── sessions/ projects/ plugins/ history.jsonl ...            # Claude Code 런타임, git이 모름
```

기기 전용 오버라이드 2개(`CLAUDE.local.md`, `settings.local.json`)도 저장소를 거쳐 연결하되 gitignore 대상이라 **내용은 커밋되지 않는다.**
공유되는 건 "그 자리에 파일이 있다"는 구조뿐이고, 내용은 기기마다 다르다.
편집 지점이 저장소 폴더 하나로 통일되는 게 이 방식의 이점이다.

> 단, gitignore 대상이므로 `git clean -dfx`를 돌리면 이 두 파일은 지워진다.

### REPOSITORY

```s
claude-sync/               # 설정 저장소
├── rules/                 # 항상 적용되는 규율 (세션 시작 시 자동 로드)
├── skills/                # 상황별 절차 (필요할 때만 로드, `/이름`으로 직접 호출)
├── templates/             # 문서 작성 시 참고할 템플릿
├── hooks/                 # settings.json에 등록된 훅 스크립트
├── agents/                # 커스텀 서브에이전트 정의
├── commands/              # 커스텀 슬래시 커맨드
├── CLAUDE.md              # Claude 응답·행동 규칙
├── settings.json          # Claude Code 앱 설정 — 테마·권한·훅 등록 등
├── CLAUDE.local.md        # 기기 전용 규칙      ┐ gitignore — 커밋 안 됨,
├── settings.local.json    # 기기 전용 앱 설정   ┘ 기기마다 내용이 다름
├── SETTING_GUIDE.md       # Claude가 읽고 실행하는 세팅 절차 (심링크 대상 아님)
└── README.md              # 이 문서 (심링크 대상 아님)
```

session, log 등이 쌓이는 `~/.claude/` 폴더 대신 클론된 디렉터리에서 claude 설정을 다룰 수 있다.

## [CLAUDE.md](./CLAUDE.md)

어떤 요청에 어떤 skill을 호출할지 정하는 SKILL ROUTING CONVENTION만 담는다. 응답 방식·조회 방식·작업 절차(주제와 무관하게 **설계 → 보고 → 진행 → 검증 → 완료** 순으로 진행하되, 단순 조회·질문·한 줄 수정엔 적용하지 않는다) 같은, 항상 적용되는 규율은 여기 없고 `rules/`에 있다.

- 개인적인 작업 규칙을 두 곳에 나눠 담는다. **항상 적용되는 규율은 `rules/`**, **특정 상황에서만 필요한 절차는 `skills/`** 이다. `rules/`는 세션 시작 시 자동으로 로드되고, `skills/`는 `CLAUDE.md`의 SKILL ROUTING CONVENTION 표에 따라 호출된다.
- 자세한 내용은 [CLAUDE.md](./CLAUDE.md)에서 확인할 수 있다.
