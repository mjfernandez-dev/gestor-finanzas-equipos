'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [alias, setAlias] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Asegurar que el perfil existe (por si el trigger no corrió)
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email ?? '',
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    }, { onConflict: 'id' })

    // Generar ID en el cliente para evitar el problema de RLS en el select post-insert
    const groupId = crypto.randomUUID()

    // Crear grupo
    const { error: groupError } = await supabase
      .from('groups')
      .insert({ id: groupId, name: name.trim(), payment_alias: alias.trim() || null, created_by: user.id })

    if (groupError) {
      setError(groupError.message)
      setLoading(false)
      return
    }

    // Crear membresía como admin
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        display_name: user.user_metadata?.name ?? user.email ?? 'Admin',
        role: 'admin',
        is_virtual: false,
      })

    if (memberError) {
      setError('Error al configurar el grupo. Intentá de nuevo.')
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white">Crear grupo</h2>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">Nombre del equipo *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Los Pibes FC"
            className="bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">Alias para cobrar (CBU/CVU/Alias)</label>
          <input
            type="text"
            value={alias}
            onChange={e => setAlias(e.target.value)}
            placeholder="Ej: lospibsfc.mp"
            className="bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 mt-2">
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
            {loading ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  )
}
