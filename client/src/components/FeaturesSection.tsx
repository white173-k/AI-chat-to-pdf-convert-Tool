import React from 'react';
import { Sparkles, Code2, FileType, CheckSquare, Download, Layers, Shield, Cpu } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'Auto Title Generation',
    description: 'Automatically detects conversation topic and builds clean titles like "React Hooks Complete Notes".',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Layers,
    title: 'Zero Formatting Loss',
    description: 'Preserves headings, bullet/numbered lists, callouts, blockquotes, images, math formulas, and tables.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Code2,
    title: 'Syntax Highlighting',
    description: 'Full code syntax highlighting for JavaScript, TypeScript, Python, C++, Java, HTML, CSS, SQL, JSON & Bash.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: FileType,
    title: 'Smart Filenames',
    description: 'Generates clean local PDF filenames (e.g. Operating System Revision.pdf) ready for folder organization.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Download,
    title: '1-Click Local Download',
    description: 'Direct browser download trigger. Works seamlessly across Windows, macOS, Linux, Android, and iOS.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: Shield,
    title: 'GitBook-Style Dark Theme',
    description: 'Designed specifically for late-night reading and long study sessions with zero eye strain.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto my-16 px-4">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Built for Revision & Long-Term Study
        </h2>
        <p className="text-gray-400 text-sm mt-2 max-w-xl mx-auto">
          Every detail is engineered to ensure your saved AI conversations are clear, complete, and beautifully readable offline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div key={i} className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${f.bg} mb-4`}>
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{f.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
