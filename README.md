# claude-sync

Claude Code 글로벌 설정입니다. `~/.claude/`는 실제 디렉터리로 두고, 관리 대상 항목만 그 안으로 **심링크**합니다.

Claude Code·훅·라우팅은 항상 `~/.claude/` 아래 **고정 경로**에서 읽습니다. 그래서 저장소를 어디에 clone하든(기기마다 달라도) 상관없고, 심링크가 그 위치 차이를 흡수합니다.

> 설정 저장소: [1Dohyeon/claude-sync](https://github.com/1Dohyeon/claude-sync)
> 작업 기록 저장소(별도): [1Dohyeon/worklog](https://github.com/1Dohyeon/worklog)

## 연결 방법

두 저장소를 각자 원하는 위치에 clone한 뒤, 그 경로로 심링크를 건다. (위치는 자유 — 심링크만 맞으면 됨)

```bash
SYNC="/absolute/path/to/claude-sync"     # 이 저장소 clone 위치 (절대경로 필수)
WORKLOG="/absolute/path/to/worklog"      # worklog 저장소 clone 위치 (절대경로 필수)

mkdir -p ~/.claude && cd ~/.claude
rm -rf agents commands hooks rules templates CLAUDE.md settings.json worklog
ln -sfn "$SYNC"/{agents,commands,hooks,rules,templates,CLAUDE.md,settings.json} .
ln -sfn "$WORKLOG" worklog

ls -l | grep '\->'                        # 링크 8개 확인
```

## 구조

### 저장소 두 개 (독립)

claude-sync(설정)와 worklog(작업 기록)는 **서로 다른 git 저장소**다. 형제로 두길 권장하지만, 심링크가 위치를 흡수하므로 어디에 둬도 된다. (claude-sync 안에 중첩하지 않는 이유: gitignore된 repo-in-repo라 `git clean -dfx` 등에 통째로 날아갈 위험이 있음)

```s
claude-sync/               # 설정 저장소 — 전부 git 추적
├── rules/                 # 작업 시 지켜야 할 규율
├── templates/             # 문서 작성 시 참고할 템플릿
├── hooks/                 # settings.json에 등록된 훅 스크립트
├── agents/                # 커스텀 서브에이전트 정의
├── commands/              # 커스텀 슬래시 커맨드
├── CLAUDE.md              # Claude 응답·행동 규칙
├── README.md              # 이 문서 (설정 구조·연결 방법 배경, 심링크 대상 아님)
└── settings.json          # Claude Code 앱 설정 - 테마·권한·훅 등록 등

worklog/                   # 작업 기록 저장소(별도, private)
└── <repo>/                # repo별 overview.md · tasks/ · tasks/done/ 등
```

### `~/.claude/` — 실제 폴더

```s
~/.claude/
├── agents/ commands/ hooks/ rules/ templates/     → claude-sync로 심링크
├── CLAUDE.md  settings.json                        → claude-sync로 심링크
├── worklog/                                        → worklog 저장소로 심링크
├── CLAUDE.local.md         # 기기별 오버라이드 (이 기기 전용, git 무관)
└── sessions/ projects/ plugins/ history.jsonl .credentials.json ...
                            # Claude Code 런타임. git이 모름
```
