import api from './api';

export const activityApi = {
  getWorkspaceActivity: (workspaceId, params = {}) =>
    api.get(`/activity/workspace/${workspaceId}`, { params }),
  getProjectActivity: (projectId, params = {}) =>
    api.get(`/activity/project/${projectId}`, { params }),
  getTaskActivity: (taskId) => api.get(`/activity/task/${taskId}`),
};

export default activityApi;
