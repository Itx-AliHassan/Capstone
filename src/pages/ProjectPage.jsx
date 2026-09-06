import { useMemo, useState } from 'react'
import { CalendarDays, Columns3, GripVertical, List, Plus, Search } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { usePermission } from '../hooks/usePermission'
import TaskModal from '../components/TaskModal'

export default function ProjectPage() {
  const { project, setTasks, addTask, tasks } = useWorkspace()
  const { canEdit } = usePermission()
  const [view, setView] = useState(() => localStorage.getItem('wm-project-view') || 'kanban')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return tasks
    return tasks.filter((task) =>
      `${task.title} ${task.description || ''} ${(task.labels || []).join(' ')}`
        .toLowerCase()
        .includes(term),
    )
  }, [tasks, query])

  function switchView(nextView) {
    setView(nextView)
    localStorage.setItem('wm-project-view', nextView)
  }

  function createTask() {
    addTask({
      title: 'Untitled task',
      description: '',
      status: project.columns[0] || 'Todo',
      priority: 'Medium',
      dueDate: '',
      assigneeId: 'demo',
      labels: [],
    })
  }

  function moveTask(taskId, status) {
    if (!canEdit) return
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status } : task)))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Project</p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{project.name}</h1>
          <p className="text-sm text-slate-500 mt-1">{project.description}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            ['kanban', Columns3, 'Kanban'],
            ['list', List, 'List'],
            ['calendar', CalendarDays, 'Calendar'],
          ].map(([value, Icon, label]) => (
            <button
              key={value}
              onClick={() => switchView(value)}
              title={label}
              className={`p-2.5 rounded-xl border ${
                view === value
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500'
              }`}
            >
              <Icon size={17} />
            </button>
          ))}

          {canEdit && (
            <button onClick={createTask} className="primary flex items-center gap-2">
              <Plus size={16} /> Task
            </button>
          )}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tasks…"
          className="field pl-9"
        />
      </div>

      {view === 'kanban' && (
        <KanbanBoard
          columns={project.columns}
          tasks={visible}
          canEdit={canEdit}
          onMove={moveTask}
          onOpen={setSelected}
        />
      )}
      {view === 'list' && <ListView tasks={visible} onOpen={setSelected} />}
      {view === 'calendar' && <CalendarView tasks={visible} onOpen={setSelected} />}

      <TaskModal
        open={Boolean(selected)}
        task={selected ? tasks.find((task) => task.id === selected.id) : null}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

function KanbanBoard({ columns, tasks, canEdit, onMove, onOpen }) {
  function handleDragStart(event, taskId) {
    if (!canEdit) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', taskId)
  }

  function handleDrop(event, column) {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain')
    if (taskId) onMove(taskId, column)
  }

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column)
        return (
          <div
            key={column}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, column)}
            className="card p-3 min-h-48"
          >
            <div className="flex justify-between px-1 pb-3">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{column}</span>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full px-2 py-1">
                {columnTasks.length}
              </span>
            </div>

            {columnTasks.map((task) => (
              <div
                key={task.id}
                draggable={canEdit}
                onDragStart={(event) => handleDragStart(event, task.id)}
                onClick={() => onOpen(task)}
                className={`p-3 mb-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:shadow-sm ${
                  canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-start gap-2">
                  {canEdit && <GripVertical size={16} className="mt-0.5 shrink-0 text-slate-400" />}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-slate-900 dark:text-white">{task.title}</div>
                    <div className="flex justify-between mt-3 text-xs text-slate-500">
                      <span>{task.priority}</span>
                      <span>{task.dueDate || 'No date'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {columnTasks.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">Drop tasks here</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ListView({ tasks, onOpen }) {
  return (
    <div className="card overflow-hidden overflow-x-auto">
      <div className="min-w-[650px]">
        <div className="grid grid-cols-[1fr_140px_120px_130px] p-3 text-xs uppercase tracking-wide text-slate-400 border-b dark:border-slate-800">
          <span>Task</span><span>Status</span><span>Priority</span><span>Due</span>
        </div>
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onOpen(task)}
            className="w-full grid grid-cols-[1fr_140px_120px_130px] p-3 text-left border-b last:border-0 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <span className="font-medium text-slate-900 dark:text-white">{task.title}</span>
            <span className="text-sm text-slate-500">{task.status}</span>
            <span className="text-sm text-slate-500">{task.priority}</span>
            <span className="text-sm text-slate-500">{task.dueDate || '—'}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function CalendarView({ tasks, onOpen }) {
  const days = Array.from({ length: 31 }, (_, index) => index + 1)

  return (
    <div className="card p-3">
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {days.map((day) => (
          <div key={day} className="min-h-28 bg-white dark:bg-slate-900 p-2">
            <div className="text-xs text-slate-400 mb-2">{day}</div>
            {tasks
              .filter((task) => Number((task.dueDate || '').slice(-2)) === day)
              .map((task) => (
                <button
                  key={task.id}
                  onClick={() => onOpen(task)}
                  className="text-left w-full text-xs rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 p-2 mb-1"
                >
                  {task.title}
                </button>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
