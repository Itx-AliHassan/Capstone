import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkspaceActivities } from '../../features/activity/activitySlice';
import { Avatar, Badge } from '../common/Badge';
import { formatRelativeTime } from '../../utils/dateUtils';

export const ActivityFeed = () => {
  const dispatch = useDispatch();
  const { activities, loading } = useSelector((state) => state.activity);
  const { currentWorkspace } = useSelector((state) => state.workspaces);

  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');

  useEffect(() => {
    if (currentWorkspace?._id) {
      dispatch(
        fetchWorkspaceActivities({
          workspaceId: currentWorkspace._id,
          params: { action: filterAction || undefined, user: filterUser || undefined },
        })
      );
    }
  }, [currentWorkspace, filterAction, filterUser, dispatch]);

  const members = currentWorkspace?.members || [];

  const formatActionDescription = (act) => {
    switch (act.action) {
      case 'TASK_CREATED':
        return `created task "${act.metadata?.title || 'a task'}"`;
      case 'TASK_UPDATED':
        return `updated task "${act.metadata?.title || 'a task'}"`;
      case 'TASK_MOVED':
        return `moved "${act.metadata?.title || 'task'}" to ${act.metadata?.to?.replace('col-', '') || 'new column'}`;
      case 'TASK_DELETED':
        return `deleted task "${act.metadata?.title || 'a task'}"`;
      case 'COMMENT_CREATED':
        return `commented on task "${act.metadata?.taskTitle || 'a task'}"`;
      case 'PROJECT_CREATED':
        return `created project "${act.metadata?.name || 'a project'}"`;
      case 'PROJECT_UPDATED':
        return `updated project "${act.metadata?.name || 'a project'}"`;
      case 'WORKSPACE_CREATED':
        return `created workspace "${act.metadata?.name || 'this workspace'}"`;
      case 'MEMBER_ADDED':
        return `added ${act.metadata?.addedUserName || 'a member'} as ${act.metadata?.role || 'member'}`;
      case 'MEMBER_ROLE_CHANGED':
        return `updated a member role to ${act.metadata?.newRole}`;
      case 'WORKSPACE_RESET':
        return `reset workspace data`;
      case 'WORKSPACE_IMPORTED':
        return `imported workspace dataset`;
      default:
        return act.action.toLowerCase().replace(/_/g, ' ');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Filter User:</span>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="">All Users</option>
            {members.map((m) => {
              const u = m.user || m;
              return (
                <option key={u._id} value={u._id}>
                  {u.name || u.username}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Action Type:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="">All Actions</option>
            <option value="TASK_CREATED">Task Created</option>
            <option value="TASK_MOVED">Task Moved</option>
            <option value="TASK_UPDATED">Task Updated</option>
            <option value="COMMENT_CREATED">Comment Added</option>
            <option value="PROJECT_CREATED">Project Created</option>
            <option value="MEMBER_ADDED">Member Added</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No activity recorded matching criteria.
          </div>
        ) : (
          activities.map((act) => (
            <div key={act._id} className="py-3 flex items-start gap-3 text-xs">
              <Avatar src={act.user?.avatar} name={act.user?.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 dark:text-slate-100 font-medium">
                  <span className="font-bold">{act.user?.name || 'Someone'}</span>{' '}
                  <span className="text-slate-600 dark:text-slate-300">
                    {formatActionDescription(act)}
                  </span>
                </p>
                {act.project?.name && (
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block mt-0.5">
                    in {act.project.name}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 block mt-1">
                  {formatRelativeTime(act.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
