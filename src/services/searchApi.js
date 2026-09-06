import api from './api';

export const searchApi = {
  globalSearch: (q, workspaceId) =>
    api.get('/search', { params: { q, workspaceId } }),
};

export default searchApi;
