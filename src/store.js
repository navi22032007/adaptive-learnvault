import { create } from 'zustand';

export const useStore = create((set) => ({
  isLoading: true,
  selectedContent: null,
  activeSection: 'dashboard',
  recommendations: [],
  activityData: null,

  setLoading: (val) => set({ isLoading: val }),
  setSelectedContent: (item) => set({ selectedContent: item }),
  setActiveSection: (section) => set({ activeSection: section }),
  setRecommendations: (data) => set({ recommendations: data }),
  setActivityData: (data) => set({ activityData: data }),
  updateProgress: (id, progress) =>
    set((state) => ({
      recommendations: state.recommendations.map((r) =>
        r.id === id ? { ...r, progress } : r
      ),
    })),
}));
