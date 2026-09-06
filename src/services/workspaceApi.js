import api from './api';

export const workspaceApi = {
  getWorkspaces: () => api.get('/workspaces'),
  getWorkspaceById: (id) => api.get(`/workspaces/${id}`),
  createWorkspace: (data) => api.post('/workspaces', data),
  updateWorkspace: (id, data) => api.put(`/workspaces/${id}`, data),
  deleteWorkspace: (id) => api.delete(`/workspaces/${id}`),

  // Members
  getMembers: (id) => api.get(`/workspaces/${id}/members`),
  addMember: (id, data) => api.post(`/workspaces/${id}/members`, data),
  updateMemberRole: (id, userId, role) =>
    api.put(`/workspaces/${id}/members/${userId}`, { role }),
  removeMember: (id, userId) =>
    api.delete(`/workspaces/${id}/members/${userId}`),

  // Import / Export
  exportWorkspace: (id) => api.get(`/workspaces/${id}/export`),
  importWorkspace: (id, data) => api.post(`/workspaces/${id}/import`, data),
  resetWorkspace: (id) => api.post(`/workspaces/${id}/reset`),
};

export default workspaceApi;
