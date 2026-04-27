import React, { useState, useEffect } from 'react';

/**
 * RevenueReport - 營收報表組件
 * 功能：顯示月度財務摘要、押金統計與商品銷量排行
 */
export default function RevenueReport({ scriptUrl }) {
  // ==========================================
  // 1. 狀態管理
  // ==========================================
  const [targetMonth, setTargetMonth] = useState(() => {
    const now = new Date();
    // 預設顯示當前月份
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // 2. 取得報表資料 API
  // ==========================================
  const fetchReport = async (month) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        // 注意：GAS 的 doPost 需要 JSON 字串
        body: JSON.stringify({
          action: 'generate_monthly_report',
          targetMonth: month
        })
      });
      const result = await response.json();
      
      if (result.status === 'success') {
        setReportData(result.data);
      } else {
        setError(result.message || '取得報表失敗');
      }
    } catch (err) {
      console.error("Fetch Report Error:", err);
      setError('網路連線錯誤，請確認 GAS API 部署狀態');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    if (scriptUrl) fetchReport(targetMonth);
  }, [scriptUrl]);

  // 處理月份變更
  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    setTargetMonth(newMonth);
    fetchReport(newMonth);
  };

  // ==========================================
  // 3. 渲染 UI
  // ==========================================
  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 標題與月份選擇區 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-darkWood mb-2">營收報表</h2>
          <p className="text-gray-500 font-medium italic">依據活動執行日認列營收，精確區分押金與實收</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <span className="pl-4 font-bold text-gray-400 uppercase text-xs tracking-widest">查詢月份</span>
          <input 
            type="month" 
            value={targetMonth}
            onChange={handleMonthChange}
            className="px-4 py-2 bg-creamBg rounded-xl font-bold text-darkWood border-none focus:ring-2 focus:ring-amberRed"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amberRed mb-4"></div>
          <p className="text-gray-400 font-bold">李伯伯正在計算帳目中...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 text-red-600 rounded-3xl border border-red-100 font-bold text-center">
          ⚠️ 系統提示：{error}
        </div>
      ) : reportData ? (
        <>
          {/* 財務統計卡片區 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 實際營收 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">實際營收</p>
              <h3 className="text-3xl font-black text-emerald-600 mb-1">
                NT$ {reportData.actualRevenue.toLocaleString()}
              </h3>
              <p className="text-xs text-gray-400 font-medium">含糖葫蘆、掃帚租金與運費</p>
            </div>

            {/* 代收押金 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">代收押金</p>
              <h3 className="text-3xl font-black text-amber-500 mb-1">
                NT$ {reportData.totalDeposit.toLocaleString()}
              </h3>
              <p className="text-xs text-gray-400 font-medium">此為負債項目，活動後需退還</p>
            </div>

            {/* 完成訂單數 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">有效訂單</p>
              <h3 className="text-3xl font-black text-blue-600 mb-1">
                {reportData.orderCount} <span className="text-lg">筆</span>
              </h3>
              <p className="text-xs text-gray-400 font-medium">該月份已完成之活動總數</p>
            </div>
          </div>

          {/* 商品熱銷排行區 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-darkWood">商品口味熱銷排行</h3>
              <div className="bg-creamBg px-4 py-1 rounded-full text-xs font-black text-amberRed uppercase tracking-widest">
                Product Statistics
              </div>
            </div>
            
            <div className="p-8">
              {reportData.flavorStats.length > 0 ? (
                <div className="space-y-8">
                  {reportData.flavorStats.map((stat, index) => {
                    // 計算長條圖比例 (以排行第一名為 100%)
                    const maxCount = reportData.flavorStats[0].count;
                    const percentage = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={stat.name} className="relative group">
                        <div className="flex justify-between items-end mb-3">
                          <div className="flex items-center gap-4">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-black ${
                              index === 0 ? 'bg-amberRed text-white' : 
                              index === 1 ? 'bg-orange-400 text-white' :
                              index === 2 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="font-bold text-darkWood text-lg">{stat.name}</span>
                          </div>
                          <span className="font-black text-darkWood text-xl">
                            {stat.count} <span className="text-xs text-gray-400 font-bold uppercase">支</span>
                          </span>
                        </div>
                        
                        {/* 背景軌道 */}
                        <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                          {/* 動態長條圖 */}
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              index === 0 ? 'bg-amberRed' : 'bg-amberRed/30'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">📊</div>
                  <p className="text-gray-400 font-bold text-lg">該月份目前尚無活動資料</p>
                </div>
              )}
            </div>

            {/* 頁尾提醒 */}
            <div className="bg-creamBg/30 p-6 text-center border-t border-gray-50">
              <p className="text-xs text-gray-400 font-bold tracking-wide">
                💡 提示：本報表數據已同步寫入 Google Sheets 「月報表」分頁，可隨時導出作為會計憑證。
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}