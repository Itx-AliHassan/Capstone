import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePermission } from '../hooks/usePermission'

export default function ProtectedRoute({ children, minRole }) {
  const { user, loading, authError } = useAuth()
  const { can } = usePermission()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-[#090D16] p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="font-medium text-slate-900 dark:text-white">Loading Workspace Manager…</p>
          <p className="mt-1 text-sm text-slate-500">Connecting to authentication</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location, authError }} replace />
  }

  if (minRole && !can(minRole)) return <Navigate to="/unauthorized" replace />

  return children
}
