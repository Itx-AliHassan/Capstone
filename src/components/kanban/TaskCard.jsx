import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar, Badge } from '../common/Badge';
import { formatDate, isDueSoon, isOverdue } from '../../utils/dateUtils';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';

export const TaskCard = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const priorityVariants = {
    urgent: 'danger',
    high: 'warning',
    medium: 'primary',
    low: 'default',
  };

  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.completed)?.length || 0;
  const attachmentsCount = task.attachments?.length || 0;

  const dueSoon = isDueSoon(task.dueDate);
  const overdue = isOverdue(task.dueDate, task.completed);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`p-3.5 rounded-2xl border bg-white dark:bg-slate-800/90 shadow-2xs hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing space-y-2.5 group ${
        isDragging
          ? 'opacity-40 ring-2 ring-indigo-500 scale-95'
          : 'border-slate-200 dark:border-slate-700/70 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {/* Labels & Priority */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant={priorityVariants[task.priority]} size="xs">
            {task.priority}
          </Badge>
          {(task.labels || []).slice(0, 2).map((lbl) => (
            <span
              key={lbl}
              className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded"
            >
              #{lbl}
            </span>
          ))}
        </div>

        {task.isOfflinePending && (
          <span className="text-[10px] text-amber-500 font-bold">● Offline</span>
        )}
      </div>

      {/* Title */}
      <h4
        className={`text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100 ${
          task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
        }`}
      >
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer Metadata: Subtasks, Attachments, Due Date, Assignee */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/40 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 text-[11px] font-medium ${
                overdue
                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                  : dueSoon
                  ? 'text-amber-600 dark:text-amber-400 font-semibold'
                  : ''
              }`}
            >
              <CalendarTodayOutlinedIcon fontSize="inherit" />
              <span>{formatDate(task.dueDate, 'MMM d')}</span>
            </div>
          )}

          {subtasksCount > 0 && (
            <div className="flex items-center gap-1 text-[11px]">
              <CheckBoxOutlinedIcon fontSize="inherit" />
              <span>
                {completedSubtasks}/{subtasksCount}
              </span>
            </div>
          )}

          {attachmentsCount > 0 && (
            <div className="flex items-center gap-0.5 text-[11px]">
              <AttachFileIcon fontSize="inherit" />
              <span>{attachmentsCount}</span>
            </div>
          )}
        </div>

        {task.assignee && (
          <Avatar
            src={task.assignee.avatar}
            name={task.assignee.name || task.assignee.username}
            size="xs"
          />
        )}
      </div>
    </div>
  );
};

export default TaskCard;
