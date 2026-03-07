'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  groupId: string
  onClose: () => void
}

export default function AddVirtualMemberModal({ groupId, onClose }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: null,
      display_name: name.trim(),
      role: 'member',
      is_virtual: true,
    })

    if (insertError) {
      setError(insertError.message)
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
          <h2 className="text-base font-semibold text-slate-100">Jugador virtual</h2>
          <p className="text-slate-500 text-xs mt-1">Para jugadores que no usan la app. Vos gestionas sus pagos.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="virtual-name" className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nombre *</label>
          <input
            id="virtual-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Juan Perez"
            autoFocus
            className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-slate-700 transition-colors"
          />
        </div>

        {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 mt-1">
          <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-xl text-sm transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}
