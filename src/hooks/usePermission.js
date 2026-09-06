import {useWorkspace} from '../context/WorkspaceContext'
const rank={viewer:0,member:1,admin:2,owner:3}
export function usePermission(){const {activeWorkspace}=useWorkspace();const role=activeWorkspace?.members?.find(m=>m.id==='demo')?.role||'viewer';const can=r=>rank[role]>=rank[r];return{role,can,canEdit:can('member'),canAdmin:can('admin'),isOwner:role==='owner',canDelete:can('owner')}}
