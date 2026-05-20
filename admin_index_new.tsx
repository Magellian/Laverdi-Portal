'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, RefreshCw, Lock, LogOut, Copy, Trash2, AlertCircle, CheckCircle } from 'lucide-react'

interface User {
  id: string
  email: string
  status?: string
  created_at: string
  instance_count?: number
  instance_ips?: string[]
}

interface Instance {
  id: string
  container_id: string
  user_id: string
  user_email: string
  ip_address: string | null
  status: string
  port: number
  created_at: string
}

interface Toast {
  type: 'success' | 'error' | 'info'
  message: string
  id: string
}

function Toast({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700'
  }[toast.type]

  return (
    <div className={`border ${bgColor} px-4 py-3 rounded flex items-center gap-2`}>
      {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
      {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
      {toast.message}
    </div>
  )
}

function LoginForm({ onLogin, error }: { onLogin: (password: string) => void; error?: string }) {
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin(password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-slate-600" />
          <h1 className="text-2xl font-bold text-slate-900 ml-3">Admin Login</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Admin Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent text-slate-900 bg-white"
              placeholder="Enter admin password"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium hover:bg-slate-800 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [users, setUsers] = useState<User[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; email: string; confirmText: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'instances'>('users')

  const getToken = () => sessionStorage.getItem('admin-token') || ''

  const addToast = (type: Toast['type'], message: string) => {
    const id = Math.random().toString(36)
    setToasts(prev => [...prev, { type, message, id }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getToken()

      // Fetch users
      const usersRes = await fetch('/api/admin/clients', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!usersRes.ok) throw new Error('Failed to load users')
      const usersData = await usersRes.json()

      // Fetch instances
      const instRes = await fetch('/api/admin/instances', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!instRes.ok) throw new Error('Failed to load instances')
      const instData = await instRes.json()

      setUsers(usersData)
      setInstances(instData.instances || [])
    } catch (err: any) {
      setError(err.message)
      addToast('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async () => {
    if (!deleteConfirm) return

    const expectedText = `DELETE ${deleteConfirm.email}`
    if (deleteConfirm.confirmText !== expectedText) {
      addToast('error', `Please type exactly: ${expectedText}`)
      return
    }

    setDeleting(true)
    try {
      const token = getToken()
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: deleteConfirm.userId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error)
      }

      const result = await response.json()
      addToast('success', `User ${deleteConfirm.email} deleted successfully`)
      setDeleteConfirm(null)
      await loadData()
    } catch (err: any) {
      addToast('error', `Delete failed: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addToast('info', 'Copied to clipboard')
  }

  if (!getToken()) {
    return <LoginForm onLogin={(password) => {
      sessionStorage.setItem('admin-token', password)
      loadData()
    }} />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 max-w-7xl mx-auto px-4 border-t border-slate-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'users'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('instances')}
            className={`px-4 py-3 font-medium border-b-2 transition ${
              activeTab === 'instances'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            Instances ({instances.length})
          </button>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 w-96">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">User ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Instance IPs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />
                        Loading...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No users found</td>
                    </tr>
                  ) : (
                    users.map(user => {
                      const userInstances = instances.filter(i => i.user_id === user.id)
                      const ips = userInstances.map(i => i.ip_address || 'PENDING').join(', ')
                      
                      return (
                        <tr key={user.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                                {user.id.substring(0, 8)}...
                              </code>
                              <button
                                onClick={() => copyToClipboard(user.id)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-900 font-medium">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {user.status || 'ready'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">{ips || '—'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setDeleteConfirm({ userId: user.id, email: user.email, confirmText: '' })}
                              className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Instances Tab */}
        {activeTab === 'instances' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Instance ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Owner Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin inline mr-2" />
                        Loading...
                      </td>
                    </tr>
                  ) : instances.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No instances found</td>
                    </tr>
                  ) : (
                    instances.map(inst => (
                      <tr key={inst.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                              {inst.container_id.substring(0, 8)}...
                            </code>
                            <button
                              onClick={() => copyToClipboard(inst.container_id)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-900">{inst.user_email}</td>
                        <td className="px-6 py-4 font-mono text-sm">{inst.ip_address || 'PENDING'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            inst.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {inst.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(inst.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Delete User</h2>
            
            <p className="text-slate-600 mb-4">
              This will permanently delete <strong>{deleteConfirm.email}</strong> and all associated instances.
            </p>

            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                To confirm, type: <strong>DELETE {deleteConfirm.email}</strong>
              </p>
            </div>

            <input
              type="text"
              placeholder={`DELETE ${deleteConfirm.email}`}
              value={deleteConfirm.confirmText}
              onChange={(e) => setDeleteConfirm({ ...deleteConfirm, confirmText: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900 bg-white mb-4"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || deleteConfirm.confirmText !== `DELETE ${deleteConfirm.email}`}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && <RefreshCw className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(!!sessionStorage.getItem('admin-token'))
  }, [])

  return (
    <>
      {isLoggedIn ? (
        <AdminDashboard onLogout={() => {
          sessionStorage.removeItem('admin-token')
          setIsLoggedIn(false)
        }} />
      ) : (
        <LoginForm onLogin={(password) => {
          sessionStorage.setItem('admin-token', password)
          setIsLoggedIn(true)
        }} error={undefined} />
      )}
    </>
  )
}
