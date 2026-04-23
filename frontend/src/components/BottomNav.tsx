import React from 'react'
import { IconHome, IconChart, IconUser, IconWallet, IconBolo } from './icons'

export type Tab = 'home' | 'historial' | 'wallet' | 'bolo' | 'perfil'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Inicio', icon: <IconHome /> },
  { id: 'historial', label: 'Historial', icon: <IconChart /> },
  { id: 'wallet', label: 'Wallet', icon: <IconWallet /> },
  { id: 'bolo', label: 'Bolo', icon: <IconBolo /> },
  { id: 'perfil', label: 'Perfil', icon: <IconUser /> },
]

interface BottomNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="z-40 px-4 pb-[env(safe-area-inset-bottom,16px)] pt-2 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800/60">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {TABS.map(({ id, label, icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200
                ${active
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {icon}
              <span className={`text-[10px] font-medium ${active ? 'text-emerald-400' : ''}`}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
