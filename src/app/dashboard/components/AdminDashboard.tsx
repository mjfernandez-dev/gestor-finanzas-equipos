'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Group, GroupMember, GroupMemberWithBalance, Transaction } from '@/lib/types'
import TransactionItem from './TransactionItem'
import CreateExpenseModal from './CreateExpenseModal'
import AddVirtualMemberModal from './AddVirtualMemberModal'
import GroupSelector from './GroupSelector'
import UserMenu from './UserMenu'
import EditGroupModal from './EditGroupModal'
import MergeMemberModal from './MergeMemberModal'

interface Props {
  group: Group
  allGroups: Group[]
  membership: GroupMember
  membersWithBalance: GroupMemberWithBalance[]
  pendingTransactions: Transaction[]
  recentTransactions: Transaction[]
  allTransactions: Transaction[]
  balance: number
}

export default function AdminDashboard({
  group,
  allGroups,
  membership,
  membersWithBalance,
  pendingTransactions,
  allTransactions,
  balance,
}: Props) {
  const [showExpense, setShowExpense] = useState(false)
  const [showVirtualMember, setShowVirtualMember] = useState(false)
  const [showEditGroup, setShowEditGroup] = useState(false)
  const [showMerge, setShowMerge] = useState<GroupMemberWithBalance | null>(null)
  const [copied, setCopied] = useState(false)
  const [expandedMember, setExpandedMember] = useState<string | null>(null)
  const sorted = [...membersWithBalance].sort((a, b) => a.balance - b.balance)
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete(memberId: string) {
    if (!window.confirm('¿Eliminar este miembro? Se borrarán sus transacciones.')) return
    const { error } = await supabase.rpc('delete_member', { p_member_id: memberId })
    if (error) { alert('Error al eliminar. Intentá de nuevo.'); return }
    router.refresh()
  }

  function copyJoinCode() {
    navigator.clipboard.writeText(group.join_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function getMemberName(memberId: string) {
    return membersWithBalance.find(m => m.id === memberId)?.display_name
  }

  const totalDebt = membersWithBalance.reduce((acc, m) => acc + (m.balance < 0 ? m.balance : 0), 0)

  return (
    <div className="min-h-screen text-slate-100 pb-10">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Administrador</p>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-xl font-semibold text-slate-100">{group.name}</h1>
            <button
              onClick={() => setShowEditGroup(true)}
              aria-label="Editar grupo"
              className="text-slate-600 hover:text-slate-300 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpense(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            + Gasto
          </button>
          <UserMenu />
        </div>
      </div>

      <GroupSelector groups={allGroups} currentGroupId={group.id} />

      {/* Resumen */}
      <div className="mx-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Deuda total</p>
          <p className="text-red-400 text-2xl font-bold font-mono mt-1">${Math.abs(totalDebt).toLocaleString('es-AR')}</p>
        </div>
        <div className="w-px bg-slate-800" />
        <div className="text-right">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Miembros</p>
          <p className="text-slate-100 text-2xl font-bold font-mono mt-1">{membersWithBalance.length}</p>
        </div>
      </div>

      {/* Pagos pendientes */}
      {pendingTransactions.length > 0 && (
        <div className="mx-6 mt-5">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Pagos pendientes <span className="text-amber-400 normal-case">({pendingTransactions.length})</span>
          </h2>
          <div className="flex flex-col gap-2">
            {pendingTransactions.map(t => (
              <TransactionItem
                key={t.id}
                transaction={t}
                showActions
                memberName={getMemberName(t.member_id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lista de miembros por deuda */}
      <div className="mx-6 mt-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide">Saldos por jugador</h2>
          <button
            onClick={() => setShowVirtualMember(true)}
            className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            + Virtual
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {sorted.map(m => {
            const isExpanded = expandedMember === m.id
            const memberTxs = allTransactions
              .filter(t => t.member_id === m.id)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            return (
              <div
                key={m.id}
                className={'bg-slate-900 border border-slate-800 rounded-xl border-l-2 ' +
                  (m.balance < 0 ? 'border-l-red-500/50' : m.balance > 0 ? 'border-l-emerald-500/50' : 'border-l-slate-700')}
              >
                {/* Fila principal */}
                <button
                  onClick={() => setExpandedMember(isExpanded ? null : m.id)}
                  className="w-full px-4 py-3 flex justify-between items-center gap-2 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{m.display_name}</p>
                    {m.is_virtual && <p className="text-xs text-slate-600">Virtual</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className={'text-sm font-bold font-mono ' + (m.balance < 0 ? 'text-red-400' : m.balance > 0 ? 'text-emerald-400' : 'text-slate-500')}>
                      {m.balance < 0 ? '-' : m.balance > 0 ? '+' : ''}${Math.abs(m.balance).toLocaleString('es-AR')}
                    </p>
                    {memberTxs.length > 0 && (
                      <svg
                        width="12" height="12" viewBox="0 0 12 12" fill="currentColor"
                        className={'text-slate-600 transition-transform ' + (isExpanded ? 'rotate-180' : '')}
                      >
                        <path d="M6 8L1 3h10L6 8z"/>
                      </svg>
                    )}
                  </div>
                </button>

                {/* Acciones (fusionar/eliminar) */}
                {m.id !== membership.id && (
                  <div className="px-4 pb-3 flex gap-1 justify-end -mt-1">
                    <button
                      onClick={() => setShowMerge(m)}
                      aria-label={'Fusionar ' + m.display_name + ' con otro miembro'}
                      className="text-xs text-slate-600 hover:text-amber-400 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors"
                    >
                      ⇄
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      aria-label={'Eliminar ' + m.display_name}
                      className="text-xs text-slate-600 hover:text-red-400 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Detalle expandible */}
                {isExpanded && memberTxs.length > 0 && (
                  <div className="px-3 pb-3 flex flex-col gap-1.5 border-t border-slate-800 pt-3">
                    {memberTxs.map(t => {
                      const isCredit = t.type === 'credit'
                      return (
                        <div key={t.id} className="flex justify-between items-center gap-2 px-1">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-300 truncate">
                              {t.description ?? (isCredit ? 'Pago' : 'Gasto')}
                            </p>
                            <p className="text-xs text-slate-600">
                              {new Date(t.created_at).toLocaleDateString('es-AR')}
                              {t.status === 'pending' && <span className="ml-1 text-amber-500">· Pendiente</span>}
                            </p>
                          </div>
                          <p className={'text-xs font-mono font-semibold shrink-0 ' + (isCredit ? 'text-emerald-400' : 'text-red-400')}>
                            {isCredit ? '+' : '-'}${Number(t.amount).toLocaleString('es-AR')}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Código de unión */}
      <div className="mx-6 mt-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex justify-between items-center gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Código del equipo</p>
            <p className="text-2xl font-mono font-bold tracking-[0.2em] text-emerald-400">{group.join_code}</p>
          </div>
          <button
            onClick={copyJoinCode}
            aria-label="Copiar código del equipo"
            className="shrink-0 text-xs font-medium text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied ? 'Copiado ✓' : 'Copiar'}
          </button>
        </div>
      </div>

      {showExpense && (
        <CreateExpenseModal
          groupId={group.id}
          members={membersWithBalance}
          currentMemberId={membership.id}
          onClose={() => setShowExpense(false)}
        />
      )}

      {showVirtualMember && (
        <AddVirtualMemberModal
          groupId={group.id}
          onClose={() => setShowVirtualMember(false)}
        />
      )}

      {showEditGroup && (
        <EditGroupModal
          group={group}
          onClose={() => setShowEditGroup(false)}
        />
      )}

      {showMerge && (
        <MergeMemberModal
          source={showMerge}
          allMembers={membersWithBalance}
          onClose={() => setShowMerge(null)}
        />
      )}
    </div>
  )
}
