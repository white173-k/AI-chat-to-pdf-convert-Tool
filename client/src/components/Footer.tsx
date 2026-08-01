import React from 'react';
import { Heart, ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-[#030407] py-10 mt-20 text-xs text-gray-500">
      <div className="max-w-6xl mx-auto px-4 flex flex-col items-center justify-between gap-6 text-center sm:text-left sm:flex-row">
        <div>
          <p className="font-bold text-gray-300">AI Chat to PDF Generator</p>
          <p className="text-gray-500 text-[11px] mt-1">
            Built with React, TypeScript, Tailwind CSS v4, Express, Puppeteer & Unified (Remark/Rehype).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-lg text-[11px] text-gray-400">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Personal productivity tool. Converts publicly shared conversation links.</span>
        </div>
      </div>
    </footer>
  );
};
