'use client'

import { useState, useRef, useCallback } from 'react'

type Priority = 'low' | 'medium' | 'high' | 'urgent'

type Task = {
  id: string
  title: string
  description?: string
  priority: Priority
  labels: string[]
  assignee?: string
}

type Column = {
  id: string
  title: string
  color: string
  tasks: Task[]
}

const INITIAL_COLUMNS: Column[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    color: 'bg-zinc-500',
    tasks: [
      { id: '1', title: 'Research competitor features', priority: 'low', labels: ['research'], description: 'Analyze top 5 competitors and document gaps' },
      { id: '2', title: 'Design token system', priority: 'medium', labels: ['design'], description: 'Create unified design tokens for spacing and color' },
    ],
  },
  {
    id: 'todo',
    title: 'To Do',
    color: 'bg-blue-500',
    tasks: [
      { id: '3', title: 'Set up CI/CD pipeline', priority: 'high', labels: ['devops'] },
      { id: '4', title: 'Write API documentation', priority: 'medium', labels: ['docs'] },
      { id: '5', title: 'Implement email notifications', priority: 'low', labels: ['feature'] },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: 'bg-amber-500',
    tasks: [
      { id: '6', title: 'Kanban board UI', priority: 'high', labels: ['ui', 'feature'], assignee: 'CR', description: 'Drag-and-drop project board for dashboard' },
      { id: '7', title: 'Auth integration tests', priority: 'urgent', labels: ['testing'], assignee: 'CR' },
    ],
  },
  {
    id: 'review',
    title: 'In Review',
    color: 'bg-purple-500',
    tasks: [
      { id: '8', title: 'Stripe payment flow', priority: 'urgent', labels: ['payments'], assignee: 'CR', description: 'Checkout session and webhook handling' },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    color: 'bg-green-500',
    tasks: [
      { id: '9', title: 'NextAuth setup', priority: 'high', labels: ['auth'], assignee: 'CR' },
      { id: '10', title: 'Database schema', priority: 'high', labels: ['backend'], assignee: 'CR' },
    ],
  },
]

const PRIORITY: Record<Priority, { label: string; dot: string; text: string }> = {
  low:    { label: 'Low',    dot: 'bg-zinc-500',  text: 'text-zinc-400'  },
  medium: { label: 'Medium', dot: 'bg-blue-500',  text: 'text-blue-400'  },
  high:   { label: 'High',   dot: 'bg-amber-500', text: 'text-amber-400' },
  urgent: { label: 'Urgent', dot: 'bg-red-500',   text: 'text-red-400'   },
}

const LABEL_STYLE: Record<string, string> = {
  research: 'bg-purple-900/60 text-purple-300 border-purple-800/60',
  design:   'bg-pink-900/60 text-pink-300 border-pink-800/60',
  devops:   'bg-orange-900/60 text-orange-300 border-orange-800/60',
  docs:     'bg-sky-900/60 text-sky-300 border-sky-800/60',
  ui:       'bg-indigo-900/60 text-indigo-300 border-indigo-800/60',
  feature:  'bg-teal-900/60 text-teal-300 border-teal-800/60',
  testing:  'bg-yellow-900/60 text-yellow-300 border-yellow-800/60',
  payments: 'bg-green-900/60 text-green-300 border-green-800/60',
  auth:     'bg-red-900/60 text-red-300 border-red-800/60',
  backend:  'bg-zinc-800 text-zinc-300 border-zinc-700',
}

function labelStyle(label: string) {
  return LABEL_STYLE[label] ?? 'bg-zinc-800 text-zinc-300 border-zinc-700'
}

let nextId = 100

type AddTaskFormProps = {
  onAdd: (title: string, priority: Priority) => void
  onCancel: () => void
}

function AddTaskForm({ onAdd, onCancel }: AddTaskFormProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onAdd(trimmed, priority)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 rounded-lg bg-zinc-800 border border-zinc-700 p-3 space-y-2">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Task title…"
        className="w-full rounded bg-zinc-900 border border-zinc-700 px-2.5 py-1.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
      />
      <div className="flex items-center gap-2">
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as Priority)}
          className="flex-1 rounded bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-zinc-500"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded bg-white px-3 py-1.5 text-xs font-medium text-black transition hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-3 py-1.5 text-xs text-zinc-400 transition hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

type TaskCardProps = {
  task: Task
  onDragStart: (e: React.DragEvent, taskId: string) => void
  isDragging: boolean
}

