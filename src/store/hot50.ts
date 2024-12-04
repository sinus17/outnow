import { create } from 'zustand';
import { Hot50Track } from '../types/tiktok';
import { getHot50Tracks } from '../services/database';

interface Hot50Store {
  tracks: Hot50Track[];
  isLoading: boolean;
  error: string | null;
  fetchTracks: () => Promise<void>;
}

export const useHot50Store = create<Hot50Store>((set) => ({
  tracks: [],
  isLoading: false,
  error: null,
  fetchTracks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tracks = await getHot50Tracks();
      set({ tracks, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch tracks',
        isLoading: false 
      });
    }
  }
}));