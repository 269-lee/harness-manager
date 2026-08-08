# Harness Ideal — 좋은 하네스의 기준

> 이 문서는 `diagnose_harness`의 채점 기준입니다.
> 매주 수요일 자동으로 업데이트됩니다 (HN + 유저 피드백 기반).

---

## Layer 1 — 컨텍스트 (Context)

**핵심 질문:** AI에게 프로젝트를 얼마나 잘 설명하고 있는가

### 필수 요소

| 요소 | 기준 |
|------|------|
| `CLAUDE.md` | 프로젝트 목적, 기술 스택, 코딩 규칙, 금지 패턴 포함 |
| `skills/` | 반복 작업별 전문 스킬 파일 (커밋, 리뷰, 배포 등) |
| 아키텍처 설명 | 컴포넌트 구조와 데이터 흐름 기술 |

### 점수 기준

- **80–100**: CLAUDE.md에 목적·스택·규칙·금지패턴 모두 있고, 3개 이상의 도메인별 skill 파일 존재
- **60–79**: CLAUDE.md는 있으나 skill 파일이 부족하거나 내용이 얕음
- **40–59**: CLAUDE.md만 존재, skill 없음
- **0–39**: CLAUDE.md 없거나 내용이 거의 없음

---

## Layer 2 — 자동강제 (Enforcement)

**핵심 질문:** 품질 기준이 얼마나 자동으로 강제되는가

### 필수 요소

| 요소 | 기준 |
|------|------|
| `.claude/settings.json` hooks | AI 행동 전후 자동 검사 (PreToolUse, PostToolUse) |
| pre-commit hook | 커밋 전 lint·타입 검사 자동 실행 |
| CI workflow | PR마다 테스트·커버리지 자동 강제 |

### 점수 기준

- **80–100**: hooks + pre-commit + CI 세 가지 모두 구성
- **60–79**: CI는 있으나 hooks 또는 pre-commit 미흡
- **40–59**: CI만 있음
- **0–39**: 자동화 없음

---

## Layer 3 — 가비지컬렉션 (GC)

**핵심 질문:** 오래된 컨텍스트와 임시 파일이 자동으로 정리되는가

### 필수 요소

| 요소 | 기준 |
|------|------|
| cleanup workflow | 오래된 임시 파일·세션 데이터 자동 삭제 |
| post-session hook | 세션 종료 시 불필요한 컨텍스트 제거 |
| cron job | 주기적 정리 스케줄 설정 |

### 점수 기준

- **80–100**: cleanup workflow + post-session hook + cron 모두 설정
- **60–79**: cleanup workflow는 있으나 hook 미흡
- **40–59**: 스케줄만 있음
- **0–39**: 자동 정리 없음

---

## Evolution Layer — 자동 업데이트 기록

> 아래 항목은 자동 수집·검토 후 추가됩니다.
> 형식: `[버전] YYYY-MM-DD | 출처 | 반영 이유`

<!-- EVOLUTION_LOG_START -->
- [v20260808.1] 2026-08-08 | Hacker News | context | 팀 코딩 표준을 Claude Code와 Codex에 적용하는 Agent Skills 패턴
  → Layer 1 'skills/' 기준에 '팀 코딩 표준 스킬' 항목 추가: 팀 차원의 코딩 규칙(네이밍, 에러 처리, 로깅, 테스트 작성)을 skills/ 디렉토리의 표준화된 스킬 파일로 정의하고, 여러 AI 에이전트(Claude Code, Codex)가 일관된 기준을 따르도록 강제하는 구조. 각 스킬에 (1) 규칙 설명, (2) 코드 예시, (3) 위반 시 자동 검사 방법을 포함하는 템플릿 제공.
- [v20260808.2] 2026-08-08 | Hacker News | enforcement | 클라우드 배포 환경에서 Claude Code 에이전트 운영 자동화 (Hoplite)
  → Layer 2에 '.claude/cloud-deployment.md' 옵션 항목 추가: Claude Code 에이전트를 클라우드에 배포하고 자동으로 운영할 때 (1) 배포 환경 검증(컨테이너 이미지, 환경 변수 주입), (2) 에이전트 생명주기 관리(실행, 모니터링, 종료), (3) 클라우드 자원 할당 및 비용 제한 설정을 CI/CD 파이프라인에서 자동화하는 가이드.
