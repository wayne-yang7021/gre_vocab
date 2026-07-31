export interface OnlineWordResult {
  found: boolean;
  word: string;
  phonetic: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: string[];
  }>;
  autoChineseTranslations: Array<{
    pos: string;
    meaning: string;
  }>;
  formattedEnglishDefinition: string;
  message?: string;
}

// Zero-key public translation helper to Traditional Chinese
export async function translateToChinese(text: string): Promise<string> {
  if (!text || !text.trim()) return '';
  const clean = text.trim();

  // Primary: Google Translate public endpoint (no key required)
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-TW&dt=t&q=${encodeURIComponent(
        clean
      )}`
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedParts = data[0].map((item: unknown) => (Array.isArray(item) ? item[0] : '')).filter(Boolean);
        if (translatedParts.length > 0) {
          return translatedParts.join('').trim();
        }
      }
    }
  } catch (e) {
    console.warn('Google GTX translate failed, trying fallback...', e);
  }

  // Fallback: MyMemory translation API
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|zh-TW`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText.trim();
      }
    }
  } catch (e) {
    console.warn('MyMemory translate fallback failed', e);
  }

  return '';
}

// Convert long POS name to standard abbreviation
function normalizePosAbbr(pos: string): string {
  const p = pos.toLowerCase().trim();
  if (p === 'noun' || p === 'n.') return 'n.';
  if (p === 'verb' || p === 'v.') return 'v.';
  if (p === 'adjective' || p === 'adj.') return 'adj.';
  if (p === 'adverb' || p === 'adv.') return 'adv.';
  if (p === 'preposition' || p === 'prep.') return 'prep.';
  if (p === 'conjunction' || p === 'conj.') return 'conj.';
  if (p === 'pronoun' || p === 'pron.') return 'pron.';
  if (p === 'interjection' || p === 'interj.') return 'interj.';
  if (p.includes('phrase') || p === 'phr.') return 'phr.';
  return pos ? `${pos}.` : 'n.';
}

export async function lookupWordOnline(wordQuery: string): Promise<OnlineWordResult> {
  const cleanWord = wordQuery.trim().toLowerCase();
  if (!cleanWord) {
    return {
      found: false,
      word: '',
      phonetic: '',
      meanings: [],
      autoChineseTranslations: [],
      formattedEnglishDefinition: '',
      message: '請輸入有效的英文單字',
    };
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`
    );

    let foundInDict = false;
    let phonetic = '';
    const meanings: Array<{ partOfSpeech: string; definitions: string[] }> = [];
    const englishDefLines: string[] = [];
    const autoChineseTranslations: Array<{ pos: string; meaning: string }> = [];

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        foundInDict = true;
        const entry = data[0];

        // Extract phonetic
        phonetic = entry.phonetic || '';
        if (!phonetic && Array.isArray(entry.phonetics)) {
          const pObj = entry.phonetics.find((p: { text?: string }) => p.text);
          if (pObj && pObj.text) {
            phonetic = pObj.text;
          }
        }

        // Extract meanings
        if (Array.isArray(entry.meanings)) {
          entry.meanings.slice(0, 3).forEach((m: { partOfSpeech?: string; definitions?: Array<{ definition: string }> }) => {
            const rawPos = m.partOfSpeech || '';
            const defs = Array.isArray(m.definitions)
              ? m.definitions.slice(0, 2).map((d) => d.definition)
              : [];

            if (defs.length > 0) {
              meanings.push({ partOfSpeech: rawPos, definitions: defs });
              englishDefLines.push(`${rawPos}: ${defs.join('; ')}`);
            }
          });
        }
      }
    }

    // Translate English word directly to get primary Chinese meaning
    const directWordZh = await translateToChinese(cleanWord);

    if (foundInDict) {
      // Translate each POS definition line into Chinese
      for (const m of meanings) {
        const posAbbr = normalizePosAbbr(m.partOfSpeech);
        let posMeaningZh = '';

        if (m.definitions.length > 0) {
          // Translate the first definition
          const translatedDef = await translateToChinese(m.definitions[0]);
          if (translatedDef) {
            posMeaningZh = translatedDef;
          }
        }

        // If definition translation is empty, fallback to word translation
        if (!posMeaningZh && directWordZh) {
          posMeaningZh = directWordZh;
        }

        if (posMeaningZh) {
          autoChineseTranslations.push({
            pos: posAbbr,
            meaning: posMeaningZh,
          });
        }
      }

      // If no auto translations were generated from definitions, add direct word translation
      if (autoChineseTranslations.length === 0 && directWordZh) {
        autoChineseTranslations.push({
          pos: 'n.',
          meaning: directWordZh,
        });
      }

      return {
        found: true,
        word: cleanWord,
        phonetic,
        meanings,
        autoChineseTranslations,
        formattedEnglishDefinition: englishDefLines.join(' | '),
      };
    } else {
      // Not found in dictionaryapi.dev, but try direct translation via translate endpoint
      if (directWordZh) {
        return {
          found: true,
          word: cleanWord,
          phonetic: '',
          meanings: [],
          autoChineseTranslations: [
            {
              pos: 'n.',
              meaning: directWordZh,
            },
          ],
          formattedEnglishDefinition: '',
          message: '已透過線上翻譯獲取中文解釋（未找到英英字典詳細音標）',
        };
      }

      return {
        found: false,
        word: cleanWord,
        phonetic: '',
        meanings: [],
        autoChineseTranslations: [],
        formattedEnglishDefinition: '',
        message: '字典資料庫中未找到該單字，請手動輸入音標與解釋',
      };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : '連線失敗';
    return {
      found: false,
      word: cleanWord,
      phonetic: '',
      meanings: [],
      autoChineseTranslations: [],
      formattedEnglishDefinition: '',
      message: `查詢出錯：${errorMsg}（可手動輸入）`,
    };
  }
}

