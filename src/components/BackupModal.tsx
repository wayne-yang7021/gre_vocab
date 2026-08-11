import React, { useState, useRef } from 'react';
import { Download, Upload, CheckCircle2, AlertTriangle, X, ShieldCheck, Database, FileJson } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (jsonData: any, mode: 'merge' | 'overwrite') => { customAddedCount: number; progressUpdatedCount: number };
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onExport,
  onImport,
}) => {
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: '',
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        const result = onImport(json, importMode);
        setStatusMessage({
          type: 'success',
          text: `資料匯入成功！${importMode === 'merge' ? '已智能合併' : '已取代更新'}：新增了 ${result.customAddedCount} 個自訂單字，以及 ${result.progressUpdatedCount} 筆單字學習紀錄！`,
        });

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: `匯入失敗：${err.message || '格式錯誤，請確定上傳 VocabCards 的 JSON 備份檔'}`,
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        {/* Background Decorative Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-950 border border-indigo-800 text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">跨裝置備份與同步轉移</h3>
              <p className="text-xs text-slate-400 mt-0.5">匯出/匯入 LocalStorage 學習進度與自訂單字</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safe Notice Banner */}
        <div className="flex items-start gap-3 p-3.5 bg-emerald-950/60 border border-emerald-800/60 rounded-2xl text-emerald-300 text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-200">100% 安全無失風險承諾</p>
            <p className="text-emerald-300/80 mt-0.5">
              匯出備份僅讀取並下載檔案，<strong>絕不會清空或重置您的 LocalStorage 紀錄</strong>。預設匯入亦採用「智能合併」，不會覆蓋您現有的學習歷史！
            </p>
          </div>
        </div>

        {/* Status Alert */}
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
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Action 1: Export Data */}
        <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-400" />
              1. 匯出備份檔 (下載至本機)
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">.json 格式</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            將您當前的所有自訂單字與練習紀錄匯出為 JSON 備份檔。您可以將此檔案發送到手機或其他電腦備用。
          </p>
          <button
            onClick={onExport}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-indigo-950/40 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>下載備份檔案 (不會修改現有資料)</span>
          </button>
        </div>

        {/* Action 2: Import Data */}
        <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-400" />
              2. 匯入備份檔 (從新裝置/網頁讀取)
            </h4>
          </div>

          {/* Import Mode Radio */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">選擇匯入方式：</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  importMode === 'merge'
                    ? 'bg-indigo-950/80 border-indigo-600 text-slate-100 ring-1 ring-indigo-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 智能合併 (推薦)
                </span>
                <span className="text-[11px] text-slate-400">保留現有資料，僅增補新單字與學習進度</span>
              </button>

              <button
                type="button"
                onClick={() => setImportMode('overwrite')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  importMode === 'overwrite'
                    ? 'bg-rose-950/80 border-rose-600 text-slate-100 ring-1 ring-rose-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> 完全覆蓋
                </span>
                <span className="text-[11px] text-slate-400">以此檔案內容直接取代目前的 LocalStorage</span>
              </button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
          >
            <FileJson className="w-4 h-4 text-emerald-400" />
            <span>選擇 JSON 備份檔並執行匯入</span>
          </button>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2">
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
