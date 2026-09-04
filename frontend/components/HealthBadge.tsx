"use client";

import React, { useEffect, useState } from "react";
import { fetchHealth } from "@/lib/api";
import { HealthResponse } from "@/lib/types";
import { Activity, Server, Cpu, Database, RefreshCw } from "lucide-react";

export const HealthBadge: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const data = await fetchHealth();
      setHealth(data);
      setError(false);
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusDot = (status?: string) => {
    if (status === "UP" || status === "CONFIGURED") {
      return <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />;
    }
    return <span className="w-2 h-2 rounded-full bg-rose-500" />;
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <Server className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-slate-500">API:</span>
        {getStatusDot(health?.backend)}
        <span className="font-semibold text-slate-700 dark:text-slate-300">{error ? "OFFLINE" : health?.backend || "..."}</span>
      </div>

      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <Cpu className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-slate-500">MCP:</span>
        {getStatusDot(health?.mcp)}
        <span className="font-semibold text-slate-700 dark:text-slate-300">{health?.mcp || "..."}</span>
      </div>

      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <Database className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-slate-500">DB:</span>
        {getStatusDot(health?.database)}
        <span className="font-semibold text-slate-700 dark:text-slate-300">{health?.database || "..."}</span>
      </div>

      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <Activity className="w-3.5 h-3.5 text-slate-500" />
        <span className="text-slate-500">Provider:</span>
        <span className="font-mono text-teal-600 dark:text-teal-400 font-semibold uppercase">{health?.aiProvider || "groq"}</span>
      </div>

      <button
        onClick={checkHealth}
        disabled={loading}
        title="Refresh health status"
        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-500" : ""}`} />
      </button>
    </div>
  );
};
