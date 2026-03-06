'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  groupId: string
  userId: string
  userName: string
  userEmail: string
  userAvatar: string | null
}

export default function JoinGroupButton({ groupId, userId, userName, userEmail, userAvatar }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleJoin() {
    setLoading(true)
    setError('')

    // Asegurar perfil
    await supabase.from('profiles').upsert({
      id: userId,
      email: userEmail,
      name: userName,
      avatar_url: userAvatar,
    }, { onConflict: 'id' })

    const { error: memberError } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: userId,
      display_name: userName,
      role: 'member',
      is_virtual: false,
    })

    if (memberError) {
      setError(memberError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        onClick={handleJoin}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
      >
        {loading ? 'Uniéndose...' : 'Unirse al grupo'}
      </button>
    </div>
  )
}
