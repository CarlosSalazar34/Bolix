import { useState, useEffect, useCallback } from 'react'
import BottomNav from './components/BottomNav'
import type { Tab } from './components/BottomNav'
import HomePage from './pages/HomePage'
import HistorialPage from './pages/HistorialPage'
import AlertasPage from './pages/AlertasPage'
import PerfilPage from './pages/PerfilPage'
import ConverterSheet from './components/ConverterSheet'
import { fetchTasas } from './services/api'
import type { TasaResponse } from './services/api'

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [tasas, setTasas] = useState<TasaResponse | null>(null)

  // Cargar tasas al nivel de App para compartir con el ConverterSheet
  const loadTasas = useCallback(async () => {
    try {
      const data = await fetchTasas()
      setTasas(data)
    } catch {
      // HomePage maneja su propio error, aquí solo para el sheet
    }
  }, [])

  useEffect(() => {
    loadTasas()
  }, [loadTasas])

  return (
    <div className="h-dvh bg-zinc-950 flex flex-col relative">
      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-4 scrollbar-hide">
        {tab === 'home' && <HomePage />}
        {tab === 'historial' && <HistorialPage />}
        {tab === 'alertas' && <AlertasPage />}
        {tab === 'perfil' && <PerfilPage />}
      </main>

      {/* FAB — Botón flotante calculadora */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed right-5 bottom-24 z-30 w-14 h-14 rounded-full
          bg-gradient-to-br from-emerald-500 to-green-600
          shadow-[0_4px_24px_rgba(16,185,129,0.4)]
          flex items-center justify-center
          hover:scale-110 active:scale-95
          transition-all duration-200"
        aria-label="Abrir calculadora"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
          <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM7 7h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4 2v-2h2v2h-2zm0-4v-2h2v2h-2zm4 4v-2h2v2h-2zm0-4v-2h2v2h-2zm0-4V7h2v2h-2z" />
        </svg>
      </button>

      {/* Bottom Sheet Calculadora */}
      <ConverterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tasas={tasas}
      />

      {/* Bottom Nav — always pinned at the bottom */}
      <BottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  )
}
