const API_BASE = import.meta.env.VITE_API_URL || 'https://bolix-backend.vercel.app'

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
      if (errorData.detail) errorMessage = errorData.detail
    } catch {
      // Ignorar
    }
    throw new Error(errorMessage)
  }

  return res.json()
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
