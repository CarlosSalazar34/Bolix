import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { loginUser, registerUser, type LoginResponse } from '../services/auth'

interface AuthContextType {
  token: string | null
  user: { username: string; id: number } | null
  login: (username: string, pass: string) => Promise<void>
  register: (user: string, email: string, pass: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ username: string; id: number } | null>(null)
  const [loading, setLoading] = useState(true) // Añadimos estado de carga

  useEffect(() => {
    // Restaurar sesión al cargar
    const storedToken = localStorage.getItem('bolix_token')
    const storedUsername = localStorage.getItem('bolix_username')
    const storedId = localStorage.getItem('bolix_user_id')

    if (storedToken && storedUsername && storedId) {
      setToken(storedToken)
      setUser({ username: storedUsername, id: Number(storedId) })
    }
    setLoading(false) // Terminó de verificar
  }, [])

  const login = async (username: string, pass: string) => {
    try {
      const data: LoginResponse = await loginUser(username, pass)
      
      // 1. Actualizar estado de React primero
      setToken(data.access_token)
      setUser({ username: data.username, id: data.id })

      // 2. Guardar en Storage (USA SIEMPRE EL MISMO PREFIJO)
      localStorage.setItem('bolix_token', data.access_token)
      localStorage.setItem('bolix_username', data.username)
      localStorage.setItem('bolix_user_id', data.id.toString())
    } catch (error) {
      console.error("Error en login context:", error)
      throw error
    }
  }

  const register = async (username: string, email: string, pass: string) => {
    await registerUser(username, email, pass)
    await login(username, pass)
  }

  const logout = () => {
    // 1. Limpiar estado
    setToken(null)
    setUser(null)
    
    // 2. Limpiar Storage
    localStorage.removeItem('bolix_token')
    localStorage.removeItem('bolix_username')
    localStorage.removeItem('bolix_user_id')
    
    // OPCIONAL: Solo si quieres limpiar TODO rastro en localhost
    // localStorage.clear();
  }

  // Mientras verifica el token, no renderizamos nada para evitar parpadeos
  if (loading) {
    return <div className="h-dvh bg-zinc-950" /> 
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}