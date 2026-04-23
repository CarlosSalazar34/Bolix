import { useBolo } from '../context/BoloContext'

export default function BoloSpeechBubble() {
  const { message, visible, hideBolo } = useBolo()

  if (!visible || !message) return null

  return (
    <div className="fixed bottom-24 left-5 right-5 z-50 flex items-end gap-3 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
      {/* Bolo Avatar */}
      <div className="w-14 h-14 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center flex-shrink-0 pointer-events-auto overflow-hidden">
        <span className="text-2xl">🤖</span>
      </div>

      {/* Speech Bubble */}
      <div className="bg-white rounded-2xl p-4 shadow-xl pointer-events-auto relative mb-2">
        <p className="text-zinc-800 text-sm font-medium leading-relaxed">
          {message}
        </p>
        
        {/* Triangle */}
        <div className="absolute left-[-8px] bottom-4 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-white border-b-[8px] border-b-transparent"></div>

        {/* Close Button */}
        <button 
          onClick={hideBolo}
          className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-800 text-white rounded-full flex items-center justify-center text-xs shadow-md border-2 border-white"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
