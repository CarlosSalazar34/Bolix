import { useState, useEffect } from 'react'
import { fetchWallets, createWallet, deleteWallet, updateWallet, type Wallet } from '../services/api'
import { IconWallet } from '../components/icons'

export default function WalletPage() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null)
  
  const [newWalletName, setNewWalletName] = useState('')
  const [newWalletBalance, setNewWalletBalance] = useState('')
  const [newWalletCurrency, setNewWalletCurrency] = useState<'BS' | 'USDT'>('BS')

  const [editBalance, setEditBalance] = useState('')

  useEffect(() => {
    loadWallets()
  }, [])

  useEffect(() => {
    if (editingWallet) {
      setEditBalance(editingWallet.saldo.toString())
    }
  }, [editingWallet])

  const loadWallets = async () => {
    try {
      const data = await fetchWallets()
      setWallets(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddWallet = async () => {
    if (!newWalletName) return
    try {
      await createWallet({
        nombre: newWalletName,
        moneda: newWalletCurrency,
        saldo: parseFloat(newWalletBalance) || 0,
        es_principal_usdt: newWalletCurrency === 'USDT'
      })
      setShowAdd(false)
      setNewWalletName('')
      setNewWalletBalance('')
      setNewWalletCurrency('BS')
      loadWallets()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteWallet = async () => {
    if (!editingWallet) return
    if (!confirm(`¿Seguro que quieres eliminar ${editingWallet.nombre}?`)) return
    
    try {
      await deleteWallet(editingWallet.id)
      setEditingWallet(null)
      loadWallets()
    } catch (err) {
      console.error(err)
      alert("No se pudo eliminar la wallet")
    }
  }

  const handleUpdateWallet = async () => {
    if (!editingWallet) return
    try {
      await updateWallet(editingWallet.id, {
        saldo: parseFloat(editBalance) || 0
      })
      setEditingWallet(null)
      loadWallets()
    } catch (err) {
      console.error(err)
      alert("No se pudo actualizar la wallet")
    }
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Wallets</h1>
          <p className="text-zinc-400 text-sm">Gestiona tus fondos en USDT y BS</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <IconWallet />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {wallets.map((w) => (
            <div 
              key={w.id}
              onClick={() => setEditingWallet(w)}
              className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  {w.moneda === 'USDT' ? 'Crypto Wallet' : 'Fiat Wallet'}
                </span>
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{w.nombre}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-emerald-400">
                  {w.saldo.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-medium text-zinc-500">{w.moneda}</span>
              </div>
            </div>
          ))}

          {/* FAB circular para agregar wallet */}
          <button 
            onClick={() => setShowAdd(true)}
            className="fixed right-5 bottom-48 z-30 w-14 h-14 rounded-full
              bg-emerald-500 text-zinc-950 shadow-[0_4px_24px_rgba(16,185,129,0.4)]
              flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
            aria-label="Agregar wallet"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        </div>
      )}

      {/* Modal Agregar Wallet */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold text-white mb-4">Nueva Wallet</h2>
            <div className="space-y-4">
              {/* Selector de Moneda */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Moneda</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setNewWalletCurrency('BS')}
                    className={`flex-1 py-3 rounded-2xl border font-bold transition-all ${newWalletCurrency === 'BS' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                  >
                    Bolívares (BS)
                  </button>
                  <button 
                    onClick={() => setNewWalletCurrency('USDT')}
                    className={`flex-1 py-3 rounded-2xl border font-bold transition-all ${newWalletCurrency === 'USDT' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}
                  >
                    USDT (Crypto)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Nombre de la Wallet</label>
                <input 
                  type="text" 
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  placeholder={newWalletCurrency === 'BS' ? "Ej: Banesco Principal" : "Ej: Binance / Ledger"}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Saldo Inicial ({newWalletCurrency})</label>
                <input 
                  type="number" 
                  value={newWalletBalance}
                  onChange={(e) => setNewWalletBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-zinc-800 text-white font-semibold hover:bg-zinc-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddWallet}
                  className="flex-1 px-4 py-3 rounded-2xl bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Wallet */}
      {editingWallet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Editar {editingWallet.nombre}</h2>
              <button 
                onClick={handleDeleteWallet}
                className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                title="Eliminar Wallet"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M9 3v1H4v2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h1V4h-5V3H9zM7 6h10v13H7V6zm2 2v9h2V8H9zm4 0v9h2V8h-2z" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Actualizar Saldo ({editingWallet.moneda})</label>
                <input 
                  type="number" 
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setEditingWallet(null)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-zinc-800 text-white font-semibold hover:bg-zinc-700 transition-colors"
                >
                  Cerrar
                </button>
                <button 
                  onClick={handleUpdateWallet}
                  className="flex-1 px-4 py-3 rounded-2xl bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-400 transition-colors"
                >
                  Actualizar
                </button>
              </div>
              <p className="text-[10px] text-zinc-500 text-center">Nota: La edición directa de saldo es para ajustes rápidos de tu balance personal.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
