import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleTheme, toggleSidebar, toggleMobileDrawer, openModal, setCommandPalette } from '../../features/ui/uiSlice';
import { logoutUser } from '../../features/auth/authSlice';
import { setCurrentWorkspace } from '../../features/workspaces/workspaceSlice';
import { Avatar, Badge } from '../common/Badge';
import Button from '../common/Button';
import NotificationsDropdown from '../notifications/NotificationsDropdown';
import useOfflineSync from '../../hooks/useOfflineSync';

import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

export const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.ui);
  const { workspaces, currentWorkspace } = useSelector((state) => state.workspaces);
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync();

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0E1526]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile Toggle & Workspace Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(toggleMobileDrawer())}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Navigation"
        >
          <MenuIcon />
        </button>

        {/* Workspace Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition-all text-left"
          >
            <span className="text-xl">{currentWorkspace?.icon || '📁'}</span>
            <div className="hidden sm:block">
              <p className="text-xs text-slate-400 font-medium leading-none">Workspace</p>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[140px]">
                {currentWorkspace?.name || 'Select Workspace'}
              </h2>
            </div>
            <KeyboardArrowDownIcon fontSize="small" className="text-slate-400" />
          </button>

          {/* Switcher Dropdown Menu */}
          {workspaceMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setWorkspaceMenuOpen(false)}
              />
              <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Your Workspaces
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {workspaces.map((ws) => (
                    <button
                      key={ws._id}
                      onClick={() => {
                        dispatch(setCurrentWorkspace(ws));
                        setWorkspaceMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors text-left ${
                        currentWorkspace?._id === ws._id
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="text-lg">{ws.icon || '📁'}</span>
                      <span className="truncate flex-1">{ws.name}</span>
                      {ws.owner === user?._id && (
                        <span className="text-[10px] uppercase font-bold text-slate-400">Owner</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setWorkspaceMenuOpen(false);
                      dispatch(openModal({ modalName: 'createWorkspace' }));
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    <AddIcon fontSize="small" />
                    Create New Workspace
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center: Command Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={() => dispatch(setCommandPalette(true))}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center gap-2">
            <SearchIcon fontSize="small" className="group-hover:text-indigo-500 transition-colors" />
            <span>Search tasks, projects, or commands...</span>
          </div>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400 shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Sync, Theme, Notifications & User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Offline / Sync Indicator */}
        {!isOnline ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium">
            <CloudOffIcon fontSize="small" />
            <span className="hidden sm:inline">Offline</span>
            {pendingCount > 0 && <span className="font-bold">({pendingCount})</span>}
          </div>
        ) : pendingCount > 0 ? (
          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 transition-all"
            title="Sync offline changes now"
          >
            <SyncIcon fontSize="small" className={isSyncing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Sync ({pendingCount})</span>
          </button>
        ) : null}

        {/* Theme Toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <LightModeOutlinedIcon fontSize="small" />
          ) : (
            <DarkModeOutlinedIcon fontSize="small" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <NotificationsDropdown />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500/30 transition-all"
          >
            <Avatar src={user?.avatar} name={user?.name} size="sm" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    @{user?.username}
                  </p>
                </div>

                <button
                  id="navbar-profile-settings-btn"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings/profile');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <PersonOutlineIcon fontSize="small" />
                  Profile Settings
                </button>

                <button
                  id="navbar-workspace-settings-btn"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate('/settings/workspace');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <SettingsOutlinedIcon fontSize="small" />
                  Workspace Settings
                </button>

                <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      dispatch(logoutUser());
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                  >
                    <LogoutIcon fontSize="small" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
