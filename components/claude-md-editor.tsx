'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updateHarnessFile } from '@/actions/harness'

interface ClaudeMdEditorProps {
  fileId: string
  initialContent: string
}

export function ClaudeMdEditor({ fileId, initialContent }: ClaudeMdEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await updateHarnessFile(fileId, content)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">CLAUDE.md</h2>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : saved ? '저장됨 ✓' : '저장'}
        </Button>
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 font-mono text-sm resize-none min-h-[500px] bg-[#0a0a0a]"
        placeholder="CLAUDE.md 내용을 입력하세요..."
      />
    </div>
  )
}
