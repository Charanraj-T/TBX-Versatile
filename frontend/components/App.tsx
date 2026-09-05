'use client';

import { useState } from 'react';
import { Sidebar, type NavTab } from './Sidebar';
import { ChatBot } from './ChatBot';
import { DataExport } from './DataExport';
import { Menu } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('chat');
  const [preloadedQuery, setPreloadedQuery] = useState<string | undefined>(undefined);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
        isPinned={isSidebarPinned}
        setIsPinned={setIsSidebarPinned}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarPinned ? 'lg:pl-72' : 'lg:pl-20'}`}>
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Versatile FinOps
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <img
              src="/tbx-logo.png"
              alt="TBX"
              className="h-7 sm:h-8 w-auto object-contain select-none"
              draggable={false}
            />
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeTab === 'chat' && (
            <ChatBot
              initialQuery={preloadedQuery}
              onClearInitialQuery={() => setPreloadedQuery(undefined)}
            />
          )}

          {activeTab === 'export' && (
            <DataExport />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;