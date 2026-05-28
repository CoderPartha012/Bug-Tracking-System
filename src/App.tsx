import React, { useState, useEffect, useCallback } from 'react';
import { Bug } from './types/bug';
import { BugProvider, useBugs } from './context/BugContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { BugList } from './components/BugList';
import { BugForm } from './components/BugForm';
import { Filters } from './components/Filters';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { KanbanSkeletons } from './components/SkeletonLoader';
import { NotificationBell } from './components/NotificationBell';
import { BottomNav } from './components/BottomNav';
import { OnboardingTour, shouldShowOnboarding } from './components/OnboardingTour';
import { RecentlyViewed, trackRecentlyViewed, getRecentlyViewedIds } from './components/RecentlyViewed';
import { Moon, Sun, Plus, Bug as BugIcon, LayoutList, Kanban, ArrowUp } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type ViewMode = 'list' | 'kanban';

function BugTracker() {
  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [selectedBug, setSelectedBug]   = useState<Bug | undefined>();
  const [viewMode, setViewMode]         = useState<ViewMode>('list');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding);
  const [recentIds, setRecentIds] = useState<string[]>(getRecentlyViewedIds);

  const { theme, toggleTheme } = useTheme();
  const { filteredBugs, loading } = useBugs();

  const openNewForm = useCallback(() => {
    setSelectedBug(undefined);
    setIsFormOpen(true);
  }, []);

  const handleEdit = useCallback((bug: Bug) => {
    setSelectedBug(bug);
    setIsFormOpen(true);
    // Track recently viewed
    trackRecentlyViewed(bug.id);
    setRecentIds(prev => {
      const deduped = prev.filter(id => id !== bug.id);
      return [bug.id, ...deduped].slice(0, 5);
    });
  }, []);

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedBug(undefined);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Keyboard shortcuts: N = new bug, Esc = close modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
        (e.target as HTMLElement).isContentEditable;
      if (e.key === 'Escape' && isFormOpen) { handleCloseForm(); return; }
      if (e.key === 'n' && !isTyping && !isFormOpen) { e.preventDefault(); openNewForm(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFormOpen, openNewForm]);

  // Back-to-top visibility
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 320);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 transition-colors duration-300">

      {/* ── Sticky header ── */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">

            {/* Brand */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="p-1.5 sm:p-2 bg-blue-600 rounded-xl shadow-sm">
                <BugIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                  Bug Tracker
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                  Track, manage &amp; resolve
                </p>
              </div>
            </div>

            {/* Actions — some hidden on mobile (moved to BottomNav) */}
            <div className="flex items-center gap-2">

              {/* View toggle — hidden on mobile */}
              <div className="hidden md:flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 p-0.5 gap-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="List view"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <LayoutList size={14} /> List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  title="Kanban board"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Kanban size={14} /> Kanban
                </button>
              </div>

              {/* Notification bell — hidden on mobile (appears in BottomNav) */}
              <div className="hidden md:block">
                <NotificationBell />
              </div>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle theme"
                title="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                )}
              </button>

              {/* Add Bug — hidden on mobile (FAB in BottomNav) */}
              <button
                type="button"
                onClick={openNewForm}
                className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                title="New bug (N)"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Bug</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Keyboard shortcut hint (desktop only) ── */}
      <div className="hidden md:flex container mx-auto px-6 pt-2 pb-0 justify-end">
        <span className="text-xs text-slate-400 dark:text-slate-600">
          Press{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-500">N</kbd>
          {' '}for new bug ·{' '}
          <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-500">Esc</kbd>
          {' '}to close
        </span>
      </div>

      {/* ── Main content — extra bottom padding on mobile for BottomNav ── */}
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 md:pb-8">
        <Dashboard onEdit={handleEdit} />
        <Filters />
        <RecentlyViewed ids={recentIds} onOpen={handleEdit} />

        {viewMode === 'list' ? (
          <BugList onEdit={handleEdit} onAddBug={openNewForm} />
        ) : loading ? (
          <KanbanSkeletons />
        ) : (
          <KanbanBoard bugs={filteredBugs} onEdit={handleEdit} />
        )}
      </main>

      {/* ── Bug form modal ── */}
      {isFormOpen && (
        <BugForm bug={selectedBug} onClose={handleCloseForm} />
      )}

      {/* ── Mobile bottom navigation ── */}
      <BottomNav
        viewMode={viewMode}
        onViewChange={setViewMode}
        onAddBug={openNewForm}
        onScrollTop={scrollToTop}
      />

      {/* ── Onboarding tour (first visit only) ── */}
      {showOnboarding && (
        <OnboardingTour onFinish={() => setShowOnboarding(false)} />
      )}

      {/* ── Back to top ── */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`
          fixed bottom-24 md:bottom-24 right-4 sm:right-6 z-20
          p-3 rounded-xl bg-white dark:bg-slate-800
          border border-slate-200 dark:border-slate-700
          shadow-lg hover:shadow-xl
          text-slate-600 dark:text-slate-300
          hover:text-blue-600 dark:hover:text-blue-400
          transition-all duration-300
          ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        <ArrowUp size={18} />
      </button>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BugProvider>
        <BugTracker />
      </BugProvider>
    </ThemeProvider>
  );
}

export default App;
