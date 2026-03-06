'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PaymentMethod } from '@/lib/types'

interface Props {
  groupId: string
  memberId: string
  onClose: () => void
}

export default function ReportPaymentModal({ groupId, memberId, onClose }: Props) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('transfer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) {
      setError('Ingresá un monto válido')
      return
    }

    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('transactions').insert({
      group_id: groupId,
      member_id: memberId,
      type: 'credit',
      amount: num,
      status: 'pending',
      payment_method: method,
      description: 'Pago reportado',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-sm p-6 flex flex-col gap-5">
        <h2 className="text-white font-bold text-lg">Reportar pago</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Monto ($)</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-lg font-bold placeholder-gray-600 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-2 block">Método de pago</label>
            <div className="flex gap-2">
              {(['transfer', 'cash'] as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    method === m
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {m === 'transfer' ? 'Transferencia' : 'Efectivo'}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-400 font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium text-sm transition-colors"
            >
              {loading ? 'Enviando...' : 'Reportar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
