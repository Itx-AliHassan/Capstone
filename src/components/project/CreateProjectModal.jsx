import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProject, fetchTemplates } from '../../features/projects/projectSlice';
import { closeModal } from '../../features/ui/uiSlice';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';

export const CreateProjectModal = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const { templates } = useSelector((state) => state.projects);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📋');
  const [color, setColor] = useState('#10B981');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = activeModal === 'createProject';

  useEffect(() => {
    if (isOpen && templates.length === 0) {
      dispatch(fetchTemplates());
    }
  }, [isOpen, dispatch, templates.length]);

  if (!isOpen) return null;

  const handleTemplateSelect = (tmpl) => {
    setSelectedTemplateId(tmpl.id);
    setName(tmpl.name);
    setDescription(tmpl.description);
    setIcon(tmpl.icon);
    setColor(tmpl.color);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    if (!currentWorkspace?._id) {
      toast.error('No workspace selected');
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        createProject({
          workspaceId: currentWorkspace._id,
          name: name.trim(),
          description: description.trim(),
          icon,
          color,
          templateId: selectedTemplateId || undefined,
        })
      ).unwrap();

      toast.success('Project created successfully');
      dispatch(closeModal());
      setName('');
      setDescription('');
      setSelectedTemplateId('');
    } catch (err) {
      toast.error(err || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal())}
      title="Create New Project"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Template Selector */}
        {templates.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Start from a Predefined Template (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {templates.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    type="button"
                    key={tmpl.id}
                    onClick={() => handleTemplateSelect(tmpl)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl block mb-1">{tmpl.icon}</span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {tmpl.name}
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {tmpl.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Icon Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Icon
            </label>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="px-3 py-2 text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="📋">📋</option>
              <option value="⚡">⚡</option>
              <option value="🚀">🚀</option>
              <option value="🐛">🐛</option>
              <option value="🎯">🎯</option>
              <option value="🛠️">🛠️</option>
              <option value="💡">💡</option>
              <option value="📊">📊</option>
            </select>
          </div>

          <div className="flex-1">
            <Input
              id="project-name-input"
              label="Project Name"
              placeholder="e.g. Mobile App Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Color
            </label>
            <input
              id="project-color-input"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-11 h-10 p-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Description
          </label>
          <textarea
            id="project-desc-input"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief goals or summary of this project..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
          />
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
          <Button
            id="create-project-submit-btn"
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
