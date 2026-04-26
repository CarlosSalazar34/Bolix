import { useState, useCallback, useEffect } from 'react'
import { IconPlus, IconTrend } from '../components/icons'
import { fetchTasas, fetchWallets, fetchGestorRecords, createGestorRecord, fetchGestorCategories, seedGestorCategories } from '../services/api'
import type { TasaResponse, Wallet, GestorRecord, GestorCategory } from '../services/api'

// Usamos los tipos de la API directamente

// Categorías predeterminadas
const DEFAULT_CATEGORIES: GestorCategory[] = [
  { id: 1, nombre: 'Salario', icono: '💰', color: 'blue', tipo: 'ingreso', es_default: true },
  { id: 2, nombre: 'Regalo', icono: '🎁', color: 'pink', tipo: 'ingreso', es_default: true },
  { id: 3, nombre: 'Interés', icono: '🏦', color: 'green', tipo: 'ingreso', es_default: true },
  { id: 4, nombre: 'Otros', icono: '❓', color: 'gray', tipo: 'ingreso', es_default: true },
  { id: 5, nombre: 'Salud', icono: '❤️', color: 'red', tipo: 'gasto', es_default: true },
  { id: 6, nombre: 'Ocio', icono: '🎮', color: 'purple', tipo: 'gasto', es_default: true },
  { id: 7, nombre: 'Casa', icono: '🏠', color: 'yellow', tipo: 'gasto', es_default: true },
  { id: 8, nombre: 'Café', icono: '☕', color: 'orange', tipo: 'gasto', es_default: true },
  { id: 9, nombre: 'Educación', icono: '🎓', color: 'indigo', tipo: 'gasto', es_default: true },
  { id: 10, nombre: 'Regalos', icono: '🎁', color: 'pink', tipo: 'gasto', es_default: true },
  { id: 11, nombre: 'Alimentación', icono: '🛒', color: 'green', tipo: 'gasto', es_default: true },
]

