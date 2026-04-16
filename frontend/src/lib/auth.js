import api from './api'

export async function login(email, password) {
  const { data } = await api.post('/auth/login/', { email, password })
  return data
}

export async function logout() {
  await api.post('/auth/logout/')
}

export async function register(payload) {
  const { data } = await api.post('/auth/register/', payload)
  return data
}

export async function getProfile() {
  const { data } = await api.get('/auth/profile/')
  return data
}

export async function updateProfile(payload) {
  const { data } = await api.patch('/auth/profile/', payload)
  return data
}