function TaskCard({ task, onDragStart, isDragging }: TaskCardProps) {
  const p = PRIORITY[task.priority]

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, task.id)}
      className={[
        'group rounded-lg bg-zinc-900 border border-zinc-800 p-3 cursor-grab active:cursor-grabbing',
        'transition-all duration-150 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/40',
        isDragging ? 'opacity-40 scale-95' : 'opacity-100',
      ].join(' ')}
    >
      {task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.labels.map(l => (
            <span
              key={l}
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border ${labelStyle(l)}`}
            >
              {l}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm font-medium text-white leading-snug">{task.title}</p>

      {task.description && (
        <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{task.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
          <span className={`text-[10px] font-medium ${p.text}`}>{p.label}</span>
        </div>
        {task.assignee && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-bold text-zinc-300">
            {task.assignee}
          </span>
        )}
      </div>
    </div>
  )
}

type KanbanColumnProps = {
  column: Column
  draggingTaskId: string | null
  dragOverColumnId: string | null
  onDragStart: (e: React.DragEvent, taskId: string) => void
  onDragOver: (e: React.DragEvent, columnId: string) => void
  onDrop: (e: React.DragEvent, columnId: string) => void
  onDragEnd: () => void
  onAddTask: (columnId: string, title: string, priority: Priority) => void
}

function KanbanColumn({
  column,
  draggingTaskId,
  dragOverColumnId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onAddTask,
}: KanbanColumnProps) {
  const [adding, setAdding] = useState(false)
  const isOver = dragOverColumnId === column.id

  return (
    <div className="flex w-72 flex-none flex-col">
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${column.color}`} />
          <h2 className="text-sm font-semibold text-white">{column.title}</h2>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
            {column.tasks.length}
          </span>
        </div>
        <button
          onClick={() => setAdding(true)}
          title="Add task"
          className="rounded p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => onDragOver(e, column.id)}
        onDrop={e => onDrop(e, column.id)}
        onDragEnd={onDragEnd}
        className={[
          'flex-1 rounded-xl p-2 transition-colors duration-150 min-h-20',
          isOver
            ? 'bg-zinc-800/70 ring-1 ring-zinc-600'
            : 'bg-zinc-900/40',
        ].join(' ')}
      >
        <div className="space-y-2">
          {column.tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onDragStart={onDragStart}
              isDragging={draggingTaskId === task.id}
            />
          ))}
        </div>

        {isOver && draggingTaskId && (
          <div className="mt-2 h-1 rounded-full bg-zinc-600/50" />
        )}
      </div>

      {adding && (
        <AddTaskForm
          onAdd={(title, priority) => {
            onAddTask(column.id, title, priority)
            setAdding(false)
          }}
          onCancel={() => setAdding(false)}
        />
      )}

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-300"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add task
        </button>
      )}
    </div>
  )
}

export default function BoardPage() {
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)
  const sourceColumnId = useRef<string | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDraggingTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
    // Find which column owns this task
    for (const col of columns) {
      if (col.tasks.some(t => t.id === taskId)) {
        sourceColumnId.current = col.id
        break
      }
    }
  }, [columns])

  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumnId(columnId)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    const taskId = draggingTaskId
    const srcId = sourceColumnId.current
    if (!taskId || !srcId || srcId === targetColumnId) {
      setDraggingTaskId(null)
      setDragOverColumnId(null)
      return
    }

    setColumns(prev => {
      const next = prev.map(col => ({ ...col, tasks: [...col.tasks] }))
      const src = next.find(c => c.id === srcId)!
      const dst = next.find(c => c.id === targetColumnId)!
      const taskIndex = src.tasks.findIndex(t => t.id === taskId)
      if (taskIndex === -1) return prev
      const [task] = src.tasks.splice(taskIndex, 1)
      dst.tasks.push(task)
      return next
    })

    setDraggingTaskId(null)
    setDragOverColumnId(null)
    sourceColumnId.current = null
  }, [draggingTaskId])

  const handleDragEnd = useCallback(() => {
    setDraggingTaskId(null)
    setDragOverColumnId(null)
    sourceColumnId.current = null
  }, [])

  const handleAddTask = useCallback((columnId: string, title: string, priority: Priority) => {
    const id = String(nextId++)
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId
          ? { ...col, tasks: [...col.tasks, { id, title, priority, labels: [] }] }
          : col
      )
    )
  }, [])

  const totalTasks = columns.reduce((n, c) => n + c.tasks.length, 0)
  const doneTasks = columns.find(c => c.id === 'done')?.tasks.length ?? 0

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="flex-none border-b border-zinc-800/60 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Board</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {doneTasks} of {totalTasks} tasks completed
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Progress bar */}
            <div className="flex items-center gap-2.5">
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: totalTasks ? `${(doneTasks / totalTasks) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-xs text-zinc-500">
                {totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-8 h-full items-start">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              draggingTaskId={draggingTaskId}
              dragOverColumnId={dragOverColumnId}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onAddTask={handleAddTask}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
