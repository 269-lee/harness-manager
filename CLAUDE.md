# Harness Coach

AI가 Claude Code 하네스를 진단하고 개선안을 제안하는 웹 기반 SaaS.

## 프로젝트 개요

**포지셔닝:** "Grammarly for Harness" - 사용자의 CLAUDE.md, Skills, Hooks, MCP를 분석해 약점을 진단하고 1클릭으로 개선 적용.

**대상:** Claude Code를 쓰는 개인 개발자 높음 전문도.

**스펙:** `docs/superpowers/specs/2026-04-06-harness-coach-design.md`
**구현 계획:** `docs/superpowers/plans/2026-04-06-harness-coach.md`

## 핵심 사용자 워크플로우

```
Connect 👉 Diagnose 👉 Recommend 👉 Edit 👉 Deploy + Monitor
```

1. GitHub 레포 연결 또는 파일 업로드
2. AI(claude-haiku-4.5)가 3초 점수화: 컨텍스트 / 자동강제 / 가비지컬렉션
3. 우선순위별 개선안 제안 (1클릭 적용)
4. CLAUDE.md / Skills 다시간 편집
5. 수정 파일 zip 다운로드

## 기술 스택

| 레이어 | 선택 |
|--------|------|
| 프레임워크 | Next.js 16 (App Router, Server Actions) |
| UI | shadcn/ui + Geist, **다크모드 기본** |
| AI | claude-haiku-4.5 via **Vercel AI Gateway (OIDC)** |
| AI SDK | AI SDK v6 (generateText) + AI Elements |
| DB | Drizzle ORM + Neon Postgres |
| 파일 | Vercel Blob |
| 인증 | Clerk (GitHub 소셜 로그인) |
| 테스트 | Vitest |
| 배포 | Vercel |

## 절대 하면 안 되는 것

- `ANTHROPIC_API_KEY` 직접 사용 금지 - 반드시 Vercel AI Gateway (OIDC) 사용
- AI 테스트를 `{text}` 또는 `<p>{content}</p>`로 렌더링 금지 - AI Elements 사용
- 분석 버튼 없이 자동 AI 호출 금지 - 비용 통제를 위해 수동 트리거만
- 파일 hash가 동일하면 재분석 금지 - 반드시 캐시 확인 후 다시 실행
- 커밋 전 lint/test 스킵 금지 - pre-commit 훅 필수 통과
- TypeScript `any` 타입 사용 금지 - 명시적 타입 정의 필수
- Server Actions에서 `console.log` 남기기 금지 - 반드시 제거

## AI 비용 통제 원칙

- 모델: `anthropic/claude-haiku-4.5` (Sonnet/Opus 사용 금지, 명시적 특인 없이는)
- 캐시 키: 프로젝트의 모든 하네스 파일 hash를 합쳐 `filesHash`
- 트리거: 사용자가 "분석" 버튼 클릭 시에만 실행
- 목표: 분석 1회 비용 $0.01 미만

## 파일 구조 (예정)

```
harness-manager/
├── app/
│   ├── (auth)/          # Clerk sign-in/sign-up
│   └── (app)/
│       ├── dashboard/   # 프로젝트 목록
│       └── projects/[id]/
│           ├── page.tsx        # 대시보드 (점수 + 추천)
│           └── editor/page.tsx # CLAUDE.md + Skills 편집기
├── components/
│   ├── harness-score-card.tsx
│   ├── recommendation-card.tsx
│   ├── claude-md-editor.tsx
│   └── skills-manager.tsx
├── lib/
│   ├── db/schema.ts     # Drizzle 스키마
│   ├── harness/parser.ts  # 파일 파싱 + hash (순수 함수, 테스트 아수)
│   └── ai/analyzer.ts   # AI 분석 프롬프트 + 파싱 (순수 함수, 테스트 아수)
├── actions/
│   ├── projects.ts
│   ├── harness.ts
│   └── analysis.ts      # 캐시 확인 또는 AI 다시 실행 또는 저장
└── middleware.ts         # Clerk auth guard
```

## MVP 범위 (Phase 1)

- [x] 설정 완료
- [ ] GitHub 레포 연결 / 파일 업로드
- [ ] 하네스 파싱 (CLAUDE.md, skills/, hooks/, settings.json)
- [ ] AI 진단 + 3초 점수화
- [ ] AI 추천 + 1클릭 적용
- [ ] CLAUDE.md / Skills 편집기
- [ ] zip 다운로드
- [ ] Clerk 인증

## Phase 2 (나중에)

- Notion / Slack 연동 (업로드 스트림 분석)
- GitHub PR 자동 생성
- 다중 협업
- Hooks / MCP 편집기
- 가비지 컬렉션 에이전트

## 코드 스타일 가이드라인

### TypeScript
- 모든 함수에 명시적 타입 선언 아수 (반환값 + 인자)
- 유니온 타입은 구체적으로: `string | null` 선호, `any` 금지
- 에러 처리: `try-catch` 또는 `Promise` reject 명시
- Zod 스키마: API 응답/요청 검증 필수

