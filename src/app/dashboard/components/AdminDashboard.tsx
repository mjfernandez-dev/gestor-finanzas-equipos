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
  balance: number
}

export default function AdminDashboard({
  group,
  allGroups,
  membership,
  membersWithBalance,
  pendingTransactions,
  recentTransactions,
  balance,
}: Props) {
  const [showExpense, setShowExpense] = useState(false)
  const [showVirtualMember, setShowVirtualMember] = useState(false)
  const [showEditGroup, setShowEditGroup] = useState(false)
  const [showMerge, setShowMerge] = useState<GroupMemberWithBalance | null>(null)
  const [copied, setCopied] = useState(false)
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
  const totalDebt = membersWithBalance.reduce((acc, m) => acc + (m.balance < 0 ? m.balance : 0), 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm">Administrador</p>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-xl font-bold">{group.name}</h1>
            <button
              onClick={() => setShowEditGroup(true)}
              className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
              title="Editar grupo"
            >
              ✎
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExpense(true)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            + Gasto
          </button>
          <UserMenu />
        </div>
      </div>

      <GroupSelector groups={allGroups} currentGroupId={group.id} />

      {/* Resumen */}
      <div className="mx-6 bg-gray-900 rounded-2xl p-5 flex justify-between">
        <div>
          <p className="text-gray-400 text-xs">Deuda total</p>
          <p className="text-red-400 text-2xl font-bold">${Math.abs(totalDebt).toLocaleString('es-AR')}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Miembros</p>
          <p className="text-white text-2xl font-bold">{membersWithBalance.length}</p>
        </div>
      </div>

      {/* Pagos pendientes */}
      {pendingTransactions.length > 0 && (
        <div className="mx-6 mt-5">
          <h2 className="text-sm font-semibold text-yellow-400 mb-3">
            Pagos pendientes ({pendingTransactions.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pendingTransactions.map(t => (
              <TransactionItem key={t.id} transaction={t} showActions />
            ))}
          </div>
        </div>
      )}

      {/* Lista de miembros por deuda */}
      <div className="mx-6 mt-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-gray-400">Saldos por jugador</h2>
          <button
            onClick={() => setShowVirtualMember(true)}
            className="text-xs text-green-500 hover:text-green-400 transition-colors"
          >
            + Virtual
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {sorted.map(m => (
            <div key={m.id} className="bg-gray-900 rounded-xl px-4 py-3 flex justify-between items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{m.display_name}</p>
                {m.is_virtual && <p className="text-xs text-gray-500">Virtual</p>}
              </div>
              <p className={`text-sm font-bold shrink-0 ${m.balance < 0 ? 'text-red-400' : m.balance > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                {m.balance < 0 ? '-' : m.balance > 0 ? '+' : ''}${Math.abs(m.balance).toLocaleString('es-AR')}
              </p>
              {m.id !== membership.id && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setShowMerge(m)}
                    className="text-xs text-gray-500 hover:text-yellow-400 bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded-lg transition-colors"
                    title="Fusionar con otro miembro"
                  >
                    ⇄
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-xs text-gray-500 hover:text-red-400 bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded-lg transition-colors"
                    title="Eliminar miembro"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Código de unión */}
      <div className="mx-6 mt-5">
        <div className="bg-gray-900 rounded-xl px-4 py-3 flex justify-between items-center gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Código del equipo</p>
            <p className="text-2xl font-mono font-bold tracking-widest text-green-400">{group.join_code}</p>
          </div>
          <button
            onClick={copyJoinCode}
            className="shrink-0 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            {copied ? 'Copiado' : 'Copiar'}
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
