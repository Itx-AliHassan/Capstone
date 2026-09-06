import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import projectApi from '../../services/projectApi';
import { joinProjectRoom, leaveProjectRoom } from '../../sockets/socket';
import { saveToCache, getFromCache } from '../../utils/indexedDb';

export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async ({ workspaceId, archived = false }, { rejectWithValue }) => {
    try {
      const res = await projectApi.getProjects(workspaceId, archived);
      const projects = res.data.data.projects;
      await saveToCache(`projects_${workspaceId}`, projects);
      return projects;
    } catch (error) {
      if (error.isOffline) {
        const cached = await getFromCache(`projects_${workspaceId}`);
        if (cached) return cached;
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch projects');
    }
  }
);

export const fetchTemplates = createAsyncThunk(
  'projects/fetchTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const res = await projectApi.getTemplates();
      return res.data.data.templates;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch templates');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (projectData, { rejectWithValue }) => {
    try {
      const res = await projectApi.createProject(projectData);
      return res.data.data.project;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await projectApi.updateProject(id, data);
      return res.data.data.project;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update project');
    }
  }
);

export const toggleArchiveProject = createAsyncThunk(
  'projects/toggleArchive',
  async (id, { rejectWithValue }) => {
    try {
      const res = await projectApi.toggleArchive(id);
      return res.data.data.project;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to archive project');
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (id, { rejectWithValue }) => {
    try {
      await projectApi.deleteProject(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete project');
    }
  }
);

export const updateProjectColumns = createAsyncThunk(
  'projects/updateColumns',
  async ({ id, columns }, { rejectWithValue }) => {
    try {
      const res = await projectApi.updateColumns(id, columns);
      return { id, columns: res.data.data.columns };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update columns');
    }
  }
);

const initialState = {
  projects: [],
  currentProject: null,
  templates: [],
  activeView: 'kanban', // 'kanban' | 'list' | 'calendar'
  loading: false,
  error: null,
};

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject: (state, action) => {
      const prevId = state.currentProject?._id;
      if (prevId) leaveProjectRoom(prevId);

      state.currentProject = action.payload;
      if (action.payload?._id) {
        joinProjectRoom(action.payload._id);
        const savedView = localStorage.getItem(`view_${action.payload._id}`);
        if (savedView) state.activeView = savedView;
      }
    },
    setActiveView: (state, action) => {
      state.activeView = action.payload;
      if (state.currentProject?._id) {
        localStorage.setItem(`view_${state.currentProject._id}`, action.payload);
      }
    },
    handleRealtimeProjectUpdate: (state, action) => {
      const updated = action.payload;
      const index = state.projects.findIndex((p) => p._id === updated._id);
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...updated };
      }
      if (state.currentProject?._id === updated._id) {
        state.currentProject = { ...state.currentProject, ...updated };
      }
    },
    handleRealtimeProjectDeleted: (state, action) => {
      const { projectId } = action.payload;
      state.projects = state.projects.filter((p) => p._id !== projectId);
      if (state.currentProject?._id === projectId) {
        state.currentProject = state.projects[0] || null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projects = action.payload;
        state.loading = false;
        if (action.payload.length > 0 && !state.currentProject) {
          state.currentProject = action.payload[0];
          joinProjectRoom(action.payload[0]._id);
        }
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Templates
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
      })

      // Create
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload);
        state.currentProject = action.payload;
        joinProjectRoom(action.payload._id);
      })

      // Update
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) state.projects[index] = action.payload;
        if (state.currentProject?._id === action.payload._id) {
          state.currentProject = action.payload;
        }
      })

      // Archive
      .addCase(toggleArchiveProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) state.projects[index] = action.payload;
        if (state.currentProject?._id === action.payload._id) {
          state.currentProject = action.payload;
        }
      })

      // Delete
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p._id !== action.payload);
        if (state.currentProject?._id === action.payload) {
          state.currentProject = state.projects[0] || null;
        }
      })

      // Columns
      .addCase(updateProjectColumns.fulfilled, (state, action) => {
        if (state.currentProject?._id === action.payload.id) {
          state.currentProject.columns = action.payload.columns;
        }
      });
  },
});

export const {
  setCurrentProject,
  setActiveView,
  handleRealtimeProjectUpdate,
  handleRealtimeProjectDeleted,
} = projectSlice.actions;

export default projectSlice.reducer;
