import api from './api';

export const projectApi = {
  getTemplates: () => api.get('/projects/templates'),
  getProjects: (workspaceId, archived = false) =>
    api.get(`/projects/workspace/${workspaceId}`, { params: { archived } }),
  getProjectById: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  toggleArchive: (id) => api.patch(`/projects/${id}/archive`),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  updateColumns: (id, columns) => api.put(`/projects/${id}/columns`, { columns }),

  // Members
  addMember: (id, userId) => api.post(`/projects/${id}/members`, { userId }),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};

export default projectApi;
