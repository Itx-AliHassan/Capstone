import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchTasks, setFilters, resetFilters } from '../features/tasks/taskSlice';
import { setCurrentProject, setActiveView } from '../features/projects/projectSlice';
import { openModal } from '../features/ui/uiSlice';
import projectApi from '../services/projectApi';
import KanbanBoard from '../components/kanban/KanbanBoard';
import ListView from '../components/list/ListView';
import CalendarView from '../components/calendar/CalendarView';
import TaskDetailModal from '../components/task/TaskDetailModal';
import Button from '../components/common/Button';
import { Skeleton } from '../components/common/CommonStates';
import usePermissions from '../hooks/usePermissions';
import toast from 'react-hot-toast';

import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const VIEWS = [
  { key: 'kanban', label: 'Kanban', Icon: ViewKanbanOutlinedIcon },
  { key: 'list', label: 'List', Icon: FormatListBulletedIcon },
  { key: 'calendar', label: 'Calendar', Icon: CalendarTodayOutlinedIcon },
];

const PRIORITY_OPTIONS = ['', 'critical', 'high', 'medium', 'low'];
const STATUS_OPTIONS_PLACEHOLDER = '';

const ProjectPage = () => {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { projects, currentProject, activeView } = useSelector((state) => state.projects);
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const { tasks, loading, filters } = useSelector((state) => state.tasks);
  const { canEditTasks, canManageProjects } = usePermissions();

  const [selectedTask, setSelectedTask] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [fetchingProject, setFetchingProject] = useState(false);

  // Direct Project Refresh & Sync:
  // Find project in Redux or fetch directly from API to prevent premature redirects
  useEffect(() => {
    if (!projectId) return;

    if (currentProject?._id === projectId) return;

    if (projects.length > 0) {
      const found = projects.find((p) => p._id === projectId);
      if (found) {
        dispatch(setCurrentProject(found));
        return;
      }
    }

    // Direct fetch fallback for refresh or unlisted projects
    let isMounted = true;
    setFetchingProject(true);

    projectApi
      .getProjectById(projectId)
      .then((res) => {
        if (!isMounted) return;
        const project = res.data?.data?.project || res.data?.project;
        if (project) {
          dispatch(setCurrentProject(project));
        } else {
          toast.error('Project not found');
          navigate('/');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to fetch project directly:', err);
        toast.error(err.response?.data?.message || 'Project not found');
        navigate('/');
      })
      .finally(() => {
        if (isMounted) setFetchingProject(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, projects, currentProject?._id, dispatch, navigate]);

  // View Persistence Priority:
  // 1. URL ?view=...
  // 2. project.defaultView or workspace.defaultView
  // 3. localStorage last-used preference
  // 4. Default 'kanban'
  const urlView = searchParams.get('view');
  const validViews = ['kanban', 'list', 'calendar'];

  useEffect(() => {
    let resolvedView = 'kanban';

    if (urlView && validViews.includes(urlView)) {
      resolvedView = urlView;
    } else {
      const projectDefault = currentProject?.defaultView;
      const workspaceDefault = currentWorkspace?.defaultView;
      const localPref = projectId ? localStorage.getItem(`view_${projectId}`) : null;

      if (projectDefault && validViews.includes(projectDefault)) {
        resolvedView = projectDefault;
      } else if (workspaceDefault && validViews.includes(workspaceDefault)) {
        resolvedView = workspaceDefault;
      } else if (localPref && validViews.includes(localPref)) {
        resolvedView = localPref;
      } else {
        resolvedView = 'kanban';
      }
    }

    if (activeView !== resolvedView) {
      dispatch(setActiveView(resolvedView));
    }
  }, [urlView, currentProject?._id, currentProject?.defaultView, currentWorkspace?.defaultView, projectId, dispatch]);

  // Fetch tasks when the project changes
  useEffect(() => {
    if (currentProject?._id) {
      dispatch(fetchTasks({ projectId: currentProject._id, params: filters }));
    }
  }, [dispatch, currentProject?._id]);

  const handleViewChange = (view) => {
    dispatch(setActiveView(view));
    if (projectId) {
      localStorage.setItem(`view_${projectId}`, view);
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('view', view);
      return next;
    });
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleSearch = (e) => {
    dispatch(setFilters({ search: e.target.value }));
  };

  const handleApplyFilters = () => {
    if (currentProject?._id) {
      dispatch(fetchTasks({ projectId: currentProject._id, params: filters }));
    }
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    if (currentProject?._id) {
      dispatch(fetchTasks({ projectId: currentProject._id }));
    }
  };

  if (!currentProject || fetchingProject) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Project Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1526] shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Project Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm shrink-0"
              style={{ backgroundColor: currentProject.color || '#6366f1' }}
            >
              {currentProject.icon || '📋'}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                {currentProject.name}
              </h2>
              {currentProject.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {currentProject.description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {canManageProjects && (
              <button
                onClick={() =>
                  dispatch(openModal({ modalName: 'createProject', props: { project: currentProject } }))
                }
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Project Settings"
              >
                <SettingsOutlinedIcon style={{ fontSize: 18 }} />
              </button>
            )}
            {canEditTasks && (
              <Button
                size="sm"
                onClick={() => dispatch(openModal({ modalName: 'createTask' }))}
              >
                <AddIcon style={{ fontSize: 16 }} className="mr-1" />
                Add Task
              </Button>
            )}
          </div>
        </div>

        {/* View Switcher + Filters Row */}
        <div className="flex items-center gap-3 mt-3">
          {/* View Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800/60 rounded-xl p-0.5">
            {VIEWS.map(({ key, label, Icon }) => (
              <button
                key={key}
                id={`view-tab-${key}`}
                onClick={() => handleViewChange(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeView === key
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon style={{ fontSize: 14 }} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs hidden md:block">
            <SearchIcon
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              style={{ fontSize: 16 }}
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={handleSearch}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-transparent focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              showFilters
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <FilterListIcon style={{ fontSize: 16 }} />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500/50 text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="">All Priorities</option>
              {['critical', 'high', 'medium', 'low'].map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500/50 text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {(currentProject.columns || []).map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>

            <Button size="sm" onClick={handleApplyFilters}>
              Apply
            </Button>
            <Button size="sm" variant="ghost" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        )}
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-auto min-h-0 p-4 sm:p-6">
        {loading ? (
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-72 shrink-0 space-y-3">
                <Skeleton className="h-8" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-16" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {activeView === 'kanban' && (
              <KanbanBoard onTaskClick={handleTaskClick} />
            )}
            {activeView === 'list' && (
              <ListView onTaskClick={handleTaskClick} />
            )}
            {activeView === 'calendar' && (
              <CalendarView onTaskClick={handleTaskClick} />
            )}
          </>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask?._id || selectedTask}
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

export default ProjectPage;
