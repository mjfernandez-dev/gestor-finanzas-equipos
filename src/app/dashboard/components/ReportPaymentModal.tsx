'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PaymentMethod, Transaction } from '@/lib/types'

interface Props {
  groupId: string
  memberId: string
  paymentAlias: string | null
  onClose: () => void
}

interface ExpenseOption {
  expense_group_id: string
  description: string
  amount: number
}

export default function ReportPaymentModal({ groupId, memberId, paymentAlias, onClose }: Props) {
  // Paso 1: selección del gasto | Paso 2: confirmar pago
  const [step, setStep] = useState<1 | 2>(1)
  const [expenseOptions, setExpenseOptions] = useState<ExpenseOption[]>([])
  const [selectedExpense, setSelectedExpense] = useState<ExpenseOption | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('transfer')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [copiedAlias, setCopiedAlias] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadExpenses() {
      setFetching(true)
      // Débitos del miembro con expense_group_id
      const { data: debits } = await supabase
        .from('transactions')
        .select('*')
        .eq('member_id', memberId)
        .eq('type', 'debit')
        .not('expense_group_id', 'is', null)

      // Créditos del miembro con expense_group_id (ya pagados o pendientes)
      const { data: credits } = await supabase
        .from('transactions')
        .select('*')
        .eq('member_id', memberId)
        .eq('type', 'credit')
        .not('expense_group_id', 'is', null)
        .in('status', ['approved', 'pending'])

      const coveredIds = new Set((credits ?? []).map((c: Transaction) => c.expense_group_id))

      const options: ExpenseOption[] = (debits ?? [])
        .filter((d: Transaction) => !coveredIds.has(d.expense_group_id))
        .map((d: Transaction) => ({
          expense_group_id: d.expense_group_id!,
          description: d.description ?? 'Gasto',
          amount: Number(d.amount),
        }))
        .sort((a, b) => b.amount - a.amount)

      setExpenseOptions(options)
      setFetching(false)
    }
    loadExpenses()
  }, [memberId])

  function selectExpense(opt: ExpenseOption | null) {
    setSelectedExpense(opt)
    if (opt) setCustomAmount(String(opt.amount))
    else setCustomAmount('')
    setStep(2)
  }

  function copyAlias() {
    if (!paymentAlias) return
    navigator.clipboard.writeText(paymentAlias)
    setCopiedAlias(true)
    setTimeout(() => setCopiedAlias(false), 2000)
  }

  async function handleSubmit() {
    const num = parseFloat(customAmount)
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
      description: selectedExpense ? `Pago — ${selectedExpense.description}` : 'Pago reportado',
      expense_group_id: selectedExpense?.expense_group_id ?? null,
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

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button onClick={() => setStep(1)} aria-label="Volver" className="text-slate-600 hover:text-slate-400 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
            )}
            <h2 className="text-base font-semibold text-slate-100">
              {step === 1 ? '¿Qué estás pagando?' : 'Confirmá el pago'}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-slate-600 hover:text-slate-400 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* PASO 1: Selección de gasto */}
        {step === 1 && (
          <div className="flex flex-col gap-2">
            {fetching ? (
              <p className="text-sm text-slate-600 text-center py-4">Cargando...</p>
            ) : expenseOptions.length === 0 ? (
              // Sin gastos vinculados: ir directo al paso 2 con pago libre
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-500">No hay gastos pendientes específicos. Podés reportar un pago libre.</p>
                <button
                  onClick={() => selectExpense(null)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl text-sm transition-colors"
                >
                  Continuar
                </button>
              </div>
            ) : (
              <>
                {expenseOptions.map(opt => (
                  <button
                    key={opt.expense_group_id}
                    onClick={() => selectExpense(opt)}
                    className="flex justify-between items-center px-4 py-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition-colors"
                  >
                    <span className="text-sm text-slate-200 truncate flex-1">{opt.description}</span>
                    <span className="text-sm font-mono font-semibold text-red-400 shrink-0 ml-3">
                      ${opt.amount.toLocaleString('es-AR')}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => selectExpense(null)}
                  className="flex justify-between items-center px-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-600 rounded-xl text-left transition-colors"
                >
                  <span className="text-sm text-slate-500">Pago libre (monto a mano)</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 shrink-0">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        )}

        {/* PASO 2: Confirmar pago */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            {/* Alias para transferir */}
            {paymentAlias && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex justify-between items-center gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">Transferir a</p>
                  <p className="text-emerald-400 font-mono text-base font-semibold">{paymentAlias}</p>
                </div>
                <button
                  onClick={copyAlias}
                  className="shrink-0 text-xs font-medium text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {copiedAlias ? 'Copiado ✓' : 'Copiar'}
                </button>
              </div>
            )}

            {/* Monto */}
            <div>
              <label htmlFor="payment-amount" className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">
                Monto ($){selectedExpense && <span className="ml-2 text-slate-600 normal-case font-normal">— {selectedExpense.description}</span>}
              </label>
              <input
                id="payment-amount"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-xl font-mono font-bold placeholder:text-slate-700 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
              />
            </div>

            {/* Método */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Método</label>
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
              <button
                onClick={handleSubmit}
                disabled={loading || !customAmount}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-sm transition-colors"
              >
                {loading ? 'Enviando...' : 'Ya pagué'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
