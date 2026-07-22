import { useState, useEffect, useCallback, useMemo } from 'react';
import { Word, WordProgressMap, WordProgressItem, WordStatus } from '../types';
import { getAllWords } from '../utils/dataLoader';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'vocab_flashcards_progress_v1';

export function useVocabulary() {
  const allWords = useMemo(() => getAllWords(), []);

  // Load progress from localStorage
  const [progressMap, setProgressMap] = useState<WordProgressMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load vocabulary progress from localStorage', e);
    }
    return {};
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressMap));
    } catch (e) {
      console.error('Failed to save vocabulary progress to localStorage', e);
    }
  }, [progressMap]);

  // Current active practice mode/filter: 'all' | 'learning_only' | 'mastered_only'
  const [practiceFilter, setPracticeFilter] = useState<'all' | 'learning_only' | 'mastered_only'>('learning_only');

  // Build current queue based on practice filter in sequential order
  const [queue, setQueue] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Function to build queue based on filter
  const initQueue = useCallback(
    (
      filter: 'all' | 'learning_only' | 'mastered_only' = practiceFilter,
      startWordId?: string
    ) => {
      let filtered: Word[] = [];

      if (filter === 'learning_only') {
        filtered = allWords.filter(
          (w) => progressMap[w.id]?.status !== 'mastered'
        );
      } else if (filter === 'mastered_only') {
        filtered = allWords.filter((w) => progressMap[w.id]?.status === 'mastered');
      } else {
        // 'all': preserve exact sequential order
        filtered = [...allWords];
      }

      if (filtered.length === 0 && filter === 'all' && allWords.length > 0) {
        filtered = [...allWords];
      }

      // If a specific start word was selected, jump to or bring to front
      if (startWordId) {
        const foundIdx = filtered.findIndex((w) => w.id === startWordId);
        if (foundIdx > 0) {
          const [selected] = filtered.splice(foundIdx, 1);
          filtered.unshift(selected);
        }
      }

      setPracticeFilter(filter);
      setQueue(filtered);
      setCurrentIndex(0);
      setIsFlipped(false);
    },
    [allWords, progressMap, practiceFilter]
  );

  // Initialize queue once on mount
  useEffect(() => {
    if (!isInitialized && allWords.length > 0) {
      initQueue('learning_only');
      setIsInitialized(true);
    }
  }, [allWords, isInitialized, initQueue]);

  // Current word
  const currentWord = useMemo(() => {
    if (queue.length === 0 || currentIndex >= queue.length) return null;
    return queue[currentIndex];
  }, [queue, currentIndex]);

  // Action: Mark as Mastered ("我會了")
  const markAsMastered = useCallback(() => {
    if (!currentWord) return;

    // Update progress map
    setProgressMap((prev) => ({
      ...prev,
      [currentWord.id]: {
        status: 'mastered',
        lastReviewedAt: Date.now(),
        reviewCount: (prev[currentWord.id]?.reviewCount || 0) + 1,
        wrongCount: prev[currentWord.id]?.wrongCount || 0,
      },
    }));

    // Trigger subtle celebratory confetti
    confetti({
      particleCount: 28,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10B981', '#3B82F6', '#6366F1'],
    });

    // Move to next card
    setIsFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  }, [currentWord]);

  // Action: Mark as Need Review ("我還不會")
  const markAsLearning = useCallback(() => {
    if (!currentWord) return;

    // Update progress map
    setProgressMap((prev) => ({
      ...prev,
      [currentWord.id]: {
        status: 'learning',
        lastReviewedAt: Date.now(),
        reviewCount: (prev[currentWord.id]?.reviewCount || 0) + 1,
        wrongCount: (prev[currentWord.id]?.wrongCount || 0) + 1,
      },
    }));

    // Re-insert this word 3-4 cards later in queue
    setQueue((prevQueue) => {
      const newQueue = [...prevQueue];
      // Insert after ~3 positions from current index
      const insertIndex = Math.min(currentIndex + 4, newQueue.length);
      newQueue.splice(insertIndex, 0, currentWord);
      return newQueue;
    });

    // Move to next card
    setIsFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  }, [currentWord, currentIndex]);

  // Action: Manually change status of any word
  const setWordStatus = useCallback((wordId: string, status: WordStatus) => {
    setProgressMap((prev) => ({
      ...prev,
      [wordId]: {
        status,
        lastReviewedAt: Date.now(),
        reviewCount: (prev[wordId]?.reviewCount || 0) + 1,
        wrongCount: prev[wordId]?.wrongCount || 0,
      },
    }));
  }, []);

  // Action: Reset all progress (clear all mastered & learning statuses)
  const resetAllProgress = useCallback(() => {
    setProgressMap({});
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
    } catch (e) {
      console.error('Failed to clear progress in localStorage', e);
    }
    setPracticeFilter('learning_only');
    setQueue([...allWords]);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [allWords]);

  // Derived counts
  const stats = useMemo(() => {
    const total = allWords.length;
    let masteredCount = 0;
    let learningCount = 0;

    Object.values(progressMap).forEach((p) => {
      if ((p as WordProgressItem)?.status === 'mastered') masteredCount++;
      else if ((p as WordProgressItem)?.status === 'learning') learningCount++;
    });

    const unseenCount = Math.max(0, total - masteredCount - learningCount);

    return {
      total,
      masteredCount,
      learningCount,
      unseenCount,
      progressPercentage: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
    };
  }, [allWords, progressMap]);

  // Lists of words for tabs
  const learningWords = useMemo(() => {
    return allWords.filter((w) => progressMap[w.id]?.status === 'learning');
  }, [allWords, progressMap]);

  const masteredWords = useMemo(() => {
    return allWords.filter((w) => progressMap[w.id]?.status === 'mastered');
  }, [allWords, progressMap]);

  const unseenWords = useMemo(() => {
    return allWords.filter((w) => !progressMap[w.id]);
  }, [allWords, progressMap]);

  return {
    allWords,
    currentWord,
    currentIndex,
    totalInQueue: queue.length,
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
    unseenWords,
    progressMap,
  };
}
