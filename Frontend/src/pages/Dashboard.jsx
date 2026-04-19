import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Dashboard/Sidebar';
import ActivityPanel from '../components/Dashboard/ActivityPanel';
import RecommendationCard from '../components/RecommendationCard/RecommendationCard';
import KnowledgeGraph from '../components/ThreeScene/KnowledgeGraph';
import AIResourceGenerator from '../components/Dashboard/AIResourceGenerator';
import ImportContentModal from '../components/Dashboard/ImportContentModal';
import PathfinderPanel from '../components/Dashboard/PathfinderPanel';
import { useStore } from '../store';

// ─── Skeleton Card (shown while recommendations load) ───
function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl bg-card border border-white/5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5" />
        <div className="flex-1">
          <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
          <div className="h-3 bg-white/5 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-white/5 rounded w-full mb-2" />
      <div className="h-3 bg-white/5 rounded w-2/3 mb-4" />
      <div className="flex gap-2">
        <div className="h-5 bg-white/5 rounded-full w-14" />
        <div className="h-5 bg-white/5 rounded-full w-14" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { 
    recommendations, 
    userProfile, 
    fetchAllData, 
    isLoading,
    initialLoadDone,
    token,
    setSelectedContent
  } = useStore();
  
  const [activeSection, setActiveSection] = useState('recommendations');
  const [filterTag, setFilterTag] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    if (token) fetchAllData();
  }, [token, fetchAllData]);

  const filtered = filterTag
    ? recommendations.filter((r) => r.tags?.includes(filterTag.toLowerCase()))
    : recommendations;

  const handleNodeClick = (nodeId) => {
    setFilterTag(nodeId);
    setActiveSection('recommendations');
  };

  // ─── Always show the dashboard shell, never a full-screen blocker ───
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
                {recommendations.length > 0
                  ? `${recommendations.length} curated resources based on your trajectory`
                  : isLoading
                    ? 'Loading your personalized recommendations…'
                    : 'No resources yet — import or generate some!'
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsImportOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-orange-primary/10 border border-orange-primary/20 text-orange-primary text-sm font-bold hover:bg-orange-primary/20 transition-all flex items-center gap-2"
              >
                <span>+</span> Import Link
              </button>
              
              <label className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all cursor-pointer flex items-center gap-2">
                <input
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      await useStore.getState().uploadFile(file);
                    }
                  }}
                />
                <span>↑</span> Upload local
              </label>
            </div>
          </div>

          {activeSection === 'recommendations' && (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-6"
            >
              <PathfinderPanel />
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

              {/* Show skeleton cards while loading, real cards when ready */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading && recommendations.length === 0 ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : (
                  filtered.map((item, i) => (
                    <RecommendationCard
                      key={item.id}
                      item={item}
                      index={i}
                      onClick={() => setSelectedContent(item)}
                    />
                  ))
                )}
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
        <ImportContentModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      </AnimatePresence>
    </div>
  );
}
