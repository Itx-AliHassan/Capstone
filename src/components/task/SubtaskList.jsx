import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createSubtask, updateTask } from '../../features/tasks/taskSlice';
import taskApi from '../../services/taskApi';
import Button from '../common/Button';
import toast from 'react-hot-toast';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import CheckBoxOutlineBlankOutlinedIcon from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

export const SubtaskList = ({ task, onTaskRefresh }) => {
  const dispatch = useDispatch();
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const subtasks = task.subtasks || [];
  const completedCount = subtasks.filter((s) => s.completed).length;

  const handleToggleCompleted = async (sub) => {
    try {
      await taskApi.updateTask(sub._id, { completed: !sub.completed });
      if (onTaskRefresh) onTaskRefresh();
    } catch (err) {
      toast.error('Failed to update subtask');
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsAdding(true);
    try {
      await dispatch(
        createSubtask({ taskId: task._id, title: newTitle.trim() })
      ).unwrap();
      setNewTitle('');
      if (onTaskRefresh) onTaskRefresh();
    } catch (err) {
      toast.error('Failed to add subtask');
    } finally {
      setIsAdding(false);
    }
  };

  const handleConvertToTask = async (subId) => {
    try {
      await taskApi.convertTask(subId, null);
      toast.success('Converted subtask to top-level task');
      if (onTaskRefresh) onTaskRefresh();
    } catch (err) {
      toast.error('Failed to convert subtask');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Subtasks ({completedCount}/{subtasks.length})
        </h4>
        {subtasks.length > 0 && (
          <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Subtasks List */}
      <div className="space-y-1.5">
        {subtasks.map((sub) => (
          <div
            key={sub._id}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <div
              className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
              onClick={() => handleToggleCompleted(sub)}
            >
              <button type="button" className="text-slate-400 group-hover:text-indigo-600">
                {sub.completed ? (
                  <CheckBoxOutlinedIcon fontSize="small" className="text-emerald-500" />
                ) : (
                  <CheckBoxOutlineBlankOutlinedIcon fontSize="small" />
                )}
              </button>
              <span
                className={`text-sm truncate ${
                  sub.completed
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {sub.title}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleConvertToTask(sub._id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-all text-xs flex items-center gap-1"
              title="Convert to top-level task"
            >
              <OpenInNewIcon fontSize="inherit" />
              <span className="text-[10px]">Promote</span>
            </button>
          </div>
        ))}
      </div>

      {/* Add Subtask Form */}
      <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new subtask..."
          className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={!newTitle.trim()}
          isLoading={isAdding}
          icon={<AddIcon fontSize="inherit" />}
        >
          Add
        </Button>
      </form>
    </div>
  );
};

export default SubtaskList;
