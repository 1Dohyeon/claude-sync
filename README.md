# claude-sync

Claude Code 글로벌 설정입니다. `~/.claude/`는 실제 디렉터리로 두고, 이 저장소가 관리하는 항목만 그 안으로 심링크합니다.

> 저장소: [1Dohyeon/claude-sync](https://github.com/1Dohyeon/claude-sync)

## 연결 방법

```bash
REPO="/absolute/path/to/claude-sync"      # 절대경로 필수

mkdir -p ~/.claude && cd ~/.claude
rm -rf agents commands hooks rules templates CLAUDE.md settings.json
ln -s "$REPO"/{agents,commands,hooks,rules,templates,CLAUDE.md,settings.json} .

ls -l | grep '\->'                        # 링크 7개 확인
```

## 구조

### 저장소: 전부 git 추적

```s
claude-sync/
├── rules/                  # 작업 시 지켜야 할 규율
├── templates/              # 문서 작성 시 참고할 템플릿
├── hooks/                  # settings.json에 등록된 훅 스크립트
├── agents/                 # 커스텀 서브에이전트 정의
├── commands/               # 커스텀 슬래시 커맨드
├── CLAUDE.md               # Claude 응답·행동 규칙
└── settings.json           # Claude Code 앱 설정 - 테마·권한·훅 등록 등
```

### `~/.claude/` — 실제 폴더

```s
~/.claude/
├── agents/ commands/ hooks/ rules/ templates/     → 저장소로 심링크
├── CLAUDE.md  settings.json                       → 저장소로 심링크
├── CLAUDE.local.md         # 기기별 오버라이드 (이 기기 전용, git 무관)
└── sessions/ projects/ plugins/ history.jsonl .credentials.json ...
                            # Claude Code 런타임. git이 모름
```


