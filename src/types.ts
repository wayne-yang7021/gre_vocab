export type WordStatus = 'learning' | 'mastered';

export interface RawWordItem {
  word: string;
  us_phonetics: string;
  paraphrase_pos: string;
  paraphrase_english: string | boolean;
}

export interface Word {
  id: string;
  word: string;
  us_phonetics: string;
  paraphrase_pos: string;
  paraphrase_english: string;
}

export interface WordProgressItem {
  status: WordStatus;
  reviewCount: number;
  lastReviewedAt: number | null;
  wrongCount: number;
}

export type WordProgressMap = Record<string, WordProgressItem>;

export type AppView = 'flashcards' | 'learning' | 'mastered' | 'all';

