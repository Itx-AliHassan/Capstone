import { io } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(backendUrl, {
      withCredentials: true,
      autoConnect: false,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to server with ID:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.warn('[Socket.IO] Connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
    });
  }

  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinWorkspaceRoom = (workspaceId) => {
  if (socket && socket.connected && workspaceId) {
    socket.emit('join:workspace', workspaceId);
  }
};

export const leaveWorkspaceRoom = (workspaceId) => {
  if (socket && socket.connected && workspaceId) {
    socket.emit('leave:workspace', workspaceId);
  }
};

export const joinProjectRoom = (projectId) => {
  if (socket && socket.connected && projectId) {
    socket.emit('join:project', projectId);
  }
};

export const leaveProjectRoom = (projectId) => {
  if (socket && socket.connected && projectId) {
    socket.emit('leave:project', projectId);
  }
};
