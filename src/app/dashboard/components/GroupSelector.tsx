'use client'

import { useRouter } from 'next/navigation'
import { Group } from '@/lib/types'

interface Props {
  groups: Group[]
  currentGroupId: string
}

export default function GroupSelector({ groups, currentGroupId }: Props) {
  const router = useRouter()

  if (groups.length <= 1) return null

  return (
    <div className="mx-6 mt-3 mb-1">
      <select
        value={currentGroupId}
        onChange={e => router.push(`/dashboard?group=${e.target.value}`)}
        className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
      >
        {groups.map(g => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
    </div>
  )
}
