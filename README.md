# claude-sync

Claude Code 글로벌 설정 저장소. `~/.claude/`는 실제 폴더로 두고, 관리 대상 항목만 그 안으로 **심링크**한다.
Claude Code는 항상 `~/.claude/` 아래 고정 경로에서 읽으므로, 저장소를 어디에 clone하든(기기마다 달라도) 심링크가 그 위치 차이를 흡수한다.

> 작업 기록 저장소(별도, private): [1Dohyeon/worklog](https://github.com/1Dohyeon/worklog)

## SETTINGS

1. 이 저장소를 원하는 곳에 clone
2. Claude Code 설치 및 로그인
3. Claude에게 **"SETTING_GUIDE.md 읽고 실행"** 명령

Claude sync 세팅은 Claude가 [SETTING_GUIDE.md](SETTING_GUIDE.md)를 따라 처리한다.

> [SETTING_GUIDE.md](SETTING_GUIDE.md)은 `ln`·`mv`·`mkdir`·`find`·`git` 명령으로 이루어진다.
> 기존 settings.json의 `permissions.deny`에 이 명령들(또는 `Bash(*)`, `Write(//Users/…/.claude/**)` 같은 넓은 규칙)이 걸려 있으면 **3단계가 중간에 멈춘다.**
> `deny`는 승인 프롬프트로 통과시킬 수 없어서, 사용자가 직접 풀어야 한다.

## STRUCTURE

### GLOBAL CLAUDE `~/.claude/`

```s
~/.claude/                                           # 실제 폴더
├── agents/ commands/ hooks/ rules/ templates/       → claude-sync로 심링크
├── CLAUDE.md  settings.json                         → claude-sync로 심링크
├── CLAUDE.local.md  settings.local.json             → claude-sync로 심링크 (gitignore 대상)
├── worklog/                                         → worklog 저장소로 심링크
└── sessions/ projects/ plugins/ history.jsonl ...   # Claude Code 런타임, git이 모름
```

기기 전용 오버라이드 2개(`CLAUDE.local.md`, `settings.local.json`)도 저장소를 거쳐 연결하되 gitignore 대상이라 **내용은 커밋되지 않는다.**
공유되는 건 "그 자리에 파일이 있다"는 구조뿐이고, 내용은 기기마다 다르다.
편집 지점이 저장소 폴더 하나로 통일되는 게 이 방식의 이점이다.

> 단, gitignore 대상이므로 `git clean -dfx`를 돌리면 이 두 파일은 지워진다.

### REPOSITORY

```s
claude-sync/               # 설정 저장소
├── rules/                 # 작업 시 지켜야 할 규율
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

session, log 등이 쌓이는 `~/.claude/` 폴더 대신 클론된 디렉토리에서 claude 설정을 다룰 수 있다.

## CLAUDE.md

1. 응답 규칙 및 작업 규칙이 적혀있어, 어느 세션에서든지 공통된 작업 스타일을 갖는다. 작업 규칙 내용은 다음과 같다:

```md
1. **설계**: 추측으로 바로 시작하지 않는다.
   - 깔고 가는 전제를 말하지 않은 채 진행하지 않는다.
   - 해석이 갈리는데 임의로 하나를 골라 밀고 가지 않는다.
   - **성공 기준 없이 다음 단계로 넘어가지 않는다.**
     - "동작하게", "잘 되게"는 기준이 아니다
     - 무엇을 만족하면 끝인지 판정 가능한 형태여야 한다.
2. **보고**: 승인 없이 실행하지 않는다.
   - 선택지만 늘어놓고 판단을 사용자에게 떠넘기지 않는다.
   - 우려가 있는데 말하지 않고 넘어가지 않는다.
3. **진행**
   - 승인받지 않은 것을 하지 않는다.
   - 요청되지 않은 것을 덤으로 만들지 않는다.
   - 설계를 벗어나면서 말없이 진행하지 않는다 — 벗어나야 하면 2로 돌아간다.
   - 막힌 것을 조용히 우회하지 않는다 — 모르면 중단하고 물어본다.
4. **검증**
   - 확인하지 않은 것을 확인했다고 하지 않는다 — "됐을 것이다"로 대체하지 않는다.
   - 검증 근거 없이 5단계로 넘어가지 않는다 — 무엇을 어떻게 확인했는지 남긴다(대화든 문서든 각 작업 규칙에 맞게).
   - 코드에서 테스트·린트·실제 실행이 가능한데 생략하지 않는다.
5. **완료**
   - **완료를 스스로 선언하지 않는다** — 검증 방법과 결과를 제시하고 사용자가 통과로 확인한 것만 완료로 판단한다.
   - 일부만 통과한 것을 완료로 뭉뚱그리지 않는다 — 통과한 것과 남은 것을 갈라서 보고한다.
   - 실패했거나 건너뛴 항목을 빼놓고 보고하지 않는다.
```

2. 작업 시작전 읽어야할 규칙 등은 `rule/`에 작성하여 라우팅한다. 개인적인 작업 rule을 클로드가 읽을 수 있도록 하는 것이 목표이다.

```md
## ROUTING CONVENTION

아래 트리거에 매칭되면 요청 작업을 시작하기 전 연결된 파일을 무조건 Read 한다.

| 요청 유형 (트리거)                   | Read 대상                                                   |
| ------------------------------------ | ----------------------------------------------------------- |
| 개발 태스크 작업                     | [`~/.claude/rules/development.md`](/rules/development.md)   |
| git 관련 작업(commit, worktree, ...) | [`~/.claude/rules/git-workflow.md`](/rules/git-workflow.md) |

... (생략)
```
