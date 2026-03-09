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
      return members.map(m => ({ memberId: m.id, amount: total / members.length }))
    }
    if (type === 'asistencia') {
      const present = members.filter(m => attendees.has(m.id))
      if (present.length === 0) return []
      return present.map(m => ({ memberId: m.id, amount: total / present.length }))
    }
    if (type === 'manual') {
      return [{ memberId: manualMemberId, amount: total }]
    }
    return []
  }

  async function handleCreate() {
    const splits = getAmountPerMember()
    if (!description.trim() || splits.length === 0) {
      setError('Completa todos los campos.')
      return
    }
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const expenseGroupId = crypto.randomUUID()
    const transactions = splits.map(s => ({
      group_id: groupId,
      member_id: s.memberId,
      type: 'debit' as const,
      amount: Math.round(s.amount * 100) / 100,
      description: description.trim(),
      status: 'approved' as const,
      expense_group_id: expenseGroupId,
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
  const typeBtnCls = (active: boolean) =>
    'flex-1 py-2 rounded-xl text-xs font-medium transition-colors ' +
    (active ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700')

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
      <div className="bg-slate-900 border-t border-slate-800 rounded-t-2xl w-full max-w-lg flex flex-col gap-4 p-6 pb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold text-slate-100">Nuevo gasto</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate-600 hover:text-slate-400 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="expense-desc" className="text-xs font-medium text-slate-500 uppercase tracking-wide">Descripcion *</label>
          <input
            id="expense-desc"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Ej: Cancha 15/03"
            autoFocus
            className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-slate-700 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="expense-amount" className="text-xs font-medium text-slate-500 uppercase tracking-wide">Monto total *</label>
          <input
            id="expense-amount"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-slate-700 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Distribucion</label>
          <div className="flex gap-2">
            {(['general', 'asistencia', 'manual'] as ExpenseType[]).map(t => (
              <button key={t} onClick={() => setType(t)} className={typeBtnCls(type === t)}>
                {t === 'general' ? 'General' : t === 'asistencia' ? 'Asistencia' : 'Manual'}
              </button>
            ))}
          </div>
        </div>

        {type === 'asistencia' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Quien asistio</label>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {members.map(m => (
                <label key={m.id} className="flex items-center gap-3 py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attendees.has(m.id)}
                    onChange={() => toggleAttendee(m.id)}
                    className="accent-emerald-600"
                  />
                  <span className="text-sm text-slate-200">{m.display_name}</span>
                  {!isNaN(total) && total > 0 && attendees.has(m.id) && attendees.size > 0 && (
                    <span className="text-xs text-slate-500 ml-auto font-mono">
                      ${(total / attendees.size).toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {type === 'manual' && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Jugador</label>
            <select
              value={manualMemberId}
              onChange={e => setManualMemberId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.display_name}</option>
              ))}
            </select>
          </div>
        )}

        {splits.length > 0 && !isNaN(total) && type === 'general' && (
          <p className="text-xs text-slate-500">
            ${(total / members.length).toLocaleString('es-AR', { maximumFractionDigits: 2 })} por jugador x {members.length} miembros
          </p>
        )}

        {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 mt-1">
          <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-xl text-sm transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !description.trim() || !amount}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? 'Guardando...' : 'Crear gasto'}
          </button>
        </div>
      </div>
    </div>
  )
}
