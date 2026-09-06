import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  const saved = localStorage.getItem('theme');
  if (saved) return saved;
  return 'dark'; // Dark mode default as planned
};

const initialState = {
  theme: getInitialTheme(),
  sidebarCollapsed: false,
  mobileDrawerOpen: false,
  commandPaletteOpen: false,
  activeModal: null, // 'createTask' | 'createProject' | 'createWorkspace' | 'workspaceSettings' | 'importExport' | 'profile'
  modalProps: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', state.theme);
      if (state.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
      if (action.payload === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleMobileDrawer: (state) => {
      state.mobileDrawerOpen = !state.mobileDrawerOpen;
    },
    setMobileDrawer: (state, action) => {
      state.mobileDrawerOpen = action.payload;
    },
    toggleCommandPalette: (state) => {
      state.commandPaletteOpen = !state.commandPaletteOpen;
    },
    setCommandPalette: (state, action) => {
      state.commandPaletteOpen = action.payload;
    },
    openModal: (state, action) => {
      state.activeModal = action.payload.modalName;
      state.modalProps = action.payload.props || {};
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalProps = {};
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileDrawer,
  setMobileDrawer,
  toggleCommandPalette,
  setCommandPalette,
  openModal,
  closeModal,
} = uiSlice.actions;

export default uiSlice.reducer;