- [v20260808.3] 2026-08-08 | Hacker News | context | 프로덕션 환경의 읽기 전용 디버깅 에이전트 운영 (HyperProbe)
  → Layer 1에 '.claude/production-safety.md' 옵션 항목 추가: 프로덕션 환경에서 Claude Code가 버그 분석/디버깅을 수행할 때 (1) 읽기 전용 권한 강제(데이터 변경 금지), (2) 접근 가능한 로그·메트릭 범위 화이트리스트, (3) 위험한 작업(DB 쿼리, 설정 변경) 시도 감지 및 차단 메커니즘을 문서화하는 가이드.

- [v20260801.1] 2026-08-01 | Hacker News | enforcement | Agent-Manager: Claude Code, Codex, OpenCode를 Tmux TUI로 통합 관리
  → Layer 2 '.claude/settings.json hooks'에 '다중 에이전트 런타임 관리' 항목 추가: 여러 AI 에이전트(Claude Code, Codex, OpenCode)를 동일 환경에서 실행할 때 (1) 에이전트별 프로세스 격리 및 리소스 할당 정책, (2) 실행 순서·동시성 제어, (3) 에이전트 간 상태 동기화 및 실패 시 자동 페일오버를 Tmux 기반 오케스트레이션으로 문서화하는 가이드
- [v20260801.2] 2026-08-01 | Hacker News | enforcement | Claude-account: 로그인 재입력 없이 Claude Code 계정 전환 도구
  → Layer 2 '.claude/settings.json hooks'에 '크레덴셜 관리 및 계정 전환' 항목 추가: 여러 Claude 계정을 관리할 때 (1) 활성 계정 상태 실시간 모니터링, (2) 계정 전환 시 자동 세션 정리 및 컨텍스트 초기화, (3) 토큰 누수 방지를 위한 사전 검증을 PostToolUse hook에서 강제하는 설정
- [v20260801.3] 2026-08-01 | Hacker News | context | What should the GUI for AI agents look like?: AI 에이전트용 UI/UX 설계 논의
  → Layer 1 'CLAUDE.md' 기준에 '에이전트 제어 인터페이스(Control Interface) 정의' 옵션 항목 추가: AI 에이전트의 의도하지 않은 행동을 방지하기 위해 (1) 사용자가 AI 행동을 실시간으로 모니터링·중단할 수 있는 UI 요구사항, (2) 위험한 작업(파일 삭제, 배포, 결제) 실행 전 명시적 승인 플로우, (3) 작업 예측 및 롤백 기능을 문서화하는 가이드

- [v20260725.1] 2026-07-25 | Hacker News | enforcement | Claude Code가 Bun(Rust 기반)으로 작동 - 런타임 성능 및 호환성 변화
  → Layer 2 '.claude/execution-environment.md'에 '런타임 환경 검증' 항목 추가: Claude Code의 런타임(Node.js → Bun)이 변경될 경우, (1) 기존 스크립트의 호환성 검증, (2) 성능 임계값(실행 시간, 메모리) 재측정, (3) 런타임 변경에 따른 의존성 업데이트 자동화 규칙을 명시하는 가이드
- [v20260725.2] 2026-07-25 | Hacker News | context | Mac에서 Claude Code 제어를 위한 단계별 설정 가이드 발행
  → Layer 1 '.claude/platform-setup.md' 옵션 항목 추가: macOS에서 Claude Code 실행 시 필수 권한 설정(Accessibility, Screen Recording, Full Disk Access)과 각 권한별 (1) 필요 이유, (2) 보안 영향도, (3) 최소 권한 원칙에 따른 설정 방식을 문서화하는 가이드
