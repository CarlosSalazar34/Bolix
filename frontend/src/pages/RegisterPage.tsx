import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage({ onNavigateToLogin }: { onNavigateToLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register(username, email, password)
    } catch (err: any) {
      setError(err.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-6">
      <div className="w-full max-w-sm bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
            Registro
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Crea una cuenta en Bolix</p>
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
            <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2" htmlFor="password">
              Contraseña
            </label>
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
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        <div className='mt-3'></div>
        <p className="mt-10 text-center text-sm text-zinc-500">
          ¿Ya tienes una cuenta?{' '}
          <button onClick={onNavigateToLogin} className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
            Inicia Sesión
          </button>
        </p>
      </div>
    </div>
  )
}
