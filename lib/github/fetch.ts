const HARNESS_FILE_MATCHERS = [
  (p: string) => p === 'CLAUDE.md',
  (p: string) => p.startsWith('skills/') && p.endsWith('.md'),
  (p: string) => p.startsWith('hooks/'),
  (p: string) => p.startsWith('.claude/skills/'),
  (p: string) => p.startsWith('.claude/hooks/'),
  (p: string) => p === '.claude/settings.json',
  (p: string) => p === 'settings.json',
  (p: string) => p.startsWith('.husky/') || p.includes('/.husky/'),
  (p: string) => (p.startsWith('.github/workflows/') || p.includes('/.github/workflows/')) && (p.endsWith('.yml') || p.endsWith('.yaml')),
  (p: string) => p === '.pre-commit-config.yaml',
  (p: string) => ['vitest.config.ts', 'vitest.config.js', 'jest.config.ts', 'jest.config.js'].includes(p),
  (p: string) => p === 'package.json' || p.endsWith('/package.json'),
  (p: string) => p === 'vercel.json',
  (p: string) => p === 'Makefile',
]

function headers(token: string | null): HeadersInit {
  return {
    Accept: 'application/vnd.github.v3+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function fetchGitHubHarnessFiles(
  repoUrl: string,
  token: string | null = null
): Promise<Record<string, string>> {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\/|\.git|$)/)
  if (!match) throw new Error('유효하지 않은 GitHub URL입니다.')
  const [, owner, repo] = match

  const h = headers(token)

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: h,
    next: { revalidate: 0 },
  })
  if (!repoRes.ok) {
    if (repoRes.status === 404) throw new Error('레포지토리를 찾을 수 없습니다. Private 레포라면 GitHub으로 로그인했는지 확인하세요.')
    throw new Error('GitHub API 요청에 실패했습니다.')
  }
  const { default_branch } = await repoRes.json() as { default_branch: string }

  const branchesRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
    { headers: h, next: { revalidate: 0 } }
  )
  const branchesData = branchesRes.ok
    ? await branchesRes.json() as { name: string }[]
    : [{ name: default_branch }]

  const branches = [
    default_branch,
    ...branchesData.map((b) => b.name).filter((n) => n !== default_branch),
  ]

  const fileMap: Record<string, string> = {}

  await Promise.all(
    branches.map(async (branch) => {
      const treeRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        { headers: h, next: { revalidate: 0 } }
      )
      if (!treeRes.ok) return
      const { tree } = await treeRes.json() as { tree: { type: string; path: string }[] }

      const targets = tree.filter(
        (item) => item.type === 'blob' && HARNESS_FILE_MATCHERS.some((fn) => fn(item.path))
      )

      await Promise.all(
        targets.map(async (item) => {
          if (fileMap[item.path]) return
          const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${item.path}?ref=${branch}`,
            { headers: h, next: { revalidate: 0 } }
          )
          if (!res.ok) return
          const data = await res.json() as { encoding: string; content: string }
          if (data.encoding === 'base64') {
            fileMap[item.path] = Buffer.from(data.content, 'base64').toString('utf-8')
          }
        })
      )
    })
  )

  return fileMap
}
