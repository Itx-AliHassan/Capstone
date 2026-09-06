import { Bell, Moon, Search, Sun } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useWorkspace } from '../context/WorkspaceContext'
export default function Topbar(){
 const {theme,toggleTheme}=useTheme(); const {notifications,setNotifications}=useWorkspace(); const [open,setOpen]=useState(false)
 const unread=notifications.filter(n=>!n.read).length
 return <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-30">
  <div className="flex-1 max-w-xl relative"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input placeholder="Search tasks, projects, workspaces…" className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-slate-300 dark:focus:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm outline-none text-slate-900 dark:text-white"/></div>
  <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500">{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button>
  <div className="relative"><button onClick={()=>setOpen(!open)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 relative"><Bell size={18}/>{unread>0&&<span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] rounded-full px-1.5">{unread}</span>}</button>{open&&<div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden"><div className="p-3 flex justify-between border-b dark:border-slate-800"><span className="font-medium dark:text-white">Notifications</span><button className="text-xs text-blue-600" onClick={()=>setNotifications(n=>n.map(x=>({...x,read:true})))}>Mark all read</button></div>{notifications.map(n=><div key={n.id} className={`p-3 text-sm border-b dark:border-slate-800 ${n.read?'text-slate-400':'text-slate-700 dark:text-slate-200'}`}>{n.text}</div>)}</div>}</div>
 </header>
}
