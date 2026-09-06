import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// Auth
import { checkAuthSession } from './features/auth/authSlice';
import { fetchWorkspaces } from './features/workspaces/workspaceSlice';
import { fetchNotifications } from './features/notifications/notificationSlice';
import { setMobileDrawer } from './features/ui/uiSlice';

// Socket
import { getSocket } from './sockets/socket';

// Realtime Redux handlers
import { handleRealtimeTaskCreated, handleRealtimeTaskUpdated, handleRealtimeTaskMoved, handleRealtimeTaskDeleted, handleRealtimeBulkUpdated } from './features/tasks/taskSlice';
import { handleRealtimeProjectUpdate, handleRealtimeProjectDeleted } from './features/projects/projectSlice';
import { handleRealtimeWorkspaceUpdate, handleRealtimeMemberUpdate } from './features/workspaces/workspaceSlice';
import { handleRealtimeNotification } from './features/notifications/notificationSlice';

// Layout components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { CommandPalette } from './components/layout/CommandPalette';
import ModalsContainer from './components/common/ModalsContainer';

// Pages
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';
import { fetchProjects } from './features/projects/projectSlice';

// Hooks
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';

import toast from 'react-hot-toast';

// ─── Protected Route ─────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

// ─── App Shell (authenticated layout) ────────────────────────────────────────
const AppShell = ({ children }) => {
  const { mobileDrawerOpen } = useSelector((state) => state.ui);
  const dispatch = useDispatch();

  // Register global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0B0F19]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => dispatch(setMobileDrawer(false))}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden w-64">
            <Sidebar isMobile />
          </div>
        </>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <OfflineBanner />

        <main className="flex-1 overflow-auto min-h-0">
          {children}
        </main>
      </div>

      {/* Global Modals */}
      <ModalsContainer />

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
};

// ─── Socket Event Handlers Hook ───────────────────────────────────────────────
const useSocketEvents = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket || !socket.connected) return;

    // Task events
    const onTaskCreated = (data) => {
      dispatch(handleRealtimeTaskCreated(data));
    };
    const onTaskUpdated = (data) => {
      dispatch(handleRealtimeTaskUpdated(data));
    };
    const onTaskMoved = (data) => {
      dispatch(handleRealtimeTaskMoved(data));
    };
    const onTaskDeleted = (data) => {
      dispatch(handleRealtimeTaskDeleted(data));
    };
    const onTasksBulkUpdated = (data) => {
      dispatch(handleRealtimeBulkUpdated(data));
    };

    // Project events
    const onProjectUpdated = (data) => {
      dispatch(handleRealtimeProjectUpdate(data));
    };
    const onProjectDeleted = (data) => {
      dispatch(handleRealtimeProjectDeleted(data));
    };

    // Workspace events
    const onWorkspaceUpdated = (data) => {
      dispatch(handleRealtimeWorkspaceUpdate(data));
    };
    const onMemberUpdated = (data) => {
      dispatch(handleRealtimeMemberUpdate(data));
    };

    // Notification events
    const onNewNotification = (data) => {
      dispatch(handleRealtimeNotification(data));
      toast(`🔔 ${data.message || 'New notification'}`, {
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '12px' },
      });
    };

    socket.on('task:created', onTaskCreated);
    socket.on('task:updated', onTaskUpdated);
    socket.on('task:moved', onTaskMoved);
    socket.on('task:deleted', onTaskDeleted);
    socket.on('tasks:bulkUpdated', onTasksBulkUpdated);
    socket.on('project:updated', onProjectUpdated);
    socket.on('project:deleted', onProjectDeleted);
    socket.on('workspace:updated', onWorkspaceUpdated);
    socket.on('member:updated', onMemberUpdated);
    socket.on('notification:new', onNewNotification);

    return () => {
      socket.off('task:created', onTaskCreated);
      socket.off('task:updated', onTaskUpdated);
      socket.off('task:moved', onTaskMoved);
      socket.off('task:deleted', onTaskDeleted);
      socket.off('tasks:bulkUpdated', onTasksBulkUpdated);
      socket.off('project:updated', onProjectUpdated);
      socket.off('project:deleted', onProjectDeleted);
      socket.off('workspace:updated', onWorkspaceUpdated);
      socket.off('member:updated', onMemberUpdated);
      socket.off('notification:new', onNewNotification);
    };
  }, [dispatch, isAuthenticated]);
};

// ─── Root App Component ───────────────────────────────────────────────────────
const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  // Register socket event listeners
  useSocketEvents();

  // On app mount: check if user has valid session
  useEffect(() => {
    dispatch(checkAuthSession());
  }, [dispatch]);

  // When authenticated: load workspaces & notifications
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchWorkspaces());
      dispatch(fetchNotifications());
    }
  }, [dispatch, isAuthenticated]);

  const { currentWorkspace } = useSelector((state) => state.workspaces);

  // When currentWorkspace is selected: fetch projects for workspace
  useEffect(() => {
    if (currentWorkspace?._id) {
      dispatch(fetchProjects({ workspaceId: currentWorkspace._id }));
    }
  }, [dispatch, currentWorkspace?._id]);

  return (
    <Routes>
      {/* Public Route */}
      <Route
        path="/auth"
        element={
          isAuthenticated && !loading ? <Navigate to="/" replace /> : <AuthPage />
        }
      />

      {/* Protected Routes (all within AppShell) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell>
              <DashboardPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/project/:projectId"
        element={
          <ProtectedRoute>
            <AppShell>
              <ProjectPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <AppShell>
              <ActivityPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={<Navigate to="/settings/profile" replace />}
      />

      <Route
        path="/settings/:tab"
        element={
          <ProtectedRoute>
            <AppShell>
              <SettingsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* Catch-all: redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
