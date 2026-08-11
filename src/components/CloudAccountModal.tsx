import React, { useState } from 'react';
import {
  Cloud,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  UploadCloud,
  LogOut,
  UserPlus,
  LogIn,
  Loader2,
  Globe,
} from 'lucide-react';
import { UserAccount, checkUsernameExists, registerOrLoginUser } from '../lib/firebase';
import { Word, WordProgressMap } from '../types';

interface CloudAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudAccount: UserAccount | null;
  onLogin: (account: UserAccount) => Promise<void>;
  onLogout: () => void;
  onSyncLocalToCloud: () => Promise<{ wordsUploaded: number; progressUploaded: number }>;
  customWordsCount: number;
  progressRecordCount: number;
}

export const CloudAccountModal: React.FC<CloudAccountModalProps> = ({
  isOpen,
  onClose,
  cloudAccount,
  onLogin,
  onLogout,
  onSyncLocalToCloud,
  customWordsCount,
  progressRecordCount,
}) => {
  const [usernameInput, setUsernameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [existsAlert, setExistsAlert] = useState<{
    checked: boolean;
    isTaken: boolean;
    message: string;
  }>({ checked: false, isTaken: false, message: '' });

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info' | null;
    text: string;
  }>({ type: null, text: '' });

  if (!isOpen) return null;

  // Check username uniqueness
  const handleCheckUsername = async () => {
    const clean = usernameInput.trim();
    if (!clean) {
      setExistsAlert({ checked: false, isTaken: false, message: '' });
      return;
    }

    try {
      const res = await checkUsernameExists(clean);
      if (res.exists) {
        setExistsAlert({
          checked: true,
          isTaken: true,
          message: `使用者名稱 「${clean}」 在雲端資料庫中已存在。如果您是此帳號擁有者可直接點擊登入！`,
        });
      } else {
        setExistsAlert({
          checked: true,
          isTaken: false,
          message: `✨ 「${clean}」 是全新的使用者名稱，可直接註冊並啟用雲端同步！`,
        });
      }
    } catch (err) {
      console.error('Check username error:', err);
    }
  };

  // Submit Register / Login
  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = usernameInput.trim();
    if (!clean) {
      setStatusMessage({ type: 'error', text: '請輸入使用者名稱' });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: null, text: '' });

    try {
      const res = await registerOrLoginUser(clean);
      await onLogin(res.account);

      setIsLoading(false);
      setStatusMessage({
        type: 'success',
        text: res.isNewUser
          ? `成功建立雲端帳號 「${res.account.username}」！此帳號具有獨一無二的雲端 ID (${res.account.userId})。`
          : `歡迎回來！成功登入雲端帳號 「${res.account.username}」，已同步線上紀錄。`,
      });
      setUsernameInput('');
      setExistsAlert({ checked: false, isTaken: false, message: '' });
    } catch (err: any) {
      setIsLoading(false);
      setStatusMessage({
        type: 'error',
        text: `處理失敗：${err?.message || '網路連線異常'}`,
      });
    }
  };

  // Trigger LocalStorage -> Cloud Migration
  const handleMigrateLocalStorage = async () => {
    setIsSyncing(true);
    setStatusMessage({ type: null, text: '' });

    try {
      const result = await onSyncLocalToCloud();
      setIsSyncing(false);
      setStatusMessage({
        type: 'success',
        text: `轉移成功！已將本機 (LocalStorage) 的 ${result.wordsUploaded} 個自訂單字與 ${result.progressUploaded} 筆學習紀錄備份上傳至雲端資料庫！(原本機紀錄完好無損)`,
      });
    } catch (err: any) {
      setIsSyncing(false);
      setStatusMessage({
        type: 'error',
        text: `轉移失敗：${err?.message || '請確認網路連線與雲端帳號狀態'}`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        {/* Background Decorative Accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-950 border border-indigo-800 text-indigo-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-100">線上雲端資料庫</h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Cloudflare 相容
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">跨裝置隨時同步單字庫與學習進度</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message Alert */}
        {statusMessage.text && (
          <div
            className={`p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/80 border border-rose-800 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* State 1: Active Logged In Cloud User */}
        {cloudAccount ? (
          <div className="space-y-5">
            <div className="bg-slate-950/80 border border-indigo-900/60 rounded-2xl p-5 space-y-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-300">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">目前綁定雲端使用者：</span>
                    <span className="text-base font-bold text-slate-100">{cloudAccount.username}</span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-xs text-slate-300 font-medium transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>登出</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
                <span>雲端不重複 ID: <code className="text-indigo-300 font-mono">{cloudAccount.userId}</code></span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 自動即時同步中
                </span>
              </div>
            </div>

            {/* Migrate LocalStorage Button Box */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-2.5">
                <UploadCloud className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-200">一鍵將本機紀錄轉換/同步至雲端</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    偵測到您目前本機 (LocalStorage) 有 <strong>{customWordsCount}</strong> 個自訂單字，以及 <strong>{progressRecordCount}</strong> 筆練習紀錄。點擊下方按鈕可將其一鍵備份同步至您的雲端帳號。
                  </p>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>重置保護：</strong>此操作僅上傳備份至雲端，絕不會刪除或清空您本機的 LocalStorage！</span>
              </div>

              <button
                onClick={handleMigrateLocalStorage}
                disabled={isSyncing}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-950/50"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                    <span>正在上傳轉換至雲端資料庫...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>轉移/同步本機紀錄至雲端 ({customWordsCount} 個單字 / {progressRecordCount} 筆進度)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* State 2: Not Logged In - Register or Login */
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-300">零設定跨裝置雲端資料庫</p>
                <p className="text-slate-400 mt-0.5">
                  輸入一個您專屬的「使用者名稱」。若名稱尚未被註冊將為您自動建立新帳號；若名稱已存在，您可直接登入同步現有紀錄。
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitAccount} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  設定使用者名稱 (Username) <span className="text-rose-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="w-5 h-5 text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => {
                      setUsernameInput(e.target.value);
                      setExistsAlert({ checked: false, isTaken: false, message: '' });
                    }}
                    onBlur={handleCheckUsername}
                    placeholder="例如：Wayne_123, Alex2026..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-11 pr-4 py-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 text-sm shadow-inner"
                  />
                </div>
              </div>

              {/* Username Uniqueness Alert Box */}
              {existsAlert.checked && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    existsAlert.isTaken
                      ? 'bg-amber-950/80 border border-amber-800 text-amber-300'
                      : 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                  }`}
                >
                  {existsAlert.isTaken ? (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span>{existsAlert.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !usernameInput.trim()}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-950/50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                    <span>正在連線雲端資料庫...</span>
                  </>
                ) : existsAlert.isTaken ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>登入並同步線上帳號 「{usernameInput.trim()}」</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>建立雲端帳號並啟用線上資料庫</span>
                  </>
                )}
              </button>
            </form>

            {/* Hint about preserving LocalStorage */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-1.5">
              <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-indigo-400" />
                已有 LocalStorage 本機紀錄？
              </p>
              <p className="leading-relaxed">
                建立/登入帳號後，您隨時可以在此處把目前本機的 <strong>{customWordsCount}</strong> 個自訂單字與 <strong>{progressRecordCount}</strong> 筆練習進度轉換備份至雲端。<strong>原本的 LocalStorage 紀錄絕不重置！</strong>
              </p>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs sm:text-sm transition-colors"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
