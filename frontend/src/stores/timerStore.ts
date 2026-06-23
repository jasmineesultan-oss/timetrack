import { create } from 'zustand';
import api from '../lib/api';

interface RunningEntry {
  id: string;
  description?: string;
  startTime: string;
  projectId?: string;
  taskId?: string;
  isBillable: boolean;
  project?: { id: string; name: string; color: string };
  task?: { id: string; name: string };
}

interface TimerState {
  runningEntry: RunningEntry | null;
  elapsed: number;
  intervalId: ReturnType<typeof setInterval> | null;
  isLoading: boolean;
  fetchRunning: () => Promise<void>;
  start: (data: { description?: string; projectId?: string; taskId?: string; isBillable?: boolean }) => Promise<void>;
  stop: () => Promise<void>;
  tick: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  runningEntry: null,
  elapsed: 0,
  intervalId: null,
  isLoading: false,

  fetchRunning: async () => {
    try {
      const { data } = await api.get('/time-entries/running');
      if (data) {
        const elapsed = Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000);
        set({ runningEntry: data, elapsed });
        const id = setInterval(() => get().tick(), 1000);
        set({ intervalId: id });
      }
    } catch {
      // No running entry
    }
  },

  start: async (formData) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/time-entries/start', formData);
      set({ runningEntry: data, elapsed: 0 });
      const id = setInterval(() => get().tick(), 1000);
      set({ intervalId: id });
    } finally {
      set({ isLoading: false });
    }
  },

  stop: async () => {
    const { runningEntry, intervalId } = get();
    if (!runningEntry) return;
    set({ isLoading: true });
    try {
      await api.post(`/time-entries/${runningEntry.id}/stop`);
      if (intervalId) clearInterval(intervalId);
      set({ runningEntry: null, elapsed: 0, intervalId: null });
    } finally {
      set({ isLoading: false });
    }
  },

  tick: () => set((state) => ({ elapsed: state.elapsed + 1 })),
}));
