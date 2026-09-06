import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../features/ui/uiSlice';
import { fetchProjects } from '../../features/projects/projectSlice';
import { fetchWorkspaces } from '../../features/workspaces/workspaceSlice';
import workspaceApi from '../../services/workspaceApi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { ConfirmDialog } from '../common/CommonStates';
import usePermissions from '../../hooks/usePermissions';
import toast from 'react-hot-toast';

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export const ImportExportModal = () => {
  const dispatch = useDispatch();
  const { activeModal } = useSelector((state) => state.ui);
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const { isOwner, isAdmin } = usePermissions();

  const [activeTab, setActiveTab] = useState('export'); // 'export' | 'import' | 'reset'
  const [importJson, setImportJson] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isOpen = activeModal === 'importExport';

  if (!isOpen || !currentWorkspace) return null;

  // Handle Export
  const handleExport = async () => {
    setIsProcessing(true);
    try {
      const res = await workspaceApi.exportWorkspace(currentWorkspace._id);
      const dataStr = JSON.stringify(res.data.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentWorkspace.name.toLowerCase().replace(/\s+/g, '_')}_export.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Workspace exported successfully');
    } catch (err) {
      toast.error('Export failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle JSON File Selection
  const handleFileChange = (e) => {
    setValidationError('');
    setImportPreview(null);
    setImportJson(null);
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      const msg = 'Invalid file type. Please upload a .json file.';
      setValidationError(msg);
      toast.error(msg);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);

        if (!parsed || typeof parsed !== 'object') {
          const msg = 'Malformed JSON: File does not contain a valid JSON object.';
          setValidationError(msg);
          toast.error(msg);
          return;
        }

        if (!parsed.version) {
          const msg = 'Missing schema version. The file must declare a schema version (e.g. "1.0.0").';
          setValidationError(msg);
          toast.error(msg);
          return;
        }

        if (!parsed.workspace || typeof parsed.workspace.name !== 'string' || !parsed.workspace.name.trim()) {
          const msg = 'Invalid schema: Missing required workspace.name field.';
          setValidationError(msg);
          toast.error(msg);
          return;
        }

        if (!Array.isArray(parsed.projects)) {
          const msg = 'Invalid schema: "projects" must be an array.';
          setValidationError(msg);
          toast.error(msg);
          return;
        }

        // Sanitize projects and tasks (strip rogue IDs and sensitive keys)
        const sanitizedProjects = parsed.projects.map((p) => {
          if (!p.name || typeof p.name !== 'string') {
            throw new Error('Every project in the imported file must have a valid name.');
          }

          return {
            name: p.name.trim(),
            description: typeof p.description === 'string' ? p.description.trim() : '',
            icon: p.icon || '📋',
            color: p.color || '#10B981',
            columns: Array.isArray(p.columns)
              ? p.columns.map((c) => ({ id: String(c.id), name: String(c.name), position: Number(c.position) || 0 }))
              : undefined,
            savedFilters: Array.isArray(p.savedFilters)
              ? p.savedFilters.map((sf) => ({ name: String(sf.name), filters: sf.filters || {} }))
              : [],
            tasks: Array.isArray(p.tasks)
              ? p.tasks.map((t) => {
                  if (!t.title || typeof t.title !== 'string') {
                    throw new Error(`Project "${p.name}" has a task missing a required title.`);
                  }
                  return {
                    title: t.title.trim(),
                    description: typeof t.description === 'string' ? t.description.trim() : '',
                    status: t.status || 'col-todo',
                    priority: ['low', 'medium', 'high', 'urgent'].includes(t.priority) ? t.priority : 'medium',
                    dueDate: t.dueDate || null,
                    labels: Array.isArray(t.labels) ? t.labels.map(String) : [],
                    completed: Boolean(t.completed),
                    assignee: t.assignee?.email ? { email: t.assignee.email } : null,
                    subtasks: Array.isArray(t.subtasks)
                      ? t.subtasks.map((s) => ({ title: String(s.title || 'Untitled subtask'), completed: Boolean(s.completed) }))
                      : [],
                    comments: Array.isArray(t.comments)
                      ? t.comments.map((c) => ({ content: String(c.content || '') }))
                      : [],
                  };
                })
              : [],
          };
        });

        const totalTasks = sanitizedProjects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
        const totalSubtasks = sanitizedProjects.reduce(
          (acc, p) => acc + (p.tasks?.reduce((sAcc, t) => sAcc + (t.subtasks?.length || 0), 0) || 0),
          0
        );
        const totalComments = sanitizedProjects.reduce(
          (acc, p) => acc + (p.tasks?.reduce((cAcc, t) => cAcc + (t.comments?.length || 0), 0) || 0),
          0
        );

        const payload = {
          version: parsed.version,
          workspace: {
            name: parsed.workspace.name.trim(),
            icon: parsed.workspace.icon,
            color: parsed.workspace.color,
            defaultView: parsed.workspace.defaultView,
          },
          projects: sanitizedProjects,
        };

        setImportJson(payload);
        setImportPreview({
          version: parsed.version,
          name: parsed.workspace.name,
          projectCount: sanitizedProjects.length,
          taskCount: totalTasks,
          subtaskCount: totalSubtasks,
          commentCount: totalComments,
        });
      } catch (err) {
        const msg = err.message || 'Invalid JSON file. Please verify file formatting.';
        setValidationError(msg);
        toast.error(msg);
      }
    };
    reader.readAsText(file);
  };

  // Submit Import
  const handleImportSubmit = async () => {
    if (!importJson) return;
    setIsProcessing(true);
    try {
      const res = await workspaceApi.importWorkspace(currentWorkspace._id, importJson);
      toast.success(res.data.message || 'Import completed successfully!');
      dispatch(fetchProjects({ workspaceId: currentWorkspace._id }));
      dispatch(fetchWorkspaces());
      dispatch(closeModal());
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.errors?.[0] || err.message;
      toast.error('Import failed: ' + errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Workspace Reset
  const handleReset = async () => {
    setIsProcessing(true);
    try {
      await workspaceApi.resetWorkspace(currentWorkspace._id);
      toast.success('Workspace reset to clean state');
      dispatch(fetchProjects({ workspaceId: currentWorkspace._id }));
      setShowResetConfirm(false);
      dispatch(closeModal());
    } catch (err) {
      toast.error('Reset failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => dispatch(closeModal())}
        title="Workspace Data Management"
        maxWidth="max-w-xl"
      >
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            Export
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('import')}
              className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'import'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500'
              }`}
            >
              Import
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => setActiveTab('reset')}
              className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'reset'
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-slate-500'
              }`}
            >
              Reset Data
            </button>
          )}
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Export all workspace projects, custom columns, tasks, nested subtasks, and labels as a structured JSON file.
            </p>
            <Button
              id="export-json-btn"
              variant="primary"
              onClick={handleExport}
              isLoading={isProcessing}
              icon={<FileDownloadOutlinedIcon fontSize="small" />}
            >
              Export Workspace JSON
            </Button>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && isAdmin && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Upload a previously exported workspace JSON file. The data will be validated against strict schemas before being associated with your workspace.
            </p>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="workspace-json-upload"
              />
              <label
                htmlFor="workspace-json-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FileUploadOutlinedIcon fontSize="large" className="text-indigo-500" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Select JSON File
                </span>
                <span className="text-xs text-slate-400">Click to browse your local device</span>
              </label>
            </div>

            {validationError && (
              <div id="import-validation-error" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-medium">
                {validationError}
              </div>
            )}

            {importPreview && (
              <div id="import-preview-box" className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Import Preview (Schema v{importPreview.version})
                </h5>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  Workspace: {importPreview.name}
                </p>
                <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
                  <span>Projects: {importPreview.projectCount}</span>
                  <span>Tasks: {importPreview.taskCount}</span>
                  <span>Subtasks: {importPreview.subtaskCount}</span>
                  <span>Comments: {importPreview.commentCount}</span>
                </div>
                <div className="pt-2">
                  <Button
                    id="confirm-import-btn"
                    variant="primary"
                    size="sm"
                    onClick={handleImportSubmit}
                    isLoading={isProcessing}
                  >
                    Confirm and Import
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reset Tab */}
        {activeTab === 'reset' && isOwner && (
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <RestartAltIcon />
              Reset Workspace Data
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              This will clear all current projects, tasks, and activities from this workspace, and reinitialize a clean default board. Workspace members and settings will be preserved.
            </p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
            >
              Reset Data Now
            </Button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="Reset All Workspace Data"
        message="Are you sure you want to erase all tasks and projects in this workspace? This cannot be undone."
        confirmText="Yes, reset data"
        isDanger={true}
        isLoading={isProcessing}
      />
    </>
  );
};

export default ImportExportModal;
