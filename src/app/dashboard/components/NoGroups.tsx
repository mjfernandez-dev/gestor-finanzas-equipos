'use client'

import { useState } from 'react'
import CreateGroupModal from './CreateGroupModal'

export default function NoGroups({ isAnonymous }: { isAnonymous: boolean }) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xs flex flex-col gap-4">
        <div className="mb-2">
          <h1 className="text-xl font-semibold text-slate-100">Sin equipos</h1>
          <p className="text-slate-500 text-sm mt-1">Todavía no pertenecés a ningún grupo</p>
        </div>

        {!isAnonymous && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-colors text-sm"
          >
            Crear grupo
          </button>
        )}

        <a
          href="/join"
          className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium py-3 rounded-xl transition-colors text-sm flex items-center justify-center"
        >
          Unirme con código de equipo
        </a>
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
