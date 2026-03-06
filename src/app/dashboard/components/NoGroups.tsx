'use client'

import { useState } from 'react'
import CreateGroupModal from './CreateGroupModal'

export default function NoGroups() {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Bienvenido</h1>
          <p className="text-gray-400 mt-1 text-sm">Todavía no pertenecés a ningún grupo</p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-colors"
        >
          Crear grupo
        </button>

        <p className="text-gray-500 text-sm">
          ¿Tenés un link de invitación? Abrilo desde el navegador para unirte.
        </p>
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
