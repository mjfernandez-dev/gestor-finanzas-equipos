'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { GroupMemberWithBalance } from '@/lib/types'

interface Props {
  source: GroupMemberWithBalance
  allMembers: GroupMemberWithBalance[]
  onClose: () => void
}

export default function MergeMemberModal({ source, allMembers, onClose }: Props) {
  const [targetId, setTargetId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const options = allMembers.filter(m => m.id !== source.id)

  async function handleMerge() {
    if (!targetId) return
    setLoading(true)
    setError('')

    const { error: rpcError } = await supabase.rpc('merge_members', {
      source_member_id: source.id,
      target_member_id: targetId,
    })

    if (rpcError) {
      setError('Error al fusionar. Intenta de nuevo.')
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Fusionar miembro</h2>
          <p className="text-sm text-slate-500 mt-1">
            Las transacciones de <span className="text-slate-300 font-medium">{source.display_name}</span> se transferiran al miembro seleccionado y luego se eliminara.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="merge-target" className="text-xs font-medium text-slate-500 uppercase tracking-wide">Transferir historial a</label>
          <select
            id="merge-target"
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
            autoFocus
            className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
          >
            <option value="">Seleccionar miembro...</option>
            {options.map(m => (
              <option key={m.id} value={m.id}>{m.display_name}</option>
            ))}
          </select>
        </div>

        {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-xl text-sm transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleMerge}
            disabled={loading || !targetId}
            className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-medium py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Fusionando...' : 'Fusionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
