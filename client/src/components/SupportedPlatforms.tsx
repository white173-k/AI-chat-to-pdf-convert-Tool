import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';

interface Platform {
  name: string;
  domain: string;
  status: 'active' | 'coming_soon';
  color: string;
  iconBg: string;
}

const platforms: Platform[] = [
  { name: 'ChatGPT', domain: 'chatgpt.com', status: 'active', color: 'from-emerald-400 to-teal-500', iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  { name: 'Google Gemini', domain: 'gemini.google.com', status: 'active', color: 'from-blue-400 to-indigo-500', iconBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
  { name: 'Claude', domain: 'claude.ai', status: 'coming_soon', color: 'from-orange-400 to-amber-500', iconBg: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
  { name: 'Perplexity', domain: 'perplexity.ai', status: 'coming_soon', color: 'from-cyan-400 to-blue-500', iconBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' },
  { name: 'Grok', domain: 'grok.com', status: 'coming_soon', color: 'from-gray-300 to-gray-500', iconBg: 'bg-gray-500/10 border-gray-500/30 text-gray-400' },
  { name: 'DeepSeek', domain: 'deepseek.com', status: 'coming_soon', color: 'from-purple-400 to-indigo-500', iconBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400' },
  { name: 'Microsoft Copilot', domain: 'copilot.microsoft.com', status: 'coming_soon', color: 'from-sky-400 to-blue-600', iconBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400' },
];

export const SupportedPlatforms: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto my-8">
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
        Supported AI Share Platforms
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {platforms.map((p) => {
          const isActive = p.status === 'active';
          return (
            <div
              key={p.name}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all ${
                isActive
                  ? `${p.iconBg} shadow-sm shadow-blue-500/5`
                  : 'bg-white/[0.02] border-white/10 text-gray-400 opacity-70 hover:opacity-100'
              }`}
            >
              {isActive ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-gray-500" />
              )}
              <span className="font-semibold text-white">{p.name}</span>
              {isActive ? (
                <span className="text-[10px] bg-green-500/20 text-green-300 px-1.5 py-0.2 rounded-full font-bold">READY</span>
              ) : (
                <span className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.2 rounded-full">SOON</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
