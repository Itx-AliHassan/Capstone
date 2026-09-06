import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import activityApi from '../../services/activityApi';

export const fetchWorkspaceActivities = createAsyncThunk(
  'activity/fetchWorkspaceActivities',
  async ({ workspaceId, params = {} }, { rejectWithValue }) => {
    try {
      const res = await activityApi.getWorkspaceActivity(workspaceId, params);
      return res.data.data.activities;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load activity');
    }
  }
);

export const fetchProjectActivities = createAsyncThunk(
  'activity/fetchProjectActivities',
  async ({ projectId, params = {} }, { rejectWithValue }) => {
    try {
      const res = await activityApi.getProjectActivity(projectId, params);
      return res.data.data.activities;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load project activity');
    }
  }
);

const initialState = {
  activities: [],
  loading: false,
  error: null,
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    handleRealtimeActivity: (state, action) => {
      state.activities.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaceActivities.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkspaceActivities.fulfilled, (state, action) => {
        state.activities = action.payload;
        state.loading = false;
      })
      .addCase(fetchWorkspaceActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProjectActivities.fulfilled, (state, action) => {
        state.activities = action.payload;
        state.loading = false;
      });
  },
});

export const { handleRealtimeActivity } = activitySlice.actions;
export default activitySlice.reducer;
