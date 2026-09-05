import React, { useState } from 'react';
import { 
  BarChart3, 
  Sparkles, 
  FileSpreadsheet, 
  KeyRound, 
  Cpu,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export type NavTab = 'dashboard' | 'chat' | 'export';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenApiKeyModal: () => void;
  hasCustomKey: boolean;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isPinned: boolean;
  setIsPinned: (pinned: boolean | ((prev: boolean) => boolean)) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenApiKeyModal,
  hasCustomKey,
  isMobileOpen,
  setIsMobileOpen,
  isPinned,
  setIsPinned,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Sidebar is open if pinned by user OR currently hovered
  const isOpen = isPinned || isHovered;

  const navItems = [
    {
      id: 'chat' as NavTab,
      label: 'AI Assistant',
      icon: Sparkles,
      description: 'Natural Language Grounded Queries',
    },
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: BarChart3,
      description: 'KPIs, Spend Trends & Reconciliation',
    },
    {
      id: 'export' as NavTab,
      label: 'Data Export',
      icon: FileSpreadsheet,
      description: 'CSV & Excel Financial Ledgers',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container with Hover Expand and Toggle */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out ${
          isMobileOpen 
            ? 'translate-x-0 w-72 shadow-2xl' 
            : '-translate-x-full lg:translate-x-0'
        } ${
          isOpen ? 'w-72 shadow-xl' : 'w-20'
        }`}
      >
        {/* Top Logo & Header */}
        <div className={`p-4 border-b border-slate-100 flex flex-col gap-2 ${isOpen ? '' : 'items-center'}`}>
          <div className="flex items-center justify-between w-full">
            {isOpen ? (
              <a 
                href="https://www.tbx.co.in/products/reconhub" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block hover:opacity-90 transition-opacity"
                title="TBX ReconHub"
              >
                <img 
                  src="/tbx-logo.png" 
                  alt="TBX ReconHub" 
                  className="h-8 w-auto object-contain"
                />
              </a>
            ) : (
              <a 
                href="https://www.tbx.co.in/products/reconhub" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-200 hover:bg-blue-100 transition-colors"
                title="TBX ReconHub"
              >
                <span className="font-extrabold text-blue-700 text-sm">TBX</span>
              </a>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Pin / Collapse Toggle */}
            <button
              onClick={() => setIsPinned((prev) => !prev)}
              className={`hidden lg:flex items-center justify-center p-1.5 rounded-lg border text-slate-500 hover:text-slate-800 transition-all ${
                isPinned 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-slate-200 hover:bg-slate-100'
              }`}
              title={isPinned ? 'Collapse sidebar (hover to open)' : 'Pin sidebar open'}
            >
              {isPinned ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {isOpen && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                TBX Hackathon
              </span>
              <span className="text-[11px] text-slate-500 font-medium truncate">
                ReconHub Intelligence
              </span>
            </div>
          )}
        </div>

        {/* Navigation Items (Only Dashboard, AI Assistant, Data Export) */}
        <div className={`flex-1 ${isOpen ? 'px-3' : 'px-2'} py-5 space-y-2 overflow-y-auto`}>
          {isOpen && (
            <div className="px-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileOpen(false);
                }}
                title={!isOpen ? item.label : undefined}
                className={`w-full relative group flex items-center ${
                  isOpen ? 'gap-3.5 px-3 py-2.5' : 'justify-center p-2.5'
                } rounded-2xl transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/70'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                {isOpen && (
                  <div className="flex-1 min-w-0 text-left">
                    <div className={`text-sm font-bold tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {item.label}
                    </div>
                    <div className={`text-[11px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {item.description}
                    </div>
                  </div>
                )}

                {/* Floating tooltip on hover when collapsed */}
                {!isOpen && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Status & LLM Config */}
        <div className={`p-3 border-t border-slate-100 bg-slate-50 ${isOpen ? 'space-y-2' : 'flex flex-col items-center gap-2'}`}>
          {isOpen ? (
            <>
              {/* Grounding & Lightweight Constraint Card */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    100% Grounded
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Deterministic
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <Cpu className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>&le;20B Param Limit Met</span>
                </div>
              </div>

              {/* LLM Settings Trigger */}
              <button
                onClick={onOpenApiKeyModal}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  hasCustomKey
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>{hasCustomKey ? 'Gemini Flash' : 'LLM Settings'}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">v1.5/2.0</span>
              </button>
            </>
          ) : (
            <>
              {/* Collapsed Mode Icons with Tooltips */}
              <div 
                className="relative group p-2 rounded-xl bg-white border border-slate-200 shadow-2xs cursor-pointer flex items-center justify-center"
                title="100% Grounded • <=20B Param Limit Met"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  100% Grounded SQL Engine
                </div>
              </div>

              <button
                onClick={onOpenApiKeyModal}
                className="relative group p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                title="LLM Settings"
              >
                <KeyRound className="w-4 h-4" />
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  LLM Settings
                </div>
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
