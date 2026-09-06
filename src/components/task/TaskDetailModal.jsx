import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateTask,
  deleteTask,
  duplicateTask,
  registerDeleteForUndo,
  fetchTasks,
} from '../../features/tasks/taskSlice';
import taskApi from '../../services/taskApi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Avatar, Badge } from '../common/Badge';
import SubtaskList from './SubtaskList';
import CommentsSection from '../comments/CommentsSection';
import { formatDate } from '../../utils/dateUtils';
import usePermissions from '../../hooks/usePermissions';
import toast from 'react-hot-toast';

import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';

export const TaskDetailModal = ({ taskId, task: propTask, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const { currentProject } = useSelector((state) => state.projects);
  const { canEditTasks } = usePermissions();

  const effectiveTaskId = taskId || propTask?._id || (typeof propTask === 'string' ? propTask : null);

  const [task, setTask] = useState(propTask && typeof propTask === 'object' ? propTask : null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const loadTask = async () => {
    if (!effectiveTaskId) return;
    try {
      const res = await taskApi.getTaskById(effectiveTaskId);
      setTask(res.data.data.task);
    } catch (err) {
      console.error('Failed to load task:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && effectiveTaskId) {
      setLoading(true);
      loadTask();
    }
  }, [isOpen, effectiveTaskId]);

  if (!isOpen) return null;

  const handleFieldChange = async (field, value) => {
    if (!canEditTasks || !task) return;
    setTask({ ...task, [field]: value });
    try {
      await dispatch(updateTask({ id: task._id, data: { [field]: value } })).unwrap();
    } catch (err) {
      toast.error('Failed to update task');
      loadTask();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', task._id);

    setIsUploading(true);
    try {
      const res = await taskApi.uploadAttachment(formData);
      toast.success('File uploaded to Cloudinary');
      if (res.data.data.task) {
        setTask(res.data.data.task);
      } else {
        loadTask();
      }
    } catch (err) {
      toast.error('File upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      const res = await taskApi.deleteAttachment(task._id, attachmentId);
      toast.success('Attachment removed');
      setTask(res.data.data.task);
    } catch (err) {
      toast.error('Failed to remove attachment');
    }
  };

  const handleDuplicate = async () => {
    try {
      await dispatch(duplicateTask(task._id)).unwrap();
      toast.success('Task duplicated');
      onClose();
    } catch (err) {
      toast.error('Failed to duplicate task');
    }
  };

  const handleDelete = async () => {
    dispatch(registerDeleteForUndo(task._id));
    try {
      await dispatch(deleteTask(task._id)).unwrap();
      toast((t) => (
        <span className="flex items-center gap-3">
          <span>Task deleted</span>
          <button
            onClick={() => {
              dispatch(fetchTasks({ projectId: currentProject._id }));
              toast.dismiss(t.id);
            }}
            className="px-2 py-0.5 bg-indigo-600 text-white rounded text-xs font-bold"
          >
            Undo
          </button>
        </span>
      ));
      onClose();
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const columns = currentProject?.columns || [];
  const members = currentWorkspace?.members || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Details" maxWidth="max-w-3xl">
      {loading || !task ? (
        <div className="p-8 text-center text-slate-400">Loading task details...</div>
      ) : (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  task.priority === 'urgent'
                    ? 'danger'
                    : task.priority === 'high'
                    ? 'warning'
                    : 'default'
                }
              >
                {task.priority.toUpperCase()}
              </Badge>
              {task.completed && <Badge variant="success">COMPLETED</Badge>}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDuplicate}
                icon={<ContentCopyIcon fontSize="inherit" />}
              >
                Duplicate
              </Button>
              {canEditTasks && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-rose-600 hover:text-rose-700"
                  icon={<DeleteOutlineIcon fontSize="inherit" />}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <input
              type="text"
              value={task.title}
              disabled={!canEditTasks}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              onBlur={(e) => handleFieldChange('title', e.target.value)}
              className="w-full text-lg font-bold text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-hidden transition-colors"
            />

            <textarea
              rows={3}
              value={task.description || ''}
              disabled={!canEditTasks}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              onBlur={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Add description..."
              className="w-full p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            {/* Status */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Status</span>
              <select
                value={task.status}
                disabled={!canEditTasks}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Assignee</span>
              <select
                value={task.assignee?._id || task.assignee || ''}
                disabled={!canEditTasks}
                onChange={(e) => handleFieldChange('assignee', e.target.value || null)}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="">Unassigned</option>
                {members.map((m) => {
                  const u = m.user || m;
                  return (
                    <option key={u._id} value={u._id}>
                      {u.name || u.username}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Due Date</span>
              <input
                type="date"
                value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                disabled={!canEditTasks}
                onChange={(e) =>
                  handleFieldChange(
                    'dueDate',
                    e.target.value ? new Date(e.target.value).toISOString() : null
                  )
                }
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Subtasks */}
          <SubtaskList task={task} onTaskRefresh={loadTask} />

          {/* Cloudinary Attachments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Attachments ({task.attachments?.length || 0})
              </h4>

              {canEditTasks && (
                <div>
                  <input
                    type="file"
                    id={`task-attach-${task._id}`}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor={`task-attach-${task._id}`}
                    className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <FileUploadOutlinedIcon fontSize="small" />
                    {isUploading ? 'Uploading...' : 'Upload File'}
                  </label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(task.attachments || []).map((att) => (
                <div
                  key={att._id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs group"
                >
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 truncate text-indigo-600 dark:text-indigo-400 hover:underline flex-1"
                  >
                    <InsertDriveFileOutlinedIcon fontSize="small" />
                    <span className="truncate">{att.fileName}</span>
                  </a>

                  {canEditTasks && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(att._id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      title="Remove file"
                    >
                      <CloseIcon fontSize="inherit" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <CommentsSection taskId={task._id} />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default TaskDetailModal;
