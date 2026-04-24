import { useState, useEffect, useCallback, useMemo } from 'react'
import BottomNav from './components/BottomNav'
import type { Tab } from './components/BottomNav'
import HomePage from './pages/HomePage'
import HistorialPage from './pages/HistorialPage'
import PerfilPage from './pages/PerfilPage'
import WalletPage from './pages/WalletPage'
import ChatbotPage from './pages/ChatbotPage'
import ConverterSheet from './components/ConverterSheet'
import BottomSheet from './components/BottomSheet'
import { fetchTasas } from './services/api'
import type { TasaResponse } from './services/api'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function AppContent() {
  const { isAuthenticated } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'register'>('login')
  const [tab, setTab] = useState<Tab>('home')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [tasas, setTasas] = useState<TasaResponse | null>(null)

  // 1. Carga de tasas memorizada para evitar disparos innecesarios
  const loadTasas = useCallback(async () => {
    try {
      const data = await fetchTasas()
      setTasas(data)
    } catch (error) {
      console.error("Error al cargar tasas:", error)
    }
  }, [])

  // 2. Solo cargar tasas si estamos autenticados y no las tenemos
  useEffect(() => {
    if (isAuthenticated && !tasas) {
      loadTasas()
    }
  }, [isAuthenticated, tasas, loadTasas])

  // 3. Renderizado Condicional Estable
  // Si no está autenticado, devolvemos el contenedor de Auth y cortamos la ejecución aquí.
  if (!isAuthenticated) {
    return (
      <div className="h-dvh bg-zinc-950 flex flex-col relative overflow-hidden">
        {authView === 'login' ? (
          <LoginPage onNavigateToRegister={() => setAuthView('register')} />
        ) : (
          <RegisterPage onNavigateToLogin={() => setAuthView('login')} />
        )}
      </div>
    )
  }

  // 4. Contenido Principal (Solo se alcanza si isAuthenticated === true)
  return (
    <div className="h-dvh bg-zinc-950 flex flex-col relative">
      <main className="flex-1 overflow-y-auto px-5 pt-6 pb-24 scrollbar-hide">
        {tab === 'home' && <HomePage />}
        {tab === 'historial' && <HistorialPage />}
        {tab === 'wallet' && <WalletPage />}
        {tab === 'perfil' && <PerfilPage />}
      </main>

      {/* Botones Flotantes */}
      <div className="fixed right-5 bottom-28 z-30 flex flex-col gap-3">
        <button
          onClick={() => setChatOpen(true)}
          className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
        >
          <span className="text-2xl italic">🤖</span>
        </button>

        <button
          onClick={() => setSheetOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-[0_4px_24px_rgba(16,185,129,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
            <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM7 7h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4 2v-2h2v2h-2zm0-4v-2h2v2h-2zm4 4v-2h2v2h-2zm0-4v-2h2v2h-2zm0-4V7h2v2h-2z" />
          </svg>
        </button>
      </div>

      <ConverterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        tasas={tasas}
      />

      <BottomSheet 
        open={chatOpen} 
        onClose={() => setChatOpen(false)} 
        title="Bolo Asistente 🤖"
      >
        <div className="h-[70dvh]">
          <ChatbotPage />
        </div>
      </BottomSheet>

      <BottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}