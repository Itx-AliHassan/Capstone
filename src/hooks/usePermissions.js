import { useSelector } from 'react-redux';

export const usePermissions = () => {
  const { user } = useSelector((state) => state.auth);
  const { currentWorkspace } = useSelector((state) => state.workspaces);

  if (!user || !currentWorkspace) {
    return {
      role: 'viewer',
      isOwner: false,
      isAdmin: false,
      isMember: false,
      isViewer: true,
      canEditTasks: false,
      canManageProjects: false,
      canManageMembers: false,
      canDeleteWorkspace: false,
    };
  }

  const userId = user._id.toString();
  const ownerId = (currentWorkspace.owner?._id || currentWorkspace.owner)?.toString();

  const isOwner = ownerId === userId;
  const memberRecord = currentWorkspace.members?.find(
    (m) => (m.user?._id || m.user)?.toString() === userId
  );

  const role = isOwner ? 'owner' : memberRecord?.role || 'viewer';

  const isAdmin = role === 'admin' || isOwner;
  const isMember = role === 'member' || isAdmin;
  const isViewer = role === 'viewer';

  return {
    role,
    isOwner,
    isAdmin,
    isMember,
    isViewer,
    canEditTasks: isMember,
    canManageProjects: isAdmin,
    canManageMembers: isAdmin,
    canDeleteWorkspace: isOwner,
  };
};

export default usePermissions;
