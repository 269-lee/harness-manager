export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { projects, users, harnessAnalyses, harnessFiles } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { AppSidebar } from '@/components/app-sidebar'
import { hashFiles } from '@/lib/harness/parser'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const [user] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1)
  const userProjects = user
    ? await db.select({ id: projects.id, name: projects.name }).from(projects).where(eq(projects.userId, user.id))
    : []

  const projectIds = userProjects.map(p => p.id)

  const latestScores = new Map<string, number>()
  try {
    // 각 프로젝트의 현재 filesHash 계산 (프로젝트 페이지와 동일한 기준)
    const allFiles = projectIds.length > 0
      ? await db.select({ projectId: harnessFiles.projectId, fileHash: harnessFiles.fileHash })
          .from(harnessFiles)
          .where(inArray(harnessFiles.projectId, projectIds))
      : []

    const filesByProject = new Map<string, { hash: string }[]>()
    for (const f of allFiles) {
      const arr = filesByProject.get(f.projectId) ?? []
      arr.push({ hash: f.fileHash })
      filesByProject.set(f.projectId, arr)
    }

    const currentHashes = new Map<string, string>()
    for (const [projectId, files] of filesByProject) {
      currentHashes.set(projectId, hashFiles(files))
    }

    // 현재 hash와 일치하는 분석만 조회
    const hashValues = [...currentHashes.values()].filter(Boolean)
    const analyses = hashValues.length > 0
      ? await db
          .select({ projectId: harnessAnalyses.projectId, filesHash: harnessAnalyses.filesHash, scores: harnessAnalyses.scores })
          .from(harnessAnalyses)
          .where(inArray(harnessAnalyses.projectId, projectIds))
      : []

    for (const a of analyses) {
      if (a.filesHash === currentHashes.get(a.projectId) && a.scores) {
        const avg = Math.round((a.scores.context + a.scores.enforcement + a.scores.gc) / 3)
        latestScores.set(a.projectId, avg)
      }
    }
  } catch {
    // 스코어 계산 실패해도 레이아웃은 정상 렌더링
  }

  const projectsWithScores = userProjects.map(p => ({
    ...p,
    score: latestScores.get(p.id) ?? null,
  }))

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar projects={projectsWithScores} />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}
