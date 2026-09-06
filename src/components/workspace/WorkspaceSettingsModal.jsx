import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
} from '../../features/workspaces/workspaceSlice';
import { closeModal } from '../../features/ui/uiSlice';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { Avatar, Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/CommonStates';
import usePermissions from '../../hooks/usePermissions';
import toast from 'react-hot-toast';

export const WorkspaceSettingsModal = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const { isOwner, isAdmin, canManageMembers } = usePermissions();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'members' | 'danger'
  const [name, setName] = useState(currentWorkspace?.name || '');
  const [icon, setIcon] = useState(currentWorkspace?.icon || '📁');
  const [color, setColor] = useState(currentWorkspace?.color || '#3B82F6');
  const [defaultView, setDefaultView] = useState(currentWorkspace?.defaultView || 'kanban');

  // Member invite state
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOpen = activeModal === 'workspaceSettings';

  if (!isOpen || !currentWorkspace) return null;

  const handleUpdateGeneral = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        updateWorkspace({
          id: currentWorkspace._id,
          data: { name, icon, color, defaultView },
        })
      ).unwrap();
      toast.success('Workspace updated');
    } catch (err) {
      toast.error(err || 'Failed to update workspace');
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteQuery.trim()) return;
    setIsInviting(true);
    try {
      await dispatch(
        addWorkspaceMember({
          id: currentWorkspace._id,
          data: { emailOrUsername: inviteQuery.trim(), role: inviteRole },
        })
      ).unwrap();
      toast.success('Member added to workspace');
      setInviteQuery('');
    } catch (err) {
      toast.error(err || 'Failed to add member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await dispatch(
        updateMemberRole({
          id: currentWorkspace._id,
          userId,
          role: newRole,
        })
      ).unwrap();
      toast.success('Member role updated');
    } catch (err) {
      toast.error(err || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await dispatch(
        removeWorkspaceMember({
          id: currentWorkspace._id,
          userId,
        })
      ).unwrap();
      toast.success('Member removed');
    } catch (err) {
      toast.error(err || 'Failed to remove member');
    }
  };

  const handleDeleteWorkspace = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteWorkspace(currentWorkspace._id)).unwrap();
      toast.success('Workspace deleted');
      setShowDeleteConfirm(false);
      dispatch(closeModal());
    } catch (err) {
      toast.error(err || 'Failed to delete workspace');
    } finally {
      setIsDeleting(false);
    }
  };

  const members = currentWorkspace.members || [];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => dispatch(closeModal())}
        title="Workspace Settings"
        maxWidth="max-w-2xl"
      >
        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Members ({members.length})
          </button>
          {isOwner && (
            <button
              onClick={() => setActiveTab('danger')}
              className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'danger'
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-slate-500 hover:text-rose-600'
              }`}
            >
              Danger Zone
            </button>
          )}
        </div>

        {/* Tab 1: General Settings */}
        {activeTab === 'general' && (
          <form onSubmit={handleUpdateGeneral} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Icon
                </label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  disabled={!isAdmin}
                  className="px-3 py-2 text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="🚀">🚀</option>
                  <option value="📁">📁</option>
                  <option value="🏢">🏢</option>
                  <option value="💻">💻</option>
                  <option value="🎨">🎨</option>
                  <option value="⚡">⚡</option>
                  <option value="✨">✨</option>
                </select>
              </div>

              <div className="flex-1">
                <Input
                  label="Workspace Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Color
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  disabled={!isAdmin}
                  className="w-11 h-10 p-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Default View
              </label>
              <select
                value={defaultView}
                onChange={(e) => setDefaultView(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="kanban">Kanban Board</option>
                <option value="list">List View</option>
                <option value="calendar">Calendar View</option>
              </select>
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-3">
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        )}

        {/* Tab 2: Members Management */}
        {activeTab === 'members' && (
          <div className="space-y-5">
            {canManageMembers && (
              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Invite by email or username..."
                  value={inviteQuery}
                  onChange={(e) => setInviteQuery(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <Button type="submit" variant="primary" isLoading={isInviting}>
                  Invite
                </Button>
              </form>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {members.map((m) => {
                const userObj = m.user || m;
                const isItemOwner = currentWorkspace.owner === userObj._id;

                return (
                  <div
                    key={userObj._id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={userObj.avatar} name={userObj.name} size="md" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {userObj.name} {isItemOwner && '(Owner)'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {userObj.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isItemOwner ? (
                        <Badge variant="purple">Owner</Badge>
                      ) : canManageMembers ? (
                        <select
                          value={m.role || 'member'}
                          onChange={(e) => handleRoleChange(userObj._id, e.target.value)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <Badge>{m.role || 'member'}</Badge>
                      )}

                      {!isItemOwner && canManageMembers && (
                        <button
                          onClick={() => handleRemoveMember(userObj._id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors text-xs"
                          title="Remove Member"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Danger Zone */}
        {activeTab === 'danger' && isOwner && (
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
            <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400">
              Delete this workspace
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Once deleted, all projects, tasks, comments, and activities in this workspace will be permanently erased. This action cannot be undone.
            </p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Workspace
            </Button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace Permanently"
        message={`Are you absolutely sure you want to delete "${currentWorkspace.name}"? All associated projects and tasks will be erased.`}
        confirmText="Yes, delete workspace"
        isDanger={true}
        isLoading={isDeleting}
      />
    </>
  );
};

export default WorkspaceSettingsModal;
