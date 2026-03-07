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
      setError('Error al fusionar. Intentá de nuevo.')
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Fusionar miembro</h2>
          <p className="text-sm text-gray-400 mt-1">
            Las transacciones de <span className="text-white font-medium">{source.display_name}</span> se transferirán al miembro seleccionado y luego se eliminará.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">Transferir historial a</label>
          <select
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
            className="bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="">Seleccionar miembro...</option>
            {options.map(m => (
              <option key={m.id} value={m.id}>{m.display_name}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleMerge}
            disabled={loading || !targetId}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Fusionando...' : 'Fusionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
