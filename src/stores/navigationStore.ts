import { create } from 'zustand';

type PageType = 'landing' | 'auth' | 'onboarding' | 'feed' | 'scout' | 'bites' | 
  'trims' | 'snap' | 'dash' | 'plate' | 'chat' | 'discover' | 'debug';

interface NavigationState {
  currentPage: PageType;
  previousPage: PageType | null;
  mobileMenuOpen: boolean;
  navigationHistory: PageType[];
  
  // Actions
  setCurrentPage: (page: PageType) => void;
  goBack: () => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  clearHistory: () => void;
}

/**
 * Global Navigation Store
 * Manages application navigation state and history
 */
export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentPage: 'landing',
  previousPage: null,
  mobileMenuOpen: false,
  navigationHistory: ['landing'],

  setCurrentPage: (page) => {
    const current = get().currentPage;
    const history = get().navigationHistory;
    
    set({
      currentPage: page,
      previousPage: current,
      navigationHistory: [...history, page].slice(-10), // Keep last 10 pages
      mobileMenuOpen: false, // Close menu on navigation
    });

    // Update URL hash
    if (typeof window !== 'undefined' && page !== 'landing') {
      window.location.hash = `#${page}`;
    } else if (page === 'landing') {
      window.location.hash = '';
    }
  },

  goBack: () => {
    const history = get().navigationHistory;
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      const previousPage = newHistory[newHistory.length - 1];
      
      set({
        currentPage: previousPage,
        previousPage: null,
        navigationHistory: newHistory,
      });

      // Update URL
      if (typeof window !== 'undefined') {
        window.location.hash = previousPage !== 'landing' ? `#${previousPage}` : '';
      }
    } else if (typeof window !== 'undefined') {
      window.history.back();
    }
  },

  toggleMobileMenu: () => set((state) => ({ 
    mobileMenuOpen: !state.mobileMenuOpen 
  })),

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  clearHistory: () => set({ 
    navigationHistory: [get().currentPage],
    previousPage: null,
  }),
}));

// Sync with URL hash on load
if (typeof window !== 'undefined') {
  const initialHash = window.location.hash.slice(1) as PageType;
  if (initialHash) {
    useNavigationStore.getState().setCurrentPage(initialHash);
  }

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1) as PageType;
    const validPages: PageType[] = [
      'landing', 'auth', 'onboarding', 'feed', 'scout', 'bites',
      'trims', 'snap', 'dash', 'plate', 'chat', 'discover', 'debug'
    ];
    
    if (hash && validPages.includes(hash)) {
      const currentPage = useNavigationStore.getState().currentPage;
      if (currentPage !== hash) {
        useNavigationStore.getState().setCurrentPage(hash);
      }
    } else if (!hash) {
      useNavigationStore.getState().setCurrentPage('landing');
    }
  });
}