- [v20260725.3] 2026-07-25 | Hacker News | context | OneCLI - AI 에이전트용 오픈소스 크레덴셜 게이트웨이 도구 출시
  → Layer 1 'CREDENTIALS.md' 기준에 '크레덴셜 게이트웨이 패턴' 항목 추가: API 키·DB 비밀번호 관리 시 (1) 프롬프트에 크레덴셜 직접 노출 금지, (2) OneCLI 같은 게이트웨이 도구 사용 패턴, (3) 크레덴셜 주입 시 검증 로직(사용 권한, 작업 범위 제한)을 명시하는 실무 예시 제공
- [v20260725.4] 2026-07-25 | Hacker News | context | CodeAlmanac - 대화 기반 코드베이스 위키 자동 생성(Karpathy 방식)
  → Layer 1 'skills/' 기준에 '자동 문서화 및 인덱싱' 항목 강화: CodeAlmanac 같은 도구로 (1) 실시간 코드베이스 대화 분석 → 자동 위키 생성, (2) 변경된 모듈·함수에 대한 skill 자동 갱신, (3) 생성된 문서의 정확도 검증 및 피드백 루프를 구성하는 가이드

- [v20260718.1] 2026-07-18 | Hacker News | enforcement | Claude Code의 프롬프트 읽기 전 과도한 토큰 소비 문제 (33k vs OpenCode 7k)
  → Layer 2 '.claude/settings.json hooks'에 '토큰 효율성 검증' 항목 추가: PreToolUse hook에서 (1) 프롬프트 송신 전 토큰 예산 검증, (2) 불필요한 초기 토큰 소비 감지(33k+ 급증), (3) 토큰 오버헤드 임계값 초과 시 작업 중단 및 알림을 강제 실행하는 설정
- [v20260718.2] 2026-07-18 | Hacker News | context | Claude Code의 설계 결함 분석: 사용자 의도 불일치 및 제어 불가능성 문제
  → Layer 1 'CLAUDE.md' 기준에 '에이전트 제어 가능성(controllability) 검증' 섹션 추가: (1) AI의 의도하지 않은 행동 방지 메커니즘, (2) 사용자 의도와 AI 행동의 일관성 확인 기준, (3) 예상 밖의 작업 시작 시 중단 및 승인 프로세스를 명시하는 가이드

- [v20260711.1] 2026-07-11 | Hacker News | context | Geosql: Claude Code용 지리공간 데이터 처리 도메인 스킬
  → Layer 1 'skills/' 기준에 '도메인별 스킬 예시' 섹션 추가: 지리공간 데이터, 머신러닝, DevOps 등 특정 도메인 작업 시 해당 라이브러리·함수·쿼리 패턴을 사전 정의한 스킬 파일 작성 방식. 각 스킬에 (1) 사용 사례, (2) 금지 패턴, (3) 성능 임계값을 포함하는 템플릿 제공.
- [v20260711.2] 2026-07-11 | Hacker News | context | The Making of Claude Code: Claude Code 공식 아키텍처 및 설계 원칙 문서
  → Layer 1 'CLAUDE.md' 기준에 '공식 설계 원칙 참고' 섹션 추가: Anthropic 공식 문서(The Making of Claude Code)에서 제시한 (1) Claude Code의 기술 스택 및 한계, (2) 권장 작업 범위, (3) 에이전트 설계 패턴을 CLAUDE.md 작성 시 참고 자료로 명시.
- [v20260711.3] 2026-07-11 | Hacker News | enforcement | Rowboat: Claude Desktop 대체 로컬 오픈소스 클라이언트
  → Layer 2 '.claude/execution-environment.md' 옵션 항목 확장: Claude Desktop 외에 로컬 오픈소스 클라이언트(Rowboat 등) 사용 시 (1) 클라이언트별 hooks 호환성 검증, (2) 로컬 실행 환경의 일관성 보장(Docker/Nix), (3) 공식 Claude Desktop과의 동작 차이점 문서화를 강제하는 가이드.
