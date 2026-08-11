import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { Word, WordProgressMap, WordProgressItem } from '../types';

// Initialize Firebase App
const firebaseConfig = {
  projectId: firebaseConfigJson.projectId,
  appId: firebaseConfigJson.appId,
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use the specific firestoreDatabaseId if configured
export const db = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export interface UserAccount {
  userId: string;
  username: string;
  createdAt: number;
}

// 1. Check if username is taken
export async function checkUsernameExists(username: string): Promise<{ exists: boolean; account?: UserAccount }> {
  const cleanName = username.trim();
  if (!cleanName) return { exists: false };
  const lowerKey = cleanName.toLowerCase();

  try {
    const docRef = doc(db, 'usernames', lowerKey);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      return {
        exists: true,
        account: {
          userId: data.userId,
          username: data.username,
          createdAt: data.createdAt || 0,
        },
      };
    }
    return { exists: false };
  } catch (err) {
    console.error('Error checking username:', err);
    throw err;
  }
}

// 2. Register or Login by Username
export async function registerOrLoginUser(usernameInput: string): Promise<{
  account: UserAccount;
  isNewUser: boolean;
}> {
  const cleanName = usernameInput.trim();
  if (!cleanName) {
    throw new Error('請輸入有效的使用者名稱');
  }

  const lowerKey = cleanName.toLowerCase();
  const check = await checkUsernameExists(cleanName);

  if (check.exists && check.account) {
    // Existing user login
    return {
      account: check.account,
      isNewUser: false,
    };
  }

  // New user registration
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Date.now();

  const newAccount: UserAccount = {
    userId,
    username: cleanName,
    createdAt: now,
  };

  // Save to usernames index
  await setDoc(doc(db, 'usernames', lowerKey), {
    username: cleanName,
    userId,
    createdAt: now,
  });

  // Save to users collection
  await setDoc(doc(db, 'users', userId), {
    userId,
    username: cleanName,
    createdAt: now,
    lastActive: now,
  });

  return {
    account: newAccount,
    isNewUser: true,
  };
}

// 3. Migrate / Sync LocalStorage data to Cloud Firestore (Safe: does NOT wipe local storage)
export async function syncLocalStorageToCloud(
  userId: string,
  localCustomWords: Word[],
  localProgressMap: WordProgressMap
): Promise<{ wordsUploaded: number; progressUploaded: number }> {
  if (!userId) throw new Error('未登入使用者');

  const batch = writeBatch(db);
  let wordsUploaded = 0;
  let progressUploaded = 0;

  // Upload custom words
  for (const word of localCustomWords) {
    if (word && word.id) {
      const docRef = doc(db, 'customWords', `${userId}_${word.id}`);
      batch.set(
        docRef,
        {
          userId,
          wordId: word.id,
          word: word.word,
          us_phonetics: word.us_phonetics || '',
          paraphrase_pos: word.paraphrase_pos || '',
          paraphrase_english: word.paraphrase_english || '',
          isCustom: true,
          createdAt: Date.now(),
        },
        { merge: true }
      );
      wordsUploaded++;
    }
  }

  // Upload progress map
  for (const [wordId, progress] of Object.entries(localProgressMap)) {
    if (wordId && progress) {
      const docRef = doc(db, 'userProgress', `${userId}_${wordId}`);
      batch.set(
        docRef,
        {
          userId,
          wordId,
          status: progress.status,
          reviewCount: progress.reviewCount || 0,
          wrongCount: progress.wrongCount || 0,
          lastReviewedAt: progress.lastReviewedAt || Date.now(),
        },
        { merge: true }
      );
      progressUploaded++;
    }
  }

  await batch.commit();

  return { wordsUploaded, progressUploaded };
}

// 4. Load all Cloud data for a User
export async function fetchCloudUserData(userId: string): Promise<{
  customWords: Word[];
  progressMap: WordProgressMap;
}> {
  if (!userId) return { customWords: [], progressMap: {} };

  // Fetch custom words
  const wordsRef = collection(db, 'customWords');
  const qWords = query(wordsRef, where('userId', '==', userId));
  const wordsSnap = await getDocs(qWords);

  const customWords: Word[] = [];
  wordsSnap.forEach((d) => {
    const data = d.data();
    customWords.push({
      id: data.wordId,
      word: data.word,
      us_phonetics: data.us_phonetics || '',
      paraphrase_pos: data.paraphrase_pos || '',
      paraphrase_english: data.paraphrase_english || '',
    });
  });

  // Fetch progress map
  const progressRef = collection(db, 'userProgress');
  const qProgress = query(progressRef, where('userId', '==', userId));
  const progressSnap = await getDocs(qProgress);

  const progressMap: WordProgressMap = {};
  progressSnap.forEach((d) => {
    const data = d.data();
    progressMap[data.wordId] = {
      status: data.status,
      reviewCount: data.reviewCount || 0,
      wrongCount: data.wrongCount || 0,
      lastReviewedAt: data.lastReviewedAt || 0,
    };
  });

  return { customWords, progressMap };
}

// 5. Save Single Word to Cloud
export async function saveWordToCloud(userId: string, word: Word): Promise<void> {
  if (!userId || !word.id) return;
  const docRef = doc(db, 'customWords', `${userId}_${word.id}`);
  await setDoc(docRef, {
    userId,
    wordId: word.id,
    word: word.word,
    us_phonetics: word.us_phonetics || '',
    paraphrase_pos: word.paraphrase_pos || '',
    paraphrase_english: word.paraphrase_english || '',
    isCustom: true,
    createdAt: Date.now(),
  });
}

// 6. Delete Word from Cloud
export async function deleteWordFromCloud(userId: string, wordId: string): Promise<void> {
  if (!userId || !wordId) return;
  const docRef = doc(db, 'customWords', `${userId}_${wordId}`);
  await deleteDoc(docRef);
}

// 7. Save Single Progress to Cloud
export async function saveProgressToCloud(
  userId: string,
  wordId: string,
  progress: WordProgressItem
): Promise<void> {
  if (!userId || !wordId) return;
  const docRef = doc(db, 'userProgress', `${userId}_${wordId}`);
  await setDoc(docRef, {
    userId,
    wordId,
    status: progress.status,
    reviewCount: progress.reviewCount || 0,
    wrongCount: progress.wrongCount || 0,
    lastReviewedAt: progress.lastReviewedAt || Date.now(),
  });
}

// 8. Batch Save Progress Map to Cloud
export async function batchSaveProgressToCloud(
  userId: string,
  progressMap: WordProgressMap
): Promise<void> {
  if (!userId) return;
  const batch = writeBatch(db);

  for (const [wordId, progress] of Object.entries(progressMap)) {
    if (wordId && progress) {
      const docRef = doc(db, 'userProgress', `${userId}_${wordId}`);
      batch.set(
        docRef,
        {
          userId,
          wordId,
          status: progress.status,
          reviewCount: progress.reviewCount || 0,
          wrongCount: progress.wrongCount || 0,
          lastReviewedAt: progress.lastReviewedAt || Date.now(),
        },
        { merge: true }
      );
    }
  }

  await batch.commit();
}
