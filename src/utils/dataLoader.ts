import { Word } from '../types';
import gre3000 from '../data/GRE_3000_Vocabulary.json';

export function getAllWords(): Word[] {
  const seen = new Set<string>();
  const uniqueWords: Word[] = [];

  for (const item of gre3000) {
    const cleanWord = item.word.trim();
    if (!cleanWord || seen.has(cleanWord)) {
      continue;
    }
    seen.add(cleanWord);

    uniqueWords.push({
      id: cleanWord,
      word: cleanWord,
      us_phonetics: typeof item.us_phonetics === 'string' ? item.us_phonetics : '',
      paraphrase_pos: typeof item.paraphrase_pos === 'string' ? item.paraphrase_pos : '',
      paraphrase_english: typeof item.paraphrase_english === 'string' ? item.paraphrase_english : '',
    });
  }

  return uniqueWords;
}