- [v20260711.4] 2026-07-11 | Hacker News | context | Context.dev: 구조화된 데이터 추출 API를 통한 웹 자동화 강화
  → Layer 1 '.claude/data-extraction.md' 옵션 항목 추가: 웹 스크래핑, API 연동 작업 시 구조화된 데이터 추출 전략 문서화. (1) 추출 대상 데이터 스키마 정의, (2) 타사 구조화 API(Context.dev 등) vs 자체 파서 선택 기준, (3) 추출 오류 시 폴백 전략을 명시하는 가이드.

- [v20260613.1] 2026-06-13 | Hacker News | enforcement | Claude Code 할당량 모니터링: macOS 메뉴바 게이지로 실시간 API 사용량 추적
  → Layer 2 '.claude/settings.json hooks'에 '할당량 모니터링' 항목 추가: API 사용량을 실시간으로 추적하고, 할당량 임계값(예: 80%) 도달 시 (1) 자동 알림 발송, (2) 비용 초과 방지 제한, (3) 대안 모델로 자동 페일오버 로직을 PostToolUse hook에서 강제 실행하는 가이드
- [v20260613.2] 2026-06-13 | Hacker News | context | Lathe: 학습 목표 중심의 LLM 도메인 학습 도구 및 피드백 루프
  → Layer 1 'CLAUDE.md' 기준에 '학습 목표 정의 및 피드백 루프' 섹션 추가: 에이전트 작업이 단순 자동화를 넘어 도메인 학습을 포함할 경우, (1) 학습 목표 및 성공 기준, (2) 피드백 루프(에러 분석, 개념 학습, 재시도), (3) 학습 진행도 추적 방식을 명시하는 가이드
- [v20260613.3] 2026-06-13 | Hacker News | enforcement | Intuned: 브라우저 자동화의 신뢰성 보장 및 에러 복구 프레임워크
  → Layer 2 '.claude/settings.json hooks'에 '브라우저 자동화 신뢰성' 항목 강화: 페이지 로딩 실패, 요소 이동, 네트워크 오류 등 불안정한 상태에서 (1) 자동 재시도 정책(지수 백오프, 최대 시도 횟수), (2) 대체 요소 선택자 준비, (3) 상태 검증 실패 시 이전 상태로 자동 복구하는 설정을 PostToolUse hook에 포함하는 구체적 예시 제공
- [v20260613.4] 2026-06-13 | Hacker News | context | Command Center: 코드 품질 기준 중심의 AI 개발 환경
  → Layer 1 필수 요소에 '.claude/quality-standards.md' 옵션 추가: 팀 또는 프로젝트의 코드 품질 기준을 명시하고, (1) 코드 복잡도(순환 복잡도, 라인당 함수), (2) 테스트 커버리지 최소값, (3) 성능 임계값(응답 시간, 메모리 사용)을 정의하여 AI 생성 코드의 검증 기준으로 활용하는 가이드

- [v20260606.1] 2026-06-06 | Hacker News | context | Claude Code와 외부 VCS를 Git으로 실시간 동기화하는 협업 패턴
  → Layer 1 필수 요소에 '.claude/git-sync.md' 옵션 항목 추가: Claude Code와 외부 에이전트(Codex 등)가 Git을 통해 실시간으로 코드 변경을 동기화할 때 (1) 브랜치 전략 및 병합 규칙, (2) 충돌 해결 자동화, (3) 커밋 메시지 포맷 통일을 문서화하는 가이드
- [v20260606.2] 2026-06-06 | Hacker News | enforcement | 클라우드 환경에서 Claude Code 실행 및 로컬호스트 대체 인프라
  → Layer 2에 '.claude/execution-environment.md' 옵션 항목 추가: 클라우드(Boxes.dev 등) 또는 컨테이너 환경에서 Claude Code를 실행할 때 (1) 환경 재현성 검증(Docker/Nix), (2) 네트워크 격리 및 접근 제어, (3) 결과물 로컬 다운로드 및 서명 검증 프로세스를 명시하는 가이드
