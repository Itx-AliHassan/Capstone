import api from './api';

export const taskApi = {
  getTasks: (projectId, params = {}) =>
    api.get(`/tasks/project/${projectId}`, { params }),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  patchStatus: (id, status, order) =>
    api.patch(`/tasks/${id}/status`, { status, order }),
  patchAssignee: (id, assignee) =>
    api.patch(`/tasks/${id}/assignee`, { assignee }),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  duplicateTask: (id) => api.post(`/tasks/${id}/duplicate`),
  convertTask: (id, targetParentId = null) =>
    api.post(`/tasks/${id}/convert`, { targetParentId }),
  createSubtask: (id, title) =>
    api.post(`/tasks/${id}/subtasks`, { title }),

  // Bulk
  bulkUpdate: (data) => api.patch('/tasks/bulk', data),
  bulkDelete: (taskIds) => api.delete('/tasks/bulk', { data: { taskIds } }),

  // Attachments
  uploadAttachment: (formData) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteAttachment: (taskId, attachmentId) =>
    api.delete(`/upload/${taskId}/${attachmentId}`),
};

export default taskApi;
