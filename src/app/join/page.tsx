'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Step = 'code' | 'name'

export default function JoinPage() {
  const [step, setStep] = useState<Step>('code')
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [group, setGroup] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  async function handleLookupCode() {
    if (!code.trim()) return
    setLoading(true)
    setError('')

    const { data, error: rpcError } = await supabase
      .rpc('get_group_by_join_code', { p_code: code.trim().toUpperCase() })

    if (rpcError || !data || data.length === 0) {
      setError('Código no encontrado. Verificá que sea correcto.')
      setLoading(false)
      return
    }

    setGroup({ id: data[0].id, name: data[0].name })
    setStep('name')
    setLoading(false)
  }

  async function handleJoin() {
    if (!displayName.trim() || !group) return
    setLoading(true)
    setError('')

    // Usar sesión existente si ya hay una (Google u anónima), sino crear anónima
    let userId: string
    const { data: { user: existingUser } } = await supabase.auth.getUser()
    if (existingUser) {
      userId = existingUser.id
    } else {
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
      if (authError || !authData.user) {
        setError('Error al crear tu acceso. Intentá de nuevo.')
        setLoading(false)
        return
      }
      userId = authData.user.id
    }

    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single()

    if (existing) {
      router.push('/dashboard')
      return
    }

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        display_name: displayName.trim(),
        role: 'member',
        is_virtual: false,
      })

    if (memberError) {
      setError('No se pudo unir al grupo. Intentá de nuevo.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Unirme a un equipo</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {step === 'code'
              ? 'Ingresá el código que te dio el admin'
              : `Te unís a ${group?.name}`}
          </p>
        </div>

        {step === 'code' && (
          <>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleLookupCode()}
              placeholder="LEON25"
              maxLength={6}
              className="bg-gray-800 text-white text-center text-2xl font-mono tracking-widest rounded-xl px-4 py-4 outline-none focus:ring-2 focus:ring-green-600 uppercase"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              onClick={handleLookupCode}
              disabled={loading || !code.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
            >
              {loading ? 'Buscando...' : 'Continuar'}
            </button>
          </>
        )}

        {step === 'name' && (
          <>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Tu nombre o apodo"
              autoFocus
              className="bg-gray-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-600"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={loading || !displayName.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
            >
              {loading ? 'Uniéndome...' : 'Unirme'}
            </button>
            <button
              onClick={() => { setStep('code'); setGroup(null); setError('') }}
              className="text-sm text-gray-500 hover:text-gray-300 text-center transition-colors"
            >
              Cambiar código
            </button>
          </>
        )}

        <a
          href="/login"
          className="text-sm text-gray-500 hover:text-gray-300 text-center transition-colors"
        >
          Soy admin, entrar con Google
        </a>
      </div>
    </div>
  )
}
