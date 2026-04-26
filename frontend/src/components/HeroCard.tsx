interface HeroCardProps {
  label: string
  value: string
  monedaStr: string
  brecha: string
  estatus: string
  ultimaActualizacion: string
  gradient?: string
}

export default function HeroCard({
  label,
  value,
  monedaStr,
  brecha,
  estatus,
  ultimaActualizacion,
  gradient = 'from-emerald-600 to-green-800',
}: HeroCardProps) {
  return (
    <div className={`relative rounded-2xl overflow-hidden p-5 bg-gradient-to-br ${gradient} shadow-[0_8px_32px_rgba(16,185,129,0.25)] min-w-full snap-center`}>
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-black/10 translate-y-8 -translate-x-6" />

      <p className="text-emerald-100 text-sm font-medium">{label}</p>
      <div className="flex items-end gap-2 mt-1">
        <span className="text-4xl font-bold text-white tracking-tight">Bs. {value}</span>
        <span className="text-emerald-200 text-sm mb-1">{monedaStr}</span>
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/20">
        <div>
          <p className="text-emerald-200 text-xs">Brecha</p>
          <p className="text-white font-semibold">{brecha}</p>
        </div>
        <div className="w-px h-8 bg-white/20" />
        <div>
          <p className="text-emerald-200 text-xs">Estatus</p>
          <p className="text-white font-semibold">{estatus}</p>
        </div>
        <div className="w-px h-8 bg-white/20" />
        <div>
          <p className="text-emerald-200 text-xs">Actualizado</p>
          <p className="text-white font-semibold">{ultimaActualizacion}</p>
        </div>
      </div>
    </div>
  )
}
