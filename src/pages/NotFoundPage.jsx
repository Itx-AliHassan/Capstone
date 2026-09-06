import { Link } from 'react-router-dom'
export default function NotFoundPage(){return <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-[#090D16]"><div className="text-center"><div className="text-6xl mb-4 dark:text-white">404</div><p className="text-slate-500 mb-5">That page doesn’t exist.</p><Link to="/" className="primary inline-block">Go home</Link></div></div>}
