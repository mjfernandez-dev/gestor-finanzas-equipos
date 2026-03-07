'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Group } from '@/lib/types'

interface Props {
  group: Group
  onClose: () => void
}

export default function EditGroupModal({ group, onClose }: Props) {
  const [name, setName] = useState(group.name)
  const [alias, setAlias] = useState(group.payment_alias ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const { error: updateError } = await supabase
      .from('groups')
      .update({ name: name.trim(), payment_alias: alias.trim() || null })
      .eq('id', group.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-base font-semibold text-slate-100">Editar grupo</h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-group-name" className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nombre del equipo *</label>
          <input
            id="edit-group-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-group-alias" className="text-xs font-medium text-slate-500 uppercase tracking-wide">Alias para cobrar</label>
          <input
            id="edit-group-alias"
            type="text"
            value={alias}
            onChange={e => setAlias(e.target.value)}
            placeholder="Ej: lospibesfc.mp"
            className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-slate-700 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Codigo del equipo</label>
          <p className="font-mono text-2xl font-bold tracking-[0.2em] text-emerald-400 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center">
            {group.join_code}
          </p>
          <p className="text-xs text-slate-600">Compartilo para que los jugadores se unan</p>
        </div>

        {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 mt-1">
          <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-xl text-sm transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
