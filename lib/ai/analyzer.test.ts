import { describe, it, expect } from 'vitest'
import { buildAnalysisPrompt, parseAnalysisResponse } from './analyzer'

describe('buildAnalysisPrompt', () => {
  it('파일 내용을 포함한 프롬프트를 생성한다', () => {
    const prompt = buildAnalysisPrompt('### CLAUDE.md\n# Rules')
    expect(prompt).toContain('CLAUDE.md')
    expect(prompt).toContain('JSON')
    expect(prompt).toContain('context')
    expect(prompt).toContain('enforcement')
    expect(prompt).toContain('gc')
  })
})

describe('parseAnalysisResponse', () => {
  it('유효한 JSON 응답을 파싱한다', () => {
    const raw = JSON.stringify({
      scores: { context: 80, enforcement: 50, gc: 30 },
      recommendations: [
        {
          priority: 'high',
          category: 'enforcement',
          title: 'TypeScript hook 추가',
          description: '타입 검사 hook이 없습니다.',
          action: 'pre-commit hook에 tsc --noEmit 추가',
        },
      ],
    })
    const result = parseAnalysisResponse(raw)
    expect(result.scores.context).toBe(80)
    expect(result.recommendations).toHaveLength(1)
    expect(result.recommendations[0].priority).toBe('high')
  })

  it('잘못된 JSON이면 에러를 던진다', () => {
    expect(() => parseAnalysisResponse('not json')).toThrow()
  })

  it('점수가 0-100 범위를 벗어나면 클램핑한다', () => {
    const raw = JSON.stringify({
      scores: { context: 150, enforcement: -10, gc: 50 },
      recommendations: [],
    })
    const result = parseAnalysisResponse(raw)
    expect(result.scores.context).toBe(100)
    expect(result.scores.enforcement).toBe(0)
  })
})
