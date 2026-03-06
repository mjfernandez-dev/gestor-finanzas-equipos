'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { GroupMember } from '@/lib/types'

type ExpenseType = 'general' | 'asistencia' | 'manual'

interface Props {
  groupId: string
  members: GroupMember[]
  currentMemberId: string
  onClose: () => void
}

export default function CreateExpenseModal({ groupId, members, currentMemberId, onClose }: Props) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<ExpenseType>('general')
  const [attendees, setAttendees] = useState<Set<string>>(new Set(members.map(m => m.id)))
  const [manualMemberId, setManualMemberId] = useState(members[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function toggleAttendee(memberId: string) {
    setAttendees(prev => {
      const next = new Set(prev)
      next.has(memberId) ? next.delete(memberId) : next.add(memberId)
      return next
    })
  }

  function getAmountPerMember(): { memberId: string; amount: number }[] {
    const total = parseFloat(amount)
    if (isNaN(total) || total <= 0) return []

    if (type === 'general') {
      const perPerson = total / members.length
      return members.map(m => ({ memberId: m.id, amount: perPerson }))
    }

    if (type === 'asistencia') {
      const present = members.filter(m => attendees.has(m.id))
      if (present.length === 0) return []
      const perPerson = total / present.length
      return present.map(m => ({ memberId: m.id, amount: perPerson }))
    }

    if (type === 'manual') {
      return [{ memberId: manualMemberId, amount: total }]
    }

    return []
  }

  async function handleCreate() {
    const splits = getAmountPerMember()
    if (!description.trim() || splits.length === 0) {
      setError('Completá todos los campos.')
      return
    }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const transactions = splits.map(s => ({
      group_id: groupId,
      member_id: s.memberId,
      type: 'debit' as const,
      amount: Math.round(s.amount * 100) / 100,
      description: description.trim(),
      status: 'approved' as const,
      created_by: user.id,
    }))

    const { error: txError } = await supabase.from('transactions').insert(transactions)

    if (txError) {
      setError(txError.message)
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  const splits = getAmountPerMember()
  const total = parseFloat(amount)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-0">
      <div className="bg-gray-900 rounded-t-2xl w-full max-w-lg flex flex-col gap-4 p-6 pb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Nuevo gasto</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        {/* Descripción */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Descripción *</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ej: Cancha 15/03"
            className="bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Monto */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Monto total *</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            className="bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Tipo */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-400">Tipo de distribución</label>
          <div className="flex gap-2">
            {(['general', 'asistencia', 'manual'] as ExpenseType[]).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                  type === t ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {t === 'general' ? 'General' : t === 'asistencia' ? 'Asistencia' : 'Manual'}
              </button>
            ))}
          </div>
        </div>

        {/* Asistencia: checkboxes */}
        {type === 'asistencia' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-400">¿Quién asistió?</label>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {members.map(m => (
                <label key={m.id} className="flex items-center gap-3 py-2 px-3 bg-gray-800 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attendees.has(m.id)}
                    onChange={() => toggleAttendee(m.id)}
                    className="accent-green-600"
                  />
                  <span className="text-sm text-white">{m.display_name}</span>
                  {!isNaN(total) && total > 0 && attendees.has(m.id) && attendees.size > 0 && (
                    <span className="text-xs text-gray-400 ml-auto">
                      ${(total / attendees.size).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Manual: selector de miembro */}
        {type === 'manual' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Jugador</label>
            <select
              value={manualMemberId}
              onChange={e => setManualMemberId(e.target.value)}
              className="bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-600"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.display_name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Preview */}
        {splits.length > 0 && !isNaN(total) && type === 'general' && (
          <p className="text-xs text-gray-400">
            ${(total / members.length).toLocaleString('es-AR', { maximumFractionDigits: 2 })} por jugador × {members.length} miembros
          </p>
        )}

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
            disabled={loading || !description.trim() || !amount}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Guardando...' : 'Crear gasto'}
          </button>
        </div>
      </div>
    </div>
  )
}
