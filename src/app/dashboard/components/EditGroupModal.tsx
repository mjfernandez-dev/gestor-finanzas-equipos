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
      .update({
        name: name.trim(),
        payment_alias: alias.trim() || null,
      })
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white">Editar grupo</h2>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Nombre del equipo *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Alias para cobrar (CBU/CVU/Alias)</label>
          <input
            type="text"
            value={alias}
            onChange={e => setAlias(e.target.value)}
            placeholder="Ej: lospibesfc.mp"
            className="bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 mt-1">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim()}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
