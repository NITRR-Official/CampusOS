import { create } from 'zustand';

interface UIState {
  isSearchOpen: boolean;
  toggleSearch: () => void;
  setSearchOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSearchOpen: false,
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen })
}));
