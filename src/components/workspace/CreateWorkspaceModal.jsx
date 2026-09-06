import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createWorkspace } from '../../features/workspaces/workspaceSlice';
import { closeModal } from '../../features/ui/uiSlice';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';

export const CreateWorkspaceModal = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🚀');
  const [color, setColor] = useState('#3B82F6');
  const [defaultView, setDefaultView] = useState('kanban');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = activeModal === 'createWorkspace';

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        createWorkspace({
          name: name.trim(),
          icon,
          color,
          defaultView,
        })
      ).unwrap();

      toast.success('Workspace created successfully');
      dispatch(closeModal());
      setName('');
    } catch (err) {
      toast.error(err || 'Failed to create workspace');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal())}
      title="Create New Workspace"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Icon
            </label>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
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
              placeholder="e.g. Acme Studio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
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
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="kanban">Kanban Board</option>
            <option value="list">List View</option>
            <option value="calendar">Calendar View</option>
          </select>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={() => dispatch(closeModal())}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Create Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateWorkspaceModal;
