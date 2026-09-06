import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import commentApi from '../../services/commentApi';

export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await commentApi.getComments(taskId);
      return res.data.data.comments;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load comments');
    }
  }
);

export const createComment = createAsyncThunk(
  'comments/createComment',
  async ({ taskId, content, mentions }, { rejectWithValue }) => {
    try {
      const res = await commentApi.createComment(taskId, { content, mentions });
      return res.data.data.comment;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
    }
  }
);

export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ id, content }, { rejectWithValue }) => {
    try {
      const res = await commentApi.updateComment(id, content);
      return res.data.data.comment;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update comment');
    }
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async (id, { rejectWithValue }) => {
    try {
      await commentApi.deleteComment(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete comment');
    }
  }
);

const initialState = {
  comments: [],
  loading: false,
  error: null,
};

const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearComments: (state) => {
      state.comments = [];
    },
    handleRealtimeCommentCreated: (state, action) => {
      const { comment } = action.payload;
      const exists = state.comments.some((c) => c._id === comment._id);
      if (!exists) {
        state.comments.push(comment);
      }
    },
    handleRealtimeCommentUpdated: (state, action) => {
      const { comment } = action.payload;
      const index = state.comments.findIndex((c) => c._id === comment._id);
      if (index !== -1) {
        state.comments[index] = comment;
      }
    },
    handleRealtimeCommentDeleted: (state, action) => {
      const { commentId } = action.payload;
      state.comments = state.comments.filter((c) => c._id !== commentId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.comments = action.payload;
        state.loading = false;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        const exists = state.comments.some((c) => c._id === action.payload._id);
        if (!exists) state.comments.push(action.payload);
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        const index = state.comments.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) state.comments[index] = action.payload;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.comments = state.comments.filter((c) => c._id !== action.payload);
      });
  },
});

export const {
  clearComments,
  handleRealtimeCommentCreated,
  handleRealtimeCommentUpdated,
  handleRealtimeCommentDeleted,
} = commentSlice.actions;

export default commentSlice.reducer;
