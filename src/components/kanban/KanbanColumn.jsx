import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

export const KanbanColumn = ({
  column,
  tasks = [],
  onTaskClick,
  onAddTask,
  onRenameColumn,
  onDeleteColumn,
  canEdit = true,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(column.name);

  const handleRename = (e) => {
    e.preventDefault();
    if (name.trim() && name !== column.name) {
      onRenameColumn(column.id, name.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`w-72 sm:w-80 shrink-0 flex flex-col max-h-full rounded-2xl bg-slate-100/70 dark:bg-slate-900/50 border transition-colors ${
        isOver
          ? 'border-indigo-500/80 bg-indigo-50/20 dark:bg-indigo-950/20'
          : 'border-slate-200/80 dark:border-slate-800/80'
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleRename} className="flex-1">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleRename}
                className="w-full px-2 py-0.5 text-xs font-bold rounded bg-white dark:bg-slate-800 border border-indigo-500 text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </form>
          ) : (
            <h3
              onClick={() => canEdit && setIsEditing(true)}
              className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate cursor-pointer hover:text-indigo-600"
            >
              {column.name}
            </h3>
          )}

          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {canEdit && (
            <button
              onClick={() => onAddTask(column.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Add task to column"
            >
              <AddIcon fontSize="small" />
            </button>
          )}

          {canEdit && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <MoreHorizIcon fontSize="small" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 z-30 text-xs">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setIsEditing(true);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      Rename Column
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteColumn(column.id);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600"
                    >
                      Delete Column
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Cards Container */}
      <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5 min-h-[150px]">
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onClick={() => onTaskClick(task._id)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl">
            No tasks in this column
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
