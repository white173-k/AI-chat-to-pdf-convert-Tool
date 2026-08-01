import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileDown, ExternalLink, Loader2, Check, Laptop, Smartphone, Tablet, Sun, Moon } from 'lucide-react';
import { PreviewData, generateAndDownloadPdf, ViewMode, AppTheme } from '../lib/api';

interface PreviewModalProps {
  data: PreviewData | null;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ data, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [modalViewMode, setModalViewMode] = useState<ViewMode>(data?.viewMode || 'desktop');
  const [modalTheme, setModalTheme] = useState<AppTheme>(data?.theme || 'dark');

  if (!data) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateAndDownloadPdf(data.originalUrl, data.title, modalTheme, modalViewMode);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Error generating PDF');
    } finally {
      setDownloading(false);
    }
  };

  const platformLabel = data.platform === 'chatgpt' ? 'ChatGPT' : 'Google Gemini';
  const isLight = modalTheme === 'light';

  // Container width style based on ViewMode
  const getContainerWidthClass = () => {
    switch (modalViewMode) {
      case 'mobile':
        return 'max-w-[390px] border-4 border-gray-700 rounded-[32px] shadow-2xl';
      case 'tablet':
        return 'max-w-[768px] border-2 border-gray-700 rounded-[20px] shadow-2xl';
      default:
        return 'max-w-4xl rounded-2xl';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full ${getContainerWidthClass()} transition-all duration-300 max-h-[92vh] ${
            isLight ? 'bg-white text-gray-900 border-gray-300' : 'bg-[#0d1117] text-gray-200 border-white/10'
          } border shadow-2xl flex flex-col overflow-hidden my-auto`}
        >
          {/* Header Bar */}
          <div
            className={`px-5 py-3.5 border-b ${
              isLight ? 'bg-gray-100 border-gray-200' : 'bg-[#161b22] border-white/10'
            } flex items-center justify-between shrink-0 flex-wrap gap-2`}
          >
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-bold uppercase">
                {platformLabel}
              </span>
              <h3 className="font-bold text-sm truncate max-w-[200px] sm:max-w-xs">{data.title}</h3>
            </div>

            {/* Layout & Theme Switches inside Modal */}
            <div className="flex items-center gap-2">
              {/* View Mode Switch */}
              <div className="flex items-center p-0.5 rounded-lg bg-black/20 border border-white/10">
                <button
                  onClick={() => setModalViewMode('desktop')}
                  className={`p-1.5 rounded-md text-xs cursor-pointer ${
                    modalViewMode === 'desktop' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Desktop View (1920px)"
                >
                  <Laptop className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setModalViewMode('tablet')}
                  className={`p-1.5 rounded-md text-xs cursor-pointer ${
                    modalViewMode === 'tablet' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Tablet View (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setModalViewMode('mobile')}
                  className={`p-1.5 rounded-md text-xs cursor-pointer ${
                    modalViewMode === 'mobile' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Mobile View (390px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Theme Switch */}
              <button
                onClick={() => setModalTheme(isLight ? 'dark' : 'light')}
                className={`p-1.5 rounded-lg border cursor-pointer ${
                  isLight ? 'bg-white text-gray-800 border-gray-300' : 'bg-white/10 text-gray-200 border-white/10'
                }`}
                title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
              >
                {isLight ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              </button>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Compiling...</span>
                  </>
                ) : downloaded ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Export PDF</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview Content Container */}
          <div
            className={`p-5 overflow-y-auto space-y-5 text-xs sm:text-sm font-['Inter',sans-serif] ${
              isLight ? 'bg-white text-gray-900' : 'bg-[#0d1117] text-gray-200'
            }`}
          >
            {/* Meta Header */}
            <div className="pb-3 border-b border-gray-500/20 text-xs text-gray-400 flex items-center justify-between">
              <span>Layout: <strong className="uppercase text-blue-400">{modalViewMode}</strong></span>
              <span>Theme: <strong className="uppercase text-green-400">{modalTheme}</strong></span>
              <span>Messages: <strong>{data.messageCount}</strong></span>
            </div>

            {data.messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id || idx}
                  className={`p-4 rounded-xl border ${
                    isLight
                      ? isUser
                        ? 'bg-[#f6f8fa] border-blue-400/40 border-l-4 border-l-blue-600'
                        : 'bg-white border-gray-300 border-l-4 border-l-green-600'
                      : isUser
                      ? 'bg-[#1c2128] border-blue-500/30 border-l-4 border-l-blue-500'
                      : 'bg-[#161b22] border-green-500/30 border-l-4 border-l-green-500'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-500/20">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isUser ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'
                      }`}
                    >
                      {isUser ? 'User Prompt' : `${platformLabel} Response`}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">#{idx + 1}</span>
                  </div>

                  <div
                    className={`prose ${
                      isLight ? 'prose-neutral' : 'prose-invert'
                    } max-w-none prose-pre:p-3 prose-pre:rounded-lg prose-pre:border prose-pre:border-gray-500/20`}
                    dangerouslySetInnerHTML={{ __html: msg.html }}
                  />
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
