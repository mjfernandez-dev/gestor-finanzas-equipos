'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PaymentMethod } from '@/lib/types'

interface Props {
  groupId: string
  memberId: string
  paymentAlias: string | null
  onClose: () => void
}

export default function ReportPaymentModal({ groupId, memberId, paymentAlias, onClose }: Props) {
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
      setError('Ingresa un monto valido')
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

  const methodBtnCls = (active: boolean) =>
    'flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ' +
    (active ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700')

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
      <div className="bg-slate-900 border-t border-slate-800 rounded-t-2xl w-full max-w-sm p-6 pb-8 flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold text-slate-100">Reportar pago</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate-600 hover:text-slate-400 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {paymentAlias && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Transferir a</p>
            <p className="text-emerald-400 font-mono text-sm font-medium">{paymentAlias}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="payment-amount" className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Monto ($)</label>
            <input
              id="payment-amount"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-xl font-mono font-bold placeholder:text-slate-700 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Metodo</label>
            <div className="flex gap-2">
              {(['transfer', 'cash'] as PaymentMethod[]).map(m => (
                <button key={m} type="button" onClick={() => setMethod(m)} className={methodBtnCls(method === m)}>
                  {m === 'transfer' ? 'Transferencia' : 'Efectivo'}
                </button>
              ))}
            </div>
          </div>

          {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 mt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-medium text-sm transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-medium text-sm transition-colors">
              {loading ? 'Enviando...' : 'Reportar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
