import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicesAPI, clientsAPI } from '../services/api'

export default function InvoicesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    lines: [{ description: '', quantity: 1, unit_price_cents: 0 }],
  })

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesAPI.list(),
  })

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsAPI.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => invoicesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['kpis'] })
      setFormData({
        client_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        lines: [{ description: '', quantity: 1, unit_price_cents: 0 }],
      })
      setShowForm(false)
    },
  })

  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { description: '', quantity: 1, unit_price_cents: 0 }],
    })
  }

  const handleLineChange = (index: number, field: string, value: any) => {
    const newLines = [...formData.lines]
    newLines[index] = { ...newLines[index], [field]: value }
    setFormData({ ...formData, lines: newLines })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.client_id) {
      alert('Select a client')
      return
    }
    if (formData.lines.some((l) => !l.description || l.unit_price_cents <= 0)) {
      alert('Fill in all line items')
      return
    }
    createMutation.mutate(formData)
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(cents / 100)
  }

  const calculateTotal = () => {
    return formData.lines.reduce((sum, line) => sum + line.quantity * line.unit_price_cents, 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-main">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-700">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary btn-md"
          >
            {showForm ? 'Cancel' : '+ New Invoice'}
          </button>
        </div>

        {showForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Create Invoice</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Client *</label>
                  <select
                    className="form-input"
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    required
                  >
                    <option value="">Select a client</option>
                    {clients?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Issue Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Line Items</h3>
                <div className="space-y-4">
                  {formData.lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Description"
                        className="col-span-5 form-input"
                        value={line.description}
                        onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        className="col-span-2 form-input"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value))}
                      />
                      <input
                        type="number"
                        placeholder="Unit Price"
                        className="col-span-3 form-input"
                        value={line.unit_price_cents / 100}
                        onChange={(e) =>
                          handleLineChange(index, 'unit_price_cents', e.target.value ? parseFloat(e.target.value) * 100 : 0)
                        }
                        step="0.01"
                      />
                      <div className="col-span-2 flex items-center justify-end text-sm">
                        {formatCurrency(line.quantity * line.unit_price_cents)}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddLine}
                  className="btn-secondary btn-sm mt-4"
                >
                  + Add Line
                </button>
              </div>

              <div className="border-t pt-4 text-right">
                <div className="text-lg font-bold">
                  Total: {formatCurrency(calculateTotal())}
                </div>
                <p className="text-sm text-gray-600 mt-1">GST/HST calculated automatically</p>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-2"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
              </button>
            </form>
          </div>
        )}

        {invoicesLoading ? (
          <div className="text-center py-8">
            <div className="spinner mx-auto"></div>
          </div>
        ) : invoices && invoices.length > 0 ? (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Invoice #</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Client</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Paid</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice: any) => (
                    <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{invoice.invoice_number}</td>
                      <td className="px-6 py-4 text-gray-600">{invoice.client.name}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(invoice.issue_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium">{formatCurrency(invoice.total_cents)}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatCurrency(invoice.amount_paid_cents)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge badge-${invoice.status.toLowerCase()}`}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-500 mb-4">No invoices yet. Create your first invoice to get started.</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary btn-md"
            >
              Create First Invoice
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
