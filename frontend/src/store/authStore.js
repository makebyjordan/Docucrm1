import { create } from 'zustand'
import api from '../api/client'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('crm_user') || 'null'),
  token: localStorage.getItem('crm_token'),
  loading: false,

  login: async (email, password) => {
    set({ loading: true })
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('crm_token', data.token)
    localStorage.setItem('crm_user', JSON.stringify(data.user))
    set({ user: data.user, token: data.token, loading: false })
    return data
  },

  logout: () => {
    localStorage.removeItem('crm_token')
    localStorage.removeItem('crm_user')
    set({ user: null, token: null })
  },
}))

export default useAuthStore
