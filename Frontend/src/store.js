import { create } from 'zustand';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const useStore = create((set, get) => ({
  // ─── State ───
  isLoading: false,
  initialLoadDone: false,    // tracks whether we've fetched at least once
  selectedContent: null,
  activeSection: 'dashboard',
  recommendations: [],
  activityData: null,
  knowledgeGraph: { nodes: [], edges: [] },
  userProfile: null,
  aiSuggestions: [],
  token: localStorage.getItem('token') || null,

  // ─── Simple setters ───
  setLoading: (val) => set({ isLoading: val }),
  setSelectedContent: (item) => set({ selectedContent: item }),
  setActiveSection: (section) => set({ activeSection: section }),

  // ─── Auth ───
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
        set({ token: data.access_token, initialLoadDone: false });
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
        set({ token: data.access_token, initialLoadDone: false });
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
    set({ 
      token: null, userProfile: null, recommendations: [], 
      activityData: null, initialLoadDone: false, aiSuggestions: [] 
    });
  },

  bypassLogin: async () => {
    localStorage.setItem('token', 'dummy');
    set({ token: 'dummy', initialLoadDone: false });
    await get().fetchAllData();
    return true;
  },

  // ─── CORE: Progressive data loading ───
  // Instead of Promise.all (waits for slowest), we fire requests independently
  // and update state as each one resolves. The UI renders instantly with
  // whatever data arrives first.
  fetchAllData: async () => {
    const { token, initialLoadDone } = get();
    if (!token) return;
    
    // Don't re-fetch if we already have data (prevents double calls)
    if (initialLoadDone) return;

    set({ isLoading: true });
    const headers = { 'Authorization': `Bearer ${token}` };

    // Fire all requests at once but DON'T wait for all — update state as each arrives
    const fetchAndSet = async (url, key, fallback) => {
      try {
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          set({ [key]: data });
          return data;
        }
      } catch (e) {
        console.error(`Failed to fetch ${key}:`, e);
      }
      set({ [key]: fallback });
      return fallback;
    };

    // Launch all 4 requests simultaneously — each updates state independently
    const promises = [
      fetchAndSet(`${API_BASE_URL}/user/profile`, 'userProfile', null),
      fetchAndSet(`${API_BASE_URL}/activity`, 'activityData', null),
      fetchAndSet(`${API_BASE_URL}/recommendations/`, 'recommendations', []),
      fetchAndSet(`${API_BASE_URL}/graph/data`, 'knowledgeGraph', { nodes: [], edges: [] }),
    ];

    // Wait for all to complete (but UI already has partial data by now)
    await Promise.allSettled(promises);

    set({ isLoading: false, initialLoadDone: true });

    // LAZY: Enrich recommendation reasons with AI (background, non-blocking)
    get().enrichReasons();
  },

  // ─── Force refetch (ignores cache) ───
  refetchAll: async () => {
    set({ initialLoadDone: false });
    await get().fetchAllData();
  },

  // ─── Background AI enrichment (runs after dashboard is already visible) ───
  enrichReasons: async () => {
    const { token, recommendations } = get();
    if (!token || recommendations.length === 0) return;

    const ids = recommendations.map(r => r.id);
    try {
      const res = await fetch(`${API_BASE_URL}/recommendations/enrich-reasons`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ids)
      });
      if (res.ok) {
        const reasonMap = await res.json();
        set(state => ({
          recommendations: state.recommendations.map(r => 
            reasonMap[r.id] ? { ...r, reason: reasonMap[r.id] } : r
          )
        }));
      }
    } catch (e) {
      // Silently fail – static reasons are already shown
    }
  },

  // ─── Content operations ───
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

  // ─── Chat / Agent ───
  fetchChatSessions: async () => {
    const { token } = get();
    try {
      const res = await fetch(`${API_BASE_URL}/agent/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
    } catch (e) { console.error("Failed to fetch chat sessions:", e); }
    return [];
  },

  getChatHistory: async (sessionId) => {
    const { token } = get();
    try {
      const res = await fetch(`${API_BASE_URL}/agent/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return await res.json();
    } catch (e) { console.error("Failed to fetch chat history:", e); }
    return null;
  },

  sendChatMessage: async (message, sessionId = null) => {
    const { token } = get();
    try {
      const res = await fetch(`${API_BASE_URL}/agent/chat`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ message, session_id: sessionId })
      });
      if (res.ok) return await res.json();
    } catch (e) { console.error("Chat message failed:", e); }
    return null;
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

  markComplete: async (id) => {
    const { token } = get();
    try {
      const res = await fetch(`${API_BASE_URL}/content/complete/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Force refetch to update profile stats and progress
        set({ initialLoadDone: false });
        await get().fetchAllData();
        return data;
      }
    } catch (e) { console.error("Mark complete failed:", e); }
    return null;
  },

  // ─── File upload ───
  uploadFile: async (file) => {
    const { token } = get();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/content/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const newItem = await res.json();
        set(state => ({ recommendations: [newItem, ...state.recommendations] }));
        return true;
      }
    } catch (e) {
      console.error("Upload failed:", e);
    }
    return false;
  },

  // ─── AI Suggestions (lazy – called on demand, not on mount) ───
  getWhatNext: async () => {
    const { token } = get();
    try {
      const res = await fetch(`${API_BASE_URL}/recommendations/what-next`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const aiSuggestions = await res.json();
        set({ aiSuggestions });
      }
    } catch (e) { console.error("What Next failed:", e); }
  },

  // ─── Explain ───
  explainTopic: async (topic, metadata = null) => {
    const { token } = get();
    try {
      const res = await fetch(`${API_BASE_URL}/recommendations/explain`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topic, metadata })
      });
      if (res.ok) {
        const data = await res.json();
        return data.explanation;
      }
    } catch (e) { console.error("Explanation failed:", e); }
    return "Failed to fetch explanation.";
  },

  // ─── Notes ───
  fetchNote: async (contentId) => {
    const { token } = get();
    try {
      const res = await fetch(`${API_BASE_URL}/content/notes/${contentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.text;
      }
    } catch (e) { console.error("Fetch note failed:", e); }
    return "";
  },

  saveNote: async (contentId, text) => {
    const { token } = get();
    try {
      await fetch(`${API_BASE_URL}/content/notes`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content_id: contentId, text })
      });
    } catch (e) { console.error("Save note failed:", e); }
  },

  // ─── YouTube search ───
  searchYouTube: async (topic) => {
    try {
      const res = await fetch(`${API_BASE_URL}/content/recommendations/youtube/search?topic=${encodeURIComponent(topic)}`);
      if (res.ok) return await res.json();
    } catch (e) { console.error("YouTube search failed:", e); }
    return [];
  },
}));
