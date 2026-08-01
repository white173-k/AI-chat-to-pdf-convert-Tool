import React from 'react';
import { Rocket, FileCode, HelpCircle, Brain, FolderTree, Search, Tag, FileCheck2 } from 'lucide-react';

const roadmapItems = [
  { icon: Brain, title: 'AI Summary & Key Takeaways' },
  { icon: FileCheck2, title: 'Auto Flashcards & MCQ Quiz Generator' },
  { icon: FolderTree, title: 'Mind Map Diagram Generator' },
  { icon: FileCode, title: 'Export to DOCX & Raw Markdown' },
  { icon: Search, title: 'Local Search inside Saved Chats' },
  { icon: Tag, title: 'Folder Organization & Tagging' },
];

export const FutureFeaturesSection: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto my-12 px-4">
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
          <Rocket className="w-4 h-4 text-indigo-400" />
          <span>Product Roadmap</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Upcoming Power Features</h3>
        <p className="text-gray-400 text-xs mb-6">
          We are actively building active revision tools on top of your saved PDF library.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {roadmapItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-gray-300 hover:border-indigo-500/30 transition-all"
              >
                <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="font-medium text-white">{item.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
