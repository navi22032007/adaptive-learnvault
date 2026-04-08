import { create } from 'zustand';

const API_BASE_URL = 'http://localhost:8000/api';

export const useStore = create((set, get) => ({
  isLoading: true,
  selectedContent: null,
  activeSection: 'dashboard',
  recommendations: [],
  activityData: null,
  knowledgeGraph: { nodes: [], edges: [] },
  userProfile: null,
  token: localStorage.getItem('token') || null,

  setLoading: (val) => set({ isLoading: val }),
  setSelectedContent: (item) => set({ selectedContent: item }),
  setActiveSection: (section) => set({ activeSection: section }),
  
  login: async (email, password) => {
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const res = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        set({ token: data.access_token });
        await get().fetchAllData();
        return true;
      }
    } catch (e) {
      console.error("Login failed:", e);
    }
    return false;
  },

  register: async (name, email, password) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        set({ token: data.access_token });
        await get().fetchAllData();
        return true;
      }
    } catch (e) {
      console.error("Registration failed:", e);
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, userProfile: null, recommendations: [], activityData: null });
  },

  fetchAllData: async () => {
    const { token } = get();
    if (!token) return;

    set({ isLoading: true });
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [recRes, activityRes, graphRes, userRes] = await Promise.all([
        fetch(`${API_BASE_URL}/recommendations`, { headers }),
        fetch(`${API_BASE_URL}/activity`, { headers }),
        fetch(`${API_BASE_URL}/knowledge-graph`), 
        fetch(`${API_BASE_URL}/user`, { headers })
      ]);

      const recommendations = await recRes.json();
      const activityData = await activityRes.json();
      const knowledgeGraph = await graphRes.json();
      const userProfile = await userRes.json();

      set({ 
        recommendations, 
        activityData, 
        knowledgeGraph, 
        userProfile,
        isLoading: false 
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
      set({ isLoading: false });
    }
  },

  importContent: async (data) => {
    const { token } = get();
    try {
      const res = await fetch(`${API_BASE_URL}/content/import`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const newItem = await res.json();
        set(state => ({ recommendations: [newItem, ...state.recommendations] }));
        return true;
      }
    } catch (e) { console.error("Import failed:", e); }
    return false;
  },

  generateTopic: async (topic) => {
    const { token } = get();
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE_URL}/content/generate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ topic })
      });
      if (res.ok) {
        const newItems = await res.json();
        set(state => ({ 
          recommendations: [...newItems, ...state.recommendations],
          isLoading: false 
        }));
        return true;
      }
    } catch (e) { console.error("Generation failed:", e); }
    set({ isLoading: false });
    return false;
  },

  updateProgress: async (id, progress) => {
    const { token } = get();
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/${id}/progress?progress=${progress}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const updatedItem = await response.json();
        set((state) => ({
          recommendations: state.recommendations.map((r) =>
            r.id === id ? updatedItem : r
          ),
        }));
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  },
}));
