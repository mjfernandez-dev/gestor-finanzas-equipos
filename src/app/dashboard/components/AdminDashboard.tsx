'use client'

import { useState } from 'react'
import { Group, GroupMember, GroupMemberWithBalance, Transaction } from '@/lib/types'
import TransactionItem from './TransactionItem'
import CreateExpenseModal from './CreateExpenseModal'
import AddVirtualMemberModal from './AddVirtualMemberModal'
import GroupSelector from './GroupSelector'
import UserMenu from './UserMenu'
import EditGroupModal from './EditGroupModal'

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
  const [copied, setCopied] = useState(false)
  const sorted = [...membersWithBalance].sort((a, b) => a.balance - b.balance)

  function copyInviteLink() {
    const url = `${window.location.origin}/invite/${group.invite_token}`
    navigator.clipboard.writeText(url)
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
            <div key={m.id} className="bg-gray-900 rounded-xl px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-white">{m.display_name}</p>
                {m.is_virtual && <p className="text-xs text-gray-500">Virtual</p>}
              </div>
              <p className={`text-sm font-bold ${m.balance < 0 ? 'text-red-400' : m.balance > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                {m.balance < 0 ? '-' : m.balance > 0 ? '+' : ''}${Math.abs(m.balance).toLocaleString('es-AR')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Link de invitación */}
      <div className="mx-6 mt-5">
        <div className="bg-gray-900 rounded-xl px-4 py-3 flex justify-between items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 mb-1">Link de invitación</p>
            <p className="text-sm text-green-400 truncate">/invite/{group.invite_token}</p>
          </div>
          <button
            onClick={copyInviteLink}
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
    </div>
  )
}
