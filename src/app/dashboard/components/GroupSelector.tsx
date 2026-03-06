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
    <div className="mx-6 mt-4">
      <select
        value={currentGroupId}
        onChange={e => router.push(`/dashboard?group=${e.target.value}`)}
        className="w-full bg-gray-800 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-600"
      >
        {groups.map(g => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
    </div>
  )
}
