import React, { useState } from 'react';
import { Word, WordProgressMap, WordStatus } from '../types';
import { lookupWordOnline } from '../utils/dictionaryApi';
import { speakWord } from '../utils/speech';
import {
  Plus,
  Trash2,
  Search,
  Volume2,
  Sparkles,
  Loader2,
  BookPlus,
  Flame,
  BookmarkX,
  CheckCircle2,
  AlertCircle,
  Check,
} from 'lucide-react';

interface TranslationInput {
  id: string;
  pos: string;
  meaning: string;
}

interface AddWordViewProps {
  customWords: Word[];
  progressMap: WordProgressMap;
  onAddCustomWord: (data: {
    word: string;
    us_phonetics?: string;
    paraphrase_pos: string;
    paraphrase_english?: string;
  }) => Word | null;
  onDeleteCustomWord: (wordId: string) => void;
  onStartPractice: (
    filter: 'all' | 'learning_only' | 'difficult_only' | 'mastered_only',
    startWordId?: string
  ) => void;
}

const POS_OPTIONS = [
  { value: 'n.', label: 'n. (名詞)' },
  { value: 'v.', label: 'v. (動詞)' },
  { value: 'adj.', label: 'adj. (形容詞)' },
  { value: 'adv.', label: 'adv. (副詞)' },
  { value: 'prep.', label: 'prep. (介系詞)' },
  { value: 'conj.', label: 'conj. (連接詞)' },
  { value: 'phr.', label: 'phr. (片語)' },
  { value: '', label: '無/自訂' },
];

