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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white">Agregar jugador virtual</h2>
        <p className="text-gray-400 text-xs -mt-2">Para jugadores que no usan la app. Vos gestionas sus pagos.</p>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-400">Nombre *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Juan Perez"
            autoFocus
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
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Agregando...' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}
