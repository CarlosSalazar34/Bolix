import { useState, useEffect } from 'react'
import { fetchWallets, addWallet } from '../services/api'
import type { Wallet } from '../services/api'
import { IconWallet } from './icons'

interface WalletWidgetProps {
  tasaUSD: number
}

export default function WalletWidget({ tasaUSD }: WalletWidgetProps) {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newWalletName, setNewWalletName] = useState('')
  const [newWalletType, setNewWalletType] = useState<'BS' | 'USDT'>('BS')

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

  useEffect(() => {
    loadWallets()
  }, [])

  const handleAddWallet = async () => {
    if (!newWalletName) return
    try {
      await addWallet({
        nombre: newWalletName,
        moneda: newWalletType,
        saldo: 0,
        es_principal_usdt: newWalletType === 'USDT' && !wallets.some(w => w.es_principal_usdt)
      })
      setNewWalletName('')
      setShowAdd(false)
      loadWallets()
    } catch (err) {
      console.error(err)
    }
  }

  const totalUSDT = wallets.reduce((acc, w) => {
    if (w.moneda === 'USDT') return acc + w.saldo
    return acc + (w.saldo / tasaUSD)
  }, 0)

  const totalVES = totalUSDT * tasaUSD

  if (loading) return <div className="h-32 bg-zinc-900 animate-pulse rounded-3xl" />

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="text-emerald-400">
            <IconWallet />
          </div>
          <h3 className="text-white font-bold">Mis Billeteras</h3>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold"
        >
          {showAdd ? '✕' : '+'}
        </button>
      </div>

      {showAdd ? (
        <div className="flex flex-col gap-3 animate-in fade-in zoom-in duration-200">
          <input 
            type="text" 
            placeholder="Nombre (ej: Banesco)"
            value={newWalletName}
            onChange={(e) => setNewWalletName(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm"
          />
          <div className="flex gap-2">
            <button 
              onClick={() => setNewWalletType('BS')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${newWalletType === 'BS' ? 'bg-zinc-700 text-white' : 'bg-transparent text-zinc-500'}`}
            >
              BOLÍVARES
            </button>
            <button 
              onClick={() => setNewWalletType('USDT')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${newWalletType === 'USDT' ? 'bg-zinc-700 text-white' : 'bg-transparent text-zinc-500'}`}
            >
              USDT
            </button>
          </div>
          <button 
            onClick={handleAddWallet}
            className="bg-emerald-500 text-white py-2 rounded-xl font-bold text-sm"
          >
            Agregar Wallet
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest leading-none">Balance Total Principal</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold text-white">{totalUSDT.toFixed(2)}</p>
            <p className="text-emerald-400 font-bold text-sm">USDT</p>
          </div>
          <p className="text-zinc-400 text-sm font-medium">≈ {totalVES.toLocaleString('es-VE')} VES</p>
          
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {wallets.map(w => (
              <div key={w.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-4 py-3 min-w-[120px]">
                <p className="text-zinc-400 text-[10px] font-bold truncate">{w.nombre}</p>
                <p className="text-white font-bold">{w.saldo.toFixed(2)} <span className="text-[10px] text-zinc-500">{w.moneda}</span></p>
              </div>
            ))}
            {wallets.length === 0 && (
              <p className="text-zinc-600 text-xs italic py-2">No has agregado wallets aún, pana.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
