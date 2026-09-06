import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
export default function AppLayout(){return <div className="min-h-screen flex bg-slate-50 dark:bg-[#090D16]"><Sidebar/><div className="flex-1 min-w-0"><Topbar/><main className="p-4 lg:p-6"><Outlet/></main></div></div>}
