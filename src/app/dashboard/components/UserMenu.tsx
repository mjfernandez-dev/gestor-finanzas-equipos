'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import CreateGroupModal from './CreateGroupModal'

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsAnonymous(data.user?.is_anonymous ?? false)
    })
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLinkGoogle() {
    const callbackUrl = `${window.location.origin}/auth/callback?redirect=/dashboard`
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    })
    if (error) alert('Error al vincular con Google. Intentá de nuevo.')
  }

  async function handleLogout() {
    if (isAnonymous) {
      const confirmed = window.confirm(
        'Si cerrás sesión perderás el acceso a este equipo. Para volver a entrar vas a necesitar el código del equipo. ¿Querés continuar?'
      )
      if (!confirmed) return
    }
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div ref={ref} className="relative mt-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-lg"
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 top-11 bg-gray-800 rounded-xl shadow-xl w-48 flex flex-col overflow-hidden z-40">
          {!isAnonymous ? (
            <>
              <button
                onClick={() => { setOpen(false); setShowCreateGroup(true) }}
                className="px-4 py-3 text-sm text-white hover:bg-gray-700 text-left transition-colors"
              >
                + Nuevo grupo
              </button>
              <div className="h-px bg-gray-700" />
            </>
          ) : (
            <>
              <button
                onClick={() => { setOpen(false); handleLinkGoogle() }}
                className="px-4 py-3 text-sm text-white hover:bg-gray-700 text-left transition-colors"
              >
                Crear mi equipo
              </button>
              <div className="h-px bg-gray-700" />
            </>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-3 text-sm text-red-400 hover:bg-gray-700 text-left transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      )}

      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}
    </div>
  )
}
