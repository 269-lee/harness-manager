/**
 * optimize-repos.mjs
 *
 * 매주 월요일 새벽 4시 실행.
 * DB의 연결된 프로젝트들을 순서대로 클론 → 진단 → 개선 → 커밋/푸시합니다.
 *
 * 필요 환경변수:
 *   DATABASE_URL        - Neon DB
 *   HARNESS_API_URL     - 예: https://harness-manager.vercel.app/api/mcp
 *   HARNESS_API_KEY     - Harness Coach API 키
 *   GH_PAT              - GitHub Personal Access Token (repo 권한)
 */

import { execSync } from 'child_process'
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, relative, dirname } from 'path'
import { tmpdir } from 'os'
import { neon } from '@neondatabase/serverless'

const API_URL = process.env.HARNESS_API_URL
const API_KEY = process.env.HARNESS_API_KEY
const GH_PAT = process.env.GH_PAT
const DB_URL = process.env.DATABASE_URL

if (!API_URL || !API_KEY || !GH_PAT || !DB_URL) {
  console.error('❌ 필요 환경변수: DATABASE_URL, HARNESS_API_URL, HARNESS_API_KEY, GH_PAT')
  process.exit(1)
}

// ── DB에서 프로젝트 목록 조회 ─────────────────────────────────────────────────

async function getProjects() {
  const sql = neon(DB_URL)
  const rows = await sql`
    SELECT p.id, p.name, p.github_repo_url
    FROM projects p
    WHERE p.github_repo_url IS NOT NULL
    GROUP BY p.id, p.name, p.github_repo_url
    ORDER BY p.created_at
  `
  return rows
}

// ── 하네스 파일 수집 ──────────────────────────────────────────────────────────

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', 'target', 'dist', '__pycache__', '.worktrees'])
const HARNESS_NAMES = new Set(['CLAUDE.md', 'settings.json'])
const HARNESS_DIRS = new Set(['skills', 'hooks', '.claude'])

function collectFiles(repoPath) {
  const files = []

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        if (!SKIP_DIRS.has(entry)) walk(full)
      } else {
        const rel = relative(repoPath, full).replace(/\\/g, '/')
        const parts = new Set(rel.split('/').slice(0, -1))
        const isHarnessName = HARNESS_NAMES.has(entry)
        const isHarnessDir = [...parts].some(p => HARNESS_DIRS.has(p))
        const isWorkflow = rel.includes('.github/workflows') && entry.endsWith('.yml')
        const isConfig = ['.pre-commit-config.yaml', 'pyproject.toml', 'Makefile'].includes(entry)
        if (isHarnessName || isHarnessDir || isWorkflow || isConfig) {
          files.push({ path: rel, content: readFileSync(full, 'utf-8') })
        }
      }
    }
  }

  walk(repoPath)
  return files
}

// ── MCP 호출 ─────────────────────────────────────────────────────────────────

async function mcpCall(method, args, id = 1) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: method, arguments: args } }),
  })
  return res.json()
}

function extractJson(text) {
  const m = text.match(/```json\n([\s\S]*?)\n```/)
  return m ? JSON.parse(m[1]) : null
}

// ── 단일 레포 최적화 ──────────────────────────────────────────────────────────

