# Adaptive LearnVault

A fully animated, AI-powered study dashboard built with React, Three.js, Framer Motion, and Tailwind CSS.

## Tech Stack

- **React 18** + **Vite** — Fast dev & build tooling
- **Three.js** (vanilla, via canvas refs) — 3D particle loader, neural background, knowledge graph
- **Framer Motion** — Page transitions, staggered card animations, microinteractions
- **Tailwind CSS** — Dark theme utility styling
- **Zustand** — Lightweight state management
- **React Router v6** — Client-side navigation

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173) to view it.

## Project Structure

```
src/
├── components/
│   ├── ThreeScene/
│   │   ├── NeuralBackground.jsx   # Home page 3D background
│   │   └── KnowledgeGraph.jsx     # Interactive 3D topic graph
│   ├── Dashboard/
│   │   ├── Sidebar.jsx            # Left navigation panel
│   │   └── ActivityPanel.jsx      # Charts & stats (right panel)
│   ├── RecommendationCard/
│   │   └── RecommendationCard.jsx # 3D-tilt hover cards
│   ├── Navbar/
│   │   └── Navbar.jsx             # Animated top nav
│   ├── Loader/
│   │   └── Loader.jsx             # Three.js particle brain loader
│   └── AnimatedWrapper/
│       └── AnimatedWrapper.jsx    # Reusable motion wrapper
├── pages/
│   ├── Home.jsx                   # Hero + features + stats
│   ├── Dashboard.jsx              # Main dashboard layout
│   └── ContentView.jsx            # Detailed content modal
├── data/
│   └── mockData.js                # Simulated backend data
├── hooks/
│   └── useAnimations.js           # Tilt effect + motion variants
├── store.js                       # Zustand global state
├── App.jsx                        # Routing + loader logic
├── main.jsx                       # React entry point
└── index.css                      # Global styles + Tailwind
```

## Key Features

### 🔥 Loading Screen
- Three.js particle system forming a brain/neural network
- Mouse parallax influence on particle cloud
- Progress bar with simulated AI initialization steps
- Framer Motion exit animation dissolving into dashboard

### 🏠 Home Page
- Animated Three.js neural network background (60 nodes + connecting lines)
- Scroll-based parallax hero with Framer Motion
- Feature cards with hover animations
- Stats section with scale-in viewport animations

### 📊 Dashboard
- Sidebar with animated nav pills (`layoutId` shared element)
- Top 6 recommendation cards with:
  - Staggered entrance animations
  - 3D perspective tilt on hover
  - Orange glow border on hover
  - Click-to-expand content modal
- Animated bar charts and circular progress rings (no chart libraries)
- Weekly XP progress tracker

### 🧠 Knowledge Graph
- Interactive 3D graph with draggable rotation
- Click a node → filters recommendation cards
- Hover highlights nodes with emissive glow
- Canvas texture labels for each topic node
- Raycaster-based intersection detection

### 📚 Content View
- Full-screen modal with layout animation
- Simulated video player with play/pause + timer
- Animated waveform visualizer
- Real-time progress bar tracking
- Tabbed interface: Overview / Tags / Notes

## Color Palette

| Token | Value | Use |
|---|---|---|
| `--orange-primary` | `#ff6a00` | Primary accent, active states |
| `--orange-secondary` | `#ff8c42` | Secondary accent, hover |
| `--bg-deep` | `#050505` | Page background |
| `--bg-card` | `#111111` | Card backgrounds |
| `--text-primary` | `#f0ece4` | Headlines |
| `--text-secondary` | `#888880` | Body text |

## Plugging into FastAPI Later

All mock data lives in `src/data/mockData.js`. To connect a real backend:

1. Replace the static imports in `Dashboard.jsx` with `useEffect` + `fetch` calls
2. Point to your FastAPI endpoints (e.g. `/api/recommendations`, `/api/activity`)
3. The Zustand store (`store.js`) is already wired to hold this state
