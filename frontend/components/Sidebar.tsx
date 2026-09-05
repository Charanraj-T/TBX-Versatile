"use client";

import React from "react";
import { Sparkles, FileSpreadsheet, ChevronLeft, ChevronRight, X } from "lucide-react";

export type NavTab = "chat" | "export";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isPinned: boolean;
  setIsPinned: (pinned: boolean | ((prev: boolean) => boolean)) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen, isPinned, setIsPinned }) => {
  const isOpen = isPinned;

  const navItems = [
    {
      id: "chat" as NavTab,
      label: "AI Chat Mode",
      icon: Sparkles,
    },
    {
      id: "export" as NavTab,
      label: "Query Mode",
      icon: FileSpreadsheet,
    },
  ];

  return (
    <>
      {isMobileOpen && <div onClick={() => setIsMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden transition-opacity" />}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0 w-72 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } ${isOpen ? "w-72 shadow-xl" : "w-20"}`}
      >
        <div className={`p-4 border-b border-slate-100 ${isOpen ? "" : "items-center"}`}>
          <div className={`flex items-center w-full ${isOpen ? "justify-between" : "justify-center"}`}>
            <img
              src="/tbx-logo.png"
              alt="TBX"
              className={`object-contain select-none ${isOpen ? "h-8" : "h-8 w-8 object-left object-cover rounded-lg overflow-hidden"}`}
              draggable={false}
            />
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsPinned((prev) => !prev)}
              className={`m-auto lg:m-0 flex items-center justify-center p-1.5 rounded-lg border text-slate-500 hover:text-slate-800 transition-all ${
                isPinned ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 hover:bg-slate-100"
              }`}
              title={isPinned ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isPinned ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <nav className={`flex-1 ${isOpen ? "px-3" : "px-2"} py-5 space-y-2 overflow-y-auto`}>
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
                  isOpen ? "gap-3.5 px-3 py-2.5" : "justify-center p-2.5"
                } rounded-2xl transition-all ${
                  isActive ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200/70"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {isOpen && (
                  <div className="flex-1 min-w-0 text-left">
                    <div className={`text-sm font-bold tracking-tight ${isActive ? "text-white" : "text-slate-900"}`}>{item.label}</div>
                  </div>
                )}

                {!isOpen && (
                  <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
