import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface BoloContextType {
  showBolo: (message: string) => void
  hideBolo: () => void
  message: string | null
  visible: boolean
}

const BoloContext = createContext<BoloContextType | undefined>(undefined)

export function BoloProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  const showBolo = useCallback((msg: string) => {
    setMessage(msg)
    setVisible(true)
    // Auto-hide after some time if it's an alert
    setTimeout(() => {
      // setVisible(false) // Un-comment if you want auto-hide
    }, 5000)
  }, [])

  const hideBolo = useCallback(() => {
    setVisible(false)
  }, [])

  return (
    <BoloContext.Provider value={{ showBolo, hideBolo, message, visible }}>
      {children}
    </BoloContext.Provider>
  )
}

export function useBolo() {
  const context = useContext(BoloContext)
  if (!context) {
    throw new Error('useBolo must be used within a BoloProvider')
  }
  return context
}
