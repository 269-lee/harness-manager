import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ScoreCardProps {
  label: string
  score: number
  warning?: string
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-green-400'
  if (score >= 40) return 'text-yellow-400'
  return 'text-red-400'
}

export function HarnessScoreCard({ label, score, warning }: ScoreCardProps) {
  return (
    <Card className="bg-[#1a1a1a] border-border">
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className={cn('text-3xl font-bold', scoreColor(score))}>
          {score}<span className="text-sm text-muted-foreground">/100</span>
        </p>
        {warning && <p className="text-xs text-yellow-400 mt-1">{warning}</p>}
      </CardContent>
    </Card>
  )
}
