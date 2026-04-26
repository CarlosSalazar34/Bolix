import { useState, useEffect } from 'react'
import { fetchStatus, fetchUserProfile, updateUserPaymentInfo } from '../services/api'
import type { StatusResponse, UserProfile } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function PerfilPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const { user, logout } = useAuth()

  // Form state
  const [form, setForm] = useState({
    banco: '',
    cedula: '',
    telefono: ''
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statusData, profileData] = await Promise.all([
          fetchStatus(),
          fetchUserProfile()
        ])
        setStatus(statusData)
        setProfile(profileData)
        setForm({
          banco: profileData.pago_banco || '',
          cedula: profileData.pago_cedula || '',
          telefono: profileData.pago_telefono || ''
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSavePaymentInfo = async () => {
    if (!form.banco || !form.cedula || !form.telefono) {
      setError('Por favor completa todos los campos de Pago Móvil')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const updated = await updateUserPaymentInfo({
        pago_banco: form.banco,
        pago_cedula: form.cedula,
        pago_telefono: form.telefono
      })
      setProfile(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Error al guardar los datos de pago')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm">Cargando perfil...</p>
      </div>
    )
  }

  const statusItems = status
    ? [
        { label: 'Versión de la API', value: `v${status.version}` },
        { label: 'Estado', value: status.status === 'online' ? '🟢 En línea' : '🔴 Fuera de línea' },
        { label: 'Fuentes activas', value: status.fuentes.join(' · ') },
      ]
    : []

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Perfil</h1>
        <p className="text-zinc-400 text-sm mt-1">Sesión iniciada como <span className="text-emerald-400 font-semibold">{user?.username}</span></p>
      </div>

      {/* SECCIÓN DE PAGO MÓVIL */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-6 space-y-5">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Datos de Pago Móvil</h2>
            {success && <span className="text-emerald-400 text-xs font-bold animate-pulse">¡Guardado!</span>}
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Banco</label>
            <input
              value={form.banco}
              onChange={(e) => setForm({ ...form, banco: e.target.value })}
              placeholder="Ej: Banesco"
              className="w-full h-12 text-base rounded-2xl bg-zinc-950 border border-zinc-800 px-4 text-white outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Cédula</label>
              <input
                value={form.cedula}
                onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                placeholder="V-12345678"
                maxLength={8}
                className="w-full h-12 text-base rounded-2xl bg-zinc-950 border border-zinc-800 px-4 text-white outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="0412..."
                maxLength={11}
                className="w-full h-12 text-base rounded-2xl bg-zinc-950 border border-zinc-800 px-4 text-white outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleSavePaymentInfo}
            disabled={saving}
            className="w-full h-12 rounded-2xl bg-emerald-500 text-zinc-950 font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
          >
            {saving ? 'Guardando...' : 'Guardar Datos de Pago'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* ESTADO DEL SISTEMA */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-zinc-500 uppercase ml-1 tracking-wider">Estado del Sistema</h2>
        {status ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden divide-y divide-zinc-800">
            {statusItems.map((item) => (
                <div key={item.label} className="flex justify-between items-center px-4 py-3.5">
                <span className="text-zinc-300 text-sm">{item.label}</span>
                <span className="text-emerald-400 text-sm font-medium">{item.value}</span>
                </div>
            ))}
            </div>
        ) : (
            <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 py-8 text-center">
                <p className="text-zinc-500 text-xs">Información del sistema no disponible</p>
            </div>
        )}
      </div>

      <button
        onClick={logout}
        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-4 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] mt-4"
      >
        Cerrar Sesión
      </button>
    </div>
  )
}
