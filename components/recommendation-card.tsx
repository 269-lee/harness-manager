'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Recommendation } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

const priorityConfig = {
  urgent: { label: '긴급', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  high: { label: '높음', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  medium: { label: '보통', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
}

interface RecommendationCardProps {
  recommendation: Recommendation
  onApply?: () => void
  applying?: boolean
}

export function RecommendationCard({ recommendation, onApply, applying }: RecommendationCardProps) {
  const config = priorityConfig[recommendation.priority]
  return (
    <Card className="bg-[#1a1a1a] border-border">
      <CardContent className="pt-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={cn('text-xs', config.className)}>{config.label}</Badge>
            <span className="text-xs text-muted-foreground capitalize">{recommendation.category}</span>
          </div>
          <p className="text-sm font-medium truncate">{recommendation.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{recommendation.description}</p>
        </div>
        {onApply && (
          <Button size="sm" variant="outline" onClick={onApply} disabled={applying} className="shrink-0 text-xs">
            {applying ? '적용 중...' : '1클릭 적용'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
