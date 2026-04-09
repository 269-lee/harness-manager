'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold">프로젝트를 불러오지 못했습니다</h2>
      <p className="text-muted-foreground text-sm max-w-md">
        {error.message || '알 수 없는 오류가 발생했습니다.'}
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono">ERROR {error.digest}</p>
      )}
      <div className="flex gap-2">
        <Button onClick={reset} variant="outline" size="sm">다시 시도</Button>
        <Link href="/dashboard"><Button variant="ghost" size="sm">대시보드로</Button></Link>
      </div>
    </div>
  )
}
