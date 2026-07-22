import { useState } from 'react';
import { useVocabulary } from './hooks/useVocabulary';
import { Navbar } from './components/Navbar';
import { FlashcardView } from './components/FlashcardView';
import { WordListView } from './components/WordListView';
import { AppView } from './types';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('flashcards');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const {
    allWords,
    currentWord,
    currentIndex,
    totalInQueue,
    isFlipped,
    setIsFlipped,
    markAsMastered,
    markAsLearning,
    setWordStatus,
    resetAllProgress,
    initQueue,
    practiceFilter,
    stats,
    learningWords,
    masteredWords,
    progressMap,
  } = useVocabulary();

  const handleStartPracticeWithFilter = (
    filter: 'all' | 'learning_only' | 'mastered_only',
    startWordId?: string
  ) => {
    initQueue(filter, startWordId);
    setCurrentView('flashcards');
  };

  const handleConfirmReset = () => {
    resetAllProgress();
    setShowResetConfirm(false);
  };

  const handleTriggerReset = () => {
    setShowResetConfirm(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sticky Main Navigation */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        stats={stats}
        onReset={handleTriggerReset}
      />

      {/* Main Body View Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {/* View Switcher */}
        {currentView === 'flashcards' && (
          <FlashcardView
            currentWord={currentWord}
            currentIndex={currentIndex}
            totalInQueue={totalInQueue}
            isFlipped={isFlipped}
            setIsFlipped={setIsFlipped}
            onMastered={markAsMastered}
            onLearning={markAsLearning}
            onInitQueue={(filter, startWordId) => initQueue(filter, startWordId)}
            onReset={handleTriggerReset}
            practiceFilter={practiceFilter}
            stats={stats}
          />
        )}

        {currentView === 'learning' && (
          <WordListView
            title="還不會的單字"
            description="這些是你在翻卡練習中選擇「我還不會」的單字。系統會將他們保留在此處，你可以隨時點擊按鈕進行針對性練習。"
            words={learningWords}
            progressMap={progressMap}
            onSetStatus={setWordStatus}
            onStartPractice={(filter, startWordId) => handleStartPracticeWithFilter(filter, startWordId)}
            onReset={handleTriggerReset}
            currentListType="learning"
          />
        )}

        {currentView === 'mastered' && (
          <WordListView
            title="已學會的單字"
            description="恭喜！這些是你已經掌握的單字。若你需要溫故知新，也可以點擊按鈕將他們重新拿出來進行翻卡複習。"
            words={masteredWords}
            progressMap={progressMap}
            onSetStatus={setWordStatus}
            onStartPractice={(filter, startWordId) => handleStartPracticeWithFilter(filter, startWordId)}
            onReset={handleTriggerReset}
            currentListType="mastered"
          />
        )}

        {currentView === 'all' && (
          <WordListView
            title="完整單字庫"
            description="檢視收錄的完整單字清單，隨時搜尋單字或切換狀態。"
            words={allWords}
            progressMap={progressMap}
            onSetStatus={setWordStatus}
            onStartPractice={(filter, startWordId) => handleStartPracticeWithFilter(filter, startWordId)}
            onReset={handleTriggerReset}
            currentListType="all"
          />
        )}
      </main>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">確定要重置所有學習進度？</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                將把「已學會」（目前 {stats.masteredCount} 個）與「還不會」的單字進度全部清空，將所有單字歸零並重設為初始未學過狀態。
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-rose-900/40"
                >
                  確認重置 (清空已學會)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>VocabCards Flashcards · 單字卡自動保存進度 (LocalStorage)</p>
      </footer>
    </div>
  );
}
