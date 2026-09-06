import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import workspaceApi from '../../services/workspaceApi';
import { joinWorkspaceRoom, leaveWorkspaceRoom } from '../../sockets/socket';
import { saveToCache, getFromCache } from '../../utils/indexedDb';

export const fetchWorkspaces = createAsyncThunk(
  'workspaces/fetchWorkspaces',
  async (_, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.getWorkspaces();
      const workspaces = res.data.data.workspaces;
      await saveToCache('workspaces', workspaces);
      return workspaces;
    } catch (error) {
      if (error.isOffline) {
        const cached = await getFromCache('workspaces');
        if (cached) return cached;
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workspaces');
    }
  }
);

export const createWorkspace = createAsyncThunk(
  'workspaces/createWorkspace',
  async (workspaceData, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.createWorkspace(workspaceData);
      return res.data.data.workspace;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create workspace');
    }
  }
);

export const updateWorkspace = createAsyncThunk(
  'workspaces/updateWorkspace',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.updateWorkspace(id, data);
      return res.data.data.workspace;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update workspace');
    }
  }
);

export const deleteWorkspace = createAsyncThunk(
  'workspaces/deleteWorkspace',
  async (id, { rejectWithValue }) => {
    try {
      await workspaceApi.deleteWorkspace(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete workspace');
    }
  }
);

export const addWorkspaceMember = createAsyncThunk(
  'workspaces/addMember',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.addMember(id, data);
      return { id, members: res.data.data.members };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add member');
    }
  }
);

export const updateMemberRole = createAsyncThunk(
  'workspaces/updateMemberRole',
  async ({ id, userId, role }, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.updateMemberRole(id, userId, role);
      return { id, members: res.data.data.members };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update role');
    }
  }
);

export const removeWorkspaceMember = createAsyncThunk(
  'workspaces/removeMember',
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      const res = await workspaceApi.removeMember(id, userId);
      return { id, members: res.data.data.members };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove member');
    }
  }
);

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  loading: false,
  error: null,
};

const workspaceSlice = createSlice({
  name: 'workspaces',
  initialState,
  reducers: {
    setCurrentWorkspace: (state, action) => {
      const prevId = state.currentWorkspace?._id;
      if (prevId) leaveWorkspaceRoom(prevId);

      state.currentWorkspace = action.payload;
      if (action.payload?._id) {
        joinWorkspaceRoom(action.payload._id);
        localStorage.setItem('lastWorkspaceId', action.payload._id);
      }
    },
    handleRealtimeWorkspaceUpdate: (state, action) => {
      const updated = action.payload;
      const index = state.workspaces.findIndex((w) => w._id === updated._id);
      if (index !== -1) {
        state.workspaces[index] = { ...state.workspaces[index], ...updated };
      }
      if (state.currentWorkspace?._id === updated._id) {
        state.currentWorkspace = { ...state.currentWorkspace, ...updated };
      }
    },
    handleRealtimeMemberUpdate: (state, action) => {
      const { workspaceId, members } = action.payload;
      if (state.currentWorkspace?._id === workspaceId) {
        state.currentWorkspace.members = members;
      }
      const index = state.workspaces.findIndex((w) => w._id === workspaceId);
      if (index !== -1) {
        state.workspaces[index].members = members;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.workspaces = action.payload;
        state.loading = false;

        // Restore last workspace or set first
        const savedId = localStorage.getItem('lastWorkspaceId');
        const found = action.payload.find((w) => w._id === savedId);
        if (found) {
          state.currentWorkspace = found;
          joinWorkspaceRoom(found._id);
        } else if (action.payload.length > 0 && !state.currentWorkspace) {
          state.currentWorkspace = action.payload[0];
          joinWorkspaceRoom(action.payload[0]._id);
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.workspaces.unshift(action.payload);
        state.currentWorkspace = action.payload;
        joinWorkspaceRoom(action.payload._id);
        localStorage.setItem('lastWorkspaceId', action.payload._id);
      })

      // Update
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        const index = state.workspaces.findIndex((w) => w._id === action.payload._id);
        if (index !== -1) state.workspaces[index] = action.payload;
        if (state.currentWorkspace?._id === action.payload._id) {
          state.currentWorkspace = action.payload;
        }
      })

      // Delete
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.workspaces = state.workspaces.filter((w) => w._id !== action.payload);
        if (state.currentWorkspace?._id === action.payload) {
          state.currentWorkspace = state.workspaces[0] || null;
        }
      })

      // Members
      .addCase(addWorkspaceMember.fulfilled, (state, action) => {
        if (state.currentWorkspace?._id === action.payload.id) {
          state.currentWorkspace.members = action.payload.members;
        }
      })
      .addCase(updateMemberRole.fulfilled, (state, action) => {
        if (state.currentWorkspace?._id === action.payload.id) {
          state.currentWorkspace.members = action.payload.members;
        }
      })
      .addCase(removeWorkspaceMember.fulfilled, (state, action) => {
        if (state.currentWorkspace?._id === action.payload.id) {
          state.currentWorkspace.members = action.payload.members;
        }
      });
  },
});

export const {
  setCurrentWorkspace,
  handleRealtimeWorkspaceUpdate,
  handleRealtimeMemberUpdate,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