- [v20260606.3] 2026-06-06 | Hacker News | context | 스탠포드 CS336 AI Agent Guidelines: 공식 교육 기관의 CLAUDE.md 가이드
  → Layer 1 'CLAUDE.md' 기준에 '학습 목표 및 제약 조건' 섹션 추가: 에이전트 작업의 목표(학습, 프로토타입, 프로덕션)를 명시하고, 각 단계별 허용/금지 작업 범위를 정의하도록 강제. 스탠포드 가이드 링크 참고 자료로 제시
- [v20260606.4] 2026-06-06 | Hacker News | context | Hyper(YC P26): 기업 지식 기반을 활용한 에이전트 개발 플랫폼
  → Layer 1 필수 요소에 '.claude/knowledge-base.md' 옵션 항목 추가: 조직의 내부 문서, 정책, 사례(playbook)를 구조화된 형식으로 관리할 때 (1) 지식 베이스 인덱싱 및 검색 전략, (2) 최신성 보장(버전 관리, 폐기 정책), (3) AI 프롬프트에 자동 주입 메커니즘을 명시하는 가이드

- [v20260530.1] 2026-05-30 | Hacker News | context | Claude Code 마스터리: Claude.md, Skills, Subagents, Plugins, MCPs 통합 가이드
  → Layer 1 필수 요소에 '.claude/subagents.md' 추가: 여러 서브에이전트 활용 시 (1) 각 에이전트의 역할·책임 범위, (2) 에이전트 간 통신 프로토콜, (3) 작업 분담 및 결과 통합 방식을 명시하도록 강제
- [v20260530.2] 2026-05-30 | Hacker News | enforcement | Claude Code 소스 코드 분석: 공식 문서에 미공개된 설정 항목 발굴
  → Layer 2 '.claude/settings.json hooks' 기준에 '숨겨진 설정 항목' 섹션 추가: 공식 문서 미반영 훅(예: task_priority, context_window_strategy, tool_call_timeout)을 체계적으로 검증하고, 각 항목의 성능 임계값을 정의하는 검사 가이드 제공
- [v20260530.3] 2026-05-30 | Hacker News | context | Claude Code 동적 워크플로우: 조건부 작업 흐름 및 에이전트 루프 자동화
  → Layer 1 필수 요소에 '.claude/workflows.md' 추가: 조건부 분기, 병렬 작업, 재시도 로직을 포함한 워크플로우 정의 방식. (1) 워크플로우 상태 머신 정의, (2) 각 단계별 입출력 검증, (3) 실패 시 롤백 전략을 명시하는 가이드
- [v20260530.4] 2026-05-30 | Hacker News | enforcement | AISlop: AI 생성 코드의 악취(code smells) 자동 감지 CLI 도구
  → Layer 2 CI workflow 기준에 '코드 품질 정적 분석' 항목 추가: AI 생성 코드의 패턴 인식 오류(과도한 추상화, 미사용 변수, 보일러플레이트)를 감지하는 린터/정적 분석 도구(AISlop 등) 통합. PreToolUse hook에서 생성 직후 검증하고, 통과 실패 시 AI에 피드백을 자동 반영하는 설정
- [v20260530.5] 2026-05-30 | Hacker News | context | Minicor (YC P26): Windows 데스크톱 자동화 스케일링 플랫폼
  → Layer 1에 '.claude/desktop-automation.md' 옵션 항목 추가: 데스크톱/OS 레벨 자동화 작업 시 (1) OS 버전·아키텍처별 호환성 검증, (2) 유저 권한 수준(admin/user)과 작업 범위 매핑, (3) 재부팅·시스템 상태 변화에 따른 멱등성 보장 방식을 문서화하는 가이드

- [v20260523.1] 2026-05-23 | Hacker News | context | Semble – 에이전트용 코드 검색 도구로 grep 대비 98% 토큰 절감
  → Layer 1 필수 요소에 '.claude/search-strategy.md' 옵션 항목 추가: 대규모 코드베이스에서 AI가 효율적으로 컨텍스트를 수집하기 위해 (1) 검색 전략(semantic search vs grep), (2) 토큰 예산 최적화 기법, (3) 자주 참조되는 파일 인덱싱 방식을 문서화하는 가이드
