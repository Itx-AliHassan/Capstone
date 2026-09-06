import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'
export default function ProtectedRoute({ children, minRole }) {
  const { user, loading } = useAuth()
  const { can } = usePermission()
  if (loading) return <div className="min-h-screen grid place-items-center text-slate-500">Loading workspace…</div>
  if (!user) return <Navigate to="/login" replace />
  if (minRole && !can(minRole)) return <Navigate to="/unauthorized" replace />
  return children
}
