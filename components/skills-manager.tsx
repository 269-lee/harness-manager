'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updateHarnessFile } from '@/actions/harness'

interface Skill {
  id: string
  filePath: string
  content: string
}

export function SkillsManager({ skills }: { skills: Skill[] }) {
  const [selected, setSelected] = useState<Skill | null>(skills[0] ?? null)
  const [content, setContent] = useState(selected?.content ?? '')
  const [saving, setSaving] = useState(false)

  function selectSkill(skill: Skill) {
    setSelected(skill)
    setContent(skill.content)
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    await updateHarnessFile(selected.id, content)
    setSaving(false)
  }

  return (
    <div className="flex gap-4 h-full">
      <div className="w-48 shrink-0">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Skills</p>
        {skills.length === 0 && <p className="text-xs text-muted-foreground">스킬 없음</p>}
        {skills.map((s) => (
          <button
            key={s.id}
            onClick={() => selectSkill(s)}
            className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors ${selected?.id === s.id ? 'bg-muted text-foreground' : 'text-muted-foreground'}`}
          >
            {s.filePath.replace('skills/', '')}
          </button>
        ))}
      </div>
      {selected ? (
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono text-muted-foreground">{selected.filePath}</span>
            <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</Button>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 font-mono text-sm resize-none min-h-[500px] bg-[#0a0a0a]"
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          스킬을 선택하세요
        </div>
      )}
    </div>
  )
}
