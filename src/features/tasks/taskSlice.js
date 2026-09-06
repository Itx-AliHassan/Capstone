import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import taskApi from '../../services/taskApi';
import { saveToCache, getFromCache, enqueueMutation } from '../../utils/indexedDb';

export const fetchTasks = createAsyncThunk(
  'tasks/fetchTasks',
  async ({ projectId, params = {} }, { rejectWithValue }) => {
    try {
      const res = await taskApi.getTasks(projectId, params);
      const tasks = res.data.data.tasks;
      await saveToCache(`tasks_${projectId}`, tasks);
      return tasks;
    } catch (error) {
      if (error.isOffline) {
        const cached = await getFromCache(`tasks_${projectId}`);
        if (cached) return cached;
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const res = await taskApi.createTask(taskData);
      return res.data.data.task;
    } catch (error) {
      if (!navigator.onLine) {
        // Enqueue offline creation
        await enqueueMutation({
          type: 'CREATE_TASK',
          endpoint: '/tasks',
          method: 'POST',
          payload: taskData,
        });
        // Generate temporary optimistic task
        return {
          _id: `temp_${Date.now()}`,
          ...taskData,
          completed: false,
          subtasks: [],
          attachments: [],
          createdAt: new Date().toISOString(),
          isOfflinePending: true,
        };
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/updateTask',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await taskApi.updateTask(id, data);
      return res.data.data.task;
    } catch (error) {
      if (!navigator.onLine) {
        await enqueueMutation({
          type: 'UPDATE_TASK',
          endpoint: `/tasks/${id}`,
          method: 'PUT',
          payload: data,
        });
        return { _id: id, ...data, isOfflinePending: true };
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const patchTaskStatus = createAsyncThunk(
  'tasks/patchStatus',
  async ({ id, status, order }, { rejectWithValue }) => {
    try {
      const res = await taskApi.patchStatus(id, status, order);
      return res.data.data.task;
    } catch (error) {
      if (!navigator.onLine) {
        await enqueueMutation({
          type: 'PATCH_STATUS',
          endpoint: `/tasks/${id}/status`,
          method: 'PATCH',
          payload: { status, order },
        });
        return { _id: id, status, order, isOfflinePending: true };
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to move task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await taskApi.deleteTask(id);
      return id;
    } catch (error) {
      if (!navigator.onLine) {
        await enqueueMutation({
          type: 'DELETE_TASK',
          endpoint: `/tasks/${id}`,
          method: 'DELETE',
        });
        return id;
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

export const duplicateTask = createAsyncThunk(
  'tasks/duplicateTask',
  async (id, { rejectWithValue }) => {
    try {
      const res = await taskApi.duplicateTask(id);
      return res.data.data.task;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to duplicate task');
    }
  }
);

export const createSubtask = createAsyncThunk(
  'tasks/createSubtask',
  async ({ taskId, title }, { rejectWithValue }) => {
    try {
      const res = await taskApi.createSubtask(taskId, title);
      return res.data.data.parentTask;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create subtask');
    }
  }
);

export const bulkUpdateTasks = createAsyncThunk(
  'tasks/bulkUpdate',
  async (bulkData, { rejectWithValue }) => {
    try {
      const res = await taskApi.bulkUpdate(bulkData);
      return res.data.data.tasks;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed bulk update');
    }
  }
);

export const bulkDeleteTasks = createAsyncThunk(
  'tasks/bulkDelete',
  async (taskIds, { rejectWithValue }) => {
    try {
      await taskApi.bulkDelete(taskIds);
      return taskIds;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed bulk delete');
    }
  }
);

const initialState = {
  tasks: [],
  selectedTask: null,
  loading: false,
  error: null,
  filters: {
    status: '',
    priority: '',
    assignee: '',
    label: '',
    search: '',
    sortBy: 'createdAt',
    order: 'desc',
  },
  // Undo/Redo stack for optimistic operations
  undoStack: [],
  redoStack: [],
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setSelectedTask: (state, action) => {
      state.selectedTask = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Optimistic Move & Rollback
    optimisticMoveTask: (state, action) => {
      const { id, destinationStatus, sourceStatus, destinationIndex, sourceIndex } = action.payload;
      const taskIndex = state.tasks.findIndex((t) => t._id === id);

      if (taskIndex !== -1) {
        // Save for undo / rollback
        const originalTask = { ...state.tasks[taskIndex] };
        state.undoStack.push({
          type: 'MOVE_TASK',
          task: originalTask,
          previousStatus: sourceStatus,
          previousIndex: sourceIndex,
        });

        // Apply optimistic change
        state.tasks[taskIndex].status = destinationStatus;
        state.tasks[taskIndex].order = destinationIndex;
        if (destinationStatus === 'col-done' || destinationStatus.toLowerCase().includes('done')) {
          state.tasks[taskIndex].completed = true;
        }
      }
    },
    revertOptimisticMove: (state, action) => {
      const { id, previousStatus, previousIndex } = action.payload;
      const taskIndex = state.tasks.findIndex((t) => t._id === id);
      if (taskIndex !== -1) {
        state.tasks[taskIndex].status = previousStatus;
        state.tasks[taskIndex].order = previousIndex;
      }
    },

    // Undo action
    undoLastAction: (state) => {
      if (state.undoStack.length === 0) return;
      const action = state.undoStack.pop();

      if (action.type === 'MOVE_TASK') {
        const taskIndex = state.tasks.findIndex((t) => t._id === action.task._id);
        if (taskIndex !== -1) {
          state.tasks[taskIndex].status = action.previousStatus;
          state.tasks[taskIndex].order = action.previousIndex;
        }
      } else if (action.type === 'DELETE_TASK') {
        state.tasks.push(action.task);
      } else if (action.type === 'UPDATE_TASK') {
        const index = state.tasks.findIndex((t) => t._id === action.task._id);
        if (index !== -1) {
          state.tasks[index] = action.task;
        }
      }
    },

    // Push delete to undo stack
    registerDeleteForUndo: (state, action) => {
      const task = state.tasks.find((t) => t._id === action.payload);
      if (task) {
        state.undoStack.push({
          type: 'DELETE_TASK',
          task: { ...task },
        });
      }
    },

    // Realtime Socket updates
    handleRealtimeTaskCreated: (state, action) => {
      const newTask = action.payload;
      const exists = state.tasks.some((t) => t._id === newTask._id);
      if (!exists) {
        state.tasks.unshift(newTask);
      }
    },
    handleRealtimeTaskUpdated: (state, action) => {
      const updated = action.payload;
      const index = state.tasks.findIndex((t) => t._id === updated._id);
      if (index !== -1) {
        state.tasks[index] = updated;
      }
      if (state.selectedTask?._id === updated._id) {
        state.selectedTask = updated;
      }
    },
    handleRealtimeTaskMoved: (state, action) => {
      const { taskId, status, order, completed, task } = action.payload;
      const index = state.tasks.findIndex((t) => t._id === taskId);
      if (index !== -1) {
        if (task) {
          state.tasks[index] = task;
        } else {
          state.tasks[index].status = status;
          if (order !== undefined) state.tasks[index].order = order;
          if (completed !== undefined) state.tasks[index].completed = completed;
        }
      }
    },
    handleRealtimeTaskDeleted: (state, action) => {
      const { taskId } = action.payload;
      state.tasks = state.tasks.filter((t) => t._id !== taskId);
      if (state.selectedTask?._id === taskId) {
        state.selectedTask = null;
      }
    },
    handleRealtimeBulkUpdated: (state, action) => {
      const { tasks } = action.payload;
      tasks.forEach((updated) => {
        const index = state.tasks.findIndex((t) => t._id === updated._id);
        if (index !== -1) state.tasks[index] = updated;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.tasks = action.payload;
        state.loading = false;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createTask.fulfilled, (state, action) => {
        // Remove temporary if replacing
        state.tasks = state.tasks.filter(
          (t) => !t._id.toString().startsWith('temp_')
        );
        state.tasks.unshift(action.payload);
      })

      // Update
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) state.tasks[index] = action.payload;
        if (state.selectedTask?._id === action.payload._id) {
          state.selectedTask = action.payload;
        }
      })

      // Patch Status
      .addCase(patchTaskStatus.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) state.tasks[index] = action.payload;
      })

      // Delete
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
        if (state.selectedTask?._id === action.payload) {
          state.selectedTask = null;
        }
      })

      // Duplicate
      .addCase(duplicateTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
      })

      // Subtask
      .addCase(createSubtask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) state.tasks[index] = action.payload;
        if (state.selectedTask?._id === action.payload._id) {
          state.selectedTask = action.payload;
        }
      })

      // Bulk Update
      .addCase(bulkUpdateTasks.fulfilled, (state, action) => {
        action.payload.forEach((updated) => {
          const index = state.tasks.findIndex((t) => t._id === updated._id);
          if (index !== -1) state.tasks[index] = updated;
        });
      })

      // Bulk Delete
      .addCase(bulkDeleteTasks.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => !action.payload.includes(t._id));
      });
  },
});

export const {
  setSelectedTask,
  setFilters,
  resetFilters,
  optimisticMoveTask,
  revertOptimisticMove,
  undoLastAction,
  registerDeleteForUndo,
  handleRealtimeTaskCreated,
  handleRealtimeTaskUpdated,
  handleRealtimeTaskMoved,
  handleRealtimeTaskDeleted,
  handleRealtimeBulkUpdated,
} = taskSlice.actions;

export default taskSlice.reducer;
