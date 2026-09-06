import { Activity, Home, Settings, UserRound, FolderKanban, LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useWorkspace } from '../context/WorkspaceContext'
import { useAuth } from '../context/AuthContext'
const items=[['/','Home',Home],['/workspace/demo-workspace/project/launch','Launch Sprint',FolderKanban],['/activity','Activity',Activity],['/workspace/settings','Workspace settings',Settings],['/profile','Profile',UserRound]]
export default function Sidebar() {
 const { workspace }=useWorkspace(); const { logout }=useAuth()
 return <aside className="hidden md:flex w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex-col p-3">
  <div className="p-3 mb-3"><div className="text-xs text-slate-400 uppercase tracking-wider">Workspace</div><div className="font-semibold text-slate-900 dark:text-white mt-1">{workspace.name}</div></div>
  <nav className="space-y-1 flex-1">{items.map(([to,label,Icon])=><NavLink key={to} to={to} className={({isActive})=>`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${isActive?'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white':'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}><Icon size={17}/>{label}</NavLink>)}</nav>
  <button onClick={logout} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:text-red-600"><LogOut size={17}/>Sign out</button>
 </aside>
}
