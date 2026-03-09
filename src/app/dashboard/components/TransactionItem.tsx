import { Transaction } from '@/lib/types'
import TransactionActions from './TransactionActions'

interface Props {
  transaction: Transaction
  showActions?: boolean
  memberName?: string
  expenseDescription?: string
}

export default function TransactionItem({ transaction, showActions, memberName, expenseDescription }: Props) {
  const isCredit = transaction.type === 'credit'
  const isPending = transaction.status === 'pending'

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex flex-col">
      <div className="flex justify-between items-center gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-sm text-slate-200 truncate">
            {memberName
              ? <><span className="text-slate-100 font-medium">{memberName}</span> <span className="text-slate-500">·</span> {transaction.description ?? (isCredit ? 'Pago' : 'Gasto')}</>
              : (transaction.description ?? (isCredit ? 'Pago' : 'Gasto'))
            }
          </p>
          <div className="flex gap-2 items-center flex-wrap">
            <p className="text-xs text-slate-600">
              {new Date(transaction.created_at).toLocaleDateString('es-AR')}
            </p>
            {isPending && (
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                Pendiente
              </span>
            )}
            {expenseDescription && (
              <span className="text-xs text-slate-500">
                {expenseDescription}
              </span>
            )}
            {transaction.payment_method && (
              <span className="text-xs text-slate-600">
                {transaction.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}
              </span>
            )}
          </div>
        </div>
        <p className={`text-sm font-mono font-semibold shrink-0 ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
          {isCredit ? '+' : '-'}${Number(transaction.amount).toLocaleString('es-AR')}
        </p>
      </div>
      {showActions && isPending && (
        <TransactionActions transactionId={transaction.id} />
      )}
    </div>
  )
}
