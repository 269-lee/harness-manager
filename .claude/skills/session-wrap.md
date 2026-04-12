---
name: session-wrap
description: 세션 종료 시 git log + 대화 내용을 .claude/weekly-context.md에 기록합니다
---

이번 세션을 마무리합니다. 아래 순서대로 실행해줘.

## 1. 정보 수집

다음 명령어를 실행해서 이번 주 작업 내역을 가져와:

```bash
git log --since="7 days ago" --format="%ad %s" --date=short
```

그리고 현재 `.claude/weekly-context.md` 파일이 있으면 읽어와.

메모리 디렉토리에서 관련 메모리도 확인해:
- user 타입 메모리: 내 역할과 작업 방식
- project 타입 메모리: 진행 중인 작업 맥락
- feedback 타입 메모리: 이번 세션에서 얻은 피드백

## 2. .claude/weekly-context.md 업데이트

아래 형식으로 파일을 업데이트해줘. 기존 내용이 있으면 새 세션 내용을 **위에 추가** (오래된 건 아래로 밀림):

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

## 3. 커밋

```bash
git add .claude/weekly-context.md
git commit -m "chore: update weekly context [$(date +%Y-%m-%d)]"
```

커밋 후 "세션 마무리 완료" 라고 알려줘.
