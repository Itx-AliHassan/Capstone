import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchWorkspaces } from '../features/workspaces/workspaceSlice';
import { fetchProjects, setCurrentProject } from '../features/projects/projectSlice';
import { fetchTasks } from '../features/tasks/taskSlice';
import { fetchNotifications } from '../features/notifications/notificationSlice';
import { openModal } from '../features/ui/uiSlice';
import { EmptyState, Skeleton } from '../components/common/CommonStates';
import Button from '../components/common/Button';
import usePermissions from '../hooks/usePermissions';

import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AddIcon from '@mui/icons-material/Add';

const StatCard = ({ icon, label, value, color = 'indigo', loading }) => {
  const colorMap = {
    indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 text-indigo-500',
    violet: 'from-violet-500/10 to-violet-600/5 border-violet-500/20 text-violet-500',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-500',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-500',
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 ${colorMap[color]}`}
    >
      {loading ? (
        <Skeleton className="h-16" />
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-xl bg-current/10`}>{icon}</div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</div>
        </>
      )}
    </div>
  );
};

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const { projects, loading: projectsLoading } = useSelector((state) => state.projects);
  const { tasks, loading: tasksLoading } = useSelector((state) => state.tasks);
  const { canManageProjects } = usePermissions();

  // Fetch workspace data on mount / workspace change
  useEffect(() => {
    if (currentWorkspace?._id) {
      dispatch(fetchProjects({ workspaceId: currentWorkspace._id }));
      dispatch(fetchNotifications());
    }
  }, [dispatch, currentWorkspace?._id]);

  // Fetch tasks for current project when projects load
  const currentProject = useSelector((state) => state.projects.currentProject);
  useEffect(() => {
    if (currentProject?._id) {
      dispatch(fetchTasks({ projectId: currentProject._id }));
    }
  }, [dispatch, currentProject?._id]);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const members = currentWorkspace?.members?.length || 0;

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const priorityColors = {
    critical: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
    high: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    medium: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
    low: 'bg-slate-500/10 text-slate-500 border border-slate-500/20',
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {currentWorkspace ? (
              <>
                {currentWorkspace.icon}{' '}
                <span className="ml-1">{currentWorkspace.name}</span>
              </>
            ) : (
              'Dashboard'
            )}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of your workspace activity
          </p>
        </div>
        {canManageProjects && (
          <Button
            onClick={() => dispatch(openModal({ modalName: 'createProject' }))}
            size="sm"
          >
            <AddIcon style={{ fontSize: 16 }} className="mr-1" />
            New Project
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderOutlinedIcon />}
          label="Total Projects"
          value={projects.length}
          color="indigo"
          loading={projectsLoading}
        />
        <StatCard
          icon={<AssignmentOutlinedIcon />}
          label="Total Tasks"
          value={tasks.length}
          color="violet"
          loading={tasksLoading}
        />
        <StatCard
          icon={<CheckCircleOutlineIcon />}
          label="Completed"
          value={completedTasks}
          color="emerald"
          loading={tasksLoading}
        />
        <StatCard
          icon={<GroupsOutlinedIcon />}
          label="Members"
          value={members}
          color="amber"
          loading={false}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PendingActionsOutlinedIcon className="text-indigo-500" style={{ fontSize: 18 }} />
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Recent Tasks
              </h3>
            </div>
            {tasks.length > 0 && (
              <span className="text-xs text-slate-400">{tasks.length} total</span>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasksLoading ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<AssignmentOutlinedIcon />}
                  title="No tasks yet"
                  description="Create a project and add tasks to see them here."
                  action={
                    <Button
                      size="sm"
                      onClick={() => dispatch(openModal({ modalName: 'createTask' }))}
                    >
                      Create Task
                    </Button>
                  }
                />
              </div>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      task.completed ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm truncate ${
                        task.completed
                          ? 'line-through text-slate-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {task.title}
                    </p>
                  </div>
                  {task.priority && (
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        priorityColors[task.priority] || priorityColors.low
                      }`}
                    >
                      {task.priority}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <FolderOutlinedIcon className="text-violet-500" style={{ fontSize: 18 }} />
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Projects ({projects.length})
              </h3>
            </div>
            {canManageProjects && (
              <Button
                id="create-new-project-btn"
                size="sm"
                variant="primary"
                onClick={() => dispatch(openModal({ modalName: 'createProject' }))}
              >
                <AddIcon style={{ fontSize: 16 }} className="mr-1" />
                + Create New Project
              </Button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {projectsLoading ? (
              <div className="p-5 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-slate-400">No projects yet.</p>
                {canManageProjects && (
                  <Button
                    id="empty-create-project-btn"
                    size="sm"
                    variant="primary"
                    className="mt-3"
                    onClick={() => dispatch(openModal({ modalName: 'createProject' }))}
                  >
                    <AddIcon style={{ fontSize: 16 }} className="mr-1" />
                    + Create New Project
                  </Button>
                )}
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project._id}
                  onClick={() => {
                    dispatch(setCurrentProject(project));
                    navigate(`/project/${project._id}`);
                  }}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-sm"
                    style={{ backgroundColor: project.color || '#6366f1' }}
                  >
                    {project.icon || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {project.name}
                    </p>
                    {project.archived && (
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        Archived
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
