import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Dashboard/Sidebar';
import ActivityPanel from '../components/Dashboard/ActivityPanel';
import RecommendationCard from '../components/RecommendationCard/RecommendationCard';
import KnowledgeGraph from '../components/ThreeScene/KnowledgeGraph';
import ContentView from './ContentView';
import AIResourceGenerator from '../components/Dashboard/AIResourceGenerator';
import ImportContentModal from '../components/Dashboard/ImportContentModal';
import { useStore } from '../store';

export default function Dashboard() {
  const { 
    recommendations, 
    userProfile, 
    fetchAllData, 
    isLoading,
    token
  } = useStore();
  
  const [activeSection, setActiveSection] = useState('recommendations');
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    if (token) fetchAllData();
  }, [token, fetchAllData]);

  const filtered = filterTag
    ? recommendations.filter((r) => r.tags.includes(filterTag.toLowerCase()))
    : recommendations;

  const handleNodeClick = (nodeId) => {
    setFilterTag(nodeId);
    setActiveSection('recommendations');
  };

  if (isLoading && recommendations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-primary/20 border-t-orange-primary rounded-full animate-spin" />
          <div className="text-orange-primary font-mono animate-pulse tracking-widest text-sm uppercase">Initializing AI Engine...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10 px-6 bg-deep">
      <div className="max-w-7xl mx-auto flex gap-8 h-[calc(100vh-120px)]">
        {/* Left Sidebar */}
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar pr-4">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="font-mono text-xs text-orange-primary tracking-widest uppercase mb-1">
                Dashboard
              </div>
              <h1 className="font-display font-bold text-3xl text-white">
                Welcome, {userProfile?.name || 'Explorer'}
              </h1>
              <p className="text-text-secondary text-sm mt-1">
                {recommendations.length} curated resources based on your trajectory
              </p>
            </div>
            <button
              onClick={() => setIsImportOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <span>+</span> Import Content
            </button>
          </div>

          {activeSection === 'recommendations' && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-6"
            >
              <AIResourceGenerator />
              
              {filterTag && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-text-secondary">Filtering by:</span>
                  <div className="px-3 py-1 rounded-full bg-orange-primary/20 border border-orange-primary text-orange-primary text-xs font-bold flex items-center gap-2">
                    {filterTag}
                    <button onClick={() => setFilterTag(null)} className="hover:text-white">×</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((item, i) => (
                  <RecommendationCard
                    key={item.id}
                    item={item}
                    index={i}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 'graph' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full rounded-3xl bg-card border border-white/5 overflow-hidden relative"
            >
              <KnowledgeGraph onNodeClick={handleNodeClick} />
            </motion.div>
          )}

          {activeSection === 'activity' && (
            <ActivityPanel />
          )}
        </main>

        {/* Right Activity Sidebar (desktop only) */}
        {activeSection !== 'activity' && (
          <aside className="w-80 hidden xl:block">
            <ActivityPanel />
          </aside>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedItem && (
          <ContentView item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
        <ImportContentModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      </AnimatePresence>
    </div>
  );
}
