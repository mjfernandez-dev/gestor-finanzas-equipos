'use client'

import { useState } from 'react'
import { Group, GroupMember, Transaction } from '@/lib/types'
import TransactionItem from './TransactionItem'
import ReportPaymentModal from './ReportPaymentModal'

interface Props {
  group: Group
  membership: GroupMember
  balance: number
  recentTransactions: Transaction[]
}

export default function MemberDashboard({ group, membership, balance, recentTransactions }: Props) {
  const [showPayment, setShowPayment] = useState(false)
  const isNegative = balance < 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="px-6 pt-10 pb-6">
        <p className="text-gray-400 text-sm">{group.name}</p>
        <h1 className="text-xl font-bold mt-1">{membership.display_name}</h1>
      </div>

      {/* Saldo */}
      <div className="mx-6 bg-gray-900 rounded-2xl p-6 flex flex-col items-center gap-1">
        <p className="text-gray-400 text-sm">Tu saldo</p>
        <p className={`text-5xl font-bold ${isNegative ? 'text-red-400' : 'text-green-400'}`}>
          {isNegative ? '-' : ''}${Math.abs(balance).toLocaleString('es-AR')}
        </p>
        <p className="text-gray-500 text-xs mt-1">
          {isNegative ? 'Debés este importe' : balance === 0 ? 'Estás al día' : 'Tenés crédito a favor'}
        </p>
      </div>

      {/* Botón reportar pago */}
      {isNegative && (
        <div className="mx-6 mt-4">
          <button
            onClick={() => setShowPayment(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Reportar pago
          </button>
        </div>
      )}

      {/* Últimos movimientos */}
      <div className="mx-6 mt-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Últimos movimientos</h2>
        {recentTransactions.length === 0 ? (
          <p className="text-gray-600 text-sm">Sin movimientos aún</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentTransactions.map(t => (
              <TransactionItem key={t.id} transaction={t} />
            ))}
          </div>
        )}
      </div>

      {showPayment && (
        <ReportPaymentModal
          groupId={group.id}
          memberId={membership.id}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  )
}
