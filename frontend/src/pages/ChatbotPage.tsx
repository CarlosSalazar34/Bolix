import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../services/api'
import { IconMessage } from '../components/icons'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: '¡Hola! Soy Bolo 🤖. Puedo ayudarte a registrar tus compras o decirte cómo van tus ganancias. Prueba con: "Compré 100" o "¿Cuánto voy ganando?"',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const response = await sendChatMessage(input)
      const botMsg: Message = {
        id: Date.now() + 1,
        text: response.respuesta,
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMsg])
    } catch (error) {
      const errMsg: Message = {
        id: Date.now() + 1,
        text: 'Lo siento, hubo un error al conectar con el servidor. Intenta de nuevo.',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 p-4 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-xl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <IconMessage />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Bolo</h1>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs text-zinc-400 font-medium">En línea para ayudarte</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                ${msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-zinc-800/80 text-zinc-100 border border-zinc-700/50 backdrop-blur-md rounded-tl-none'
                }`}
            >
              {msg.text}
              <div className={`text-[10px] mt-1 opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800/80 px-4 py-3 rounded-2xl rounded-tl-none border border-zinc-700/50 flex gap-1">
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="relative flex items-center gap-2 bg-zinc-900/80 border border-zinc-800/80 p-2 rounded-2xl backdrop-blur-xl mb-4 focus-within:border-emerald-500/50 transition-colors"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-transparent border-0 focus:ring-0 focus:ring-offset-0 focus:outline-none text-white placeholder-zinc-500 px-3 py-2 text-base"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`p-2.5 rounded-xl transition-all duration-200 
            ${input.trim() && !isLoading
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
          </svg>
        </button>
      </form>
    </div>
  )
}