import { useWorkspace } from '../context/WorkspaceContext'
const rank = { viewer:0, member:1, admin:2, owner:3 }
export function usePermission() {
  const { workspace } = useWorkspace()
  const role = workspace?.role || 'viewer'
  const can = required => rank[role] >= rank[required]
  return { role, can, canEdit: can('member'), canAdmin: can('admin'), isOwner: role === 'owner' }
}
