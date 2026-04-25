import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../../hooks/useSession.js'

export default function RequireAuth({ children }) {
  const { user, loading } = useSession()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