export const AddWordView: React.FC<AddWordViewProps> = ({
  customWords,
  progressMap,
  onAddCustomWord,
  onDeleteCustomWord,
  onStartPractice,
}) => {
  // Form fields
  const [englishWord, setEnglishWord] = useState('');
  const [phonetics, setPhonetics] = useState('');
  const [englishDef, setEnglishDef] = useState('');

  // Multiple Chinese translations
  const [translations, setTranslations] = useState<TranslationInput[]>([
    { id: '1', pos: 'n.', meaning: '' },
  ]);

  // UI state
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<{
    type: 'success' | 'warning' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [formSuccessMessage, setFormSuccessMessage] = useState('');
  const [formErrorMessage, setFormErrorMessage] = useState('');

  // Custom list filter query
  const [customSearchQuery, setCustomSearchQuery] = useState('');

  // Handle auto lookup online (Free Dictionary API, zero AI key required)
  const handleAutoLookup = async () => {
    if (!englishWord.trim()) {
      setSearchStatus({
        type: 'warning',
        message: '請先輸入英文單字再進行查詢',
      });
      return;
    }

    setIsSearching(true);
    setSearchStatus({ type: null, message: '' });

    const result = await lookupWordOnline(englishWord.trim());
    setIsSearching(false);

    if (result.found) {
      if (result.phonetic) {
        setPhonetics(result.phonetic);
      }
      if (result.formattedEnglishDefinition) {
        setEnglishDef(result.formattedEnglishDefinition);
      }
      if (result.autoChineseTranslations && result.autoChineseTranslations.length > 0) {
        setTranslations(
          result.autoChineseTranslations.map((t, idx) => ({
            id: (Date.now() + idx).toString(),
            pos: t.pos,
            meaning: t.meaning,
          }))
        );
      }

      setSearchStatus({
        type: 'success',
        message: '已成功線上抓取音標、英文釋義並自動翻譯成中文！您可以直接確認或微調內容：',
      });
    } else {
      setSearchStatus({
        type: 'warning',
        message: result.message || '線上記錄未找到該單字，請手動輸入音標與翻譯',
      });
    }
  };

  // Add another Chinese translation row
  const handleAddTranslationRow = () => {
    setTranslations((prev) => [
      ...prev,
      { id: Date.now().toString(), pos: 'n.', meaning: '' },
    ]);
  };

  // Remove a Chinese translation row
  const handleRemoveTranslationRow = (id: string) => {
    if (translations.length <= 1) return;
    setTranslations((prev) => prev.filter((t) => t.id !== id));
  };

  // Update a Chinese translation row field
  const handleUpdateTranslation = (id: string, field: 'pos' | 'meaning', value: string) => {
    setTranslations((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrorMessage('');
    setFormSuccessMessage('');

    const cleanWord = englishWord.trim();
    if (!cleanWord) {
      setFormErrorMessage('請輸入英文單字');
      return;
    }

    // Combine multiple Chinese translations into formatted paraphrase_pos string
    // e.g. "n. 蘋果； v. 增強"
    const validTranslations = translations
      .map((t) => {
        const cleanMeaning = t.meaning.trim();
        if (!cleanMeaning) return '';
        const posPrefix = t.pos ? `${t.pos.trim()} ` : '';
        return `${posPrefix}${cleanMeaning}`;
      })
      .filter(Boolean);

    if (validTranslations.length === 0) {
      setFormErrorMessage('請至少輸入一組中文翻譯');
      return;
    }

    const combinedPosChinese = validTranslations.join('； ');

    const created = onAddCustomWord({
      word: cleanWord,
      us_phonetics: phonetics.trim(),
      paraphrase_pos: combinedPosChinese,
      paraphrase_english: englishDef.trim(),
    });

    if (created) {
      setFormSuccessMessage(`成功加入單字 「${cleanWord}」 到字庫中！`);
      // Reset form
      setEnglishWord('');
      setPhonetics('');
      setEnglishDef('');
      setTranslations([{ id: Date.now().toString(), pos: 'n.', meaning: '' }]);
      setSearchStatus({ type: null, message: '' });

      setTimeout(() => {
        setFormSuccessMessage('');
      }, 4000);
    }
  };

  // Filter custom words
  const filteredCustomWords = customWords.filter((w) => {
    const q = customSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      w.word.toLowerCase().includes(q) ||
      w.paraphrase_pos.toLowerCase().includes(q) ||
      w.us_phonetics.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-fadeIn">
      {/* View Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
            <BookPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100">新增自訂單字</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              您可以自行新增生字集。輸入英文後可一鍵線上免費查詢音標與釋義，並可新增多個中文翻譯！
            </p>
          </div>
        </div>
      </div>

      {/* Add Word Form Card */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            單字內容設定
          </h3>

          {/* Form Top Alert Messages */}
          {formSuccessMessage && (
            <div className="flex items-center gap-2.5 p-4 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 rounded-2xl text-sm font-medium">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{formSuccessMessage}</span>
            </div>
          )}

          {formErrorMessage && (
            <div className="flex items-center gap-2.5 p-4 bg-rose-950/80 border border-rose-800/80 text-rose-300 rounded-2xl text-sm font-medium">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{formErrorMessage}</span>
            </div>
          )}

          {/* 1. English Word + Auto Lookup */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-semibold text-slate-300">
              英文單字 <span className="text-rose-400">*</span>
            </label>
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <input
                type="text"
                value={englishWord}
                onChange={(e) => setEnglishWord(e.target.value)}
                placeholder="例如：ephemeral, resilient..."
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-sans text-base shadow-inner"
              />
              <button
                type="button"
                onClick={handleAutoLookup}
                disabled={isSearching || !englishWord.trim()}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-950/80 hover:bg-indigo-600 border border-indigo-700/60 text-indigo-300 hover:text-white transition-all text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md shrink-0"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                    <span>線上查詢中...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-indigo-400" />
                    <span>自動查詢音標與釋義</span>
                  </>
                )}
              </button>
            </div>

            {/* Auto Search Status Message */}
            {searchStatus.message && (
              <div
                className={`mt-2 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  searchStatus.type === 'success'
                    ? 'bg-indigo-950/60 border border-indigo-800/50 text-indigo-300'
                    : 'bg-amber-950/60 border border-amber-800/50 text-amber-300'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchStatus.message}</span>
              </div>
            )}
          </div>

          {/* 2. Phonetics (音標) */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-semibold text-slate-300">
              美式/國際音標 <span className="text-slate-500 font-normal">(選填)</span>
            </label>
            <input
              type="text"
              value={phonetics}
              onChange={(e) => setPhonetics(e.target.value)}
              placeholder="例如：/ɪˈfɛmərəl/"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-indigo-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-sm shadow-inner"
            />
          </div>

          {/* 3. Chinese Translations (Supports Multiple) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-semibold text-slate-300">
                中文翻譯 <span className="text-rose-400">*</span>{' '}
                <span className="text-slate-400 font-normal text-xs">(可新增多個詞性與中文解釋)</span>
              </label>
              <button
                type="button"
                onClick={handleAddTranslationRow}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-medium border border-slate-700/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>新增一組中文解釋</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {translations.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800"
                >
                  <span className="text-xs font-mono text-slate-500 pl-1">{index + 1}.</span>

                  {/* POS Dropdown */}
                  <select
                    value={item.pos}
                    onChange={(e) => handleUpdateTranslation(item.id, 'pos', e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500 shrink-0 font-medium"
                  >
                    {POS_OPTIONS.map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                  </select>

                  {/* Meaning Text Input */}
                  <input
                    type="text"
                    value={item.meaning}
                    onChange={(e) =>
                      handleUpdateTranslation(item.id, 'meaning', e.target.value)
                    }
                    placeholder="輸入中文解釋，例如：轉瞬即逝的..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />

                  {/* Delete Translation Row Button */}
                  {translations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTranslationRow(item.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="刪除此組翻譯"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4. English Definition (Optional) */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-semibold text-slate-300">
              英文補充釋義/例句 <span className="text-slate-500 font-normal">(選填)</span>
            </label>
            <input
              type="text"
              value={englishDef}
              onChange={(e) => setEnglishDef(e.target.value)}
              placeholder="例如：lasting for a very short time."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm shadow-inner italic font-serif"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-base shadow-lg shadow-indigo-950/40 hover:shadow-indigo-900/50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>加入單字庫 (存至 LocalStorage)</span>
            </button>
          </div>
        </form>
      </div>

      {/* List of User's Custom Words */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BookPlus className="w-5 h-5 text-emerald-400" />
              自訂單字列表
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                {customWords.length} 個單字
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              由您自行新增的單字會保存在此處，並會加入翻卡與所有統計中。
            </p>
          </div>

          {/* Search filter for custom words */}
          {customWords.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={customSearchQuery}
                onChange={(e) => setCustomSearchQuery(e.target.value)}
                placeholder="搜尋自訂單字..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {customWords.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-slate-800/60 p-6">
            <BookPlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">您目前尚未新增任何自訂單字</p>
            <p className="text-slate-500 text-xs mt-1">在上方表單輸入英文與中文解釋即可隨時建立專屬單字庫！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCustomWords.map((item) => {
              const status: WordStatus | undefined = progressMap[item.id]?.status;
              return (
                <div
                  key={item.id}
                  className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-md group relative"
                >
                  <div>
                    {/* Top Row: Word & Speech */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-xl font-extrabold text-white font-sans tracking-wide">
                          {item.word}
                        </h4>
                        <button
                          type="button"
                          onClick={() => speakWord(item.word)}
                          className="p-1.5 rounded-full bg-slate-800/80 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-colors"
                          title="播放發音"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Delete Custom Word Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`確定要從單字庫刪除自訂單字 「${item.word}」 嗎？`)) {
                            onDeleteCustomWord(item.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded-xl transition-colors"
                        title="刪除此單字"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Phonetics */}
                    {item.us_phonetics && (
                      <p className="text-xs font-mono text-indigo-300 bg-indigo-950/40 border border-indigo-900/40 px-2 py-0.5 rounded-md inline-block mb-2">
                        {item.us_phonetics}
                      </p>
                    )}

                    {/* Chinese Translation */}
                    <p className="text-sm font-semibold text-emerald-400 leading-snug">
                      {item.paraphrase_pos}
                    </p>

                    {/* English Definition */}
                    {item.paraphrase_english && (
                      <p className="text-xs text-slate-400 italic mt-1 font-serif bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        "{item.paraphrase_english}"
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Learning Status & Quick Practice */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                    <div>
                      {status === 'mastered' ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/50">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 已學會
                        </span>
                      ) : status === 'difficult' ? (
                        <span className="flex items-center gap-1 text-rose-400 font-medium bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-800/50">
                          <Flame className="w-3.5 h-3.5" /> 較不熟
                        </span>
                      ) : status === 'learning' ? (
                        <span className="flex items-center gap-1 text-amber-400 font-medium bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-800/50">
                          <BookmarkX className="w-3.5 h-3.5" /> 學習中
                        </span>
                      ) : (
                        <span className="text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                          未學過
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onStartPractice('all', item.id)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-800/60 transition-colors font-medium text-xs"
                    >
                      翻卡練習此字
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
