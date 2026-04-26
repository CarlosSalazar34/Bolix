const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export interface LoginResponse {
  access_token: string
  token_type: string
  username: string
  id: number
}

export interface RegisterResponse {
  id: number
  username: string
  email: string
  fecha_registro: string
}

export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  // OAuth2PasswordRequestForm expects form-data
  const formData = new URLSearchParams()
  formData.append('username', username)
  formData.append('password', password)

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })

    if (!res.ok) {
      let errorMessage = 'Error al iniciar sesión'
      try {
        const errorData = await res.json()
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail[0].msg
          }
        }
      } catch {
        // Si no puede parsear el JSON, usar mensaje genérico
        if (res.status === 0) {
          errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté corriendo.'
        } else if (res.status >= 500) {
          errorMessage = 'Error interno del servidor. Intenta más tarde.'
        } else if (res.status === 401) {
          errorMessage = 'Usuario o contraseña incorrectos'
        } else {
          errorMessage = `Error ${res.status}: ${res.statusText}`
        }
      }
      throw new Error(errorMessage)
    }

    return res.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Error de conexión. Verifica que el backend esté corriendo en http://127.0.0.1:8000')
  }
}

export async function registerUser(username: string, email: string, password: string): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password })
  })

  if (!res.ok) {
    let errorMessage = 'Error al registrar usuario'
    try {
      const errorData = await res.json()
      if (errorData.detail) {
        // FastAPI sometimes returns detail as an array of validation errors
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail[0].msg
        }
      }
    } catch {
      // Ignorar
    }
    throw new Error(errorMessage)
  }

  return res.json()
}