- [v20260523.2] 2026-05-23 | Hacker News | enforcement | Superlog – 자동 설치형 모니터링 및 버그 자동 수정 도구
  → Layer 2 필수 요소에 '자동 모니터링 및 피드백 루프' 섹션 추가: CI/CD 파이프라인 외에도 프로덕션 환경에서 (1) 자동으로 에러 로깅 및 스택트레이스 수집, (2) 로그 기반 자동 버그 리포트 생성, (3) 버그 리포트를 프롬프트에 자동 반영하는 메커니즘을 '.claude/settings.json' PostToolUse hook에 포함하는 가이드
- [v20260523.3] 2026-05-23 | Hacker News | context | Runtime & Superset – 팀 협업용 샌드박스 에이전트 IDE
  → Layer 1에 '.claude/team-governance.md' 옵션 항목 추가: 팀 환경에서 여러 AI 에이전트를 협업시킬 때 (1) 에이전트별 권한 범위(접근 가능 모듈, 배포 권한), (2) 에이전트 간 작업 분담 규칙, (3) 충돌 해결 및 승인 프로세스를 문서화하는 가이드

- [v20260509.1] 2026-05-09 | Hacker News | context | DeepClaude – Claude Code agent loop with DeepSeek V4 Pro: 다중 AI 모델 체이닝을 통한 에이전트 루프 자동화
  → Layer 1 필수 요소에 '.claude/agent-chain.md' 옵션 항목 추가: 외부 AI 모델(DeepSeek, GPT-4 등)과의 체이닝 시 (1) 각 모델별 역할 정의, (2) 모델 간 데이터 흐름 및 포맷 변환, (3) 폴백 및 검증 로직을 문서화하는 가이드
- [v20260509.2] 2026-05-09 | Hacker News | context | Using Claude Code: The unreasonable effectiveness of HTML: HTML 프롬프트 구조화를 통한 Claude Code 효율성 극대화
  → Layer 1 필수 요소 'CLAUDE.md' 기준에 '프롬프트 포맷팅' 섹션 추가: 구조화된 HTML/마크다운 형식으로 작업 정의, 컨텍스트 트리 시각화, 예제 코드 포함 방식을 명시하도록 강제
- [v20260509.3] 2026-05-09 | Hacker News | enforcement | Show HN: Git for AI Agents (Regent VCS): AI 에이전트용 버전 관리 시스템 및 diff 추적
  → Layer 2 자동강제 필수 요소에 '에이전트 변경 이력 추적' 섹션 추가: AI 생성 코드의 버전 관리를 위해 (1) 에이전트별 커밋 메타데이터 기록, (2) 자동 생성 코드 diff 검증 로직, (3) 의도하지 않은 변경 감지 알림을 CI workflow에 포함하는 설정 가이드
- [v20260509.4] 2026-05-09 | Hacker News | context | Wiki Builder: Skill to Build LLM Knowledge Bases: Claude Code용 동적 문서/스킬 생성 플러그인
  → Layer 1 필수 요소 'skills/' 디렉토리 기준에 '자동 skill 생성 및 동기화' 옵션 추가: Wiki Builder 같은 도구로 (1) 프로젝트 문서로부터 skill 자동 추출, (2) 변경된 CLAUDE.md 감지 시 skill 자동 갱신, (3) skill 버전 관리 및 유효성 검증 메커니즘을 설정하는 가이드

- [v20260502.1] 2026-05-02 | Hacker News | enforcement | Claude Code가 특정 키워드(OpenClaw)로 거부 또는 추가 비용 청구 현상
  → Layer 2 '.claude/settings.json hooks'에 '프롬프트 검열 및 바이패스 방지' 항목 추가: AI가 특정 키워드나 요청을 임의로 거부하지 않도록, (1) 금지 패턴 목록의 투명성 확보, (2) 바이패스 시도 로깅, (3) 비용 청구 조건 사전 정의를 PreToolUse hook에서 강제하는 검사 항목 명시
