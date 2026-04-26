import { useState, useEffect } from 'react'
import BottomSheet from './BottomSheet'
import { updateUserPaymentInfo, type UserProfile } from '../services/api'

interface PaymentInfoModalProps {
  open: boolean
  onClose: () => void
  profile: UserProfile | null
  onSave: (updated: UserProfile) => void
}

export default function PaymentInfoModal({ open, onClose, profile, onSave }: PaymentInfoModalProps) {
  const [form, setForm] = useState({
    banco: '',
    cedula: '',
    telefono: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setForm({
        banco: profile.pago_banco || '',
        cedula: profile.pago_cedula || '',
        telefono: profile.pago_telefono || ''
      })
    }
  }, [profile, open])

  const handleSave = async () => {
    if (!form.banco || !form.telefono) {
      setError('Banco y Teléfono son obligatorios')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const updated = await updateUserPaymentInfo({
        pago_banco: form.banco,
        pago_cedula: form.cedula,
        pago_telefono: form.telefono
      })
      onSave(updated)
      onClose()
    } catch (err) {
      setError('Error al guardar los datos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Configurar Pago Móvil">
      <div className="flex flex-col gap-5 pb-6">
        <p className="text-zinc-400 text-sm">
          Estos datos se incluirán automáticamente al compartir tus conversiones por WhatsApp.
        </p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Banco</label>
            <input
              value={form.banco}
              onChange={(e) => setForm({ ...form, banco: e.target.value })}
              placeholder="Ej: Banesco"
              className="w-full h-12 rounded-2xl bg-zinc-900 border border-zinc-800 px-4 text-white outline-none focus:border-emerald-500/50 transition-all"
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
                className="w-full h-12 rounded-2xl bg-zinc-900 border border-zinc-800 px-4 text-white outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="0412..."
                maxLength={11}
                className="w-full h-12 rounded-2xl bg-zinc-900 border border-zinc-800 px-4 text-white outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-xs font-medium px-1">⚠️ {error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 rounded-2xl bg-emerald-500 text-zinc-950 font-bold text-base active:scale-[0.98] transition-all disabled:opacity-50 mt-2 shadow-lg shadow-emerald-500/20"
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </BottomSheet>
  )
}
