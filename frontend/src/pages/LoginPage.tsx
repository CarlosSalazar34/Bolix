import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { requestPasswordReset } from '../services/api'

export default function LoginPage({ onNavigateToRegister }: { onNavigateToRegister: () => void }) {
  const [view, setView] = useState<'login' | 'forgot'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await requestPasswordReset(email, newPassword)
      setSuccess(res.message)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al solicitar recuperación')
    } finally {
      setLoading(false)
    }
  }

  if (view === 'forgot') {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full px-6">
        <div className="w-full max-w-sm bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              Recuperar
            </h1>
            <p className="text-zinc-400 mt-2 text-sm">Ingresa tu correo para continuar</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2" htmlFor="email">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2" htmlFor="new-password">
                Nueva Contraseña
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <p className="text-[10px] text-zinc-500 mt-1">Se aplicará al hacer clic en el enlace de tu correo.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-xl py-3 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>

          <button
            onClick={() => setView('login')}
            className="mt-6 w-full text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-6">
      <div className="w-full max-w-sm bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
            Bolix
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Inicia sesión para continuar</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2" htmlFor="username">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="tu_usuario"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-zinc-400 text-xs uppercase tracking-wider" htmlFor="password">
                Contraseña
              </label>

            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-xl py-3 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className='mt-3'></div>
        <p className="mt-8 text-center text-sm text-zinc-500">
          ¿No tienes una cuenta?{' '}
          <button onClick={onNavigateToRegister} className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Regístrate
          </button>
        </p>
        <button
          type="button"
          onClick={() => setView('forgot')}
          className="text-emerald-500/80 hover:text-emerald-400 text-[10px] w-full uppercase tracking-widest flex justify-center items-center mt-3 font-bold transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>
    </div>
  )
}
