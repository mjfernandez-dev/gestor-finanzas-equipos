'use client'

import { useState, useEffect } from 'react'
import { SharedFile } from '@/lib/sharedFiles'

interface Props {
  onOpenPaymentModal: (files: SharedFile[]) => void
}

export default function SharedFilesListener({ onOpenPaymentModal }: Props) {
  const [pendingFiles, setPendingFiles] = useState<SharedFile[]>([])
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    function handleFilesShared(event: CustomEvent<SharedFile[]>) {
      setPendingFiles(event.detail)
      setShowBanner(true)
    }

    window.addEventListener('files-shared', handleFilesShared as EventListener)
    return () => window.removeEventListener('files-shared', handleFilesShared as EventListener)
  }, [])

  if (!showBanner || pendingFiles.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p className="font-medium">Comprobante recibido</p>
          <p className="text-sm text-blue-100">{pendingFiles.length} archivo(s) listo(s)</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            setShowBanner(false)
            setPendingFiles([])
          }}
          className="px-3 py-2 text-sm bg-white/20 rounded-lg hover:bg-white/30"
        >
          Cerrar
        </button>
        <button
          onClick={() => {
            onOpenPaymentModal(pendingFiles)
            setShowBanner(false)
          }}
          className="px-4 py-2 text-sm bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50"
        >
          Reportar pago
        </button>
      </div>
    </div>
  )
}
