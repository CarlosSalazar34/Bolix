import { useState } from 'react'
import { resetPassword } from '../services/api'

export default function ResetPasswordView({ token, onComplete }: { token: string, onComplete: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres')
        return
    }

    setLoading(true)

    try {
      const res = await resetPassword(token, password)
      setSuccess(res.message)
      setTimeout(() => {
        onComplete()
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al restablecer la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-6">
      <div className="w-full max-w-sm bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
            Nueva Contraseña
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">Crea una nueva contraseña segura</p>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2" htmlFor="password">
              Nueva Contraseña
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

          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wider mb-2" htmlFor="confirm">
              Confirmar Contraseña
            </label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium rounded-xl py-3 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? 'Procesando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