export default function GestorPage() {
  const [records, setRecords] = useState<GestorRecord[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [dbCategories, setDbCategories] = useState<GestorCategory[]>([])
  const [tasas, setTasas] = useState<TasaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Form state
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>('ingreso')
  const [monto, setMonto] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | null>(null)
  const [descripcion, setDescripcion] = useState('')
  const [walletId, setWalletId] = useState('')
  const [tasaAplicada, setTasaAplicada] = useState<'bcv' | 'binance' | 'promedio' | 'otro'>('promedio')
  const [tasaCustom, setTasaCustom] = useState('')

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    try {
      const [tasasData, walletsData, recordsData, categoriesData] = await Promise.all([
        fetchTasas(),
        fetchWallets(),
        fetchGestorRecords(),
        fetchGestorCategories()
      ])
      setTasas(tasasData)
      setWallets(walletsData)
      setRecords(recordsData)
      
      // Si no hay categorías, las inicializamos automáticamente
      if (categoriesData.length === 0) {
        const seeded = await seedGestorCategories()
        setDbCategories(seeded)
      } else {
        setDbCategories(categoriesData)
      }
      
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar datos al montar
  useEffect(() => {
    loadData()
  }, [loadData])

  // Obtener categorías filtradas por tipo
  const getCategorias = () => {
    const cats = dbCategories.length > 0 ? dbCategories : DEFAULT_CATEGORIES
    return cats.filter(cat => cat.tipo === tipo)
  }

  // Obtener tasa según selección
  const getTasaValor = (): number => {
    if (!tasas) return 1
    
    switch (tasaAplicada) {
      case 'bcv': return tasas.dolar_bcv
      case 'binance': return tasas.usdt_binance
      case 'promedio': return tasas.promedio
      case 'otro': return parseFloat(tasaCustom) || 1
      default: return 1
    }
  }

  
  // Obtener label dinámico del monto
  const getMontoLabel = (): string => {
    const wallet = wallets.find(w => w.id.toString() === walletId)
    if (!wallet) return 'MONTO'
    
    if (wallet.moneda === 'BS') {
      return 'MONTO EN BS'
    } else if (wallet.moneda === 'USDT') {
      return 'MONTO EN USDT'
    } else {
      return 'MONTO EN USD'
    }
  }

  // Handle wallet change (sin useEffect)
  const handleWalletChange = (newWalletId: string) => {
    setWalletId(newWalletId)
  }

  // Handle submit
  const handleSubmit = async () => {
    try {
      if (!walletId || !categoriaId || !monto) {
        alert('Por favor completa todos los campos')
        return
      }

      const wallet = wallets.find(w => w.id.toString() === walletId)
      const tasaVal = getTasaValor()
      const montoVal = parseFloat(monto)
      
      // Si la wallet es BS, el monto convertido es el mismo. Si es USD/USDT, se multiplica por la tasa.
      const montoConvertido = wallet?.moneda === 'BS' ? montoVal : montoVal * tasaVal

      await createGestorRecord({
        tipo,
        monto: montoVal,
        categoria_id: categoriaId,
        descripcion,
        wallet_id: parseInt(walletId),
        tasa_aplicada: tasaAplicada,
        tasa_valor: tasaVal,
        monto_convertido: montoConvertido
      })

      // Recargar datos para ver el nuevo registro y saldo actualizado
      await loadData()
      
      // Reset form
      setMonto('')
      setDescripcion('')
      setShowForm(false)
      
    } catch (error: any) {
      console.error('Error guardando registro:', error)
      const msg = error?.response?.data?.detail || 'Error al guardar el registro'
      alert(`${msg}. Verifica que tengas saldo suficiente si es un gasto.`)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-zinc-400">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Cargando Gestor...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-end px-1">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestor</h1>
          <p className="text-zinc-500 text-sm">Tus finanzas personales</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-500 flex items-center justify-center active:scale-95 transition-all shadow-lg"
        >
          <IconPlus />
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 flex flex-col gap-4">
          <p className="text-xs text-zinc-400 uppercase tracking-widest">
            Nuevo movimiento
          </p>

          {/* Tabs tipo */}
          <div className="flex gap-2 bg-zinc-950 rounded-xl p-1">
            <button
              onClick={() => setTipo('ingreso')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                tipo === 'ingreso'
                  ? 'bg-emerald-500 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ingreso
            </button>
            <button
              onClick={() => setTipo('gasto')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                tipo === 'gasto'
                  ? 'bg-red-500 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Gasto
            </button>
          </div>

          {/* Monto */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
              {getMontoLabel()}
            </label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-2xl px-5 py-4 text-white text-2xl font-bold
                placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Wallet */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
              Cuenta
            </label>
            <select
              value={walletId}
              onChange={(e) => handleWalletChange(e.target.value)}
              className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-2xl px-5 py-4 text-white
                outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            >
              <option value="">Selecciona cuenta</option>
              {wallets.map(wallet => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.nombre} ({wallet.moneda}) - Saldo: {wallet.saldo}
                </option>
              ))}
            </select>
          </div>

          {/* Categorías */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3 block">
              Categorías
            </label>
            <div className="grid grid-cols-4 gap-2">
              {getCategorias().map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaId(cat.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all duration-200
                    ${categoriaId === cat.id
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                      : 'bg-zinc-800/60 border-zinc-700/50 hover:border-zinc-600'
                    }`}
                >
                  <span className="text-xl">{cat.icono}</span>
                  <span className={`text-xs font-semibold ${categoriaId === cat.id ? 'text-emerald-400' : 'text-zinc-300'}`}>
                    {cat.nombre}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tasa (solo para divisas) */}
          {walletId && wallets.find(w => w.id.toString() === walletId)?.moneda !== 'BS' && (
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
                Tasa de conversión
              </label>
              <div className="flex gap-2">
                <select
                  value={tasaAplicada}
                  onChange={(e) => setTasaAplicada(e.target.value as any)}
                  className="flex-1 bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-3 py-3 text-white text-sm"
                >
                  <option value="bcv">BCV</option>
                  <option value="binance">Binance</option>
                  <option value="promedio">Promedio</option>
                  <option value="otro">Otro</option>
                </select>
                {tasaAplicada === 'otro' && (
                  <input
                    type="number"
                    value={tasaCustom}
                    onChange={(e) => setTasaCustom(e.target.value)}
                    placeholder="Tasa"
                    className="w-24 bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-3 py-3 text-white text-sm"
                  />
                )}
              </div>
              {tasas && tasaAplicada !== 'otro' && (
                <p className="text-xs text-zinc-500 mt-1">
                  1 USD = {getTasaValor().toFixed(2)} BS
                </p>
              )}
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2 block">
              Descripción
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="¿Para qué es este movimiento?"
              className="w-full bg-zinc-800/70 border border-zinc-700/50 rounded-xl px-4 py-3 text-white
                placeholder:text-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-green-800 p-4 rounded-2xl">
          <p className="text-emerald-100 text-sm font-medium">Ingresos</p>
          <p className="text-2xl font-bold text-white">
            {records.filter(r => r.tipo === 'ingreso').reduce((sum, r) => sum + r.monto, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-600 to-orange-800 p-4 rounded-2xl">
          <p className="text-red-100 text-sm font-medium">Gastos</p>
          <p className="text-2xl font-bold text-white">
            {records.filter(r => r.tipo === 'gasto').reduce((sum, r) => sum + r.monto, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Movimientos */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Movimientos</h2>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-[2rem] overflow-hidden backdrop-blur-sm">
          {records.length === 0 ? (
            <div className="p-10 text-center text-zinc-500 text-sm italic">No hay movimientos aún.</div>
          ) : (
            records.map((record, i) => (
              <div 
                key={record.id} 
                className={`flex items-center justify-between p-4 ${i !== records.length - 1 ? 'border-b border-zinc-800/50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors
                    ${record.tipo === 'ingreso' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}
                  >
                    <span className="text-lg font-bold">{record.tipo === 'ingreso' ? '↙' : '↗'}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">{record.categoria?.nombre || 'General'}</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-medium mt-1">{record.descripcion}</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-medium">
                      {new Date(record.fecha).toLocaleDateString('es-VE')} · {wallets.find(w => w.id === record.wallet_id)?.nombre || 'Cuenta'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm tracking-tight ${record.tipo === 'ingreso' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {record.tipo === 'gasto' ? '-' : '+'} {record.monto.toFixed(2)}
                  </p>
                  <div className="flex justify-end mt-1">
                    <IconTrend up={record.tipo === 'ingreso'} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
