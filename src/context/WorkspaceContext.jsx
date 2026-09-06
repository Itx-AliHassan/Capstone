import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { demoTasks } from '../data/demo'
const WorkspaceContext = createContext(null)
const defaultWorkspace = { id:'demo-workspace', name:'Hackathon HQ', color:'#2563EB', role:'owner', members:[{id:'demo',name:'Demo User',email:'demo@example.com',role:'owner'},{id:'maya',name:'Maya Chen',email:'maya@example.com',role:'admin'},{id:'omar',name:'Omar Khan',email:'omar@example.com',role:'member'}] }
const defaultProject = { id:'launch', name:'Launch Sprint', description:'Ship the capstone workspace manager.', color:'#2563EB', columns:['Todo','In Progress','Review','Done'] }

export function WorkspaceProvider({ children }) {
  const [workspace, setWorkspace] = useState(() => JSON.parse(localStorage.getItem('wm-workspace') || 'null') || defaultWorkspace)
  const [project, setProject] = useState(() => JSON.parse(localStorage.getItem('wm-project') || 'null') || defaultProject)
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('wm-tasks') || 'null') || demoTasks)
  const [notifications, setNotifications] = useState([{id:'n1',text:'You were assigned “Wire Firebase auth”',read:false},{id:'n2',text:'Task “README for judges” is due today',read:false}])
  useEffect(() => localStorage.setItem('wm-workspace', JSON.stringify(workspace)), [workspace])
  useEffect(() => localStorage.setItem('wm-project', JSON.stringify(project)), [project])
  useEffect(() => localStorage.setItem('wm-tasks', JSON.stringify(tasks)), [tasks])
  const addTask = task => setTasks(t => [...t, { ...task, id: crypto.randomUUID(), subtasks: task.subtasks || [] }])
  const updateTask = (id, patch) => setTasks(t => t.map(x => x.id === id ? { ...x, ...patch } : x))
  const deleteTask = id => setTasks(t => t.filter(x => x.id !== id))
  const value = useMemo(() => ({ workspace,setWorkspace,project,setProject,tasks,setTasks,addTask,updateTask,deleteTask,notifications,setNotifications }), [workspace,project,tasks,notifications])
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
export const useWorkspace = () => useContext(WorkspaceContext)
