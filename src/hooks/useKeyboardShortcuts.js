import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleCommandPalette,
  toggleSidebar,
  openModal,
  closeModal,
} from '../features/ui/uiSlice';
import { setActiveView } from '../features/projects/projectSlice';

export const useKeyboardShortcuts = () => {
  const dispatch = useDispatch();
  const { activeModal, commandPaletteOpen } = useSelector((state) => state.ui);
  const { currentProject } = useSelector((state) => state.projects);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in an input, textarea, or contentEditable
      const isInput =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) ||
        e.target.isContentEditable;

      // Cmd / Ctrl + K -> Toggle Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dispatch(toggleCommandPalette());
        return;
      }

      // Escape -> Close Modals or Command Palette
      if (e.key === 'Escape') {
        if (commandPaletteOpen) {
          dispatch(toggleCommandPalette());
          return;
        }
        if (activeModal) {
          dispatch(closeModal());
          return;
        }
      }

      // If user is focused inside an input field, do not trigger single-key navigation shortcuts
      if (isInput) return;

      // 'c' -> Create new task
      if (e.key === 'c' && currentProject) {
        e.preventDefault();
        dispatch(openModal({ modalName: 'createTask' }));
      }

      // '[' -> Toggle sidebar
      if (e.key === '[') {
        e.preventDefault();
        dispatch(toggleSidebar());
      }

      // '1', '2', '3' -> Switch Views
      if (e.key === '1') {
        dispatch(setActiveView('kanban'));
      } else if (e.key === '2') {
        dispatch(setActiveView('list'));
      } else if (e.key === '3') {
        dispatch(setActiveView('calendar'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, activeModal, commandPaletteOpen, currentProject]);
};

export default useKeyboardShortcuts;