- [v20260502.2] 2026-05-02 | Hacker News | context | Apple Support 앱에서 실수로 CLAUDE.md 파일 노출
  → Layer 1 필수 요소에 '.gitignore 및 보안 검사' 강화 항목 추가: CLAUDE.md, CREDENTIALS.md, .claude/ 디렉토리를 CI/CD 파이프라인에서 (1) 실수 커밋 차단, (2) 배포 아티팩트 검사, (3) 민감 파일 제외 규칙을 자동으로 검증하도록 필수화
- [v20260502.3] 2026-05-02 | Hacker News | enforcement | EvanFlow – TDD 기반 Claude Code 피드백 루프 도구
  → Layer 2 필수 요소에 '테스트 주도 자동화' 섹션 추가: 자동 코드 생성 후 검증을 위해 (1) 생성된 코드에 대한 자동 테스트 실행 필수, (2) 테스트 통과율을 PR 머지 조건으로 설정, (3) 실패 케이스 자동 수집 및 프롬프트 피드백 루프 구성을 CI workflow에 포함하는 가이드 제공
- [v20260502.4] 2026-05-02 | Hacker News | context | Agent-desktop – AI 에이전트용 네이티브 데스크톱 자동화 CLI
  → Layer 1에 '.claude/agent-capabilities.md' 옵션 항목 추가: 데스크톱 자동화, 브라우저 제어, CLI 도구 실행 권한을 명시하고, (1) 접근 가능한 시스템 리소스 화이트리스트, (2) 작업 타입별 필수 승인 프로세스, (3) 로깅 및 감시 방식을 문서화하는 가이드

- [v20260425.1] 2026-04-25 | Hacker News | enforcement | Browser Harness – LLM이 브라우저 작업을 자유롭게 완료할 수 있도록 하는 오픈소스 도구
  → Layer 2 '.claude/settings.json hooks'에 '브라우저 자동화 안전성 검증' 항목 추가: 브라우저 태스크 실행 시 (1) 도메인 화이트리스트 확인, (2) 클릭/입력 액션 사전 검증, (3) 페이지 상태 변화 모니터링을 PreToolUse/PostToolUse hook에서 강제 실행하는 설정 예시 제공
- [v20260425.2] 2026-04-25 | Hacker News | context | Agent Vault – 에이전트용 크레덴셜 프록시 및 보안 저장소 (오픈소스)
  → Layer 1 필수 요소에 'CREDENTIALS.md' 추가: API 키, DB 비밀번호, OAuth 토큰 등을 안전하게 관리하기 위해 (1) 크레덴셜 저장소 구성(Agent Vault 등), (2) 프롬프트에서 민감 정보 제외 방식, (3) 토큰 로테이션 주기를 명시하도록 강제
- [v20260425.3] 2026-04-25 | Hacker News | enforcement | Claude 4.7이 stop hooks를 무시하는 현상 보고
  → Layer 2 점수 기준 상세 내용에 '훅 신뢰성 검증' 항목 추가: hooks가 실제로 동작하는지 확인하기 위해 (1) 테스트 케이스로 각 hook 동작 검증, (2) 훅 실패 시 AI 행동 제한 메커니즘, (3) 훅 바이패스 시도 감지 로깅을 CI workflow에 포함하도록 권고

- [v20260418.1] 2026-04-18 | Hacker News | context | Claude Code Routines: AI 워크플로우 자동화 및 반복 작업 체계화 문서
  → Layer 1 필수 요소에 '.claude/routines.md' 추가: 반복되는 AI 작업(코드 생성, 테스트, 리뷰, 배포)을 Routine으로 정의하고, 각 Routine별 입력·출력·검증 기준을 명시하도록 강제
- [v20260418.2] 2026-04-18 | Hacker News | enforcement | Libretto: AI 브라우저 자동화의 결정성(Determinism) 보장 기법
  → Layer 2 '.claude/settings.json hooks'에 '자동화 신뢰성 검증' 항목 추가: 브라우저·API 자동화 작업 시 (1) 재시도 정책(exponential backoff), (2) 멱등성(idempotency) 검증, (3) 상태 동기화 확인을 PostToolUse hook에서 강제 실행
