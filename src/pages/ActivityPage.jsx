import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { ActivityFeed } from '../components/activity/ActivityFeed';
import { fetchWorkspaces } from '../features/workspaces/workspaceSlice';

import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';

const ActivityPage = () => {
  const { workspaceId: urlWorkspaceId } = useParams();
  const dispatch = useDispatch();
  const { currentWorkspace } = useSelector((state) => state.workspaces);

  useEffect(() => {
    if (!currentWorkspace) {
      dispatch(fetchWorkspaces());
    }
  }, [dispatch, currentWorkspace]);

  const wsId = urlWorkspaceId || currentWorkspace?._id;

  return (
    <div className="p-4 sm:p-6 xl:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <HistoryOutlinedIcon />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Activity Feed</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Recent actions in{' '}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {currentWorkspace?.name || 'your workspace'}
            </span>
          </p>
        </div>
      </div>

      {wsId ? (
        <ActivityFeed />
      ) : (
        <div className="text-center py-16 text-slate-400">
          <HistoryOutlinedIcon style={{ fontSize: 48 }} className="mb-3 opacity-30" />
          <p className="text-sm">Select a workspace to view activity</p>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
