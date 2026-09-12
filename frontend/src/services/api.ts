import axios, { AxiosInstance, AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data)
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data as T
  }

  async get<T>(url: string): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url)
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data as T
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data)
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data as T
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url)
    if (!response.data.success) {
      throw new Error(response.data.error || 'Request failed')
    }
    return response.data.data as T
  }
}

export const apiClient = new ApiClient()

// Auth API
export const authAPI = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  verify: () => apiClient.post('/auth/verify'),
  logout: () => apiClient.post('/auth/logout'),
}

// Company API
export const companyAPI = {
  get: () => apiClient.get('/company'),
  update: (data: any) => apiClient.put('/company', data),
}

// Clients API
export const clientsAPI = {
  list: () => apiClient.get('/clients'),
  get: (id: string) => apiClient.get(`/clients/${id}`),
  create: (data: any) => apiClient.post('/clients', data),
  update: (id: string, data: any) => apiClient.put(`/clients/${id}`, data),
  delete: (id: string) => apiClient.delete(`/clients/${id}`),
}

// Invoices API
export const invoicesAPI = {
  list: () => apiClient.get('/invoices'),
  get: (id: string) => apiClient.get(`/invoices/${id}`),
  create: (data: any) => apiClient.post('/invoices', data),
  recordPayment: (id: string, data: any) => apiClient.post(`/invoices/${id}/payments`, data),
}

// Expenses API
export const expensesAPI = {
  list: () => apiClient.get('/expenses'),
  categories: () => apiClient.get('/expenses/categories'),
  create: (data: any) => apiClient.post('/expenses', data),
}

// Estimates API
export const estimatesAPI = {
  list: () => apiClient.get('/estimates'),
  get: (id: string) => apiClient.get(`/estimates/${id}`),
  create: (data: any) => apiClient.post('/estimates', data),
}

// Accounting API
export const accountingAPI = {
  trialBalance: (params?: any) => apiClient.get(`/accounting/trial-balance${params ? '?' + new URLSearchParams(params) : ''}`),
  ledger: (accountId: string) => apiClient.get(`/accounting/ledger/${accountId}`),
  profitLoss: (params?: any) => apiClient.get(`/accounting/reports/profit-loss${params ? '?' + new URLSearchParams(params) : ''}`),
  dashboardKPIs: () => apiClient.get('/accounting/dashboard/kpis'),
}
