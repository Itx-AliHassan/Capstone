import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  bulkUpdateTasks,
  bulkDeleteTasks,
  patchTaskStatus,
} from '../../features/tasks/taskSlice';
import { Avatar, Badge } from '../common/Badge';
import Button from '../common/Button';
import { formatDate } from '../../utils/dateUtils';
import usePermissions from '../../hooks/usePermissions';
import toast from 'react-hot-toast';

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export const ListView = ({ onTaskClick }) => {
  const dispatch = useDispatch();
  const { tasks } = useSelector((state) => state.tasks);
  const { currentProject } = useSelector((state) => state.projects);
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const { canEditTasks } = usePermissions();

  const [selectedIds, setSelectedIds] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [groupBy, setGroupBy] = useState('status'); // 'status' | 'priority' | 'assignee' | 'none'
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const defaultColumns = [
    { id: 'col-backlog', name: 'Backlog', position: 0 },
    { id: 'col-todo', name: 'Todo', position: 1 },
    { id: 'col-in-progress', name: 'In Progress', position: 2 },
    { id: 'col-review', name: 'Review', position: 3 },
    { id: 'col-done', name: 'Done', position: 4 },
  ];
  const columns = currentProject?.columns?.length > 0 ? currentProject.columns : defaultColumns;
  const members = currentWorkspace?.members || [];

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(tasks.map((t) => t._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedIds.length === 0 || !newStatus) return;
    setIsBulkProcessing(true);
    try {
      await dispatch(
        bulkUpdateTasks({ taskIds: selectedIds, status: newStatus })
      ).unwrap();
      toast.success(`Updated ${selectedIds.length} tasks`);
      setSelectedIds([]);
    } catch (err) {
      toast.error('Bulk update failed');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await dispatch(bulkDeleteTasks(selectedIds)).unwrap();
      toast.success(`Deleted ${selectedIds.length} tasks`);
      setSelectedIds([]);
    } catch (err) {
      toast.error('Bulk delete failed');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Sort tasks safely and null-tolerantly
  const sortedTasks = [...tasks].sort((a, b) => {
    const normalizeValue = (value) => {
      if (value === null || value === undefined || value === '') return '';
      if (typeof value === 'string') return value.trim().toLowerCase();
      return value;
    };

    let aVal = normalizeValue(a[sortBy]);
    let bVal = normalizeValue(b[sortBy]);

    if (sortBy === 'title') {
      aVal = normalizeValue(a.title);
      bVal = normalizeValue(b.title);
    } else if (sortBy === 'createdAt' || sortBy === 'createdDate') {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : Number.NEGATIVE_INFINITY;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : Number.NEGATIVE_INFINITY;
      aVal = Number.isFinite(aTime) ? aTime : Number.NEGATIVE_INFINITY;
      bVal = Number.isFinite(bTime) ? bTime : Number.NEGATIVE_INFINITY;
    } else if (sortBy === 'dueDate') {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.NEGATIVE_INFINITY;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.NEGATIVE_INFINITY;
      aVal = Number.isFinite(aTime) ? aTime : Number.NEGATIVE_INFINITY;
      bVal = Number.isFinite(bTime) ? bTime : Number.NEGATIVE_INFINITY;
    }

    if (aVal === bVal) return 0;
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  // Group tasks
  const renderTaskRow = (task) => {
    const isSelected = selectedIds.includes(task._id);
    return (
      <tr
        key={task._id}
        className={`border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs ${
          isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
        }`}
      >
        <td className="p-3 w-8">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleToggleSelect(task._id)}
            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
        </td>

        <td
          className="p-3 font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
          onClick={() => onTaskClick(task)}
        >
          <span className={task.completed ? 'line-through text-slate-400' : ''}>
            {task.title}
          </span>
          {task.subtasks?.length > 0 && (
            <span className="ml-2 text-[10px] text-slate-400 font-normal">
              ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
            </span>
          )}
        </td>

        <td className="p-3">
          <select
            value={task.status}
            disabled={!canEditTasks}
            onChange={(e) =>
              dispatch(patchTaskStatus({ id: task._id, status: e.target.value }))
            }
            className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold"
          >
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </td>

        <td className="p-3">
          <Badge
            variant={
              task.priority === 'urgent'
                ? 'danger'
                : task.priority === 'high'
                ? 'warning'
                : task.priority === 'medium'
                ? 'primary'
                : 'default'
            }
            size="xs"
          >
            {task.priority}
          </Badge>
        </td>

        <td className="p-3">
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
              <Avatar
                src={task.assignee.avatar}
                name={task.assignee.name || task.assignee.username}
                size="xs"
              />
              <span className="truncate max-w-[100px] text-slate-600 dark:text-slate-300">
                {task.assignee.name || task.assignee.username}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 italic">Unassigned</span>
          )}
        </td>

        <td className="p-3">
          <div className="flex gap-1 flex-wrap">
            {(task.labels || []).slice(0, 3).map((l) => (
              <span
                key={l}
                className="text-[10px] bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-300"
              >
                #{l}
              </span>
            ))}
          </div>
        </td>

        <td className="p-3 text-slate-500 dark:text-slate-400">
          {task.dueDate ? formatDate(task.dueDate, 'MMM d, yyyy') : '—'}
        </td>
      </tr>
    );
  };

  return (
    <div id="list-view-container" className="space-y-4">
      {/* Controls: Grouping & Bulk Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Group by:</span>
          <select
            id="group-by-select"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="status">Status</option>
            <option value="priority">Priority</option>
            <option value="assignee">Assignee</option>
            <option value="none">None (Flat List)</option>
          </select>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && canEditTasks && (
          <div id="bulk-action-bar" className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs">
            <span className="font-bold text-indigo-700 dark:text-indigo-300">
              {selectedIds.length} selected
            </span>

            <select
              id="bulk-status-select"
              onChange={(e) => handleBulkStatusChange(e.target.value)}
              defaultValue=""
              className="px-2 py-1 rounded-md border border-indigo-200 bg-white dark:bg-slate-800 text-xs"
            >
              <option value="" disabled>
                Change Status...
              </option>
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <Button
              id="bulk-delete-btn"
              variant="danger"
              size="sm"
              onClick={handleBulkDelete}
              isLoading={isBulkProcessing}
              icon={<DeleteOutlineIcon fontSize="inherit" />}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Tasks Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <table id="list-view-table" className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="p-3 w-8">
                <input
                  id="select-all-tasks-checkbox"
                  type="checkbox"
                  checked={selectedIds.length === tasks.length && tasks.length > 0}
                  onChange={handleSelectAll}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th
                className="p-3 cursor-pointer hover:text-indigo-600"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1">
                  <span>Task Title</span>
                  {sortBy === 'title' &&
                    (sortOrder === 'asc' ? (
                      <ArrowUpwardIcon fontSize="inherit" />
                    ) : (
                      <ArrowDownwardIcon fontSize="inherit" />
                    ))}
                </div>
              </th>
              <th className="p-3">Status</th>
              <th
                className="p-3 cursor-pointer hover:text-indigo-600"
                onClick={() => handleSort('priority')}
              >
                Priority
              </th>
              <th className="p-3">Assignee</th>
              <th className="p-3">Labels</th>
              <th
                className="p-3 cursor-pointer hover:text-indigo-600"
                onClick={() => handleSort('dueDate')}
              >
                Due Date
              </th>
            </tr>
          </thead>

          <tbody>
            {groupBy === 'none' ? (
              sortedTasks.map(renderTaskRow)
            ) : groupBy === 'status' ? (
              <>
                {columns.map((col) => {
                  const groupTasks = sortedTasks.filter((t) => t.status === col.id);
                  if (groupTasks.length === 0) return null;
                  return (
                    <React.Fragment key={col.id}>
                      <tr className="bg-slate-50/90 dark:bg-slate-800/70">
                        <td colSpan={7} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          {col.name} ({groupTasks.length})
                        </td>
                      </tr>
                      {groupTasks.map(renderTaskRow)}
                    </React.Fragment>
                  );
                })}
                {(() => {
                  const knownColIds = new Set(columns.map((c) => c.id));
                  const otherTasks = sortedTasks.filter((t) => !knownColIds.has(t.status));
                  if (otherTasks.length === 0) return null;
                  return (
                    <React.Fragment key="other-status">
                      <tr className="bg-slate-50/90 dark:bg-slate-800/70">
                        <td colSpan={7} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          Other ({otherTasks.length})
                        </td>
                      </tr>
                      {otherTasks.map(renderTaskRow)}
                    </React.Fragment>
                  );
                })()}
              </>
            ) : groupBy === 'priority' ? (
              ['urgent', 'high', 'medium', 'low'].map((p) => {
                const groupTasks = sortedTasks.filter((t) => t.priority === p);
                if (groupTasks.length === 0) return null;
                return (
                  <React.Fragment key={p}>
                    <tr className="bg-slate-50/90 dark:bg-slate-800/70">
                      <td colSpan={7} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        {p.toUpperCase()} Priority ({groupTasks.length})
                      </td>
                    </tr>
                    {groupTasks.map(renderTaskRow)}
                  </React.Fragment>
                );
              })
            ) : groupBy === 'assignee' ? (
              <>
                {members.map((m) => {
                  const u = m.user || m;
                  const groupTasks = sortedTasks.filter((t) => t.assignee?._id === u._id);
                  if (groupTasks.length === 0) return null;
                  return (
                    <React.Fragment key={u._id}>
                      <tr className="bg-slate-50/90 dark:bg-slate-800/70">
                        <td colSpan={7} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          {u.name || u.username} ({groupTasks.length})
                        </td>
                      </tr>
                      {groupTasks.map(renderTaskRow)}
                    </React.Fragment>
                  );
                })}
                {(() => {
                  const unassigned = sortedTasks.filter((t) => !t.assignee);
                  if (unassigned.length === 0) return null;
                  return (
                    <React.Fragment key="unassigned-group">
                      <tr className="bg-slate-50/90 dark:bg-slate-800/70">
                        <td colSpan={7} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          Unassigned ({unassigned.length})
                        </td>
                      </tr>
                      {unassigned.map(renderTaskRow)}
                    </React.Fragment>
                  );
                })()}
              </>
            ) : (
              sortedTasks.map(renderTaskRow)
            )}

            {tasks.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                  No tasks found in this project.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListView;
