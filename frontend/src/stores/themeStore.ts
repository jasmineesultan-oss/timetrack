import { create } from 'zustand';

const saved = localStorage.getItem('tt_theme');
const initial = saved === 'dark';
if (initial) document.documentElement.classList.add('dark');

interface ThemeState { isDark: boolean; toggle: () => void; }

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: initial,
  toggle: () => set((state) => {
    const next = !state.isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('tt_theme', next ? 'dark' : 'light');
    return { isDark: next };
  }),
}));
