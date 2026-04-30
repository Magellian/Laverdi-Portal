import { useState, useEffect } from 'react'

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size: number | null
  modified: number
  extension: string | null
}

interface FileBrowserProps {
  authToken: string // Supabase auth token for API calls
}

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getFileIcon(item: FileItem): string {
  if (item.type === 'directory') return '📁'
  const ext = item.extension || ''
  if (['.md', '.txt', '.log'].includes(ext)) return '📄'
  if (['.py', '.js', '.ts', '.tsx', '.jsx'].includes(ext)) return '💻'
  if (['.json', '.yaml', '.yml', '.toml'].includes(ext)) return '⚙️'
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext)) return '🖼️'
  if (['.zip', '.tar', '.gz'].includes(ext)) return '📦'
  return '📄'
}

export default function FileBrowser({ authToken }: FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState('/')
  const [items, setItems] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<{ content: string; filename: string } | null>(null)

  const headers = { 'Authorization': `Bearer ${authToken}` }

  async function loadDirectory(path: string) {
    setLoading(true)
    setError('')
    setPreview(null)

    try {
      const res = await fetch(`/api/files/browse?action=list&path=${encodeURIComponent(path)}`, { headers })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        if (res.status === 502 || errData.error?.includes('connect')) {
          // Container file server not running — show friendly message
          setItems([])
          setCurrentPath(path)
          setLoading(false)
          return
        }
        throw new Error(errData.error || `Failed to load: ${res.status}`)
      }
      const data = await res.json()
      setItems(data.items || [])
      setCurrentPath(path)
    } catch (err: any) {
      // Don't show error for expected cases (empty workspace, server starting up)
      console.log('[FileBrowser] Load error:', err.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  async function previewFile(path: string) {
    try {
      const res = await fetch(`/api/files/browse?action=preview&path=${encodeURIComponent(path)}`, { headers })
      const data = await res.json()
      if (data.preview) {
        setPreview({ content: data.content, filename: data.filename })
      }
    } catch (err) {
      console.error('Preview failed:', err)
    }
  }

  function downloadFile(path: string) {
    // For downloads, we need to pass auth via query param since window.open can't set headers
    window.open(`/api/files/browse?action=download&path=${encodeURIComponent(path)}&token=${authToken}`, '_blank')
  }

  function downloadFolder(path: string) {
    window.open(`/api/files/browse?action=zip&path=${encodeURIComponent(path)}&token=${authToken}`, '_blank')
  }

  function navigateUp() {
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    loadDirectory('/' + parts.join('/'))
  }

  useEffect(() => {
    loadDirectory('/')
  }, [authToken])

  const breadcrumbs = currentPath.split('/').filter(Boolean)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">📂 Workspace Files</h3>
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-gray-500 ml-4">
            <button onClick={() => loadDirectory('/')} className="hover:text-blue-600">/</button>
            {breadcrumbs.map((part, i) => (
              <span key={i}>
                <span className="mx-1">/</span>
                <button
                  onClick={() => loadDirectory('/' + breadcrumbs.slice(0, i + 1).join('/'))}
                  className="hover:text-blue-600"
                >
                  {part}
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {currentPath !== '/' && (
            <button
              onClick={navigateUp}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              ⬆ Up
            </button>
          )}
          <button
            onClick={() => downloadFolder(currentPath)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ⬇ Download All
          </button>
          <button
            onClick={() => loadDirectory(currentPath)}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="px-4 py-8 text-center text-gray-500">Loading...</div>
      )}

      {/* File List */}
      {!loading && items.length === 0 && !error && (
        <div className="px-4 py-8 text-center text-gray-400">
          Workspace is empty. Your AI agent will create files here as it works.
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <div
              key={item.path}
              className="px-4 py-2 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
            >
              <div
                className="flex items-center gap-3 flex-1 min-w-0"
                onClick={() => {
                  if (item.type === 'directory') {
                    loadDirectory(item.path)
                  } else {
                    previewFile(item.path)
                  }
                }}
              >
                <span className="text-lg">{getFileIcon(item)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.type === 'directory' ? 'Folder' : formatSize(item.size)}
                  </p>
                </div>
              </div>

              {item.type === 'file' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadFile(item.path)
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  title="Download"
                >
                  ⬇
                </button>
              )}
              {item.type === 'directory' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadFolder(item.path)
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  title="Download as ZIP"
                >
                  📦
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview Panel */}
      {preview && (
        <div className="border-t border-gray-200">
          <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">📄 {preview.filename}</span>
            <button
              onClick={() => setPreview(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <pre className="px-4 py-3 text-sm text-gray-800 bg-gray-50 overflow-x-auto max-h-96 overflow-y-auto font-mono">
            {preview.content}
          </pre>
        </div>
      )}
    </div>
  )
}
