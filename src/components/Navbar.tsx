import React from 'react';
import { AppView } from '../types';
import { Layers, BookmarkX, CheckCircle2, BookOpen, RotateCcw } from 'lucide-react';

interface NavbarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  stats: {
    total: number;
    masteredCount: number;
    learningCount: number;
    unseenCount: number;
    progressPercentage: number;
  };
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  stats,
  onReset,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Progress Overview */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div 
            onClick={() => setCurrentView('flashcards')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-emerald-200 bg-clip-text text-transparent">
                VocabCards
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">翻卡背單字 · 自動記憶進度</p>
            </div>
          </div>

          {/* Compact Mobile/Desktop Progress indicator */}
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-800">
            <div className="w-28 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full transition-all duration-500"
                style={{ width: `${stats.progressPercentage}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-emerald-400">{stats.progressPercentage}%</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav id="nav-tabs" className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80 w-full md:w-auto overflow-x-auto">
          <button
            id="tab-flashcards"
            onClick={() => setCurrentView('flashcards')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              currentView === 'flashcards'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>翻卡練習</span>
          </button>

          <button
            id="tab-learning"
            onClick={() => setCurrentView('learning')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              currentView === 'learning'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookmarkX className="w-4 h-4 text-amber-400" />
            <span>還不會的單字</span>
            <span className="ml-1 px-1.5 py-0.2 bg-amber-950/80 text-amber-300 text-[11px] font-semibold rounded-md border border-amber-800/50">
              {stats.learningCount}
            </span>
          </button>

          <button
            id="tab-mastered"
            onClick={() => setCurrentView('mastered')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              currentView === 'mastered'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>已學會</span>
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-950/80 text-emerald-300 text-[11px] font-semibold rounded-md border border-emerald-800/50">
              {stats.masteredCount}
            </span>
          </button>

          <button
            id="tab-all"
            onClick={() => setCurrentView('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              currentView === 'all'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>全部單字</span>
            <span className="text-[11px] text-slate-400 font-normal">({stats.total})</span>
          </button>

          <button
            id="btn-reset-progress"
            onClick={onReset}
            title="把所有學會的單字重置為未學過"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-rose-300 hover:text-rose-100 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800/60 rounded-xl transition-all ml-auto shrink-0 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置進度</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
