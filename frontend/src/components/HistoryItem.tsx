export interface HistoryItemData {
  fecha: string
  dolar_bcv: number
  binance: number
  promedio: number
  brecha: string
}

interface HistoryItemProps extends HistoryItemData {
  index?: number
  showBorder?: boolean
}

export default function HistoryItem({ fecha, dolar_bcv, binance, promedio, brecha, index, showBorder = true }: HistoryItemProps) {
  const brechaNum = parseFloat(brecha)

  const formatFechaLocal = (fechaString: string) => {
    try {
      // Asumimos que la fecha viene en UTC desde el backend
      const date = new Date(fechaString.replace(' ', 'T') + 'Z')
      if (isNaN(date.getTime())) return fechaString

      const pad = (n: number) => n.toString().padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    } catch (e) {
      return fechaString
    }
  }

  const fechaLocal = formatFechaLocal(fecha)

  return (
    <div className={`flex items-center justify-between px-4 py-3.5 hover:bg-zinc-800/50 transition-colors ${showBorder ? 'border-t border-zinc-800' : ''}`}>
      <div className="flex items-center gap-3">
        {index !== undefined && (
          <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <span className="text-emerald-400 text-xs font-bold">{index}</span>
          </div>
        )}
        <div>
          <p className="text-white text-sm font-semibold">{fechaLocal}</p>
          <p className="text-zinc-500 text-xs mt-0.5">BCV {dolar_bcv} · Binance {binance}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-white font-bold">Bs. {promedio}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-block mt-0.5 ${brechaNum < 5 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
          {brecha}
        </span>
      </div>
    </div>
  )
}
