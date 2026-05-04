import { create } from 'zustand';
import type { Task, Finding, Toast } from './types';
import { generateId } from './utils';

interface AppState {
  // Current task state
  currentTask: Task | null;
  selectedFinding: Finding | null;
  
  // UI state
  toasts: Toast[];
  isLoading: boolean;
  isDarkMode: boolean;
  
  // Actions
  setCurrentTask: (task: Task | null) => void;
  setSelectedFinding: (finding: Finding | null) => void;
  setLoading: (loading: boolean) => void;
  toggleTheme: () => void;
  
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Utility actions
  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentTask: null,
  selectedFinding: null,
  toasts: [],
  isLoading: false,
  isDarkMode: false,

  // Actions
  setCurrentTask: (task) => set({ currentTask: task }),
  
  setSelectedFinding: (finding) => set({ selectedFinding: finding }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  toggleTheme: () => {
    try {
      const currentTheme = get().isDarkMode;
      const newTheme = !currentTheme;
      
      set({ isDarkMode: newTheme });
      
      // Update the HTML class for Tailwind dark mode
      if (typeof document !== 'undefined') {
        if (newTheme) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      // Persist theme preference to localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('Error in toggleTheme:', error);
    }
  },

  // Toast actions
  addToast: (toast) => {
    const id = generateId();
    const newToast: Toast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => set({ toasts: [] }),

  // Reset all state
  reset: () => set({
    currentTask: null,
    selectedFinding: null,
    toasts: [],
    isLoading: false,
    isDarkMode: false,
  }),
}));

// Selectors for common use cases
export const useCurrentTask = () => useAppStore((state) => state.currentTask);
export const useSelectedFinding = () => useAppStore((state) => state.selectedFinding);
export const useToasts = () => useAppStore((state) => state.toasts);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useTheme = () => {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const toggleTheme = useAppStore((state) => state.toggleTheme);
  return { isDarkMode, toggleTheme };
};
