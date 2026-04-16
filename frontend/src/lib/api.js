import axios from 'axios'

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // envia cookies HttpOnly automaticamente
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor: tenta renovar o access token em caso de 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        await api.post('/auth/refresh/')
        return api(original)
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
