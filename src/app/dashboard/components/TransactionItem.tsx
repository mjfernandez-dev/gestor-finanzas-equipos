import { Transaction } from '@/lib/types'
import TransactionActions from './TransactionActions'

interface Props {
  transaction: Transaction
  showActions?: boolean
}

export default function TransactionItem({ transaction, showActions }: Props) {
  const isCredit = transaction.type === 'credit'
  const isPending = transaction.status === 'pending'

  return (
    <div className="bg-gray-900 rounded-xl px-4 py-3 flex flex-col">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm text-white">{transaction.description ?? (isCredit ? 'Pago' : 'Gasto')}</p>
          <div className="flex gap-2 items-center">
            <p className="text-xs text-gray-500">
              {new Date(transaction.created_at).toLocaleDateString('es-AR')}
            </p>
            {isPending && (
              <span className="text-xs bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded-full">
                Pendiente
              </span>
            )}
            {transaction.payment_method && (
              <span className="text-xs text-gray-600">
                {transaction.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}
              </span>
            )}
          </div>
        </div>
        <p className={`text-sm font-bold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
          {isCredit ? '+' : '-'}${Number(transaction.amount).toLocaleString('es-AR')}
        </p>
      </div>
      {showActions && isPending && (
        <TransactionActions transactionId={transaction.id} />
      )}
    </div>
  )
}
