'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Group } from '@/lib/types'

interface Props {
  groups: Group[]
  currentGroupId: string
}

export default function GroupSelector({ groups, currentGroupId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = groups.find(g => g.id === currentGroupId)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (groups.length <= 1) return null

  return (
    <div ref={ref} className="relative mx-6 mt-3 mb-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 text-slate-200 text-sm rounded-xl px-4 py-2.5 outline-none hover:border-slate-700 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate font-medium">{current?.name ?? '—'}</span>
        </span>
        <svg
          className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-xl shadow-black/40 overflow-hidden">
          {groups.map(g => {
            const selected = g.id === currentGroupId
            return (
              <button
                key={g.id}
                onClick={() => { setOpen(false); router.push(`/dashboard?group=${g.id}`) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors
                  ${selected
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${selected ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                <span className="truncate">{g.name}</span>
                {selected && (
                  <svg className="ml-auto w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