### React/Next.js
- "use client" 최소화: 기본은 Server Components
- Form: Server Actions 사용, `onChange` 콜백 최소화
- 성능: 컴포넌트 분리 > useMemo/useCallback
- 에러 바운더리: error.tsx + global-error.tsx 필수

### 함수 설계
- 순수 함수 우선 (`lib/` 모듈)
- 사이드이펙트는 `actions/` 또는 컴포넌트에 격리
- 한 함수 = 한 책임 (Single Responsibility)
- 데이터 변환 > 비즈니스 로직 > UI

### 테스트
- `lib/` 순수 함수는 반드시 `.test.ts` 작성
- 커버리지: 80% 이상 아수
- Mock은 최소화, 실제 로직 테스트 우선
- 통합 테스트: 주요 워크플로우만 (E2E는 별도)

### 네이밍
- 파일: kebab-case (`claude-md-editor.tsx`)
- 함수/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- 불린 함수: `is*`, `has*`, `can*` 접두사

## 핵심 함수 스펙

### `lib/harness/parser.ts`

```typescript
// 파일 맵에서 하네스 구조 파싱
parseHarnessFromMap(files: Map<string, string>): HarnessData

// 하네스 구조를 평탄한 파일 배열로 변환
getAllFiles(harness: HarnessData): Array<{ path: string; content: string; hash: string }>

// 단일 파일 내용 해시 (SHA-256, hex)
hashContent(content: string): string

// 여러 파일의 해시를 합산한 캐시 키 생성
hashFiles(files: Array<{ hash: string }>): string
// 또는 다작 없음. 빈 배열이면 빈 문자열 반환
```

### `lib/ai/analyzer.ts`

```typescript
// AI 분석용 프롬프트 생성 (순수 함수, 부작용 없음)
buildAnalysisPrompt(fileContents: string): string

// AI 응답 JSON 파싱. 마크다운 코드블록 자동 제거
// 또는 JSON 파싱 다실 시 SyntaxError throw
parseAnalysisResponse(raw: string): AnalysisResult

// AI Gateway 호출 또는 분석 실행
// 또는 Gateway 오류 시 GatewayInternalServerError throw
analyzeHarness(fileContents: string): Promise<AnalysisResult>
```

### `actions/analysis.ts` - 캐시 키 전략

```typescript
// filesHash = SHA-256(각 파일 hash를 정렬 후 연결)
// 동일 hash 존재 시 또는 DB 캐시 반환 (AI 미호출)
// 새 hash 또는 AI 분석 또는 DB 저장
getOrRunAnalysis(projectId: string): Promise<HarnessAnalysis | null>
```

## 테스트 규칙

- **커버리지 80% 이상 아수** - `lib/harness/parser.ts`, `lib/ai/analyzer.ts` 는 순수 함수이므로 반드시 테스트
- `npm run test:coverage` 로 확인, 미달 시 CI 다실
- 새 순수 함수 추가 시 동일 파일에 `.test.ts` 작성 아수

## 로컬 개발 시작

```bash
# 1. Vercel 프로젝트 연결 + AI Gateway 활성화
vercel link
vercel env pull .env.local

# 2. Neon DB 마이그레이션
npx drizzle-kit migrate

# 3. 개발 서버
npm run dev
```

## 정리 절차 (Post-Session)

세션 종료 시 자동으로 `.claude/scripts/post-session.sh` 가 실행되어 `.claude/weekly-context.md` 에 세션 마커를 기록합니다.

### 자동 프로세스
1. 스크립트가 `git log --since="7 days ago"` 로 이번 주 커밋 수집
2. 현재 날짜/시간으로 세션 헤더 생성
3. `.claude/weekly-context.md` 상단에 삽입

### 수동 보강 (`/session-wrap` 사용)

```bash
# 1. 세션 내용 요약
대화 내용을 바탕으로 이번 세션에서 한 일을 3-5줄로 정리

# 2. weekly-context.md 수동 편집 (선택)
.claude/weekly-context.md 파일을 열어 다음 섹션 추가:
- "### 이번 세션에서 한 일"
- "### 자주 쓴 패턴 / 반복된 작업"
- "### AI에게 자주 물어본 것 / 어려웠던 부분"
- "### 다음 세션에서 이어야 할 것"

# 3. 커밋
git add .claude/weekly-context.md
git commit -m "chore: update weekly context [$(date +%Y-%m-%d)]"
```

### 파일 형식

```markdown
# Weekly Context

_harness optimize loop가 매주 월요일에 이 파일을 읽어 맞춤형 개선을 합니다._

---

## [YYYY-MM-DD 세션]

### 이번 주 커밋 (git log 기반)
- YYYY-MM-DD: [커밋 메시지]
- ...

### 이번 세션에서 한 일
- [실제로 작업한 내용 3-5줄]

### 자주 쓴 패턴 / 반복된 작업
- [이번 세션에서 반복적으로 한 작업이나 물어본 것]

### AI에게 자주 물어본 것 / 어려웠던 부분
- [Claude에게 질문한 주제나 막혔던 부분]

### 다음 세션에서 이어야 할 것
- [미완료 작업]

---
[이전 세션 내용은 여기 아래...]
```

