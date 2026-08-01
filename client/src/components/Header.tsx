import React from 'react';
import { FileText, Laptop, Smartphone, Tablet, Sun, Moon, Sparkles } from 'lucide-react';
import { ViewMode, AppTheme } from '../lib/api';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  theme: AppTheme;
  onThemeToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  theme,
  onThemeToggle,
}) => {
  return (
    <header className="w-full border-b border-white/10 dark:border-white/10 border-gray-200 bg-[#050508]/80 dark:bg-[#050508]/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-green-500 p-[1px] shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#0a0c14] dark:bg-[#0a0c14] bg-gray-900 rounded-[11px] flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white dark:text-white text-gray-900 tracking-tight">
                AI Chat <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-green-400 bg-clip-text text-transparent">to PDF</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">PRO</span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-400 text-gray-500 hidden sm:block">
              Permanent Revision Notes Generator
            </p>
          </div>
        </div>

        {/* Prominent Controls: View Mode & Theme Toggle */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-white/5 dark:bg-white/5 bg-gray-100 border border-white/10 dark:border-white/10 border-gray-200">
            <button
              onClick={() => onViewModeChange('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'desktop'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white'
              }`}
              title="Desktop Layout (1920px style)"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Desktop</span>
            </button>

            <button
              onClick={() => onViewModeChange('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'tablet'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white'
              }`}
              title="Tablet Layout (768px style)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tablet</span>
            </button>

            <button
              onClick={() => onViewModeChange('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'mobile'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-gray-400 dark:text-gray-400 text-gray-600 hover:text-white'
              }`}
              title="Mobile Layout (390px style)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mobile</span>
            </button>
          </div>

          {/* Theme Switch Toggle */}
          <button
            onClick={onThemeToggle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 dark:bg-white/5 bg-gray-100 border border-white/10 dark:border-white/10 border-gray-200 text-xs font-bold text-gray-300 dark:text-gray-300 text-gray-700 hover:border-blue-500/40 transition-all cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Light</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