- [v20260418.3] 2026-04-18 | Hacker News | context | Stage: AI 코드 리뷰의 인간 개입 및 제어 가능성 프레임워크
  → Layer 1 필수 요소에 '.claude/review-gates.md' 옵션 추가: 자동 리뷰 통과 조건(코드 복잡도, 파일 변경 규모, 의존성 변경)을 정의하고, 인간 리뷰 필수 단계(보안, 아키텍처, 성능 변경)를 명시하는 가이드

- [v20260411.1] 2026-04-11 | Hacker News | context | Claude Code의 복잡한 엔지니어링 작업 실패: 컨텍스트 부족 및 작업 분해 능력 제한
  → Layer 1 필수 요소에 'task-decomposition.md' 추가: 프로젝트 복잡도(LOC, 모듈 수, 의존성 깊이)를 CLAUDE.md에 명시하고, 100+ 모듈 또는 3단계 이상 의존성을 가진 프로젝트는 작업 분해 가이드 필수 포함하도록 강제
- [v20260411.2] 2026-04-11 | Hacker News | context | Vercel 플러그인의 프롬프트 텔레메트리 수집: 사용자 데이터 노출 위험
  → Layer 1 필수 요소에 'SECURITY.md' 추가: 타사 플러그인/IDE 확장/CI 통합 도구 사용 시 데이터 수집 범위를 명시하고, 프롬프트·코드·토큰 수집 제외 설정을 문서화하도록 필수화
- [v20260411.3] 2026-04-11 | Hacker News | context | 로컬 LLM(Gemma 4) + Claude Code 통합: MCP 및 로컬 에이전트 연동 패턴
  → Layer 1에 '.claude/integrations.md' 옵션 항목 추가: MCP 서버, 로컬 LLM 모델, 커스텀 에이전트 연동 시 설정 예시, 성능 기준(레이턴시, 비용), 폴백 전략 문서화 가이드
- [v20260411.4] 2026-04-11 | 유저 피드백 | enforcement | MCP 서버 정의 및 테스트 검증 필요성 확인
  → Layer 2 '.claude/settings.json hooks' 상세 기준에 추가: PreToolUse hook에서 MCP 호출 전 (1) 스키마 검증, (2) 권한 범위 확인, (3) 재시도 정책 설정을 강제하는 검사 항목 명시

- [v20260411.1] 2026-04-11 | Hacker News | context | Claude Code의 복잡한 엔지니어링 작업 실패 사례 분석
  → Layer 1에 '프로젝트 복잡도 평가' 기준 추가: CLAUDE.md에서 프로젝트 스코프(LOC, 모듈 수, 의존성 깊이)를 명시하고, 복잡한 작업은 '작업 분해 가이드(task-decomposition.md)' 필수 포함
- [v20260411.2] 2026-04-11 | Hacker News | context | 보안 이슈: Vercel 플러그인의 프롬프트 텔레메트리 수집 문제
  → Layer 1 필수 요소에 '보안 정책(SECURITY.md)' 추가: 타사 플러그인/통합 도구 사용 시 데이터 수집 범위와 제외 설정을 명시하도록 강제
- [v20260411.3] 2026-04-11 | Hacker News | context | 로컬 LLM(Gemma 4) + Claude Code 통합 패턴
  → Layer 1에 '.claude/integrations.md' 옵션 추가: 외부 LLM 모델, 로컬 에이전트, MCP 서버 연동 시 설정 예시와 성능 기준 문서화
- [v20260411.4] 2026-04-11 | 유저 피드백 | enforcement | MCP 정의 및 테스트 확인 요청
  → Layer 2에 '.claude/settings.json hooks' 기준 상세화: MCP 서버 검증(PreToolUse에서 mcp_call 전 권한·스키마 검사) 항목 추가

<!-- EVOLUTION_LOG_END -->