## 기술 스택별 트러블슈팅

### Next.js + Server Actions

**문제:** Server Action에서 Clerk auth 정보가 `null`로 반환됨
- **원인:** 클라이언트 컴포넌트에서 Server Action 호출 시 컨텍스트 손실
- **해결:** `auth()` 호출을 Server Action 내부에서만 사용, 클라이언트에서는 `userId` 전달

**문제:** Form 제출 후 UI가 업데이트되지 않음
- **원인:** `revalidatePath()` 누락 또는 캐시 전략 오류
- **해결:** Server Action 마지막에 `revalidatePath('/projects')` 추가

**문제:** 대용량 파일 업로드 시 타임아웃
- **원인:** Vercel Blob 업로드 시간 초과
- **해결:** 파일 크기 제한 (권장 100MB 이하), 청크 업로드 검토

### TypeScript + Zod

**문제:** API 응답 타입 검증 오류 (`Type 'unknown' is not assignable to type`)
- **원인:** Zod 파싱 후 타입이 여전히 `unknown`
- **해결:** `.parse()` 대신 `.safeParse()` 사용, 에러 처리 필수

```typescript
const result = schema.safeParse(data);
if (!result.success) {
  throw new Error(`Validation failed: ${result.error.message}`);
}
const validated = result.data; // 이제 올바른 타입
```

**문제:** 옵셔널 필드가 `undefined`로 처리됨
- **원인:** `.optional()` vs `.nullable()` 혼동
- **해결:** 
  - 필드 존재 안 할 수 있음: `.optional()`
  - 필드 존재하지만 `null` 가능: `.nullable()`
  - 둘 다: `.optional().nullable()`

### React + Vitest

**문제:** 컴포넌트 테스트 시 `document is not defined` 오류
- **원인:** jsdom 환경 미설정
- **해결:** `vitest.config.ts` 에 `environment: 'jsdom'` 추가

**문제:** 비동기 함수 테스트 시 `Promise is not returned`
- **원인:** `await` 누락
- **해결:** 테스트 함수를 `async` 로 선언, `await` 추가

```typescript
it('should fetch data', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});
```

### Drizzle ORM

**문제:** 쿼리 실행 후 `undefined` 반환
- **원인:** `await` 누락 또는 연결 오류
- **해결:** 모든 DB 쿼리에 `await` 필수, 타입 정보 명시

```typescript
const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
if (project.length === 0) {
  throw new NotFoundError('Project not found');
}
```

**문제:** 마이그레이션 실패 (`push` vs `migrate`)
- **원인:** 환경 차이 (로컬 vs 프로덕션)
- **해결:** 
  - 로컬: `npx drizzle-kit push:pg` (빠름, DB 업데이트만)
  - 프로덕션: `npx drizzle-kit migrate` (별도 파일 생성, 추적 가능)

### AI SDK v6 (generateText)

**문제:** AI 응답에 마크다운 코드블록 포함됨
- **원인:** 프롬프트에 명시적 포맷 지시 부재
- **해결:** 프롬프트에 `Return ONLY valid JSON, no markdown.` 추가

**문제:** 토큰 초과로 요청 실패
- **원인:** 입력 프롬프트가 너무 김
- **해결:** 파일 크기 제한 (권장 5000자 이하), 핵심 정보만 포함

**문제:** Vercel AI Gateway 인증 오류
- **원인:** `VERCEL_AI_GATEWAY_OIDC_TOKEN` 환경변수 누락
- **해결:** `vercel env pull .env.local` 실행, 로컬 `.env.local` 확인

### Clerk 인증

**문제:** `useAuth()` hook이 `null` 반환
- **원인:** 클라이언트 컴포넌트가 아님
- **해결:** `"use client"` 선언 필수, Server Components에서는 `auth()` 사용

**문제:** GitHub 소셜 로그인 실패
- **원인:** Clerk 대시보드에서 GitHub OAuth 앱 미등록
- **해결:** Clerk 콘솔 → Social Connections → GitHub 설정, Client ID/Secret 입력

### Vercel Blob

**문제:** 파일 업로드 후 `403 Forbidden` 오류
- **원인:** 토큰 만료 또는 권한 부족
- **해결:** `vercel env pull .env.local` 로 최신 토큰 확인

**문제:** 업로드된 파일이 공개 URL에서 접근 불가
- **원인:** `public: false` 옵션 설정
- **해결:** `put()` 시 `{ access: 'public' }` 옵션 추가

### CI/CD (GitHub Actions)

**문제:** lint/test 실패했지만 PR이 merge됨
- **원인:** 브랜치 보호 규칙 미설정
- **해결:** GitHub Settings → Branches → Add rule, "Require status checks to pass"

**문제:** 환경변수 누락으로 workflow 실패
- **원인:** Secrets 미설정
- **해결:** Settings → Secrets and variables → Actions → New repository secret
