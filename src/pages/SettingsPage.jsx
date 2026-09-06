import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../features/auth/authSlice';
import {
  updateWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
} from '../features/workspaces/workspaceSlice';
import { setTheme, toggleTheme } from '../features/ui/uiSlice';
import workspaceApi from '../services/workspaceApi';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { Avatar, Badge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/CommonStates';
import usePermissions from '../hooks/usePermissions';
import toast from 'react-hot-toast';

import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BusinessIcon from '@mui/icons-material/Business';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import CheckIcon from '@mui/icons-material/Check';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export const SettingsPage = () => {
  const { tab = 'profile' } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { currentWorkspace, workspaces } = useSelector((state) => state.workspaces);
  const { theme } = useSelector((state) => state.ui);
  const { isOwner, isAdmin, canManageMembers } = usePermissions();

  // User Settings State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userSaving, setUserSaving] = useState(false);

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState(
    user?.notificationPreferences || {
      emailNotifications: true,
      taskAssigned: true,
      taskDueSoon: true,
      mentions: true,
    }
  );
  const [notifSaving, setNotifSaving] = useState(false);

  // Workspace Settings State
  const [wsName, setWsName] = useState(currentWorkspace?.name || '');
  const [wsIcon, setWsIcon] = useState(currentWorkspace?.icon || '📁');
  const [wsColor, setWsColor] = useState(currentWorkspace?.color || '#3B82F6');
  const [wsDefaultView, setWsDefaultView] = useState(currentWorkspace?.defaultView || 'kanban');
  const [wsSaving, setWsSaving] = useState(false);

  // Member Invite State
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);

  // Danger Zone Confirmation Dialogs
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state when user or workspace changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || '');
      if (user.notificationPreferences) {
        setNotifPrefs(user.notificationPreferences);
      }
    }
  }, [user]);

  useEffect(() => {
    if (currentWorkspace) {
      setWsName(currentWorkspace.name || '');
      setWsIcon(currentWorkspace.icon || '📁');
      setWsColor(currentWorkspace.color || '#3B82F6');
      setWsDefaultView(currentWorkspace.defaultView || 'kanban');
    }
  }, [currentWorkspace]);

  // Valid tabs
  const validTabs = ['profile', 'workspace', 'notifications', 'appearance', 'danger-zone'];
  const activeTab = validTabs.includes(tab) ? tab : 'profile';

  // Navigation Items
  const navTabs = [
    { id: 'profile', label: 'User Profile', icon: <PersonOutlineIcon fontSize="small" /> },
    { id: 'workspace', label: 'Workspace', icon: <BusinessIcon fontSize="small" /> },
    { id: 'notifications', label: 'Notifications', icon: <NotificationsNoneIcon fontSize="small" /> },
    { id: 'appearance', label: 'Appearance & Theme', icon: <PaletteOutlinedIcon fontSize="small" /> },
    { id: 'danger-zone', label: 'Danger Zone', icon: <WarningAmberIcon fontSize="small" />, danger: true },
  ];

  // Save User Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setUserSaving(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        avatar: avatar.trim(),
      };

      if (newPassword) {
        if (!currentPassword) {
          toast.error('Current password is required to set a new password');
          setUserSaving(false);
          return;
        }
        payload.password = newPassword;
        payload.currentPassword = currentPassword;
      }

      await dispatch(updateUserProfile(payload)).unwrap();
      toast.success('Profile updated successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err || 'Failed to update profile');
    } finally {
      setUserSaving(false);
    }
  };

  // Save Notification Preferences
  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setNotifSaving(true);
    try {
      await dispatch(
        updateUserProfile({
          notificationPreferences: notifPrefs,
        })
      ).unwrap();
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error(err || 'Failed to save notifications');
    } finally {
      setNotifSaving(false);
    }
  };

  // Save Workspace Settings
  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    if (!currentWorkspace?._id) return;
    if (!wsName.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    setWsSaving(true);
    try {
      await dispatch(
        updateWorkspace({
          id: currentWorkspace._id,
          data: {
            name: wsName.trim(),
            icon: wsIcon,
            color: wsColor,
            defaultView: wsDefaultView,
          },
        })
      ).unwrap();
      toast.success('Workspace updated successfully');
    } catch (err) {
      toast.error(err || 'Failed to update workspace');
    } finally {
      setWsSaving(false);
    }
  };

  // Member Invite
  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteQuery.trim() || !currentWorkspace?._id) return;
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

  // Member Role Change
  const handleRoleChange = async (userId, newRole) => {
    if (!currentWorkspace?._id) return;
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
      toast.error(err || 'Failed to update member role');
    }
  };

  // Member Removal
  const handleRemoveMember = async (userId) => {
    if (!currentWorkspace?._id) return;
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

  // Danger: Reset Workspace Data
  const handleResetWorkspaceData = async () => {
    if (!currentWorkspace?._id) return;
    setIsResetting(true);
    try {
      await workspaceApi.resetWorkspace(currentWorkspace._id);
      toast.success('Workspace data reset successfully');
      setShowResetConfirm(false);
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset workspace');
    } finally {
      setIsResetting(false);
    }
  };

  // Danger: Delete Workspace
  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace?._id) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteWorkspace(currentWorkspace._id)).unwrap();
      toast.success('Workspace deleted successfully');
      setShowDeleteConfirm(false);
      navigate('/');
    } catch (err) {
      toast.error(err || 'Failed to delete workspace');
    } finally {
      setIsDeleting(false);
    }
  };

  const members = currentWorkspace?.members || [];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal account, workspace configuration, and preferences
        </p>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Settings Navigation Sidebar */}
        <aside className="md:col-span-1 space-y-1">
          {navTabs.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`settings-tab-${item.id}`}
                onClick={() => navigate(`/settings/${item.id}`)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  isActive
                    ? item.danger
                      ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-semibold'
                      : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : item.danger
                    ? 'text-rose-500/80 hover:bg-rose-50/50 dark:hover:bg-rose-950/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Tab Content Panel */}
        <main className="md:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
          {/* TAB 1: User Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  User Profile
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update your identity, email, avatar, and security password
                </p>
              </div>

              {/* Avatar Preview */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <Avatar src={avatar || user?.avatar} name={name || user?.name} size="lg" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {name || user?.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    @{user?.username}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="profile-name-input"
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    id="profile-email-input"
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Input
                  id="profile-avatar-input"
                  label="Avatar Image URL"
                  placeholder="https://images.unsplash.com/..."
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  helperText="Leave empty to use automatic color initials"
                />

                {/* Password Update Section */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Change Password (Optional)
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      id="profile-current-password"
                      type="password"
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <Input
                      id="profile-new-password"
                      type="password"
                      placeholder="New Password (min 6 chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    id="save-profile-btn"
                    type="submit"
                    variant="primary"
                    isLoading={userSaving}
                  >
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Workspace Settings */}
          {activeTab === 'workspace' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Workspace Settings
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure workspace name, branding color, default task layout, and team members
                </p>
              </div>

              {/* General Workspace Info */}
              <form onSubmit={handleSaveWorkspace} className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Icon
                    </label>
                    <select
                      id="workspace-icon-select"
                      value={wsIcon}
                      onChange={(e) => setWsIcon(e.target.value)}
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

                  <div className="flex-1 min-w-[200px]">
                    <Input
                      id="workspace-name-input"
                      label="Workspace Name"
                      value={wsName}
                      onChange={(e) => setWsName(e.target.value)}
                      disabled={!isAdmin}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Theme Color
                    </label>
                    <input
                      id="workspace-color-input"
                      type="color"
                      value={wsColor}
                      onChange={(e) => setWsColor(e.target.value)}
                      disabled={!isAdmin}
                      className="w-12 h-10 p-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Default Project View
                  </label>
                  <select
                    id="workspace-default-view-select"
                    value={wsDefaultView}
                    onChange={(e) => setWsDefaultView(e.target.value)}
                    disabled={!isAdmin}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="kanban">Kanban Board</option>
                    <option value="list">List / Table View</option>
                    <option value="calendar">Calendar View</option>
                  </select>
                </div>

                {isAdmin && (
                  <div className="flex justify-end pt-2">
                    <Button
                      id="save-workspace-btn"
                      type="submit"
                      variant="primary"
                      isLoading={wsSaving}
                    >
                      Save Workspace Configuration
                    </Button>
                  </div>
                )}
              </form>

              {/* Members Management Section */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Workspace Members ({members.length})
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Manage team access and permissions
                    </p>
                  </div>
                </div>

                {canManageMembers && (
                  <form onSubmit={handleInviteMember} className="flex gap-2">
                    <input
                      id="invite-member-input"
                      type="text"
                      placeholder="Invite by email or username..."
                      value={inviteQuery}
                      onChange={(e) => setInviteQuery(e.target.value)}
                      className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      id="invite-member-role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <Button
                      id="invite-member-btn"
                      type="submit"
                      variant="primary"
                      isLoading={isInviting}
                    >
                      Invite
                    </Button>
                  </form>
                )}

                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  {members.map((m) => {
                    const userObj = m.user || m;
                    const isItemOwner = currentWorkspace?.owner === userObj._id;

                    return (
                      <div
                        key={userObj._id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar src={userObj.avatar} name={userObj.name} size="md" />
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {userObj.name} {isItemOwner && <span className="text-xs text-indigo-500 font-bold ml-1">(Owner)</span>}
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
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove Member"
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Notifications Preferences */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Notification Preferences
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Choose which events trigger alerts and in-app notifications
                </p>
              </div>

              <form onSubmit={handleSaveNotifications} className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Task Assignments
                      </h5>
                      <p className="text-xs text-slate-500">
                        Notify me whenever a task is assigned to my account
                      </p>
                    </div>
                    <input
                      id="notif-task-assigned"
                      type="checkbox"
                      checked={Boolean(notifPrefs.taskAssigned)}
                      onChange={(e) =>
                        setNotifPrefs({ ...notifPrefs, taskAssigned: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Mentions (@username)
                      </h5>
                      <p className="text-xs text-slate-500">
                        Notify me when someone mentions me in task comments
                      </p>
                    </div>
                    <input
                      id="notif-mentions"
                      type="checkbox"
                      checked={Boolean(notifPrefs.mentions)}
                      onChange={(e) =>
                        setNotifPrefs({ ...notifPrefs, mentions: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Approaching Due Dates
                      </h5>
                      <p className="text-xs text-slate-500">
                        Receive a reminder when a task deadline is within 24 hours
                      </p>
                    </div>
                    <input
                      id="notif-due-soon"
                      type="checkbox"
                      checked={Boolean(notifPrefs.taskDueSoon)}
                      onChange={(e) =>
                        setNotifPrefs({ ...notifPrefs, taskDueSoon: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Email Notifications
                      </h5>
                      <p className="text-xs text-slate-500">
                        Forward critical task digests and workspace invitations to email
                      </p>
                    </div>
                    <input
                      id="notif-email"
                      type="checkbox"
                      checked={Boolean(notifPrefs.emailNotifications)}
                      onChange={(e) =>
                        setNotifPrefs({ ...notifPrefs, emailNotifications: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    id="save-notifications-btn"
                    type="submit"
                    variant="primary"
                    isLoading={notifSaving}
                  >
                    Save Preferences
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: Appearance & Theme */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Appearance & Theme
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Customize the interface appearance across the application
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dark Theme Option */}
                <button
                  id="theme-dark-btn"
                  type="button"
                  onClick={() => dispatch(setTheme('dark'))}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    theme === 'dark'
                      ? 'border-indigo-600 bg-slate-800/90 ring-2 ring-indigo-500 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400">
                      <DarkModeOutlinedIcon />
                    </div>
                    {theme === 'dark' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <CheckIcon style={{ fontSize: 14 }} />
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-white">Dark Mode</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Sleek dark aesthetics with high contrast for night productivity
                  </p>
                </button>

                {/* Light Theme Option */}
                <button
                  id="theme-light-btn"
                  type="button"
                  onClick={() => dispatch(setTheme('light'))}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    theme === 'light'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 text-indigo-600">
                      <LightModeOutlinedIcon />
                    </div>
                    {theme === 'light' && (
                      <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <CheckIcon style={{ fontSize: 14 }} />
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Light Mode</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Crisp clean white background tailored for daytime work
                  </p>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Active Theme: <span className="capitalize font-bold text-indigo-500">{theme}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Theme choice is persisted instantly in local client preferences
                  </p>
                </div>
                <Button
                  id="toggle-theme-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(toggleTheme())}
                >
                  Toggle Theme
                </Button>
              </div>
            </div>
          )}

          {/* TAB 5: Danger Zone */}
          {activeTab === 'danger-zone' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  Danger Zone
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Irreversible actions regarding workspace data and ownership
                </p>
              </div>

              {/* Reset Workspace */}
              {isOwner && (
                <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 space-y-3">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                    <RestartAltIcon />
                    Reset Workspace Data
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    This will clear all projects, tasks, and activities from this workspace, and initialize a fresh clean board. Members and roles will remain intact.
                  </p>
                  <Button
                    id="reset-workspace-btn"
                    variant="danger"
                    size="sm"
                    onClick={() => setShowResetConfirm(true)}
                  >
                    Reset Workspace Data
                  </Button>
                </div>
              )}

              {/* Delete Workspace */}
              {isOwner && (
                <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/30 space-y-3">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                    <DeleteOutlineIcon />
                    Delete Workspace Permanently
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Once deleted, all projects, tasks, comments, files, and memberships in this workspace will be permanently erased from MongoDB. This action cannot be undone.
                  </p>
                  <Button
                    id="delete-workspace-btn"
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete This Workspace
                  </Button>
                </div>
              )}

              {!isOwner && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500">
                  You are not the owner of this workspace. Destructive actions require Owner role.
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modals */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetWorkspaceData}
        title="Reset All Workspace Data"
        message="Are you sure you want to clear all tasks and projects in this workspace? This cannot be undone."
        confirmText="Yes, reset workspace"
        isDanger={true}
        isLoading={isResetting}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace Permanently"
        message={`Are you absolutely sure you want to delete "${currentWorkspace?.name}"? All associated projects and tasks will be erased.`}
        confirmText="Yes, delete workspace"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SettingsPage;
