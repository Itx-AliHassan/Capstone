import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../features/auth/authSlice';
import { closeModal } from '../../features/ui/uiSlice';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { Avatar } from '../common/Badge';
import toast from 'react-hot-toast';

export const ProfileModal = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [notifPrefs, setNotifPrefs] = useState(
    user?.notificationPreferences || {
      emailNotifications: true,
      taskAssigned: true,
      taskDueSoon: true,
      mentions: true,
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = activeModal === 'profile';

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        avatar: avatar.trim(),
        notificationPreferences: notifPrefs,
      };

      if (password) {
        if (!currentPassword) {
          toast.error('Current password required to change password');
          setIsSubmitting(false);
          return;
        }
        payload.password = password;
        payload.currentPassword = currentPassword;
      }

      await dispatch(updateUserProfile(payload)).unwrap();
      toast.success('Profile updated successfully');
      dispatch(closeModal());
    } catch (err) {
      toast.error(err || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal())}
      title="User Profile & Settings"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Avatar preview */}
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <Avatar src={avatar || user.avatar} name={name || user.name} size="lg" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {name || user.name}
            </h4>
            <p className="text-xs text-slate-400">@{user.username}</p>
          </div>
        </div>

        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Avatar Image URL"
          placeholder="https://..."
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          helperText="Leave empty to use generated avatar"
        />

        {/* Password update */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Change Password (Optional)
          </h5>
          <Input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="New Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Notification Preferences */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Notification Preferences
          </h5>
          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={notifPrefs.taskAssigned}
              onChange={(e) =>
                setNotifPrefs({ ...notifPrefs, taskAssigned: e.target.checked })
              }
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            Notify when assigned to a task
          </label>
          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={notifPrefs.mentions}
              onChange={(e) =>
                setNotifPrefs({ ...notifPrefs, mentions: e.target.checked })
              }
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            Notify when mentioned in comments (@username)
          </label>
          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={notifPrefs.taskDueSoon}
              onChange={(e) =>
                setNotifPrefs({ ...notifPrefs, taskDueSoon: e.target.checked })
              }
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            Notify when task due date is approaching
          </label>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={() => dispatch(closeModal())}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileModal;
