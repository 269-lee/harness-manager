'use server'

import { db } from '@/lib/db'
import { harnessFiles, projects } from '@/lib/db/schema'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { fetchGitHubHarnessFiles as fetchGitHubHarnessFilesCore } from '@/lib/github/fetch'

async function getGitHubToken(): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null
  try {
    const client = await clerkClient()
    const { data } = await client.users.getUserOauthAccessToken(userId, 'oauth_github')
    return data[0]?.token ?? null
  } catch {
    return null
  }
}

export type GitHubRepo = {
  name: string
  fullName: string
  private: boolean
  description: string | null
  htmlUrl: string
}

export async function fetchUserGitHubRepos(): Promise<GitHubRepo[]> {
  const token = await getGitHubToken()
  if (!token) return []

  const res = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  })
  if (!res.ok) return []

  const data = await res.json() as { name: string; full_name: string; private: boolean; description: string | null; html_url: string }[]
  return data.map((r) => ({
    name: r.name,
    fullName: r.full_name,
    private: r.private,
    description: r.description,
    htmlUrl: r.html_url,
  }))
}

export async function fetchGitHubHarnessFiles(repoUrl: string): Promise<Record<string, string>> {
  const token = await getGitHubToken()
  return fetchGitHubHarnessFilesCore(repoUrl, token)
}

export async function saveHarnessFiles(
  projectId: string,
  fileMap: Record<string, string>
) {
  const { hashContent } = await import('@/lib/harness/parser')
  const entries = Object.entries(fileMap)

  for (const [filePath, content] of entries) {
    const fileHash = hashContent(content)
    await db
      .insert(harnessFiles)
      .values({ projectId, filePath, content, fileHash })
      .onConflictDoUpdate({
        target: [harnessFiles.projectId, harnessFiles.filePath],
        set: { content, fileHash, lastSyncedAt: new Date() },
      })
  }

  return entries.length
}

export async function syncFromGitHub(projectId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) })
  if (!project?.githubRepoUrl) throw new Error('GitHub 레포가 연결되지 않은 프로젝트입니다.')

  const fileMap = await fetchGitHubHarnessFiles(project.githubRepoUrl)
  const count = await saveHarnessFiles(projectId, fileMap)

  revalidatePath(`/projects/${projectId}`)
  return count
}

export async function syncAllProjects() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const { users } = await import('@/lib/db/schema')
  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  if (!user) return 0

  const userProjects = await db.select().from(projects).where(eq(projects.userId, user.id))
  const githubProjects = userProjects.filter((p) => p.githubRepoUrl)

  const { getOrRunAnalysis } = await import('@/actions/analysis')

  await Promise.all(
    githubProjects.map(async (p) => {
      const fileMap = await fetchGitHubHarnessFiles(p.githubRepoUrl!)
      await saveHarnessFiles(p.id, fileMap)
      await getOrRunAnalysis(p.id)
      revalidatePath(`/projects/${p.id}`)
    })
  )

  revalidatePath('/', 'layout')
  return githubProjects.length
}

export async function updateHarnessFile(fileId: string, content: string) {
  const { hashContent } = await import('@/lib/harness/parser')
  const [updated] = await db
    .update(harnessFiles)
    .set({ content, fileHash: hashContent(content), lastSyncedAt: new Date() })
    .where(eq(harnessFiles.id, fileId))
    .returning()
  return updated
}
