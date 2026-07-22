import React, { useState, useMemo } from 'react';
import { Word, WordProgressMap, WordStatus } from '../types';
import { speakWord } from '../utils/speech';
import { Search, Volume2, CheckCircle2, BookmarkX, Play, ArrowUpDown, RefreshCw } from 'lucide-react';

interface WordListViewProps {
  title: string;
  description: string;
  words: Word[];
  progressMap: WordProgressMap;
  onSetStatus: (wordId: string, status: WordStatus) => void;
  onStartPractice: (filter: 'all' | 'learning_only' | 'mastered_only', startWordId?: string) => void;
  onReset?: () => void;
  currentListType: 'learning' | 'mastered' | 'all';
}

export const WordListView: React.FC<WordListViewProps> = ({
  title,
  description,
  words,
  progressMap,
  onSetStatus,
  onStartPractice,
  onReset,
  currentListType,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'alphabetical' | 'recent'>('default');

  // Filter and sort words
  const filteredWords = useMemo(() => {
    let result = words.filter((w) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        w.word.toLowerCase().includes(term) ||
        w.paraphrase_pos.toLowerCase().includes(term) ||
        w.paraphrase_english.toLowerCase().includes(term) ||
        w.us_phonetics.toLowerCase().includes(term)
      );
    });

    if (sortBy === 'alphabetical') {
      result = [...result].sort((a, b) => a.word.localeCompare(b.word));
    } else if (sortBy === 'recent') {
      result = [...result].sort((a, b) => {
        const timeA = progressMap[a.id]?.lastReviewedAt || 0;
        const timeB = progressMap[b.id]?.lastReviewedAt || 0;
        return timeB - timeA;
      });
    }

    return result;
  }, [words, searchTerm, sortBy, progressMap]);

  const practiceFilterParam =
    currentListType === 'learning'
      ? 'learning_only'
      : currentListType === 'mastered'
      ? 'mastered_only'
      : 'all';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* List Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            {currentListType === 'learning' && <BookmarkX className="w-6 h-6 text-amber-400" />}
            {currentListType === 'mastered' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
            {title}
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 ml-2">
              {words.length} 個單字
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
          {words.length > 0 && (
            <button
              onClick={() => onStartPractice(practiceFilterParam)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-indigo-950/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>開始這份清單的翻卡練習</span>
            </button>
          )}

          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-rose-100 border border-rose-800/60 font-medium text-sm transition-all shadow-sm"
              title="把所有學習進度重置為未學過"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重置所有進度</span>
            </button>
          )}
        </div>
      </div>

      {/* Controls: Search & Sort */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜尋單字、注音、中文解釋..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors"
          />
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> 排序:
          </span>
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setSortBy('default')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                sortBy === 'default'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              原本順序
            </button>
            <button
              onClick={() => setSortBy('alphabetical')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                sortBy === 'alphabetical'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              字母順序 (A-Z)
            </button>
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                sortBy === 'recent'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              最近複習
            </button>
          </div>
        </div>
      </div>

      {/* Word Grid / List */}
      {filteredWords.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-12 text-center text-slate-400">
          <p className="text-base font-medium mb-2">沒有找到符合條件的單字</p>
          {searchTerm ? (
            <p className="text-xs text-slate-500">嘗試搜尋其他關鍵字或清除搜尋框</p>
          ) : (
            <p className="text-xs text-slate-500">此清單目前是空的，快去翻卡練習吧！</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWords.map((item) => {
            const status = progressMap[item.id]?.status;
            return (
              <div
                key={item.id}
                className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all flex flex-col justify-between gap-3 group shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-slate-100 font-sans tracking-tight">
                        {item.word}
                      </span>
                      {item.us_phonetics && (
                        <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-900/50">
                          {item.us_phonetics}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-emerald-400 mt-1">
                      {item.paraphrase_pos}
                    </div>
                    {item.paraphrase_english && (
                      <div className="text-xs text-slate-400 italic mt-0.5 line-clamp-1">
                        "{item.paraphrase_english}"
                      </div>
                    )}
                  </div>

                  {/* Speech Pronunciation Button */}
                  <button
                    onClick={() => speakWord(item.word)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                    title="發音"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Row: Status Badge & Quick Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    {status === 'mastered' ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/50">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 已學會
                      </span>
                    ) : status === 'learning' ? (
                      <span className="flex items-center gap-1 text-amber-400 font-medium bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800/50">
                        <BookmarkX className="w-3.5 h-3.5" /> 學習中
                      </span>
                    ) : (
                      <span className="text-slate-500 bg-slate-800/50 px-2.5 py-0.5 rounded-full border border-slate-700/50">
                        尚未練習
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {status !== 'mastered' ? (
                      <button
                        onClick={() => onSetStatus(item.id, 'mastered')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-800/60 transition-colors font-medium text-[11px]"
                      >
                        標示為已學會
                      </button>
                    ) : (
                      <button
                        onClick={() => onSetStatus(item.id, 'learning')}
                        className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-800/60 transition-colors font-medium text-[11px]"
                      >
                        改為學習中
                      </button>
                    )}

                    <button
                      onClick={() => onStartPractice(practiceFilterParam, item.id)}
                      className="p-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-800/60 transition-colors"
                      title="以此單字開始翻卡"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
