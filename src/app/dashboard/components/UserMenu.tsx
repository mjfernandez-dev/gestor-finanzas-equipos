'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import CreateGroupModal from './CreateGroupModal'

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
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
          <button
            onClick={() => { setOpen(false); setShowCreateGroup(true) }}
            className="px-4 py-3 text-sm text-white hover:bg-gray-700 text-left transition-colors"
          >
            + Nuevo grupo
          </button>
          <div className="h-px bg-gray-700" />
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
