import React, { useEffect } from 'react';
import { Word } from '../types';
import { speakWord } from '../utils/speech';
import { Volume2, CheckCircle2, BookmarkX, Sparkles, HelpCircle, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FlashcardViewProps {
  currentWord: Word | null;
  currentIndex: number;
  totalInQueue: number;
  isFlipped: boolean;
  setIsFlipped: (flipped: boolean | ((prev: boolean) => boolean)) => void;
  onMastered: () => void;
  onLearning: () => void;
  onInitQueue: (filter: 'all' | 'learning_only' | 'mastered_only', startWordId?: string) => void;
  onReset: () => void;
  practiceFilter: 'all' | 'learning_only' | 'mastered_only';
  stats: {
    total: number;
    masteredCount: number;
    learningCount: number;
    unseenCount: number;
  };
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  currentWord,
  currentIndex,
  totalInQueue,
  isFlipped,
  setIsFlipped,
  onMastered,
  onLearning,
  onInitQueue,
  onReset,
  practiceFilter,
  stats,
}) => {
  // Listen for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowLeft' || e.key === '1') {
        e.preventDefault();
        onLearning();
      } else if (e.code === 'ArrowRight' || e.key === '2') {
        e.preventDefault();
        onMastered();
      } else if (e.key === 'v' || e.key === 'V') {
        if (currentWord) {
          speakWord(currentWord.word);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWord, setIsFlipped, onLearning, onMastered]);

  if (!currentWord || totalInQueue === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 flex items-center justify-center mb-4 shadow-lg">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">太棒了！目前單字皆已練習完畢</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
          已學會單字：<span className="text-emerald-400 font-bold">{stats.masteredCount}</span> / {stats.total} 個。<br />
          若你想重新進行翻卡練習，可點擊下方按鈕將單字全部重置為「未學過」。
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-semibold rounded-2xl text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重置所有單字為「未學過」</span>
          </button>
          <button
            onClick={() => onInitQueue('all')}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-2xl text-sm transition-all border border-slate-700"
          >
            檢視全部單字 ({stats.total})
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="flashcard-container" className="flex flex-col items-center justify-center max-w-2xl mx-auto px-4 py-6">
      {/* Queue Filter & Order Mode Control Header */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 mb-6 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
        {/* Practice Filter Scope */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400">練習範圍:</span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => onInitQueue('learning_only')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                practiceFilter === 'learning_only'
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              未學過 ({stats.total - stats.masteredCount})
            </button>
            <button
              onClick={() => onInitQueue('mastered_only')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                practiceFilter === 'mastered_only'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              已學會 ({stats.masteredCount})
            </button>
            <button
              onClick={() => onInitQueue('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                practiceFilter === 'all'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              全部單字 ({stats.total})
            </button>
          </div>
        </div>

        {/* Card Progress Badge & Reset */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto text-xs">
          <span className="font-mono text-indigo-300 font-semibold px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-900/50">
            第 {currentIndex + 1} / {totalInQueue} 張
          </span>
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-rose-100 border border-rose-800/60 font-medium transition-colors"
            title="把所有學習紀錄重置為未學過"
          >
            <RotateCcw className="w-3 h-3" />
            <span>重置進度</span>
          </button>
        </div>
      </div>

      {/* Main Flashcard Card Flip Container */}
      <div
        onClick={() => setIsFlipped((prev) => !prev)}
        className="w-full h-80 sm:h-96 relative mb-8 cursor-pointer select-none [perspective:1000px] touch-manipulation active:scale-[0.99] transition-transform"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          style={{
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d',
          }}
          className="w-full h-full relative"
        >
          {/* Front Side */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
            className="absolute inset-0 w-full h-full rounded-3xl border border-slate-700/80 p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-2xl bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-slate-100 shadow-slate-950/50 hover:border-slate-500 overflow-hidden"
          >
            {/* Speech Pronunciation Button - Top Right */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                speakWord(currentWord.word);
              }}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2.5 rounded-full bg-slate-800/80 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-all shadow-md group active:scale-95 z-20"
              title="發音"
            >
              <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            {/* Front Card Content Center */}
            <div className="space-y-4 px-2 max-w-lg">
              <h2 id="card-word-title" className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-sm font-sans">
                {currentWord.word}
              </h2>
              {currentWord.us_phonetics && (
                <div className="inline-block px-3.5 py-1 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-base sm:text-lg font-mono tracking-wide">
                  {currentWord.us_phonetics}
                </div>
              )}
              <p className="text-slate-400 text-xs sm:text-sm mt-4 flex items-center justify-center gap-1">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                點擊卡片翻面查看中文解釋
              </p>
            </div>
          </div>

          {/* Back Side */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              WebkitTransform: 'rotateY(180deg)',
            }}
            className="absolute inset-0 w-full h-full rounded-3xl border border-indigo-500/40 p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-2xl bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 text-slate-100 shadow-indigo-950/30 overflow-hidden"
          >
            {/* Speech Pronunciation Button - Top Right */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                speakWord(currentWord.word);
              }}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2.5 rounded-full bg-slate-800/80 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-all shadow-md group active:scale-95 z-20"
              title="發音"
            >
              <Volume2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            {/* Back Card Content Center */}
            <div className="space-y-5 max-w-lg px-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-wide font-sans">
                {currentWord.paraphrase_pos}
              </div>

              {currentWord.paraphrase_english && (
                <p className="text-slate-300 text-sm sm:text-base font-medium italic bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50">
                  "{currentWord.paraphrase_english}"
                </p>
              )}

              <p className="text-slate-400 text-xs">
                英文單字：<span className="text-slate-200 font-bold">{currentWord.word}</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons below card */}
      <div id="flashcard-action-buttons" className="w-full grid grid-cols-2 gap-4">
        <button
          id="btn-still-learning"
          onClick={onLearning}
          className="group flex flex-col sm:flex-row items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 border border-amber-800/60 hover:border-amber-500 hover:bg-amber-950/40 text-amber-200 font-semibold shadow-lg shadow-amber-950/20 transition-all transform active:scale-95"
        >
          <BookmarkX className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          <div className="text-center sm:text-left">
            <div className="text-base sm:text-lg">我還不會</div>
            <div className="text-[11px] text-amber-400/70 font-normal">跳過並於稍後自動出現</div>
          </div>
        </button>

        <button
          id="btn-know-it"
          onClick={onMastered}
          className="group flex flex-col sm:flex-row items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 border border-emerald-800/60 hover:border-emerald-500 hover:bg-emerald-950/40 text-emerald-200 font-semibold shadow-lg shadow-emerald-950/20 transition-all transform active:scale-95"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <div className="text-center sm:text-left">
            <div className="text-base sm:text-lg">我會了</div>
            <div className="text-[11px] text-emerald-400/70 font-normal">歸類至「已學會」清單</div>
          </div>
        </button>
      </div>
    </div>
  );
};
