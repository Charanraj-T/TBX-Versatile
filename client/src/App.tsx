import { useState } from 'react';
import { Sidebar, type NavTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ChatBot } from './components/ChatBot';
import { DataExport } from './components/DataExport';
import { ModelSpecs } from './components/ModelSpecs';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { Sparkles, Menu, X, Info } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('chat');
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [specsModalOpen, setSpecsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [preloadedQuery, setPreloadedQuery] = useState<string | undefined>(undefined);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('gemini_api_key', key);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  const handleAskQuestion = (query: string) => {
    setPreloadedQuery(query);
    // Open right-side AI assistant popup with the query preloaded
    setIsAiDrawerOpen(true);
  };

  const handleExpandToFullChat = () => {
    setIsAiDrawerOpen(false);
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Left Navigation Sidebar (Collapsible with Hover to Open) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApiKeyModal={() => setApiKeyModalOpen(true)}
        hasCustomKey={!!apiKey}
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
        isPinned={isSidebarPinned}
        setIsPinned={setIsSidebarPinned}
      />

      {/* Main Layout Container (adjusts dynamically based on sidebar pin state) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarPinned ? 'lg:pl-72' : 'lg:pl-20'}`}>
        {/* Top Header (Mobile & Desktop Status Bar) */}
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
              <a 
                href="https://www.tbx.co.in/products/reconhub" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:opacity-90 transition-opacity"
              >
                <img 
                  src="/tbx-logo.png" 
                  alt="TBX ReconHub" 
                  className="h-6 sm:h-7 w-auto object-contain"
                />
              </a>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-700 hidden sm:inline">
                ReconHub Financial Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Model Architecture Note Button */}
            <button
              onClick={() => setSpecsModalOpen(true)}
              title="View Model Specs & Hackathon Architecture Notes"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Architecture Specs</span>
            </button>

            {/* Right-Side AI Assistant Header Trigger */}
            <button
              onClick={() => setIsAiDrawerOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xs hover:shadow-md transition-all cursor-pointer"
              title="Open AI Assistant Popup (Right Side)"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">AI Assistant</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-mono hidden md:inline">
                Popup
              </span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {activeTab === 'dashboard' && (
            <Dashboard onAskQuestion={handleAskQuestion} />
          )}

          {activeTab === 'chat' && (
            <ChatBot
              initialQuery={preloadedQuery}
              customApiKey={apiKey}
              onClearInitialQuery={() => setPreloadedQuery(undefined)}
            />
          )}

          {activeTab === 'export' && (
            <DataExport />
          )}
        </main>

        {/* Global Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">TBX ReconHub</span>
              <span>• BVP Tech Catalyst Hackathon</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Grounded SQL Computation</span>
              <span>• Verifiable Breakdown</span>
              <span>• &le;20B Lightweight LLM Constraint Compliant</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Right-Side AI Assistant Action Button */}
      <aside 
        aria-label="AI Assistant Floating Trigger" 
        className="fixed right-5 bottom-6 z-40"
      >
        <button
          onClick={() => setIsAiDrawerOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all duration-200 border border-white/20 cursor-pointer"
          title="Open AI Assistant (Right Popup)"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 border border-white rounded-full" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
              AI Assistant
              <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.2 rounded-full font-mono">
                Ask
              </span>
            </span>
            <span className="text-[10px] text-blue-100 leading-tight">
              Click to open popup
            </span>
          </div>
        </button>
      </aside>

      {/* Right-Side Slide-Over AI Assistant Popup Drawer */}
      <AIAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        onExpandToFullView={handleExpandToFullChat}
        customApiKey={apiKey}
        initialQuery={preloadedQuery}
        onClearInitialQuery={() => setPreloadedQuery(undefined)}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={apiKeyModalOpen}
        onClose={() => setApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      {/* Architecture Specs Modal */}
      {specsModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            onClick={() => setSpecsModalOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" 
          />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-900">Architecture & Model Evaluation Specs</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Hackathon Submission Notes
                  </span>
                </div>
                <button
                  onClick={() => setSpecsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ModelSpecs />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
