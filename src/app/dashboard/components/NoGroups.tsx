'use client'

import { useState } from 'react'
import CreateGroupModal from './CreateGroupModal'

export default function NoGroups({ isAnonymous }: { isAnonymous: boolean }) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-4 text-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Bienvenido</h1>
          <p className="text-gray-400 mt-1 text-sm">Todavía no pertenecés a ningún grupo</p>
        </div>

        {!isAnonymous && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            Crear grupo
          </button>
        )}

        <a
          href="/join"
          className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-colors text-sm flex items-center justify-center"
        >
          Unirme con código de equipo
        </a>
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
