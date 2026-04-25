"use client";

import { useState } from "react";

interface RecommendationsProps {
  content: string | null;
  loading: boolean;
}

export default function Recommendations({ content, loading }: RecommendationsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  // Extract inline code blocks to make them copyable
  const renderContent = (text: string) => {
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        const code = part.slice(1, -1);
        return (
          <button
            key={i}
            onClick={() => copyToClipboard(code)}
            title="Click to copy"
            className="font-mono text-xs bg-gray-800 text-violet-300 px-1.5 py-0.5 rounded hover:bg-violet-900 transition-colors cursor-pointer"
          >
            {copied === code ? "✓ copied" : code}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-widest mb-4">
          Recommendations
        </h2>
        <div className="space-y-3 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 bg-gray-800 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4">Asking Copilot about your hardware…</p>
      </div>
    );
  }

  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <h2 className="text-sm font-semibold text-violet-400 uppercase tracking-widest mb-4">
        Copilot Recommendations
      </h2>
      <div className="space-y-1 text-sm text-gray-300 leading-relaxed">
        {lines.map((line, i) => {
          if (line.startsWith("## ") || line.startsWith("# ")) {
            return (
              <p key={i} className="text-white font-semibold mt-4 mb-1">
                {line.replace(/^#+\s/, "")}
              </p>
            );
          }
          if (line.startsWith("### ")) {
            return (
              <p key={i} className="text-violet-300 font-medium mt-3">
                {line.replace(/^###\s/, "")}
              </p>
            );
          }
          if (line.startsWith("- ") || line.startsWith("* ")) {
            return (
              <p key={i} className="pl-3 before:content-['·'] before:mr-2 before:text-violet-500">
                {renderContent(line.replace(/^[-*]\s/, ""))}
              </p>
            );
          }
          if (/^\d+\./.test(line)) {
            return (
              <p key={i} className="pl-3">
                {renderContent(line)}
              </p>
            );
          }
          if (line.trim() === "") return <div key={i} className="h-2" />;
          return <p key={i}>{renderContent(line)}</p>;
        })}
      </div>
    </div>
  );
}
