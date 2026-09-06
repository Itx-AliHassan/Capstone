import { useState } from 'react'
import Modal from './Modal'
import { useWorkspace } from '../context/WorkspaceContext'
import { uploadToCloudinary } from '../services/cloudinary'
export default function TaskModal({ open, onClose, task }) {
  const { updateTask, deleteTask } = useWorkspace()
  const [uploading, setUploading] = useState(false)
  if (!task) return null
  const change = (key, value) => updateTask(task.id, { [key]: value })
  async function addFile(e) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try { const url = await uploadToCloudinary(file); change('attachments', [...(task.attachments||[]), { name:file.name, url, fileType:file.type }]) } finally { setUploading(false) }
  }
  const addSubtask = () => change('subtasks', [...(task.subtasks||[]), {id:crypto.randomUUID(),title:'New subtask',completed:false}])
  return <Modal open={open} onClose={onClose} title="Task details">
    <div className="space-y-4 text-slate-700 dark:text-slate-200">
      <input value={task.title} onChange={e=>change('title',e.target.value)} className="w-full text-xl font-semibold bg-transparent border-b border-slate-200 dark:border-slate-700 pb-2 outline-none" />
      <textarea value={task.description||''} onChange={e=>change('description',e.target.value)} rows="3" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent p-3" />
      <div className="grid sm:grid-cols-3 gap-3">
        <select value={task.status} onChange={e=>change('status',e.target.value)} className="rounded-xl border p-2 bg-transparent dark:border-slate-700"><option>Todo</option><option>In Progress</option><option>Review</option><option>Done</option></select>
        <select value={task.priority} onChange={e=>change('priority',e.target.value)} className="rounded-xl border p-2 bg-transparent dark:border-slate-700"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select>
        <input type="date" value={task.dueDate||''} onChange={e=>change('dueDate',e.target.value)} className="rounded-xl border p-2 bg-transparent dark:border-slate-700" />
      </div>
      <div><div className="flex justify-between mb-2"><h3 className="font-medium">Subtasks</h3><button onClick={addSubtask} className="text-blue-600 text-sm">+ Add</button></div>{(task.subtasks||[]).map((s,i)=><label key={s.id} className="flex gap-2 items-center py-1"><input type="checkbox" checked={s.completed} onChange={e=>change('subtasks',task.subtasks.map(x=>x.id===s.id?{...x,completed:e.target.checked}:x))}/><input value={s.title} onChange={e=>change('subtasks',task.subtasks.map(x=>x.id===s.id?{...x,title:e.target.value}:x))} className="bg-transparent flex-1 outline-none"/></label>)}</div>
      <div><h3 className="font-medium mb-2">Attachments</h3><input type="file" onChange={addFile}/>{uploading && <span className="text-sm text-slate-500 ml-2">Uploading…</span>}<div className="mt-2 space-y-1">{(task.attachments||[]).map(a=><a key={a.url} href={a.url} target="_blank" className="block text-blue-600 text-sm">{a.name}</a>)}</div></div>
      <div><h3 className="font-medium mb-2">Comments</h3><textarea placeholder="Write a comment… use @name to mention" className="w-full rounded-xl border p-3 bg-transparent dark:border-slate-700"/></div>
      <div className="flex justify-between pt-2"><button onClick={()=>{deleteTask(task.id);onClose()}} className="text-red-600">Delete task</button><button onClick={onClose} className="px-4 py-2 rounded-xl bg-blue-600 text-white">Done</button></div>
    </div>
  </Modal>
}
