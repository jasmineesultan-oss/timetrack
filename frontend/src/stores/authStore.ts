import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  workspaceId?: string;
  workspaceName?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; name: string; password: string; joinCode: string }) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('tt_token'),
  isLoading: false,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('tt_token', data.token);
    set({ user: data.user, token: data.token });
  },

  register: async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('tt_token', data.token);
    set({ user: data.user, token: data.token });
  },

  logout: () => {
    localStorage.removeItem('tt_token');
    set({ user: null, token: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('tt_token');
    if (!token) return;
    set({ isLoading: true });
    try {
      const { data } = await api.get('/auth/me');
      const primaryWorkspace = data.workspaces?.[0];
      set({
        user: {
          ...data,
          workspaceId: primaryWorkspace?.workspace?.id,
          workspaceName: primaryWorkspace?.workspace?.name,
        },
      });
    } catch {
      localStorage.removeItem('tt_token');
      set({ user: null, token: null });
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (data) => set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
}));
