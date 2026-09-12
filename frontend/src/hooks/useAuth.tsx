import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

interface User {
  id: string
  email: string
  name: string
  role: 'OWNER' | 'ACCOUNTANT'
}

interface Company {
  id: string
  name: string
  province: string
}

interface AuthContextType {
  user: User | null
  company: Company | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken')
    const storedUser = localStorage.getItem('user')
    const storedCompany = localStorage.getItem('company')

    if (storedToken && storedUser && storedCompany) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      setCompany(JSON.parse(storedCompany))
    }

    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password)
      const { user: userData, company: companyData, token: tokenData } = response as any

      setToken(tokenData)
      setUser(userData)
      setCompany(companyData)

      localStorage.setItem('authToken', tokenData)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('company', JSON.stringify(companyData))
    } catch (error) {
      throw error
    }
  }

  const register = async (data: any) => {
    try {
      const response = await authAPI.register(data)
      const { user: userData, company: companyData, token: tokenData } = response as any

      setToken(tokenData)
      setUser(userData)
      setCompany(companyData)

      localStorage.setItem('authToken', tokenData)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('company', JSON.stringify(companyData))
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setCompany(null)
    setToken(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    localStorage.removeItem('company')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
