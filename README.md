# claude-sync

Claude Code 개인 설정을 관리하고, `~/.claude/`에 심링크로 연결해 쓰는 저장소입니다.

## Install

Claude에게 아래 한 줄을 그대로 전달합니다.

```
https://github.com/1Dohyeon/claude-sync 읽고 설치해줘
```

설치 절차는 Claude가 [SETTING_GUIDE.md](SETTING_GUIDE.md)를 따라 진행합니다.



## Symlink `~/.claude/`

```s
~/.claude/                                                    # 실제 폴더
├── agents/ commands/ hooks/ rules/ skills/ templates/        # → claude-sync로 심링크
├── CLAUDE.md  settings.json                                  # → claude-sync로 심링크
├── CLAUDE.local.md  settings.local.json                      # → claude-sync로 심링크 (gitignore 대상)
└── sessions/ projects/ plugins/ history.jsonl ...            # Claude Code 런타임, git이 모름
```

기기 전용 오버라이드 2개(`CLAUDE.local.md`, `settings.local.json`)도 저장소를 거쳐 연결하지만, gitignore 대상이라 **내용은 커밋되지 않습니다.**
공유되는 것은 "그 자리에 파일이 있다"는 구조뿐이고, 내용은 기기마다 다릅니다.


> [!CAUTION]
> 단, gitignore 대상이므로 `git clean -dfx`를 실행하면 이 두 파일은 지워집니다.

## Structure

```s
claude-sync/               # 설정 저장소
├── rules/                 # 항상 적용되는 규율 (세션 시작 시 자동 로드)
├── skills/                # 상황별 절차 (필요할 때만 로드, `/이름`으로 직접 호출)
├── templates/             # 문서 작성 시 참고할 템플릿
├── hooks/                 # settings.json에 등록된 훅 스크립트
├── agents/                # 커스텀 서브에이전트 정의
├── commands/              # 커스텀 슬래시 커맨드
├── CLAUDE.md              # Claude 응답·행동 규칙
├── settings.json          # Claude Code 앱 설정: 테마·권한·훅 등록 등
├── CLAUDE.local.md        # 기기 전용 규칙      ┐ gitignore: 커밋 안 됨,
├── settings.local.json    # 기기 전용 앱 설정   ┘ 기기마다 내용이 다름
├── SETTING_GUIDE.md       # Claude가 읽고 실행하는 세팅 절차 (심링크 대상 아님)
└── README.md              # 이 문서 (심링크 대상 아님)
```

Claude는 세션을 시작할 때 [`CLAUDE.md`](CLAUDE.md), [`rules/`](rules/) 등을 컨텍스트에 주입합니다. 따라서 어떤 작업에서든 공통으로 지켜야 하는 규칙은 `rules/`에 담습니다. 그 외에 작업 종류가 갈리는 경우(개발이면 개발, 리서치면 리서치 등)에는 [`skills/`](skills/)를 활용하도록 `CLAUDE.md`에서 라우팅합니다.