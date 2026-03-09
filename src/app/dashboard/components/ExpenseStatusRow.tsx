'use client'

import { useState } from 'react'
import { GroupMemberWithBalance, Transaction } from '@/lib/types'

interface ExpenseGroup {
  expense_group_id: string
  description: string
  created_at: string
  debits: Transaction[]
}

interface MemberStatus {
  member: GroupMemberWithBalance
  debit: Transaction
  status: 'paid' | 'pending' | 'owed'
}

interface Props {
  expense: ExpenseGroup
  allTransactions: Transaction[]
  members: GroupMemberWithBalance[]
  paymentAlias: string | null
}

export default function ExpenseStatusRow({ expense, allTransactions, members, paymentAlias }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  // Para cada débito del gasto, determinar el estado del miembro
  const memberStatuses: MemberStatus[] = expense.debits.map(debit => {
    const member = members.find(m => m.id === debit.member_id)!
    // Buscar crédito vinculado a este gasto para este miembro
    const linkedCredit = allTransactions.find(
      t => t.type === 'credit' && t.member_id === debit.member_id && t.expense_group_id === expense.expense_group_id
    )
    let status: 'paid' | 'pending' | 'owed' = 'owed'
    if (linkedCredit) {
      status = linkedCredit.status === 'approved' ? 'paid' : 'pending'
    }
    return { member, debit, status }
  })

  const paid = memberStatuses.filter(s => s.status === 'paid')
  const pending = memberStatuses.filter(s => s.status === 'pending')
  const owed = memberStatuses.filter(s => s.status === 'owed')
  const total = memberStatuses.length
  const amountPerMember = expense.debits[0] ? Number(expense.debits[0].amount) : 0

  function copyStatus() {
    const lines: string[] = []
    lines.push(`🔵 ${expense.description} — $${amountPerMember.toLocaleString('es-AR')} c/u`)
    if (paid.length > 0) lines.push(`✅ ${paid.map(s => s.member?.display_name ?? '').join(', ')}`)
    if (pending.length > 0) lines.push(`⏳ ${pending.map(s => s.member?.display_name ?? '').join(', ')} (por aprobar)`)
    if (owed.length > 0) lines.push(`❌ ${owed.map(s => s.member?.display_name ?? '').join(', ')} — Falta pagar`)
    if (paymentAlias) lines.push(`\nTransferí a: ${paymentAlias}`)
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const progressPct = total > 0 ? Math.round((paid.length / total) * 100) : 0
  const date = new Date(expense.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Fila principal */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-100 truncate">{expense.description}</p>
          <p className="text-xs text-slate-600 mt-0.5">{date} · ${amountPerMember.toLocaleString('es-AR')} c/u · {total} jugadores</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className={`text-xs font-medium font-mono ${paid.length === total ? 'text-emerald-400' : pending.length > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {paid.length}/{total}
          </span>
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
            className={`text-slate-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path d="M6 8L1 3h10L6 8z"/>
          </svg>
        </div>
      </button>

      {/* Barra de progreso */}
      <div className="h-0.5 bg-slate-800 mx-4">
        <div
          className={`h-full transition-all rounded-full ${paid.length === total ? 'bg-emerald-500' : 'bg-emerald-600'}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Detalle expandible */}
      {expanded && (
        <div className="px-4 py-3 border-t border-slate-800 flex flex-col gap-1.5">
          {memberStatuses.map(({ member, debit, status }) => (
            <div key={debit.id} className="flex items-center gap-2">
              <span className="text-sm w-4 text-center shrink-0">
                {status === 'paid' ? '✅' : status === 'pending' ? '⏳' : '❌'}
              </span>
              <span className="text-sm text-slate-200 flex-1 truncate">{member?.display_name ?? '—'}</span>
              <span className={`text-xs font-mono shrink-0 ${status === 'paid' ? 'text-emerald-400' : status === 'pending' ? 'text-amber-400' : 'text-slate-500'}`}>
                ${Number(debit.amount).toLocaleString('es-AR')}
                {status === 'pending' && <span className="ml-1 text-amber-500/70">· pendiente</span>}
              </span>
            </div>
          ))}

          <button
            onClick={copyStatus}
            className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 py-2 rounded-xl transition-colors"
          >
            {copied ? '✓ Copiado' : '📋 Copiar estado para WhatsApp'}
          </button>
        </div>
      )}
    </div>
  )
}
