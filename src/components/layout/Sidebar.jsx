import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  toggleSidebar,
  setMobileDrawer,
  openModal,
} from '../../features/ui/uiSlice';
import { setCurrentProject } from '../../features/projects/projectSlice';
import usePermissions from '../../hooks/usePermissions';

import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AddIcon from '@mui/icons-material/Add';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined';

export const Sidebar = ({ isMobile = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed } = useSelector((state) => state.ui);
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const { projects, currentProject } = useSelector((state) => state.projects);
  const { canManageProjects, canManageMembers } = usePermissions();

  const handleProjectClick = (proj) => {
    dispatch(setCurrentProject(proj));
    navigate(`/project/${proj._id}`);
    if (isMobile) dispatch(setMobileDrawer(false));
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) dispatch(setMobileDrawer(false));
  };

  const collapsed = !isMobile && sidebarCollapsed;
  const isSettingsActive = location.pathname.startsWith('/settings');
  const isDashboardActive = location.pathname === '/';
  const isActivityActive = location.pathname === '/activity';

  return (
    <aside
      className={`h-full bg-white dark:bg-[#0E1526] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between transition-all duration-200 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top: Projects & Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {/* Workspace Brand / Header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 shadow-sm"
              style={{ backgroundColor: currentWorkspace?.color || '#3B82F6', color: '#fff' }}
            >
              {currentWorkspace?.icon || '⚡'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                  {currentWorkspace?.name || 'Workspace'}
                </h1>
                <p className="text-[11px] text-slate-400 capitalize">
                  {currentWorkspace?.defaultView || 'kanban'} view
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Core Navigation Links */}
        <div className="space-y-1">
          <button
            id="sidebar-dashboard-link"
            onClick={() => handleNavClick('/')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors group ${
              isDashboardActive
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
            title="Dashboard"
          >
            <DashboardOutlinedIcon
              fontSize="small"
              className={isDashboardActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500'}
            />
            {!collapsed && <span>Dashboard Overview</span>}
          </button>

          <button
            id="sidebar-activity-link"
            onClick={() => handleNavClick('/activity')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors group ${
              isActivityActive
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
            title="Activity Feed"
          >
            <HistoryOutlinedIcon
              fontSize="small"
              className={isActivityActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500'}
            />
            {!collapsed && <span>Activity Feed</span>}
          </button>
        </div>

        {/* Projects Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            {!collapsed && (
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Projects ({projects.length})
              </span>
            )}
            {canManageProjects && (
              <button
                onClick={() => dispatch(openModal({ modalName: 'createProject' }))}
                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Create Project"
              >
                <AddIcon fontSize="small" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {projects.map((proj) => {
              const isActive = currentProject?._id === proj._id;
              return (
                <button
                  key={proj._id}
                  onClick={() => handleProjectClick(proj)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left group ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                  title={proj.name}
                >
                  <span className="text-base shrink-0">{proj.icon || '📋'}</span>
                  {!collapsed && <span className="truncate flex-1">{proj.name}</span>}
                  {proj.archived && !collapsed && (
                    <span className="text-[10px] uppercase font-bold text-slate-400">Archived</span>
                  )}
                </button>
              );
            })}

            {projects.length === 0 && !collapsed && (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No projects yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Tools & Settings */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
        <button
          onClick={() => dispatch(openModal({ modalName: 'importExport' }))}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors group"
          title="Import / Export Data"
        >
          <ImportExportIcon fontSize="small" className="text-slate-400 group-hover:text-indigo-500" />
          {!collapsed && <span>Import / Export</span>}
        </button>

        <button
          id="sidebar-settings-link"
          onClick={() => handleNavClick('/settings/profile')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors group ${
            isSettingsActive
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
          title="Settings"
        >
          <SettingsOutlinedIcon
            fontSize="small"
            className={isSettingsActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500'}
          />
          {!collapsed && <span>Settings</span>}
        </button>

        {!isMobile && (
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="w-full flex items-center justify-center py-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={collapsed ? 'Expand Sidebar ([)' : 'Collapse Sidebar ([)'}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