async function optimizeRepo(repoUrl, repoName) {
  console.log(`\n📦 ${repoName} (${repoUrl})`)

  // 1. 클론
  const cloneDir = join(tmpdir(), `harness-opt-${repoName}-${Date.now()}`)
  const authUrl = repoUrl.replace('https://', `https://${GH_PAT}@`)
  execSync(`git clone --depth 1 ${authUrl} ${cloneDir}`, { stdio: 'pipe' })
  console.log(`   ✓ 클론 완료`)

  // 2. 파일 수집
  const files = collectFiles(cloneDir)
  if (files.length === 0) {
    console.log(`   ⚠️  하네스 파일 없음, 스킵`)
    return null
  }
  console.log(`   ✓ ${files.length}개 파일 수집`)

  // 3. 진단
  const diagRes = await mcpCall('diagnose_harness', { files })
  if (!diagRes.result) {
    console.error(`   ❌ 진단 실패:`, diagRes.error)
    return null
  }
  const diagData = extractJson(diagRes.result.content[0].text)
  if (!diagData) { console.error('   ❌ 진단 응답 파싱 실패'); return null }

  const { total, scores, recommendations } = diagData.loop_data
  const grade = total >= 80 ? 'A' : total >= 60 ? 'B' : total >= 40 ? 'C' : 'D'
  console.log(`   진단: ${total}/100 (${grade}) — context:${scores.context} enforcement:${scores.enforcement} gc:${scores.gc}`)

  if (recommendations.length === 0 || total >= 80) {
    console.log(`   ✅ 개선 불필요 (점수 충분 또는 추천 없음)`)
    return { repoName, before: total, after: total, grade, filesChanged: 0 }
  }

  // 4. weekly-context.md 읽기 (있으면)
  const weeklyContextPath = join(cloneDir, '.claude', 'weekly-context.md')
  const weeklyContext = existsSync(weeklyContextPath)
    ? readFileSync(weeklyContextPath, 'utf-8')
    : undefined
  if (weeklyContext) {
    console.log(`   ✓ weekly-context.md 발견 — 맞춤형 개선 적용`)
  }

  // 5. 개선 (action 필드 제거 — 페이로드 크기 절감)
  const recs = recommendations.map(r => ({
    priority: r.priority,
    category: r.category ?? 'context',
    title: r.title,
    description: r.description,
    action: '',
  }))

  const improveRes = await mcpCall('improve_harness', { files, recommendations: recs, weekly_context: weeklyContext }, 2)
  if (!improveRes.result) {
    console.error(`   ❌ 개선 실패:`, improveRes.error)
    return null
  }
  const improveData = extractJson(improveRes.result.content[0].text)
  if (!improveData) { console.error('   ❌ 개선 응답 파싱 실패'); return null }

  const improvedFiles = improveData.loop_data?.improved_files ?? []
  if (improvedFiles.length === 0) {
    console.log(`   ⚠️  개선 파일 없음`)
    return null
  }

  // 6. 파일 쓰기
  for (const f of improvedFiles) {
    const fullPath = join(cloneDir, f.path)
    mkdirSync(dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, f.content, 'utf-8')
  }
  console.log(`   ✓ ${improvedFiles.length}개 파일 개선`)

  // 7. 재진단
  const afterFiles = collectFiles(cloneDir)
  const diagAfterRes = await mcpCall('diagnose_harness', { files: afterFiles }, 3)
  let afterTotal = total
  if (diagAfterRes.result) {
    const afterData = extractJson(diagAfterRes.result.content[0].text)
    afterTotal = afterData?.loop_data?.total ?? total
  }

  // 8. 커밋 & 푸시
  execSync(`git -C ${cloneDir} config user.name "harness-coach[bot]"`)
  execSync(`git -C ${cloneDir} config user.email "harness-coach[bot]@users.noreply.github.com"`)
  execSync(`git -C ${cloneDir} add -A`)

  const hasChanges = execSync(`git -C ${cloneDir} status --porcelain`).toString().trim()
  if (!hasChanges) {
    console.log(`   ⚠️  변경 사항 없음`)
    return null
  }

  const msg = `feat: harness optimization — score ${total}→${afterTotal} [auto]`
  execSync(`git -C ${cloneDir} commit -m "${msg}"`)
  execSync(`git -C ${cloneDir} push`, { stdio: 'pipe' })
  console.log(`   ✅ 푸시 완료: ${total} → ${afterTotal}`)

  return { repoName, repoUrl, before: total, after: afterTotal, grade, filesChanged: improvedFiles.length }
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  const projects = await getProjects()
  console.log(`🔍 연결된 프로젝트: ${projects.length}개`)

  const results = []
  for (const proj of projects) {
    try {
      const result = await optimizeRepo(proj.github_repo_url, proj.name)
      if (result) results.push(result)
    } catch (err) {
      console.error(`   ❌ ${proj.name} 오류: ${err.message}`)
    }
  }

  console.log('\n\n── 결과 요약 ───────────────────────────────────')
  if (results.length === 0) {
    console.log('변경된 프로젝트 없음')
  } else {
    for (const r of results) {
      const diff = r.after - r.before
      const arrow = diff > 0 ? `+${diff}` : diff === 0 ? '±0' : `${diff}`
      console.log(`  ${r.repoName}: ${r.before} → ${r.after} (${arrow}), ${r.filesChanged}개 파일`)
    }
  }
}

main().catch(err => {
  console.error('❌ 치명적 오류:', err.message)
  process.exit(1)
})
