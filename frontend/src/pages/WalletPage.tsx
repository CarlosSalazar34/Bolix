import { useState, useEffect } from 'react'
import { IconWallet, IconPlus, IconTrend } from '../components/icons'

// 1. Separación de funciones y tipos para cumplir con verbatimModuleSyntax
import { fetchWallets, fetchTrades, createWallet, updateWallet, registrarTrade, smokeTestBolixEndpoints } from '../services/api'
import type { Wallet as ApiWallet, Trade as ApiTrade } from '../services/api'

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
        .then((results) => {
          console.group('Bolix Smoke Test');
          console.table(results);
          console.groupEnd();
        })
        .catch((error) => {
          console.error('Smoke test fallo:', error);
        });
    }
  }, []);

  useEffect(() => {
    if (!tradeWalletId && wallets.length > 0) {
      setTradeWalletId(wallets[0].id)
    }
  }, [wallets, tradeWalletId])

  const handleAgregarWallet = async () => {
    const nombre = walletNombre.trim()
    const saldo = Number(walletSaldo)
    const esPrincipal = walletMoneda === 'USDT'

    if (!nombre) {
      console.warn('Debes colocar un nombre de wallet')
      return
    }

    if (Number.isNaN(saldo)) {
      console.warn('Saldo invalido');
      return;
    }

    try {
      await createWallet({
        nombre,
        moneda: walletMoneda,
        saldo,
        es_principal_usdt: esPrincipal
      });
      setWalletNombre('')
      setWalletSaldo('0')
      setWalletMoneda('USDT')
      setShowWalletForm(false)
      await loadData();
    } catch (error) {
      console.error('No se pudo crear la wallet:', error);
    }
  };

  const handleEditarWallet = (wallet: Wallet) => {
    setEditingWalletId(wallet.id)
    setWalletNombre(wallet.nombre)
    setWalletMoneda(wallet.moneda)
    setWalletSaldo(String(wallet.balance))
    setShowWalletForm(true)
  }

  const handleGuardarWallet = async () => {
    if (editingWalletId) {
      const nombre = walletNombre.trim()
      const saldo = Number(walletSaldo)
      const esPrincipal = walletMoneda === 'USDT'
      if (!nombre || Number.isNaN(saldo)) {
        console.warn('Datos de billetera invalidos')
        return
      }
      try {
        await updateWallet(Number(editingWalletId), {
          nombre,
          moneda: walletMoneda,
          saldo,
          es_principal_usdt: esPrincipal
        })
        setEditingWalletId(null)
        setWalletNombre('')
        setWalletSaldo('0')
        setWalletMoneda('USDT')
        setShowWalletForm(false)
        await loadData()
      } catch (error) {
        console.error('No se pudo editar la wallet:', error)
      }
      return
    }
    await handleAgregarWallet()
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
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 flex flex-col gap-3">
          <p className="text-xs text-zinc-400 uppercase tracking-widest">
            {editingWalletId ? 'Editar billetera' : 'Nueva billetera'}
          </p>
          <input
            value={walletNombre}
            onChange={(e) => setWalletNombre(e.target.value)}
            placeholder="Nombre (ej: Binance)"
            className="h-10 rounded-xl bg-zinc-950 border border-zinc-700 px-3 text-sm text-white"
          />
          <div className="flex gap-2">
            <select
              value={walletMoneda}
              onChange={(e) => setWalletMoneda(e.target.value as 'USDT' | 'USD' | 'BS')}
              className="h-10 rounded-xl bg-zinc-950 border border-zinc-700 px-3 text-sm text-white flex-1"
            >
              <option value="USDT">USDT</option>
              <option value="USD">USD</option>
              <option value="BS">BS</option>
            </select>
            <input
              value={walletSaldo}
              onChange={(e) => setWalletSaldo(e.target.value)}
              placeholder="Saldo"
              className="h-10 rounded-xl bg-zinc-950 border border-zinc-700 px-3 text-sm text-white w-32"
            />
          </div>
          <button
            onClick={handleGuardarWallet}
            className="h-10 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
          >
            {editingWalletId ? 'Actualizar billetera' : 'Guardar billetera'}
          </button>
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
                <button
                  onClick={() => handleEditarWallet(w)}
                  className="mt-2 text-[10px] uppercase font-bold text-white/80 hover:text-white underline"
                >
                  Editar
                </button>
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
          <div className="mx-1 mb-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 flex flex-col gap-2">
            <div className="flex gap-2">
              <select
                value={tradeTipo}
                onChange={(e) => setTradeTipo(e.target.value as 'COMPRA' | 'VENTA' | 'FONDEO')}
                className="h-9 rounded-lg bg-zinc-950 border border-zinc-700 px-3 text-sm text-white flex-1"
              >
                <option value="FONDEO">Fondeo</option>
                <option value="COMPRA">Compra</option>
                <option value="VENTA">Venta</option>
              </select>
              <select
                value={tradeWalletId}
                onChange={(e) => setTradeWalletId(e.target.value)}
                className="h-9 rounded-lg bg-zinc-950 border border-zinc-700 px-3 text-sm text-white flex-1"
              >
                <option value="">Selecciona wallet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nombre} ({w.moneda})
                  </option>
                ))}
              </select>
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
                className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
              >
                Confirmar
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
                  <div className="flex justify-end mt-1">
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