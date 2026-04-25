"use client";

import { useEffect, useState } from "react";
import SystemInfo from "@/components/SystemInfo";
import Recommendations from "@/components/Recommendations";
import CopilotChat from "@/components/CopilotChat";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [systemData, setSystemData] = useState(null);
  const [recommendations, setRecommendations] = useState<string | null>(null);
  const [loadingSystem, setLoadingSystem] = useState(true);
  const [loadingRec, setLoadingRec] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/system-info`)
      .then((r) => r.json())
      .then((data) => {
        setSystemData(data);
        setLoadingSystem(false);
      })
      .catch(() => {
        setError("Cannot reach backend. Start FastAPI on port 8000.");
        setLoadingSystem(false);
      });
  }, []);

  const fetchRecommendations = async () => {
    setLoadingRec(true);
    setRecommendations(null);
    try {
      const res = await fetch(`${API_URL}/api/recommend`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "API error");
      setRecommendations(data.recommendations);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingRec(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">llm-selector</h1>
            <p className="text-xs text-gray-500">Find the right model for your machine</p>
          </div>
        </div>
        <a
          href="https://github.com/jppawade/llm-selector"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-violet-400 transition-colors"
        >
          github ↗
        </a>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="flex flex-col gap-4">
            <SystemInfo data={systemData} loading={loadingSystem} />

            {!loadingSystem && systemData && !recommendations && !loadingRec && (
              <button
                onClick={fetchRecommendations}
                className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-3 text-sm font-semibold transition-colors"
              >
                ✨ Ask Copilot for recommendations
              </button>
            )}

            {(loadingRec || recommendations) && (
              <button
                onClick={fetchRecommendations}
                disabled={loadingRec}
                className="w-full rounded-xl border border-gray-700 hover:border-violet-500 px-4 py-2 text-sm text-gray-400 hover:text-violet-300 disabled:opacity-40 transition-colors"
              >
                {loadingRec ? "Fetching…" : "↺ Refresh recommendations"}
              </button>
            )}
          </div>

          {/* Middle column — recommendations */}
          <div className="lg:col-span-1">
            {(loadingRec || recommendations) ? (
              <Recommendations content={recommendations} loading={loadingRec} />
            ) : (
              <div className="rounded-xl border border-dashed border-gray-800 p-8 text-center text-gray-600 text-sm h-full flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">🤖</span>
                <p>Click the button to get<br />Copilot's recommendations</p>
              </div>
            )}
          </div>

          {/* Right column — chat */}
          <div>
            <CopilotChat />
          </div>
        </div>
      </div>
    </main>
  );
}
