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
      .maybeSingle()

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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xs flex flex-col gap-7">

        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
            {step === 'code' ? 'Paso 1 de 2' : 'Paso 2 de 2'}
          </p>
          <h1 className="text-xl font-semibold text-slate-100">
            {step === 'code' ? 'Ingresá el código' : `Unirte a ${group?.name}`}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {step === 'code'
              ? 'El admin del equipo te lo compartió'
              : '¿Cómo te conocen en el grupo?'}
          </p>
        </div>

        {step === 'code' && (
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleLookupCode()}
              placeholder="LEON25"
              maxLength={6}
              className="bg-slate-900 border border-slate-800 text-slate-100 text-center text-3xl font-mono tracking-[0.25em] rounded-xl px-4 py-5 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 uppercase placeholder:text-slate-700 transition-colors"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              onClick={handleLookupCode}
              disabled={loading || !code.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Buscando...' : 'Continuar'}
            </button>
          </div>
        )}

        {step === 'name' && (
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Tu nombre o apodo"
              autoFocus
              className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-slate-600 transition-colors"
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={loading || !displayName.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Uniéndome...' : 'Unirme al equipo'}
            </button>
            <button
              onClick={() => { setStep('code'); setGroup(null); setError('') }}
              className="text-sm text-slate-600 hover:text-slate-400 text-center transition-colors"
            >
              ← Cambiar código
            </button>
          </div>
        )}

        <a
          href="/login"
          className="text-sm text-slate-600 hover:text-slate-400 text-center transition-colors"
        >
          Soy admin, entrar con Google
        </a>

      </div>
    </div>
  )
}
