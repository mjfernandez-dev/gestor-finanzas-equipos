'use client'

import { useState } from 'react'
import { Group, GroupMember, GroupMemberWithBalance, Transaction } from '@/lib/types'
import TransactionItem from './TransactionItem'
import CreateExpenseModal from './CreateExpenseModal'

interface Props {
  group: Group
  membership: GroupMember
  membersWithBalance: GroupMemberWithBalance[]
  pendingTransactions: Transaction[]
  recentTransactions: Transaction[]
  balance: number
}

export default function AdminDashboard({
  group,
  membership,
  membersWithBalance,
  pendingTransactions,
  recentTransactions,
  balance,
}: Props) {
  const [showExpense, setShowExpense] = useState(false)
  const sorted = [...membersWithBalance].sort((a, b) => a.balance - b.balance)
  const totalDebt = membersWithBalance.reduce((acc, m) => acc + (m.balance < 0 ? m.balance : 0), 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm">Administrador</p>
          <h1 className="text-xl font-bold mt-1">{group.name}</h1>
        </div>
        <button
          onClick={() => setShowExpense(true)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors mt-1"
        >
          + Gasto
        </button>
      </div>

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
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Saldos por jugador</h2>
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
        <div className="bg-gray-900 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400 mb-1">Link de invitación</p>
          <p className="text-sm text-green-400 break-all">/invite/{group.invite_token}</p>
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
    </div>
  )
}
