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
├── worklog/                → 별도 private repo로 심링크 (선택)
├── CLAUDE.local.md         # 기기별 오버라이드 (이 기기 전용, git 무관)
└── sessions/ projects/ plugins/ history.jsonl .credentials.json ...
                            # Claude Code 런타임. git이 모름
```

## `worklog`

repo별 작업 기록. 저장소 밖에 따로 clone해서 심링크합니다(형제 관계라 nested repo가 안 생김).

```bash
git clone https://github.com/1Dohyeon/worklog.git "$WORKSPACE/worklog"
ln -sfn "$WORKSPACE/worklog" "$HOME/.claude/worklog"
```

```
~/.claude/worklog/<repo>/
├── overview.md             # 해당 repo의 서비스 도메인 이해를 돕는 정적 문서
└── tasks/
    ├── <branch>.md         # 진행 중인 task (브랜치 = task)
    └── done/
        └── <branch>-YYYYMMDD.md   # 완료된 task
```

- **`<repo>`** = `git remote get-url origin` 마지막 세그먼트(`.git` 제외), **`<branch>`** = `git rev-parse --abbrev-ref HEAD`. 매번 직접 계산.
- `done/`은 평탄 유지 — 브랜치명의 `/`는 `-`로 치환.
- 운용 방식은 [CLAUDE.md의 HOW TO WORK](CLAUDE.md#how-to-work) 참고.

### 스냅샷

- **`SessionEnd` → `hooks/save-docs.sh`**: 세션 종료 시 `worklog/` 상태를 커밋·푸시.
- **`/save-docs [repo]`**: 수동 실행(훅 미발동 대비). repo명을 주면 그 repo만.

git repo가 아니면 조용히 통과, 변경 없으면 빈 커밋 안 만듦, 오프라인·충돌이어도 세션을 막지 않음(push 15초 후 중단, 로컬 커밋만).

> push 전용입니다. 여러 기기를 쓴다면 세션 시작 전 `git -C ~/.claude/worklog pull`을 직접 해주세요.
