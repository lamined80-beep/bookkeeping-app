import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { accountingAPI } from '../services/api'

export default function DashboardPage() {
  const { user, company, logout } = useAuth()
  const navigate = useNavigate()

  // Fetch KPIs
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['kpis'],
    queryFn: () => accountingAPI.dashboardKPIs(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(cents / 100)
  }

  const kpiData = isLoading
    ? null
    : [
        {
          label: 'Total Income',
          value: formatCurrency(kpis?.total_income_cents || 0),
          color: 'text-green-600',
        },
        {
          label: 'Total Expenses',
          value: formatCurrency(kpis?.total_expenses_cents || 0),
          color: 'text-red-600',
        },
        {
          label: 'Net Profit',
          value: formatCurrency(kpis?.net_profit_cents || 0),
          color: kpis?.net_profit_cents! >= 0 ? 'text-green-600' : 'text-red-600',
        },
        {
          label: 'Cash Balance',
          value: formatCurrency(kpis?.cash_balance_cents || 0),
          color: 'text-blue-600',
        },
      ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container-main flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📊 Bookkeeping</h1>
            <p className="text-gray-600 text-sm">{company?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium text-gray-900 text-sm">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary btn-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-main">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
          {kpiData ? (
            kpiData.map((kpi) => (
              <div key={kpi.label} className="card p-6 hover:shadow-lg transition">
                <p className="text-sm text-gray-600 mb-2">{kpi.label}</p>
                <p className={`text-3xl font-bold ${kpi.color} mb-2`}>{kpi.value}</p>
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-8">
              <div className="spinner mx-auto"></div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[
            { icon: '📄', label: 'New Invoice', to: '/invoices' },
            { icon: '👥', label: 'Add Client', to: '/clients' },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="card p-6 text-center hover:shadow-lg transition cursor-pointer"
            >
              <div className="text-4xl mb-3">{action.icon}</div>
              <p className="font-medium text-gray-900">{action.label}</p>
            </Link>
          ))}
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link to="/invoices" className="card p-6 hover:border-blue-400 transition">
            <h3 className="font-semibold text-lg mb-2">Invoices</h3>
            <p className="text-gray-600 text-sm mb-4">Create, send, and track invoices</p>
            <span className="text-blue-600 text-sm font-medium">View all →</span>
          </Link>

          <Link to="/clients" className="card p-6 hover:border-blue-400 transition">
            <h3 className="font-semibold text-lg mb-2">Clients</h3>
            <p className="text-gray-600 text-sm mb-4">Manage your client list</p>
            <span className="text-blue-600 text-sm font-medium">View all →</span>
          </Link>
        </div>

        {/* A/R & A/P Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Accounts Receivable</h3>
            <p className="text-3xl font-bold text-orange-600">
              {formatCurrency(kpis?.accounts_receivable_cents || 0)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {kpis?.unpaid_invoices || 0} unpaid invoices
            </p>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-lg mb-4">Accounts Payable</h3>
            <p className="text-3xl font-bold text-orange-600">
              {formatCurrency(kpis?.accounts_payable_cents || 0)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {kpis?.unpaid_bills || 0} unpaid bills
            </p>
          </div>
        </div>

        {/* Getting Started */}
        <div className="card p-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Add Clients', desc: 'Start by creating client records' },
              { step: '2', title: 'Create Invoices', desc: 'Generate and send invoices to clients' },
              { step: '3', title: 'Track Payments', desc: 'Record payments and monitor cash flow' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 mb-2">{item.step}</div>
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
