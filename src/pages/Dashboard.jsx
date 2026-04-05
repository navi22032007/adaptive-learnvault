import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Dashboard/Sidebar';
import ActivityPanel from '../components/Dashboard/ActivityPanel';
import RecommendationCard from '../components/RecommendationCard/RecommendationCard';
import KnowledgeGraph from '../components/ThreeScene/KnowledgeGraph';
import ContentView from './ContentView';
import { mockRecommendations } from '../data/mockData';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('recommendations');
  const [selectedItem, setSelectedItem] = useState(null);
  const [recommendations, setRecommendations] = useState(mockRecommendations);
  const [filterTag, setFilterTag] = useState(null);

  const filtered = filterTag
    ? recommendations.filter((r) => r.tags.includes(filterTag))
    : recommendations;

  const handleNodeClick = (nodeId) => {
    setFilterTag(nodeId);
    setActiveSection('recommendations');
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-6" style={{ background: 'radial-gradient(circle farthest-corner at 10% 20%, rgba(234,249,249,0.67) 0.1%, rgba(239,249,251,0.63) 90.1%)', backgroundColor: '#eef9fb' }}>
      {/* Dashboard header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto mb-8 flex items-end justify-between"
      >
        <div>
          <div className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#0891b2', letterSpacing: '0.2em' }}>
            Dashboard
          </div>
          <h1 className="font-display font-bold text-3xl" style={{ color: '#0f1f22', fontFamily: 'Syne' }}>
            Good morning, Arjun
          </h1>
          <p className="text-sm mt-1" style={{ color: '#4a7a82', fontFamily: 'DM Sans' }}>
            AI has queued 6 new recommendations based on your recent activity
          </p>
        </div>

        <div className="flex items-center gap-3">
          {filterTag && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setFilterTag(null)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{ background: 'rgba(8,145,178,0.12)', border: '1px solid rgba(8,145,178,0.3)', color: '#0891b2', fontFamily: 'JetBrains Mono' }}
            >
              #{filterTag} ✕
            </motion.button>
          )}
          <div
            className="px-3 py-1.5 rounded-full text-xs flex items-center gap-2"
            style={{ background: 'rgba(8,145,178,0.05)', border: '1px solid rgba(8,145,178,0.15)', color: '#4a7a82', fontFamily: 'DM Sans' }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4ade80' }} />
            AI Engine Active
          </div>
        </div>
      </motion.div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto flex gap-6">
        {/* Sidebar */}
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

        {/* Center content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeSection === 'recommendations' && (
              <motion.div
                key="recommendations"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
              >
                {/* Section header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-display font-semibold text-lg" style={{ color: '#0f1f22', fontFamily: 'Syne' }}>
                      {filterTag ? `Content tagged #${filterTag}` : 'Top Recommendations'}
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: '#4a7a82', fontFamily: 'DM Sans' }}>
                      {filtered.length} items · Sorted by AI relevance score
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {['All', 'Video', 'PDF'].map((f) => (
                      <button
                        key={f}
                        className="px-3 py-1 rounded-lg text-xs transition-all duration-200"
                        style={{
                          background: 'rgba(8,145,178,0.05)',
                          border: '1px solid rgba(8,145,178,0.15)',
                          color: '#4a7a82',
                          fontFamily: 'DM Sans',
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cards grid */}
                <motion.div
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                  initial="hidden"
                  animate="show"
                >
                  {filtered.map((item, i) => (
                    <RecommendationCard
                      key={item.id}
                      item={item}
                      index={i}
                      onClick={setSelectedItem}
                    />
                  ))}
                </motion.div>
              </motion.div>
            )}

            {activeSection === 'graph' && (
              <motion.div
                key="graph"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-5">
                  <h2 className="font-display font-semibold text-lg" style={{ color: '#0f1f22', fontFamily: 'Syne' }}>
                    Knowledge Graph
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: '#4a7a82', fontFamily: 'DM Sans' }}>
                    Interactive 3D map of your topic relationships · Click a node to filter content
                  </p>
                </div>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ height: '520px', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(8,145,178,0.18)' }}
                >
                  <KnowledgeGraph onNodeClick={handleNodeClick} />
                </div>
                <p className="text-xs mt-3 text-center" style={{ color: '#8ab4ba', fontFamily: 'DM Sans' }}>
                  Nodes represent topics · Lines indicate connections · Drag to rotate
                </p>
              </motion.div>
            )}

            {activeSection === 'activity' && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
              >
                <div className="mb-5">
                  <h2 className="font-display font-semibold text-lg" style={{ color: '#0f1f22', fontFamily: 'Syne' }}>
                    Activity Overview
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: '#4a7a82', fontFamily: 'DM Sans' }}>
                    Your learning analytics for the past 7 days
                  </p>
                </div>
                <ActivityPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right panel - always visible on large screens */}
        <div className="hidden xl:block w-64 flex-shrink-0">
          <ActivityPanel />
        </div>
      </div>

      {/* Content modal */}
      <AnimatePresence>
        {selectedItem && (
          <ContentView item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
