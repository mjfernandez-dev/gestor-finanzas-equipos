'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  transactionId: string
}

export default function TransactionActions({ transactionId }: Props) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handle(action: 'approve' | 'reject') {
    setLoading(action)
    await supabase
      .from('transactions')
      .update({ status: action === 'approve' ? 'approved' : 'rejected' })
      .eq('id', transactionId)
    router.refresh()
  }

  return (
    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800">
      <button
        onClick={() => handle('reject')}
        disabled={loading !== null}
        className="flex-1 py-1.5 rounded-lg bg-red-500/8 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-medium disabled:opacity-40 transition-colors"
      >
        {loading === 'reject' ? '...' : 'Rechazar'}
      </button>
      <button
        onClick={() => handle('approve')}
        disabled={loading !== null}
        className="flex-1 py-1.5 rounded-lg bg-emerald-500/8 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-medium disabled:opacity-40 transition-colors"
      >
        {loading === 'approve' ? '...' : 'Aprobar'}
      </button>
    </div>
  )
}
