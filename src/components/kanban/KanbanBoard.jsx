import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  optimisticMoveTask,
  revertOptimisticMove,
  patchTaskStatus,
} from '../../features/tasks/taskSlice';
import { updateProjectColumns } from '../../features/projects/projectSlice';
import { openModal } from '../../features/ui/uiSlice';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import Button from '../common/Button';
import usePermissions from '../../hooks/usePermissions';
import toast from 'react-hot-toast';

import AddIcon from '@mui/icons-material/Add';

export const KanbanBoard = ({ onTaskClick }) => {
  const dispatch = useDispatch();
  const { currentProject } = useSelector((state) => state.projects);
  const { tasks } = useSelector((state) => state.tasks);
  const { canEditTasks, canManageProjects } = usePermissions();

  const [activeTask, setActiveTask] = useState(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px drag threshold before activating drag
      },
    })
  );

  const columns = currentProject?.columns || [
    { id: 'col-backlog', name: 'Backlog', position: 0 },
    { id: 'col-todo', name: 'Todo', position: 1 },
    { id: 'col-in-progress', name: 'In Progress', position: 2 },
    { id: 'col-review', name: 'Review', position: 3 },
    { id: 'col-done', name: 'Done', position: 4 },
  ];

  // Group tasks by column status
  const tasksByColumn = columns.reduce((acc, col) => {
    acc[col.id] = tasks
      .filter((t) => t.status === col.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return acc;
  }, {});

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !canEditTasks) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const task = tasks.find((t) => t._id === activeId);
    if (!task) return;

    // Determine target column ID
    let targetColumnId = overId;
    const isOverColumn = columns.some((c) => c.id === overId);

    if (!isOverColumn) {
      // Dropped over another task; find that task's column
      const overTask = tasks.find((t) => t._id === overId);
      if (overTask) {
        targetColumnId = overTask.status;
      }
    }

    const previousStatus = task.status;
    const previousOrder = task.order || 0;

    if (previousStatus === targetColumnId) {
      // Reordering within same column
      return;
    }

    // 1. Optimistic Update in Redux
    dispatch(
      optimisticMoveTask({
        id: activeId,
        destinationStatus: targetColumnId,
        sourceStatus: previousStatus,
        destinationIndex: tasksByColumn[targetColumnId]?.length || 0,
        sourceIndex: previousOrder,
      })
    );

    // 2. Synchronize with Backend
    try {
      await dispatch(
        patchTaskStatus({
          id: activeId,
          status: targetColumnId,
          order: tasksByColumn[targetColumnId]?.length || 0,
        })
      ).unwrap();
    } catch (err) {
      // 3. Rollback on failure with toast
      dispatch(
        revertOptimisticMove({
          id: activeId,
          previousStatus,
          previousIndex: previousOrder,
        })
      );
      toast.error('Failed to move task. Reverting position.');
    }
  };

  const handleCreateColumn = async (e) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    const newColId = `col-${Date.now()}`;
    const updatedColumns = [
      ...columns,
      { id: newColId, name: newColumnName.trim(), position: columns.length },
    ];

    try {
      await dispatch(
        updateProjectColumns({
          id: currentProject._id,
          columns: updatedColumns,
        })
      ).unwrap();
      setNewColumnName('');
      setShowAddColumn(false);
      toast.success('Column created');
    } catch (err) {
      toast.error('Failed to add column');
    }
  };

  const handleRenameColumn = async (colId, newName) => {
    const updatedColumns = columns.map((c) =>
      c.id === colId ? { ...c, name: newName } : c
    );
    try {
      await dispatch(
        updateProjectColumns({ id: currentProject._id, columns: updatedColumns })
      ).unwrap();
      toast.success('Column renamed');
    } catch (err) {
      toast.error('Failed to rename column');
    }
  };

  const handleDeleteColumn = async (colId) => {
    if (columns.length <= 1) {
      toast.error('A project must have at least one column');
      return;
    }
    const updatedColumns = columns.filter((c) => c.id !== colId);
    try {
      await dispatch(
        updateProjectColumns({ id: currentProject._id, columns: updatedColumns })
      ).unwrap();
      toast.success('Column removed');
    } catch (err) {
      toast.error('Failed to remove column');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 h-full items-start">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id] || []}
            onTaskClick={onTaskClick}
            onAddTask={(colId) =>
              dispatch(openModal({ modalName: 'createTask', props: { initialStatus: colId } }))
            }
            onRenameColumn={handleRenameColumn}
            onDeleteColumn={handleDeleteColumn}
            canEdit={canEditTasks}
          />
        ))}

        {/* Add Column Button / Form */}
        {canManageProjects && (
          <div className="w-72 shrink-0">
            {showAddColumn ? (
              <form
                onSubmit={handleCreateColumn}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm"
              >
                <input
                  autoFocus
                  type="text"
                  placeholder="Column name..."
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddColumn(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Add
                  </Button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddColumn(true)}
                className="w-full py-3 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center gap-2 text-xs font-semibold transition-all hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                <AddIcon fontSize="small" />
                Add Column
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 scale-105 shadow-2xl opacity-90">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
