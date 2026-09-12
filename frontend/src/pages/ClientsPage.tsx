import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function ClientsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', billing_address: '' })

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => clientsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setFormData({ name: '', email: '', phone: '', billing_address: '' })
      setShowForm(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Client name is required')
      return
    }
    createMutation.mutate(formData)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      await clientsAPI.delete(id)
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-main">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-700">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary btn-md"
          >
            {showForm ? 'Cancel' : '+ New Client'}
          </button>
        </div>

        {showForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Add New Client</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Client Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Billing Address</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-2"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Client'}
              </button>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="spinner mx-auto"></div>
          </div>
        ) : clients && clients.length > 0 ? (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client: any) => (
                    <tr key={client.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                      <td className="px-6 py-4 text-gray-600">{client.email || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{client.phone || '-'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-500 mb-4">No clients yet. Create your first client to get started.</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary btn-md"
            >
              Create First Client
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
