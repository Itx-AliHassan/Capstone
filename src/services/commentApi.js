import api from './api';

export const commentApi = {
  getComments: (taskId) => api.get(`/comments/task/${taskId}`),
  createComment: (taskId, data) => api.post(`/comments/task/${taskId}`, data),
  updateComment: (id, content) => api.put(`/comments/${id}`, { content }),
  deleteComment: (id) => api.delete(`/comments/${id}`),
};

export default commentApi;
