import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,   // envia cookies HttpOnly (refresh token)
  headers: { 'Content-Type': 'application/json' },
})

// ── Interceptor: adiciona access token do cookie/memory ao header Authorization
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Interceptor: tenta renovar access token via refresh cookie
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await axios.post(
          `${API_URL}/api/v1/auth/refresh/`,
          {},
          { withCredentials: true }
        )
        const newToken = data.access
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('access_token', newToken)
        }
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('access_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth
export const login = (email, password) =>
  api.post('/auth/login/', { email, password })

export const logout = () =>
  api.post('/auth/logout/')

export const refreshToken = () =>
  api.post('/auth/refresh/')

// ── Perfil
export const getProfile = () =>
  api.get('/profile/')

export const updateProfile = (data) =>
  api.patch('/profile/', data)

// ── Contas
export const getAccounts = () =>
  api.get('/accounts/')

export const createAccount = (data) =>
  api.post('/accounts/', data)

export const updateAccount = (id, data) =>
  api.patch(`/accounts/${id}/`, data)

export const deleteAccount = (id) =>
  api.delete(`/accounts/${id}/`)

// ── Categorias
export const getCategories = (params) =>
  api.get('/categories/', { params })

export const createCategory = (data) =>
  api.post('/categories/', data)

export const updateCategory = (id, data) =>
  api.patch(`/categories/${id}/`, data)

export const deleteCategory = (id) =>
  api.delete(`/categories/${id}/`)

// ── Transações
export const getTransactions = (params) =>
  api.get('/transactions/', { params })

export const createTransaction = (data) =>
  api.post('/transactions/', data)

export const updateTransaction = (id, data) =>
  api.patch(`/transactions/${id}/`, data)

export const deleteTransaction = (id) =>
  api.delete(`/transactions/${id}/`)

// ── Dashboard
export const getDashboard = (params) =>
  api.get('/dashboard/', { params })

export default api
