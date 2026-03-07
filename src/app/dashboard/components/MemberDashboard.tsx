'use client'

import { useState } from 'react'
import { Group, GroupMember, Transaction } from '@/lib/types'
import TransactionItem from './TransactionItem'
import ReportPaymentModal from './ReportPaymentModal'
import GroupSelector from './GroupSelector'
import UserMenu from './UserMenu'

interface Props {
  group: Group
  allGroups: Group[]
  membership: GroupMember
  balance: number
  recentTransactions: Transaction[]
}

export default function MemberDashboard({ group, allGroups, membership, balance, recentTransactions }: Props) {
  const [showPayment, setShowPayment] = useState(false)
  const isNegative = balance < 0
  const isZero = balance === 0

  return (
    <div className="min-h-screen text-slate-100 pb-10">
      {/* Header */}
      <div className="px-6 pt-10 pb-4 flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{group.name}</p>
          <h1 className="text-xl font-semibold text-slate-100 mt-1">{membership.display_name}</h1>
        </div>
        <UserMenu />
      </div>

      <GroupSelector groups={allGroups} currentGroupId={group.id} />

      {/* Saldo hero */}
      <div className="mx-6 mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center gap-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tu saldo</p>
        <p className={`font-mono text-6xl font-bold tracking-tight leading-none ${isNegative ? 'text-red-400' : isZero ? 'text-slate-400' : 'text-emerald-400'}`}>
          {isNegative ? '-' : isZero ? '' : '+'}${Math.abs(balance).toLocaleString('es-AR')}
        </p>
        <p className="text-slate-600 text-xs mt-1">
          {isNegative ? 'Debés este importe' : isZero ? 'Estás al día' : 'Tenés crédito a favor'}
        </p>
      </div>

      {/* Botón reportar pago */}
      {isNegative && (
        <div className="mx-6 mt-3">
          <button
            onClick={() => setShowPayment(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-colors text-sm"
          >
            Reportar pago
          </button>
        </div>
      )}

      {/* Últimos movimientos */}
      <div className="mx-6 mt-6">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Últimos movimientos</p>
        {recentTransactions.length === 0 ? (
          <p className="text-slate-700 text-sm">Sin movimientos aún</p>
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
          paymentAlias={group.payment_alias}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  )
}
