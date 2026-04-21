import { IconBell } from '../components/icons'

export default function AlertasPage() {
  return (
    <div className="flex flex-col gap-5 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Alertas</h1>
        <p className="text-zinc-400 text-sm mt-1">Notificaciones de cambio de tasa</p>
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <IconBell />
        </div>
        <p className="text-white font-semibold">Próximamente</p>
        <p className="text-zinc-500 text-sm text-center max-w-48">
          Configura alertas cuando el dólar suba o baje un umbral
        </p>
      </div>
    </div>
  )
}
