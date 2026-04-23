import { useState, useRef, useEffect } from 'react'
import { boloTexto, boloVoz, boloTool } from '../services/api'
import { IconBolo } from '../components/icons'

interface Message {
  role: 'user' | 'bolo'
  content: string
  timestamp: Date
}

export default function BoloPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bolo',
      content: '¡Epa mano! Soy Bolo. ¿En qué te puedo ayudar hoy? ¿Compraste, vendiste o quieres saber cómo va la vuelta?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendText = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await boloTexto(input)
      const boloMsg: Message = { role: 'bolo', content: res.respuesta, timestamp: new Date() }
      setMessages(prev => [...prev, boloMsg])
    } catch (err) {
      const errorMsg: Message = { role: 'bolo', content: 'Mano, algo salió mal. Intenta de nuevo.', timestamp: new Date() }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        sendAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error al acceder al micro:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const sendAudio = async (blob: Blob) => {
    setLoading(true)
    const userMsg: Message = { role: 'user', content: '🎤 Nota de voz enviada...', timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await boloVoz(blob)
      const boloMsg: Message = { role: 'bolo', content: res.respuesta, timestamp: new Date() }
      setMessages(prev => [...prev, boloMsg])
    } catch (err) {
      const errorMsg: Message = { role: 'bolo', content: 'Mano, no pude escuchar bien el audio. ¿Me repites?', timestamp: new Date() }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleTool = async (tool: 'ganancias' | 'saldo' | 'mercado') => {
    if (tool === 'ganancias') {
      const boloMsg: Message = {
        role: 'bolo',
        content: 'Mano, la función de Ver Ganancias está siendo desarrollada. ¡Pronto sabrás cuánto billete estás haciendo!',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, boloMsg])
      return
    }

    setLoading(true)
    try {
      const res = await boloTool(tool as any)
      const boloMsg: Message = { role: 'bolo', content: res.respuesta, timestamp: new Date() }
      setMessages(prev => [...prev, boloMsg])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
          <IconBolo />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Bolo Chat</h1>
          <p className="text-sm text-zinc-400">Asistente Inteligente de Bolix</p>
        </div>
      </div>

      {/* Tools Bubbles */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => handleTool('ganancias')}
          className="whitespace-nowrap px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:border-emerald-500/50 transition-colors"
        >
          🚀 Ver Ganancias
        </button>
        <button
          onClick={() => handleTool('saldo')}
          className="whitespace-nowrap px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:border-emerald-500/50 transition-colors"
        >
          💰 Saldo Principal
        </button>
        <button
          onClick={() => handleTool('mercado')}
          className="whitespace-nowrap px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:border-emerald-500/50 transition-colors"
        >
          📊 Estado del Mercado
        </button>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-hide"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none'}`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 px-4 py-3 rounded-2xl border border-zinc-800 rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="relative">
        <div className="flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded-2xl focus-within:border-emerald-500/50 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            placeholder="Escribe algo, mano..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-white text-sm px-2"
          />

          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`p-2 rounded-xl transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'text-zinc-400 hover:text-emerald-400'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </button>

          <button
            onClick={handleSendText}
            disabled={!input.trim() || loading}
            className="p-2 bg-emerald-500 text-zinc-950 rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        {isRecording && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
            Grabando Audio...
          </div>
        )}
      </div>
    </div>
  )
}