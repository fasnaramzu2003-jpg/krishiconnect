
import { createContext, useContext, useState } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)

function readSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('krishi_user'))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser)

  function saveSession(data) {
    localStorage.setItem('krishi_token', data.token)
    localStorage.setItem('krishi_user', JSON.stringify(data.user))
    setUser(data.user)
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login/', { email, password })
    saveSession(data)
    return data.user
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register/', payload)
    saveSession(data)
    return data.user
  }

  async function logout() {
    try {
      await api.post('/auth/logout/')
    } catch {
      // the token may already be invalid, we still log out here
    }
    localStorage.removeItem('krishi_token')
    localStorage.removeItem('krishi_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
