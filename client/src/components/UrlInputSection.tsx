import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  FileDown,
  Eye,
  Clipboard,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Moon,
  Sun,
  Laptop,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { fetchPreview, generateAndDownloadPdf, PreviewData, ViewMode, AppTheme } from '../lib/api';

interface UrlInputSectionProps {
  onPreviewSuccess: (data: PreviewData) => void;
  currentViewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentTheme: AppTheme;
  onThemeToggle: () => void;
}

export const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  onPreviewSuccess,
  currentViewMode,
  onViewModeChange,
  currentTheme,
  onThemeToggle,
}) => {
  const [url, setUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [pdfTheme, setPdfTheme] = useState<AppTheme>(currentTheme);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successFilename, setSuccessFilename] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // ignore
    }
  };

  const handleGeneratePdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please paste an AI conversation share link.');
      return;
    }

    setError(null);
    setSuccessFilename(null);
    setLoading(true);

    try {
      setStep(`Launching Puppeteer for ${currentViewMode.toUpperCase()} layout (${pdfTheme.toUpperCase()} theme)...`);
      await new Promise((r) => setTimeout(r, 600));

      setStep('Fetching public conversation & parsing markdown content...');
      const downloadedName = await generateAndDownloadPdf(
        url.trim(),
        customTitle.trim() || undefined,
        pdfTheme,
        currentViewMode
      );

      setStep('PDF downloaded successfully!');
      setSuccessFilename(downloadedName);
    } catch (err: any) {
      setError(err.message || 'Failed to generate PDF. Please verify the share link and try again.');
    } finally {
      setLoading(false);
      setStep('');
    }
  };

  const handleLivePreview = async () => {
    if (!url.trim()) {
      setError('Please paste an AI conversation share link.');
      return;
    }

    setError(null);
    setSuccessFilename(null);
    setLoading(true);

    try {
      setStep('Fetching conversation preview...');
      const preview = await fetchPreview(
        url.trim(),
        customTitle.trim() || undefined,
        pdfTheme,
        currentViewMode
      );
      onPreviewSuccess(preview);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch preview.');
    } finally {
      setLoading(false);
      setStep('');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-6 px-4">
      {/* Hero Title */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Save ChatGPT & Gemini Chats Permanently</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-5xl font-extrabold text-white dark:text-white text-gray-900 tracking-tight leading-tight mb-4"
        >
          Turn Shared AI Chats Into <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-green-400 bg-clip-text text-transparent">
            Formatted PDF Notes
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-gray-400 dark:text-gray-400 text-gray-600 text-sm sm:text-base max-w-xl mx-auto"
        >
          Paste a public share link. Customize layout (Desktop/Mobile) and Theme (Dark/Light) before exporting your revision PDF.
        </motion.p>
      </div>

      {/* Main Glass Card Form */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
      >
        <form onSubmit={handleGeneratePdf} className="space-y-6 relative z-10">
          {/* Share Link Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 dark:text-gray-300 text-gray-700 mb-2">
              AI Share Link
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-blue-400 pointer-events-none">
                <Link2 className="w-5 h-5" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste link: https://chatgpt.com/share/... or https://gemini.google.com/share/..."
                className="w-full bg-[#0a0c14] dark:bg-[#0a0c14] bg-white border border-white/10 dark:border-white/10 border-gray-300 rounded-xl pl-11 pr-24 py-3.5 text-sm text-white dark:text-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5 text-blue-400" />
                <span>Paste</span>
              </button>
            </div>
          </div>

          {/* Configuration Grid: Document Title + PDF Theme + View Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title Override */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Document Title (Optional Override)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Auto-detected if empty"
                className="w-full bg-[#0a0c14]/70 dark:bg-[#0a0c14]/70 bg-white border border-white/10 dark:border-white/10 border-gray-300 rounded-xl px-4 py-2.5 text-sm text-white dark:text-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                disabled={loading}
              />
            </div>

            {/* PDF Theme Options Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                PDF Export Theme
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setPdfTheme('dark')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    pdfTheme === 'dark'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Dark PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPdfTheme('light')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    pdfTheme === 'light'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-100" />
                  <span>Light PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-white" />
                  <span>Generate & Download PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLivePreview}
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white dark:text-white text-gray-800 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Live {pdfTheme === 'dark' ? 'Dark' : 'Light'} Preview</span>
            </button>
          </div>
        </form>

        {/* Loading Progress State */}
        <AnimatePresence>
          {loading && step && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-5 p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center gap-3 text-xs text-blue-300"
            >
              <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
              <span>{step}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Alert */}
        <AnimatePresence>
          {successFilename && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-5 p-4 rounded-xl bg-green-950/40 border border-green-500/30 flex items-center justify-between text-xs text-green-300"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <div>
                  <p className="font-bold text-green-200">PDF Downloaded!</p>
                  <p className="text-gray-400 font-mono text-[11px]">{successFilename}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-green-500/20 text-green-300 font-semibold text-[10px]">
                SAVED TO LOCAL
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-5 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-3 text-xs text-red-300"
            >
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-200">Processing Error</p>
                <p className="text-red-300/90 mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
