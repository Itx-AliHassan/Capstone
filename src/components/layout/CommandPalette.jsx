import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  setCommandPalette,
  openModal,
  toggleTheme,
} from '../../features/ui/uiSlice';
import { setActiveView, setCurrentProject } from '../../features/projects/projectSlice';
import { searchApi } from '../../services/searchApi';

import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';

export const CommandPalette = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { commandPaletteOpen } = useSelector((state) => state.ui);
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const { projects, currentProject } = useSelector((state) => state.projects);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ workspaces: [], projects: [], tasks: [] });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!commandPaletteOpen) {
      setQuery('');
      setSearchResults({ workspaces: [], projects: [], tasks: [] });
    }
  }, [commandPaletteOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSearchResults({ workspaces: [], projects: [], tasks: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchApi.globalSearch(query, currentWorkspace?._id);
        setSearchResults(res.data.data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, currentWorkspace]);

  if (!commandPaletteOpen) return null;

  const close = () => dispatch(setCommandPalette(false));

  const quickActions = [
    {
      id: 'create-task',
      label: 'Create new task',
      shortcut: 'C',
      icon: <AddIcon fontSize="small" />,
      action: () => {
        close();
        dispatch(openModal({ modalName: 'createTask' }));
      },
    },
    {
      id: 'create-project',
      label: 'Create new project',
      icon: <FolderOutlinedIcon fontSize="small" />,
      action: () => {
        close();
        dispatch(openModal({ modalName: 'createProject' }));
      },
    },
    {
      id: 'view-kanban',
      label: 'Switch to Kanban Board',
      shortcut: '1',
      icon: <ViewKanbanOutlinedIcon fontSize="small" />,
      action: () => {
        close();
        dispatch(setActiveView('kanban'));
      },
    },
    {
      id: 'view-list',
      label: 'Switch to List View',
      shortcut: '2',
      icon: <TableRowsOutlinedIcon fontSize="small" />,
      action: () => {
        close();
        dispatch(setActiveView('list'));
      },
    },
    {
      id: 'view-calendar',
      label: 'Switch to Calendar View',
      shortcut: '3',
      icon: <CalendarTodayOutlinedIcon fontSize="small" />,
      action: () => {
        close();
        dispatch(setActiveView('calendar'));
      },
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Dark / Light Theme',
      icon: <DarkModeOutlinedIcon fontSize="small" />,
      action: () => {
        close();
        dispatch(toggleTheme());
      },
    },
    {
      id: 'workspace-settings',
      label: 'Open Workspace Settings',
      icon: <SettingsOutlinedIcon fontSize="small" />,
      action: () => {
        close();
        navigate('/settings/workspace');
      },
    },
    {
      id: 'user-settings',
      label: 'Open User Profile & Settings',
      icon: <SettingsOutlinedIcon fontSize="small" />,
      action: () => {
        close();
        navigate('/settings/profile');
      },
    },
    {
      id: 'import-export',
      label: 'Import / Export Workspace Data',
      icon: <ImportExportIcon fontSize="small" />,
      action: () => {
        close();
        dispatch(openModal({ modalName: 'importExport' }));
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-20">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={close} />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <SearchIcon className="text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search tasks, projects..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results / Actions List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* Dynamic Search Results */}
          {query.trim().length >= 2 && (
            <div>
              {isSearching ? (
                <div className="p-4 text-center text-xs text-slate-400">Searching...</div>
              ) : searchResults.tasks.length === 0 && searchResults.projects.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No results found</div>
              ) : (
                <div className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Search Results
                  </div>
                  {searchResults.projects.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => {
                        close();
                        dispatch(setCurrentProject(p));
                        navigate(`/project/${p._id}`);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left"
                    >
                      <FolderOutlinedIcon fontSize="small" className="text-indigo-500" />
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-xs text-slate-400 ml-auto">Project</span>
                    </button>
                  ))}
                  {searchResults.tasks.map((t) => (
                    <button
                      key={t._id}
                      onClick={() => {
                        close();
                        if (t.project?._id) {
                          dispatch(setCurrentProject(t.project));
                          navigate(`/project/${t.project._id}?taskId=${t._id}`);
                        }
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left"
                    >
                      <AssignmentOutlinedIcon fontSize="small" className="text-slate-400" />
                      <span className="truncate flex-1">{t.title}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {t.status.replace('col-', '')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions List */}
          <div>
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quick Actions
            </div>
            <div className="space-y-0.5">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">
                      {action.icon}
                    </span>
                    <span>{action.label}</span>
                  </div>
                  {action.shortcut && (
                    <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-400">
                      {action.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
