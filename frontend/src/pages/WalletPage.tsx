import { useState, useEffect } from 'react'
// 1. Separación de funciones y tipos para cumplir con verbatimModuleSyntax
import { fetchWallets, fetchTrades, createWallet, updateWallet, registrarTrade, smokeTestBolixEndpoints, deleteWallet, deleteTrade } from '../services/api'
import type { Wallet as ApiWallet, Trade as ApiTrade, SmokeTestResult } from '../services/api'
import { IconWallet, IconPlus, IconTrend, IconTrash } from '../components/icons'

// ── Tipos de la Interfaz (Frontend) ────────────────────────────────────────
interface Wallet {
  id: string
  nombre: string
  balance: number
  moneda: 'BS' | 'USD' | 'USDT'
  tipo: 'Banco' | 'Efectivo' | 'Crypto'
  color: string
}

interface Transaction {
  id: string
  descripcion: string
  monto: number
  moneda: string
  fecha: string
  tipo: 'ingreso' | 'egreso'
  tipoMovimiento: 'COMPRA' | 'VENTA' | 'FONDEO'
  walletNombre: string
}

export default function WalletPage() {
  const [loading, setLoading] = useState(true)
  const [savingWallet, setSavingWallet] = useState(false)
  const [savingTrade, setSavingTrade] = useState(false)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showWalletForm, setShowWalletForm] = useState(false)
  const [showTradeForm, setShowTradeForm] = useState(false)
  const [walletNombre, setWalletNombre] = useState('')
  const [walletMoneda, setWalletMoneda] = useState<'USDT' | 'USD' | 'BS'>('USDT')
  const [walletSaldo, setWalletSaldo] = useState('0')
  const [tradeMonto, setTradeMonto] = useState('10')
  const [tradeTipo, setTradeTipo] = useState<'COMPRA' | 'VENTA' | 'FONDEO'>('FONDEO')
  const [tradeWalletId, setTradeWalletId] = useState<string>('')
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null)

  const getColorByTipo = (moneda: string): string => {
    if (moneda === 'BS') return 'from-blue-600 to-blue-800'
    if (moneda === 'USDT') return 'from-orange-500 to-orange-700'
    return 'from-emerald-600 to-green-800'
  }

  const loadData = async () => {
    try {
      // 2. Carga tolerante: si falla trades, wallets sigue mostrandose (y viceversa)
      const [walletsResult, tradesResult] = await Promise.allSettled([
        fetchWallets() as Promise<ApiWallet[]>,
        fetchTrades() as unknown as Promise<{ historial: ApiTrade[] }>
      ]);

      const walletsData = walletsResult.status === 'fulfilled' ? walletsResult.value : [];
      const tradesResponse = tradesResult.status === 'fulfilled' ? tradesResult.value : { historial: [] };

      if (walletsResult.status === 'rejected') {
        console.error("Error cargando wallets de Bolix:", walletsResult.reason);
      }
      if (tradesResult.status === 'rejected') {
        console.error("Error cargando trades de Bolix:", tradesResult.reason);
      }

      // 3. Mapeo de Wallets
      const mappedWallets: Wallet[] = (walletsData || []).map((w: ApiWallet) => ({
        id: w.id.toString(),
        nombre: w.nombre,
        balance: Number(w.saldo),
        moneda: w.moneda as 'BS' | 'USD' | 'USDT',
        tipo: w.moneda === 'USDT'
          ? 'Crypto'
          : w.nombre.toLowerCase().includes('efectivo') ? 'Efectivo' : 'Banco',
        color: getColorByTipo(w.moneda)
      }));

      // 4. Mapeo de Transacciones (Usando el historial del objeto de respuesta)
      const mappedTransactions: Transaction[] = (tradesResponse?.historial || []).map((t: ApiTrade) => {
        const typedTrade = t as ApiTrade & { wallet_id?: number; moneda?: string }
        const walletMatch = mappedWallets.find((w) => w.id === String(typedTrade.wallet_id))
        return {
          id: t.id.toString(),
          descripcion: t.tipo === 'COMPRA' ? 'Compra' : t.tipo === 'VENTA' ? 'Venta' : 'Fondeo',
          monto: Number(t.monto_usdt),
          moneda: typedTrade.moneda || walletMatch?.moneda || 'USDT',
          fecha: new Date(t.fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }),
          tipo: t.tipo === 'VENTA' ? 'egreso' : 'ingreso',
          tipoMovimiento: t.tipo,
          walletNombre: walletMatch?.nombre || 'Wallet principal'
        }
      });

      setWallets(mappedWallets);
      setTransactions(mappedTransactions);
    } catch (error) {
      console.error("Error cargando datos de Bolix:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (import.meta.env.DEV) {
      smokeTestBolixEndpoints()
        .then((results: SmokeTestResult[]) => {
          console.group('Bolix Smoke Test');
          console.table(results);
          console.groupEnd();
        })
        .catch((error: any) => {
          console.error('Smoke test fallo:', error);
        });
    }
  }, []);

  useEffect(() => {
    if (!tradeWalletId && wallets.length > 0) {
      setTradeWalletId(wallets[0].id)
    }
  }, [wallets, tradeWalletId])

  const handleGuardarWallet = async () => {
    const nombre = walletNombre.trim()
    const saldo = Number(walletSaldo)
    const esPrincipal = walletMoneda === 'USDT'

    if (!nombre) {
      alert('Ponle un nombre a la cuenta')
      return
    }

    setSavingWallet(true)
    try {
      if (editingWalletId) {
        await updateWallet(Number(editingWalletId), {
          nombre,
          moneda: walletMoneda,
          saldo,
          es_principal_usdt: esPrincipal
        })
      } else {
        await createWallet({
          nombre,
          moneda: walletMoneda,
          saldo,
          es_principal_usdt: esPrincipal
        })
      }
      setShowWalletForm(false)
      setEditingWalletId(null)
      setWalletNombre('')
      setWalletSaldo('0')
      await loadData()
    } catch (error) {
      console.error('Error al guardar wallet:', error)
      alert('Error al guardar la billetera')
    } finally {
      setSavingWallet(false)
    }
  }

  const handleEliminarWallet = async (id: number, saldo: number) => {
    if (saldo > 0) {
      alert("No puedes eliminar una billetera con saldo. Primero retira los fondos o gástalos.");
      return;
    }

    if (window.confirm("¿Estás seguro de que quieres eliminar esta billetera?")) {
      try {
        await deleteWallet(id);
        await loadData();
      } catch (error) {
        console.error("Error al eliminar wallet:", error);
        alert("No se pudo eliminar la billetera.");
      }
    }
  }

  const handleEliminarTrade = async (id: number) => {
    if (window.confirm("¿Eliminar este movimiento? Esto no devolverá el dinero a la billetera automáticamente.")) {
      try {
        await deleteTrade(id);
        await loadData();
      } catch (error) {
        console.error("Error al eliminar trade:", error);
      }
    }
  }

  const handleEditarWallet = (wallet: Wallet) => {
    setEditingWalletId(wallet.id)
    setWalletNombre(wallet.nombre)
    setWalletMoneda(wallet.moneda)
    setWalletSaldo(String(wallet.balance))
    setShowWalletForm(true)
  }

  const handleRegistrarFondeo = async () => {
    const monto = Number(tradeMonto);
    if (Number.isNaN(monto) || monto <= 0) {
      console.warn('Monto invalido');
      return;
    }
    if (!tradeWalletId) {
      console.warn('Selecciona una wallet');
      return;
    }
    const walletSeleccionada = wallets.find((w) => w.id === tradeWalletId)
    
    setSavingTrade(true)
    try {
      await registrarTrade({
        tipo: tradeTipo,
        monto_usdt: monto,
        precio_tasa: 1,
        wallet_id: Number(tradeWalletId),
        moneda: walletSeleccionada?.moneda || 'USDT'
      });
      setTradeMonto('10')
      setTradeTipo('FONDEO')
      setShowTradeForm(false)
      await loadData();
    } catch (error: any) {
      const detail = error?.response?.data?.detail
      console.error('No se pudo registrar el movimiento:', detail || error);
    } finally {
      setSavingTrade(false)
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-zinc-400">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Sincronizando con Bolix...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

      {/* Header */}
      <div className="flex justify-between items-end px-1">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Mis Billeteras</h1>
          <p className="text-zinc-500 text-sm">Resumen de tus activos</p>
        </div>
        <button
          onClick={() => setShowWalletForm((prev) => !prev)}
          className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-500 flex items-center justify-center active:scale-95 transition-all shadow-lg"
          aria-label="Agregar cuenta"
        >
          <IconPlus />
        </button>
      </div>

      {showWalletForm && (
        <div className="mx-1 p-5 rounded-[2rem] bg-zinc-900/80 border border-zinc-800 backdrop-blur-md shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">
              {editingWalletId ? 'Editar billetera' : 'Nueva billetera'}
            </h3>
            <button
              onClick={() => { setShowWalletForm(false); setEditingWalletId(null); }}
              className="text-zinc-500 hover:text-red-400 p-1"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Nombre de la cuenta</label>
              <input
                value={walletNombre}
                onChange={(e) => setWalletNombre(e.target.value)}
                placeholder="Ej: Efectivo, Binance, Banesco..."
                className="w-full h-12 text-base rounded-2xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 px-4 text-white transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Moneda</label>
                <select
                  value={walletMoneda}
                  onChange={(e) => setWalletMoneda(e.target.value as 'USDT' | 'USD' | 'BS')}
                  className="w-full h-12 text-base rounded-2xl bg-zinc-950 border border-zinc-800 px-4 text-white outline-none appearance-none"
                >
                  <option value="USDT">USDT (₮)</option>
                  <option value="USD">USD ($)</option>
                  <option value="BS">BS (Bs.)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase ml-1">Saldo inicial</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={walletSaldo}
                  onChange={(e) => setWalletSaldo(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-12 text-base rounded-2xl bg-zinc-950 border border-zinc-800 px-4 text-white outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleGuardarWallet}
              disabled={savingWallet}
              className={`h-12 mt-2 text-base rounded-2xl text-white font-bold shadow-lg transition-all active:scale-[0.98]
                ${savingWallet ? 'bg-zinc-700 opacity-50 cursor-not-allowed' : 'bg-emerald-600 shadow-emerald-900/20 hover:bg-emerald-500'}`}
            >
              {savingWallet ? 'Guardando...' : (editingWalletId ? 'Guardar cambios' : 'Crear Billetera')}
            </button>
          </div>
        </div>
      )}

      {/* Wallets */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        {wallets.length === 0 ? (
          <div className="min-w-[280px] h-44 rounded-[2.5rem] p-6 bg-zinc-900 border border-zinc-800 border-dashed flex items-center justify-center text-zinc-500 text-sm">
            No hay cuentas registradas.
          </div>
        ) : (
          wallets.map((w) => (
            <div
              key={w.id}
              className={`min-w-[280px] h-44 rounded-[2.5rem] p-6 bg-gradient-to-br ${w.color} relative overflow-hidden shadow-xl flex flex-col justify-between`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl" />
              <div className="flex justify-between items-start z-10">
                <div className="flex flex-col">
                  <span className="text-white/70 text-[10px] uppercase tracking-widest font-bold">{w.tipo}</span>
                  <span className="text-white font-bold text-lg leading-tight">{w.nombre}</span>
                </div>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md text-white">
                  <IconWallet size={18} />
                </div>
              </div>
              <div className="z-10">
                <p className="text-white/60 text-xs font-medium mb-1">Disponible</p>
                <h3 className="text-3xl font-bold text-white tracking-tighter">
                  {w.moneda === 'BS' ? 'Bs.' : w.moneda === 'USDT' ? '₮' : '$'} {w.balance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </h3>
                <div className="flex gap-4 items-center mt-2">
                  <button
                    onClick={() => handleEditarWallet(w)}
                    className="text-[10px] uppercase font-bold text-white/80 hover:text-white underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminarWallet(Number(w.id), w.balance)}
                    className="text-[10px] uppercase font-bold text-white/50 hover:text-red-300 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transacciones */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Movimientos recientes</h2>
          <button
            onClick={() => setShowTradeForm((prev) => !prev)}
            className="text-emerald-500 text-[10px] font-bold uppercase hover:underline"
          >
            Agregar movimiento
          </button>
        </div>

        {showTradeForm && (
          <div className="mx-1 mb-4 p-5 rounded-[2rem] bg-zinc-900/80 border border-zinc-800 backdrop-blur-md shadow-2xl animate-in slide-in-from-top-4 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Registrar Movimiento</h3>
              <button onClick={() => setShowTradeForm(false)} className="text-zinc-500 hover:text-red-400 p-1">✕</button>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={tradeMonto}
                onChange={(e) => setTradeMonto(e.target.value)}
                placeholder={tradeWalletId ? 
                  `Monto en ${wallets.find(w => w.id === tradeWalletId)?.moneda || 'USDT'}` : 
                  "Monto"
                }
                className="h-9 rounded-lg bg-zinc-950 border border-zinc-700 px-3 text-sm text-white flex-1"
              />
              <button
                onClick={handleRegistrarFondeo}
                disabled={savingTrade}
                className={`h-12 text-base rounded-2xl text-white font-bold shadow-lg transition-all active:scale-[0.98]
                  ${savingTrade ? 'bg-zinc-700 opacity-50 cursor-not-allowed' : 'bg-emerald-600 shadow-emerald-900/20 hover:bg-emerald-500'}`}
              >
                {savingTrade ? 'Registrando...' : 'Confirmar Registro'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-[2rem] overflow-hidden backdrop-blur-sm">
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-zinc-500 text-sm italic">No hay movimientos aún.</div>
          ) : (
            transactions.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center justify-between p-4 ${i !== transactions.length - 1 ? 'border-b border-zinc-800/50' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors
                    ${t.tipo === 'ingreso' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800/50 text-zinc-400'}`}
                  >
                    <span className="text-lg font-bold">{t.tipo === 'ingreso' ? '↙' : '↗'}</span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">{t.descripcion} · {t.tipoMovimiento}</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-medium mt-1">{t.fecha}</p>
                    <p className="text-zinc-500 text-[10px] uppercase font-medium">{t.walletNombre}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm tracking-tight ${t.tipo === 'ingreso' ? 'text-emerald-400' : 'text-zinc-300'}`}>
                    {t.tipo === 'egreso' ? '-' : '+'} {t.monto.toFixed(2)} {t.moneda}
                  </p>
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      onClick={() => handleEliminarTrade(Number(t.id))}
                      className="text-zinc-600 hover:text-red-400/70 transition-colors p-1"
                      title="Eliminar movimiento"
                    >
                      <IconTrash size={14} />
                    </button>
                    <IconTrend up={t.tipo === 'ingreso'} />
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