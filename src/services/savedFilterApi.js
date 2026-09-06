import api from './api';

export const savedFilterApi = {
  getSavedFilters: (projectId) => api.get(`/saved-filters/project/${projectId}`),
  createSavedFilter: (data) => api.post('/saved-filters', data),
  deleteSavedFilter: (id) => api.delete(`/saved-filters/${id}`),
};

export default savedFilterApi;
