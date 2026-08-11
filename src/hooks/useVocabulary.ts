import { useState, useEffect, useCallback, useMemo } from 'react';
import { Word, WordProgressMap, WordProgressItem, WordStatus } from '../types';
import { getAllWords } from '../utils/dataLoader';
import confetti from 'canvas-confetti';
import {
  UserAccount,
  fetchCloudUserData,
  saveWordToCloud,
  deleteWordFromCloud,
  saveProgressToCloud,
  syncLocalStorageToCloud,
} from '../lib/firebase';

const STORAGE_KEY = 'vocab_flashcards_progress_v1';
const CUSTOM_WORDS_KEY = 'vocab_custom_words_v1';
const CLOUD_USER_KEY = 'vocab_cloud_user_account_v1';

export function useVocabulary() {
  const builtinWords = useMemo(() => getAllWords(), []);

  // Cloud user account state
  const [cloudAccount, setCloudAccount] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(CLOUD_USER_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load cloud account from localStorage', e);
    }
    return null;
  });

  // Custom user-added words loaded from localStorage
  const [customWords, setCustomWords] = useState<Word[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_WORDS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load custom words from localStorage', e);
    }
    return [];
  });

  // Save customWords to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customWords));
    } catch (e) {
      console.error('Failed to save custom words to localStorage', e);
    }
  }, [customWords]);

  // Save cloudAccount to localStorage
  useEffect(() => {
    try {
      if (cloudAccount) {
        localStorage.setItem(CLOUD_USER_KEY, JSON.stringify(cloudAccount));
      } else {
        localStorage.removeItem(CLOUD_USER_KEY);
      }
    } catch (e) {
      console.error('Failed to save cloud account to localStorage', e);
    }
  }, [cloudAccount]);

  // Combined words (builtin + custom)
  const allWords = useMemo(() => {
    return [...builtinWords, ...customWords];
  }, [builtinWords, customWords]);

  // Add new custom word
  const addCustomWord = useCallback(
    (newWordData: {
      word: string;
      us_phonetics?: string;
      paraphrase_pos: string;
      paraphrase_english?: string;
    }) => {
      const cleanWordStr = newWordData.word.trim();
      if (!cleanWordStr) return null;

      const isDup = allWords.some(
        (w) => w.word.trim().toLowerCase() === cleanWordStr.toLowerCase()
      );
      if (isDup) return null;

      const newWord: Word = {
        id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        word: cleanWordStr,
        us_phonetics: newWordData.us_phonetics?.trim() || '',
        paraphrase_pos: newWordData.paraphrase_pos.trim(),
        paraphrase_english: newWordData.paraphrase_english?.trim() || '',
      };

      setCustomWords((prev) => [newWord, ...prev]);

      // Auto sync to cloud if logged in
      if (cloudAccount) {
        saveWordToCloud(cloudAccount.userId, newWord).catch((e) =>
          console.error('Failed to sync new word to cloud', e)
        );
      }

      return newWord;
    },
    [allWords, cloudAccount]
  );

  // Delete custom word
  const deleteCustomWord = useCallback(
    (wordId: string) => {
      setCustomWords((prev) => prev.filter((w) => w.id !== wordId));
      setProgressMap((prev) => {
        const copy = { ...prev };
        delete copy[wordId];
        return copy;
      });

      // Auto sync delete to cloud if logged in
      if (cloudAccount) {
        deleteWordFromCloud(cloudAccount.userId, wordId).catch((e) =>
          console.error('Failed to sync word deletion to cloud', e)
        );
      }
    },
    [cloudAccount]
  );

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

  // Current active practice mode/filter: 'all' | 'learning_only' | 'difficult_only' | 'mastered_only'
  const [practiceFilter, setPracticeFilter] = useState<
    'all' | 'learning_only' | 'difficult_only' | 'mastered_only'
  >('learning_only');

  // Build current queue based on practice filter in sequential order
  const [queue, setQueue] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Function to build queue based on filter
  const initQueue = useCallback(
    (
      filter: 'all' | 'learning_only' | 'difficult_only' | 'mastered_only' = practiceFilter,
      startWordId?: string
    ) => {
      let filtered: Word[] = [];

      if (filter === 'learning_only') {
        filtered = allWords.filter(
          (w) =>
            progressMap[w.id]?.status !== 'mastered' &&
            progressMap[w.id]?.status !== 'difficult'
        );
      } else if (filter === 'difficult_only') {
        filtered = allWords.filter((w) => progressMap[w.id]?.status === 'difficult');
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

    const newProgress: WordProgressItem = {
      status: 'mastered',
      lastReviewedAt: Date.now(),
      reviewCount: (progressMap[currentWord.id]?.reviewCount || 0) + 1,
      wrongCount: progressMap[currentWord.id]?.wrongCount || 0,
    };

    // Update progress map
    setProgressMap((prev) => ({
      ...prev,
      [currentWord.id]: newProgress,
    }));

    // Auto sync to cloud if logged in
    if (cloudAccount) {
      saveProgressToCloud(cloudAccount.userId, currentWord.id, newProgress).catch((e) =>
        console.error('Failed to sync progress to cloud', e)
      );
    }

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
  }, [currentWord, progressMap, cloudAccount]);

  // Action: Mark as Need Review ("我還不會")
  const markAsLearning = useCallback(() => {
    if (!currentWord) return;

    const prevItem = progressMap[currentWord.id];
    const prevWrongCount = prevItem?.wrongCount || 0;
    const newWrongCount = prevWrongCount + 1;

    // If marked "還不會" 2 or more times, automatically classify as "較不熟單字" (difficult)
    const isNowDifficult = newWrongCount >= 2;
    const newStatus: WordStatus = isNowDifficult ? 'difficult' : 'learning';

    const newProgress: WordProgressItem = {
      status: newStatus,
      lastReviewedAt: Date.now(),
      reviewCount: (prevItem?.reviewCount || 0) + 1,
      wrongCount: newWrongCount,
    };

    // Update progress map
    setProgressMap((prev) => ({
      ...prev,
      [currentWord.id]: newProgress,
    }));

    // Auto sync to cloud if logged in
    if (cloudAccount) {
      saveProgressToCloud(cloudAccount.userId, currentWord.id, newProgress).catch((e) =>
        console.error('Failed to sync progress to cloud', e)
      );
    }

    if (isNowDifficult) {
      // Remove any future re-inserted copies of currentWord from the rest of the queue
      setQueue((prevQueue) => {
        const before = prevQueue.slice(0, currentIndex + 1);
        const after = prevQueue
          .slice(currentIndex + 1)
          .filter((w) => w.id !== currentWord.id);
        return [...before, ...after];
      });
    } else {
      // First time clicking "還不會": re-insert this word 3-4 cards later in queue
      setQueue((prevQueue) => {
        const newQueue = [...prevQueue];
        const insertIndex = Math.min(currentIndex + 4, newQueue.length);
        newQueue.splice(insertIndex, 0, currentWord);
        return newQueue;
      });
    }

    // Move to next card
    setIsFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  }, [currentWord, currentIndex, progressMap, cloudAccount]);

  // Action: Manually change status of any word
  const setWordStatus = useCallback(
    (wordId: string, status: WordStatus) => {
      const prevItem = progressMap[wordId];
      const newProgress: WordProgressItem = {
        status,
        lastReviewedAt: Date.now(),
        reviewCount: (prevItem?.reviewCount || 0) + 1,
        wrongCount:
          status === 'difficult'
            ? Math.max(2, prevItem?.wrongCount || 2)
            : prevItem?.wrongCount || 0,
      };

      setProgressMap((prev) => ({
        ...prev,
        [wordId]: newProgress,
      }));

      // Auto sync to cloud if logged in
      if (cloudAccount) {
        saveProgressToCloud(cloudAccount.userId, wordId, newProgress).catch((e) =>
          console.error('Failed to sync progress to cloud', e)
        );
      }
    },
    [progressMap, cloudAccount]
  );

  // Action: Reset all progress (clear all mastered, difficult & learning statuses)
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
    let difficultCount = 0;
    let learningCount = 0;

    Object.values(progressMap).forEach((p) => {
      if ((p as WordProgressItem)?.status === 'mastered') masteredCount++;
      else if ((p as WordProgressItem)?.status === 'difficult') difficultCount++;
      else if ((p as WordProgressItem)?.status === 'learning') learningCount++;
    });

    const unseenCount = Math.max(0, total - masteredCount - difficultCount - learningCount);

    return {
      total,
      masteredCount,
      difficultCount,
      learningCount,
      unseenCount,
      progressPercentage: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
    };
  }, [allWords, progressMap]);

  // Export backup JSON file (Safe read-only download, does not alter localStorage)
  const exportBackupData = useCallback(() => {
    const backupObj = {
      version: 1,
      appName: 'VocabCards',
      timestamp: new Date().toISOString(),
      customWords,
      progressMap,
    };

    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `vocabcards_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [customWords, progressMap]);

  // Import backup JSON file
  const importBackupData = useCallback(
    (jsonData: any, mode: 'merge' | 'overwrite' = 'merge') => {
      if (!jsonData || typeof jsonData !== 'object') {
        throw new Error('無效的備份檔案格式，請確認選擇正確的 JSON 備份檔');
      }

      const importedCustomWords: Word[] = Array.isArray(jsonData.customWords)
        ? jsonData.customWords
        : [];
      const importedProgressMap: WordProgressMap =
        jsonData.progressMap && typeof jsonData.progressMap === 'object'
          ? jsonData.progressMap
          : {};

      if (mode === 'overwrite') {
        setCustomWords(importedCustomWords);
        setProgressMap(importedProgressMap);
        return {
          customAddedCount: importedCustomWords.length,
          progressUpdatedCount: Object.keys(importedProgressMap).length,
        };
      }

      // Merge Mode (Default - Safe, keeps all existing words and progress intact)
      let customAddedCount = 0;
      setCustomWords((prev) => {
        const existingWordSet = new Set(prev.map((w) => w.word.trim().toLowerCase()));
        const newToAdd: Word[] = [];

        importedCustomWords.forEach((item) => {
          if (item && item.word) {
            const clean = item.word.trim().toLowerCase();
            if (!existingWordSet.has(clean)) {
              existingWordSet.add(clean);
              newToAdd.push(item);
              customAddedCount++;
            }
          }
        });

        return [...prev, ...newToAdd];
      });

      let progressUpdatedCount = 0;
      setProgressMap((prev) => {
        const merged = { ...prev };
        Object.entries(importedProgressMap).forEach(([wordId, progressItem]) => {
          if (!merged[wordId]) {
            merged[wordId] = progressItem;
            progressUpdatedCount++;
          } else {
            // Combine stats if exists
            const currentItem = merged[wordId];
            const isMastered = progressItem.status === 'mastered' || currentItem.status === 'mastered';
            const maxWrong = Math.max(currentItem.wrongCount || 0, progressItem.wrongCount || 0);
            const maxReviews = Math.max(currentItem.reviewCount || 0, progressItem.reviewCount || 0);
            const status = isMastered
              ? 'mastered'
              : maxWrong >= 2
              ? 'difficult'
              : progressItem.status || currentItem.status;

            merged[wordId] = {
              status,
              wrongCount: maxWrong,
              reviewCount: maxReviews,
              lastReviewedAt: Math.max(currentItem.lastReviewedAt || 0, progressItem.lastReviewedAt || 0),
            };
            progressUpdatedCount++;
          }
        });
        return merged;
      });

      return {
        customAddedCount,
        progressUpdatedCount,
      };
    },
    []
  );

  // Cloud Login / Set Account and Load Cloud Data
  const loginCloudAccount = useCallback(async (account: UserAccount) => {
    setCloudAccount(account);
    try {
      const cloudData = await fetchCloudUserData(account.userId);

      // Merge custom words safely
      if (cloudData.customWords.length > 0) {
        setCustomWords((prev) => {
          const existingIds = new Set(prev.map((w) => w.id));
          const existingWordsLower = new Set(prev.map((w) => w.word.trim().toLowerCase()));
          const newWords = cloudData.customWords.filter(
            (cw) => !existingIds.has(cw.id) && !existingWordsLower.has(cw.word.trim().toLowerCase())
          );
          return [...prev, ...newWords];
        });
      }

      // Merge progress map safely
      if (Object.keys(cloudData.progressMap).length > 0) {
        setProgressMap((prev) => {
          const merged = { ...prev };
          Object.entries(cloudData.progressMap).forEach(([wId, p]) => {
            if (!merged[wId]) {
              merged[wId] = p;
            } else {
              if ((p.reviewCount || 0) > (merged[wId].reviewCount || 0) || p.status === 'mastered') {
                merged[wId] = p;
              }
            }
          });
          return merged;
        });
      }
    } catch (e) {
      console.error('Error fetching cloud data on login:', e);
    }
  }, []);

  // Cloud Logout
  const logoutCloudAccount = useCallback(() => {
    setCloudAccount(null);
  }, []);

  // One-click Migrate / Sync LocalStorage to Cloud
  const syncCurrentLocalToCloud = useCallback(async () => {
    if (!cloudAccount) {
      throw new Error('未登入雲端帳號，請先登入或建立帳號');
    }
    const result = await syncLocalStorageToCloud(cloudAccount.userId, customWords, progressMap);
    return result;
  }, [cloudAccount, customWords, progressMap]);

  // Lists of words for tabs
  const learningWords = useMemo(() => {
    return allWords.filter((w) => progressMap[w.id]?.status === 'learning');
  }, [allWords, progressMap]);

  const difficultWords = useMemo(() => {
    return allWords.filter((w) => progressMap[w.id]?.status === 'difficult');
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
    difficultWords,
    masteredWords,
    unseenWords,
    customWords,
    addCustomWord,
    deleteCustomWord,
    exportBackupData,
    importBackupData,
    progressMap,
    cloudAccount,
    loginCloudAccount,
    logoutCloudAccount,
    syncCurrentLocalToCloud,
  };
}
