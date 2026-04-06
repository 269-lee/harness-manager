import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { projects, harnessFiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getOrRunAnalysis } from '@/actions/analysis'
import { HarnessScoreCard } from '@/components/harness-score-card'
import { RecommendationCard } from '@/components/recommendation-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const project = await db.query.projects.findFirst({ where: eq(projects.id, id) })
  if (!project) redirect('/dashboard')

  const files = await db.select().from(harnessFiles).where(eq(harnessFiles.projectId, id))
  const analysis = files.length > 0 ? await getOrRunAnalysis(id) : null

  const totalScore = analysis
    ? Math.round((analysis.scores.context + analysis.scores.enforcement + analysis.scores.gc) / 3)
    : 0

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{files.length}개 파일 · 하네스 강도 {totalScore}/100</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${id}/editor`}><Button variant="outline">편집기</Button></Link>
          <a href={`/api/projects/${id}/download`}>
            <Button variant="outline">📥 다운로드</Button>
          </a>
        </div>
      </div>

      {!analysis ? (
        <div className="border border-dashed border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">하네스 파일을 업로드하면 AI 진단이 시작됩니다.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <HarnessScoreCard label="전체 강도" score={totalScore} />
            <HarnessScoreCard label="컨텍스트 파일" score={analysis.scores.context} />
            <HarnessScoreCard label="자동강제 시스템" score={analysis.scores.enforcement}
              warning={analysis.scores.enforcement < 50 ? 'hook 보강 필요' : undefined} />
            <HarnessScoreCard label="가비지컬렉션" score={analysis.scores.gc}
              warning={analysis.scores.gc < 40 ? '설정 없음' : undefined} />
          </div>

          <h2 className="text-lg font-semibold mb-3">AI 추천 ({analysis.recommendations.length}개)</h2>
          <div className="space-y-3">
            {analysis.recommendations.map((rec, i) => (
              <RecommendationCard key={i} recommendation={rec} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
