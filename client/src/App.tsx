import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SupportedPlatforms } from './components/SupportedPlatforms';
import { UrlInputSection } from './components/UrlInputSection';
import { PreviewModal } from './components/PreviewModal';
import { FeaturesSection } from './components/FeaturesSection';
import { FutureFeaturesSection } from './components/FutureFeaturesSection';
import { Footer } from './components/Footer';
import { PreviewData, ViewMode, AppTheme } from './lib/api';

export function App() {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  // 1. Auto-detect theme preference from localStorage or default to 'dark'
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('ai_chat_pdf_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  });

  // 2. Auto-detect viewMode based on viewport width (mobile vs desktop)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'mobile';
    }
    return 'desktop';
  });

  // Apply theme to document root & persist preference
  useEffect(() => {
    localStorage.setItem('ai_chat_pdf_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#050508] text-[#f3f4f6]' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <div>
        <Header
          viewMode={viewMode}
          onViewModeChange={(mode) => setViewMode(mode)}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
        <main className="pt-4 pb-12">
          <SupportedPlatforms />
          <UrlInputSection
            onPreviewSuccess={(data) => setPreviewData(data)}
            currentViewMode={viewMode}
            onViewModeChange={(mode) => setViewMode(mode)}
            currentTheme={theme}
            onThemeToggle={toggleTheme}
          />
          <FeaturesSection />
          <FutureFeaturesSection />
        </main>
      </div>

      <Footer />

      <PreviewModal data={previewData} onClose={() => setPreviewData(null)} />
    </div>
  );
}

export default App;
