import { useEffect, useRef } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export default function BottomSheet({ open, onClose, children, title }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all duration-500 ease-in-out
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 cubic-bezier-sheet
          ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="bg-zinc-900 border-t border-zinc-700/60 rounded-t-3xl max-h-[92dvh] overflow-y-auto">
          {/* Handle */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-zinc-700" />
          </div>

          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 pb-4 pt-2">
              <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all hover:bg-zinc-700"
              >
                ✕
              </button>
            </div>
          )}

          {/* Content */}
          <div className="px-6 pb-[env(safe-area-inset-bottom,32px)] pt-2">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
