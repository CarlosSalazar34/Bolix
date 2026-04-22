import { useState } from 'react'
import { IconBell } from '../components/icons'
import { registerPushNotifications, sendSubscriptionToBackend } from '../services/pushService'

export default function AlertasPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleEnableNotifications = async () => {
    try {
      setLoading(true)
      setMessage('')
      const sub = await registerPushNotifications()
      await sendSubscriptionToBackend(sub)
      setMessage('¡Notificaciones activadas correctamente!')
    } catch (error: any) {
      console.error(error)
      setMessage('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Alertas</h1>
        <p className="text-zinc-400 text-sm mt-1">Notificaciones de cambio de tasa</p>
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 flex flex-col items-center justify-center py-12 gap-5">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <IconBell />
        </div>
        
        <div className="flex flex-col items-center gap-3">
          <button 
            onClick={handleEnableNotifications}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Activar Notificaciones'}
          </button>
        </div>

        {message && (
          <p className={`text-sm text-center px-4 ${message.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
