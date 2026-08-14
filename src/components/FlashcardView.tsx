import React, { useEffect } from 'react';
import { Word } from '../types';
import { speakWord } from '../utils/speech';
import { Volume2, CheckCircle2, BookmarkX, Sparkles, HelpCircle, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FlashcardViewProps {
  currentWord: Word | null;
  currentIndex: number;
  totalInQueue: number;
  uniqueWordNumber?: number;
  totalUniqueWords?: number;
  isFlipped: boolean;
  setIsFlipped: (flipped: boolean | ((prev: boolean) => boolean)) => void;
  onMastered: () => void;
  onLearning: () => void;
  onNextCard?: () => void;
  onPrevCard?: () => void;
  onInitQueue: (
    filter: 'all' | 'learning_only' | 'difficult_only' | 'mastered_only',
    startWordId?: string,
    forceResetIndex?: boolean
  ) => void;
  onReset: () => void;
  practiceFilter: 'all' | 'learning_only' | 'difficult_only' | 'mastered_only';
  stats: {
    total: number;
    masteredCount: number;
    difficultCount: number;
    learningCount: number;
    unseenCount: number;
  };
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  currentWord,
  currentIndex,
  totalInQueue,
  uniqueWordNumber,
  totalUniqueWords,
  isFlipped,
  setIsFlipped,
  onMastered,
  onLearning,
  onNextCard,
  onPrevCard,
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/50 flex items-center justify-center mb-4 shadow-lg">
          <Sparkles className="w-8 h-8" />
        </div>

        {practiceFilter === 'learning_only' ? (
          <>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">🎉 「未學過」單字已全部學完一輪！</h2>
            <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
              目前無新的未學過單字。當您新增自訂單字時，會自動出現在未學過清單中。<br />
              您可以切換至 <span className="text-rose-400 font-bold">「較不熟 ({stats.difficultCount})」</span> 或 <span className="text-emerald-400 font-bold">「已學會 ({stats.masteredCount})」</span> 繼續進行複習。
            </p>
          </>
        ) : practiceFilter === 'difficult_only' ? (
          <>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">💪 「較不熟」單字已全部複習完畢！</h2>
            <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
              太棒了！您已完成這一輪較不熟單字的強化練習。目前較不熟剩餘 <span className="text-rose-400 font-bold">{stats.difficultCount}</span> 個單字。
            </p>
          </>
        ) : practiceFilter === 'mastered_only' ? (
          <>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">✨ 「已學會」單字已全數瀏覽完畢！</h2>
            <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
              您已完成了所有已學會單字 ({stats.masteredCount} 個) 的溫習保鮮。
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">太棒了！所有單字皆已練習完畢</h2>
            <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
              已學會單字：<span className="text-emerald-400 font-bold">{stats.masteredCount}</span> / {stats.total} 個。
            </p>
          </>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {stats.difficultCount > 0 && practiceFilter !== 'difficult_only' && (
            <button
              onClick={() => onInitQueue('difficult_only')}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-2xl text-sm transition-all shadow-md shadow-rose-950/40 active:scale-95"
            >
              <BookmarkX className="w-4 h-4" />
              <span>複習「較不熟」單字 ({stats.difficultCount})</span>
            </button>
          )}

          {stats.masteredCount > 0 && practiceFilter !== 'mastered_only' && (
            <button
              onClick={() => onInitQueue('mastered_only')}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-2xl text-sm transition-all shadow-md shadow-emerald-950/40 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>複習「已學會」單字 ({stats.masteredCount})</span>
            </button>
          )}

          <button
            onClick={() => onInitQueue('all')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-2xl text-sm transition-all border border-slate-700"
          >
            檢視全部單字 ({stats.total})
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-rose-950 text-rose-300 border border-slate-800 hover:border-rose-800 font-medium rounded-2xl text-xs sm:text-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置進度</span>
          </button>
        </div>
      </div>
    );
  }

  // Determine button hints according to mode
  const getButtonHints = () => {
    if (practiceFilter === 'mastered_only') {
      return {
        learningSub: '4~10張後再次出現 (按2次移至較不熟)',
        masteredSub: '繼續留在「已學會」',
      };
    }
    if (practiceFilter === 'difficult_only') {
      return {
        learningSub: '4~10張後再次出現 (維持較不熟)',
        masteredSub: '掌握並升級至「已學會」',
      };
    }
    return {
      learningSub: '4~10張後再次出現 (按2次移至較不熟)',
      masteredSub: '掌握並歸類至「已學會」',
    };
  };

  const buttonHints = getButtonHints();

  return (
    <div id="flashcard-container" className="flex flex-col items-center justify-center max-w-2xl mx-auto px-4 py-6">
      {/* Queue Filter & Order Mode Control Header */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 mb-6 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
        {/* Practice Filter Scope */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400">練習範圍:</span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium overflow-x-auto max-w-full">
            <button
              onClick={() => onInitQueue('learning_only')}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                practiceFilter === 'learning_only'
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              未學過 ({stats.total - stats.masteredCount - stats.difficultCount})
            </button>
            <button
              onClick={() => onInitQueue('difficult_only')}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                practiceFilter === 'difficult_only'
                  ? 'bg-rose-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              較不熟 ({stats.difficultCount})
            </button>
            <button
              onClick={() => onInitQueue('mastered_only')}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                practiceFilter === 'mastered_only'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              已學會 ({stats.masteredCount})
            </button>
            <button
              onClick={() => onInitQueue('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                practiceFilter === 'all'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              全部 ({stats.total})
            </button>
          </div>
        </div>

        {/* Card Progress Badge & Reset */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto text-xs flex-wrap">
          {onPrevCard && (
            <button
              onClick={onPrevCard}
              disabled={currentIndex <= 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 border border-slate-700/60 transition-all"
              title="上一張單字"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <span className="font-mono text-indigo-300 font-semibold px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-900/50">
            第 {uniqueWordNumber !== undefined ? uniqueWordNumber : currentIndex + 1} / {totalUniqueWords !== undefined ? totalUniqueWords : totalInQueue} 個單字
          </span>

          {onNextCard && (
            <button
              onClick={onNextCard}
              disabled={currentIndex >= totalInQueue - 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 border border-slate-700/60 transition-all"
              title="下一張單字"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onInitQueue(practiceFilter, undefined, true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 font-medium transition-all border border-slate-700/60"
            title="從該分類的第 1 張卡片重新開始瀏覽"
          >
            <RotateCcw className="w-3 h-3 text-indigo-400" />
            <span>從頭看</span>
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
            <div className="text-[11px] text-amber-400/70 font-normal">{buttonHints.learningSub}</div>
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
            <div className="text-[11px] text-emerald-400/70 font-normal">{buttonHints.masteredSub}</div>
          </div>
        </button>
      </div>
    </div>
  );
};
