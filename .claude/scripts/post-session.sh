#!/bin/bash
# PostSession 훅 — Claude Code exit 시 자동 실행
# git log를 수집해서 weekly-context.md에 세션 마커를 남깁니다.
# Claude가 /session-wrap을 실행하면 이 마커를 보고 내용을 채웁니다.

CONTEXT_FILE=".claude/weekly-context.md"
DATE=$(date +"%Y-%m-%d")
TIME=$(date +"%H:%M")

# weekly-context.md가 없으면 헤더 생성
if [ ! -f "$CONTEXT_FILE" ]; then
  cat > "$CONTEXT_FILE" << HEADER
# Weekly Context

_harness optimize loop가 매주 월요일에 이 파일을 읽어 맞춤형 개선을 합니다._
_세션 종료 시 자동으로 업데이트됩니다. /session-wrap으로 내용을 보강할 수 있습니다._

HEADER
fi

# 이번 주 git log 수집
RECENT_COMMITS=$(git log --since="7 days ago" --format="- %ad: %s" --date=short 2>/dev/null | head -20)

# 세션 마커 추가 (파일 상단에 삽입)
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE" << SESSION

---

## [$DATE $TIME 세션 종료]

### 이번 주 커밋
${RECENT_COMMITS:-"(커밋 없음)"}

### 세션 상세 내용
> /session-wrap 을 실행하면 Claude가 대화 내용을 기반으로 이 섹션을 채워줍니다.

SESSION

# 헤더 뒤에 새 세션 내용 삽입
head -5 "$CONTEXT_FILE" > "$CONTEXT_FILE.new"
cat "$TEMP_FILE" >> "$CONTEXT_FILE.new"
tail -n +6 "$CONTEXT_FILE" >> "$CONTEXT_FILE.new"
mv "$CONTEXT_FILE.new" "$CONTEXT_FILE"
rm "$TEMP_FILE"

echo "[harness] weekly-context.md 업데이트됨 ($DATE)"
