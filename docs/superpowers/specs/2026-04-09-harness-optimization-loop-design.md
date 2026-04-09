# Harness Optimization Loop — Design Spec
**Date:** 2026-04-09
**Status:** Approved

---

## 1. 개요

Harness Coach에 **자동 최적화 루프** 기능을 추가한다. Claude Code가 오케스트레이터 역할을 하여 로컬 하네스 파일을 진단 → 개선 → 재진단하는 루프를 목표 점수에 도달할 때까지 반복한다.

핵심 흐름:
```
진단 → 점수 확인 → (임계값 미달) → 개선 적용 → 재진단 → ...
```

---

## 2. 아키텍처

```
Claude Code (오케스트레이터)
│
│  loop(threshold=80, max_iter=5):
│    1. 로컬 파일 읽기 (CLAUDE.md, skills/, hooks/, settings.json)
│    2. diagnose_harness(files) → { score, recommendations }
│    3. score >= threshold → 완료 출력 후 break
│    4. improve_harness(files, recommendations) → { improved_files }
│    5. 로컬 파일 쓰기
│    6. 다음 반복
│
▼
MCP Server (/api/mcp)
├── diagnose_harness(files?)   ← files 파라미터 추가
└── improve_harness(files?)    ← improved_files 반환 추가
```

**변경 범위:**
- `diagnose_harness`: `files?` 파라미터 추가 (있으면 GitHub fetch 스킵)
- `improve_harness`: `improved_files` 반환 추가
- 새 파일 없음, 새 DB 스키마 없음

---

## 3. MCP 도구 인터페이스

### 3.1 `diagnose_harness`

```typescript
// 입력
{
  repo: string,
  files?: {
    path: string,
    content: string
  }[]
}

// 출력 (기존과 동일)
{
  scores: {
    context: number,      // 0-100
    enforcement: number,
    gc: number,
    total: number
  },
  recommendations: {
    priority: "urgent" | "high" | "medium",
    title: string,
    description: string,
    target_file: string
  }[]
}
```

`files`가 제공되면 GitHub fetch를 건너뛰고 전달된 내용으로 직접 분석한다.

### 3.2 `improve_harness`

```typescript
// 입력
{
  repo: string,
  files?: { path: string, content: string }[],
  recommendations?: { title: string, description: string, target_file: string }[]
}

// 출력
{
  summary: string,
  improved_files: {
    path: string,
    content: string,
    change_summary: string  // 변경 내용 한 줄 설명
  }[]
}
```

`recommendations`가 제공되면 재생성 없이 해당 추천을 파일에 적용한다.

---

## 4. 루프 실행 흐름

### 4.1 정상 흐름

```
사용자: "harness 최적화해줘 (threshold=80)"

iter 1/5:
  diagnose_harness(files) → score: 62
  62 < 80 → improve_harness(files, recs) → improved_files
  로컬 파일 수정

iter 2/5:
  diagnose_harness(updated_files) → score: 74
  74 < 80 → improve_harness(...) → improved_files
  로컬 파일 수정

iter 3/5:
  diagnose_harness(updated_files) → score: 83
  83 >= 80 → 루프 완료

최종 리포트:
  시작 점수: 62 → 최종 점수: 83
  수정 파일: CLAUDE.md, skills/session-wrap.md
  반복 횟수: 3회
```

### 4.2 종료 조건

| 조건 | 동작 |
|------|------|
| `score >= threshold` | 성공 종료, 결과 리포트 출력 |
| `iteration >= max_iterations` | 중단, 최종 점수 및 잔여 추천 출력 |
| 연속 2회 score 개선 없음 | 수렴 감지, 조기 종료 |

기본값: `threshold=80`, `max_iterations=5`

---

## 5. 에러 처리

| 상황 | 처리 |
|------|------|
| MCP 호출 실패 | 해당 이터레이션 재시도 1회, 실패 시 중단 |
| 파일 쓰기 실패 | 중단 + 변경된 파일 목록 출력 (수동 복구 가능) |
| max_iterations 도달 | 중단 + 최종 점수 및 잔여 추천사항 출력 |

---

## 6. 향후 확장 연결 지점

이 루프는 이후 두 모듈의 연결을 전제로 설계되었다.

```
[기준 모듈]       → loop() 호출 전, threshold / 허용 개선 범위 정의
[리스크 제한 모듈] → improve_harness 결과 수신 후,
                     파일 쓰기 전 변경사항 검토 및 차단
```

두 모듈은 이 스펙의 범위 밖이며 별도 스펙으로 설계한다.

---

## 7. 범위 밖 (이 스펙에서 다루지 않음)

- 기준 모듈 (좋은 하네스의 정의)
- 리스크 제한 모듈
- 웹앱 UI 연동
- GitHub 자동 커밋/PR
- 루프 진행 상황 실시간 표시
