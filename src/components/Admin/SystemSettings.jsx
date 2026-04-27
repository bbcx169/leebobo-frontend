import React from 'react';

export default function SystemSettings({ 
  settings, 
  setSettings, 
  isSavingSettings, 
  onSaveSettings 
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <header>
        <h2 className="text-2xl font-bold text-gray-800">系統設定</h2>
        <p className="text-gray-500 mt-1 text-sm md:text-base">管理機器人通知與日常自動化作業</p>
      </header>

      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
          <svg className="w-5 h-5 text-[#06C755]" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.572-3.843 2.572-5.992z"/></svg>
          LINE 每日出貨提醒報表
        </h3>
        
        <div className="space-y-6 max-w-lg">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-bold text-gray-700 text-base">啟用每日提醒功能</label>
              <p className="text-sm text-gray-500 mt-1">系統將在指定時間，發送「明日訂單總覽」至 LINE 官方帳號。</p>
            </div>
            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
              <input 
                type="checkbox" 
                id="toggle" 
                checked={settings.reminderEnabled} 
                onChange={e => setSettings({...settings, reminderEnabled: e.target.checked})} 
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 transition-all duration-300" 
              />
              <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer transition-colors duration-300"></label>
            </div>
          </div>

          <div className={`transition-opacity duration-300 ${settings.reminderEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <label className="block font-bold text-gray-700 mb-2">提醒發送時間</label>
            <input 
              type="time" 
              value={settings.reminderTime} 
              onChange={e => setSettings({...settings, reminderTime: e.target.value})} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#06C755] outline-none font-medium" 
            />
            <p className="text-xs text-gray-400 mt-2">建議設定在營業前（如 11:00）或前一天晚上，讓職人有充分時間備料。</p>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <button 
              onClick={onSaveSettings} 
              disabled={isSavingSettings} 
              className="w-full md:w-auto px-8 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSavingSettings ? '儲存中...' : '儲存並更新排程'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}