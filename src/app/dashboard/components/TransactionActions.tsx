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
    <div className="flex gap-2 mt-2">
      <button
        onClick={() => handle('reject')}
        disabled={loading !== null}
        className="flex-1 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 text-xs font-medium disabled:opacity-50 transition-colors"
      >
        {loading === 'reject' ? '...' : 'Rechazar'}
      </button>
      <button
        onClick={() => handle('approve')}
        disabled={loading !== null}
        className="flex-1 py-1.5 rounded-lg bg-green-900/40 hover:bg-green-900/60 text-green-400 text-xs font-medium disabled:opacity-50 transition-colors"
      >
        {loading === 'approve' ? '...' : 'Aprobar'}
      </button>
    </div>
  )
}
