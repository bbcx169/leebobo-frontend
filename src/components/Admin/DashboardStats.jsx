import React, { useMemo } from 'react';

export default function DashboardStats({ 
  orders, 
  // 🚀 已移除 urgentOrders
  selectedDate, 
  setSelectedDate, 
  dailyOrders, 
  dailyMaterials 
}) {

  // 🚀 新增邏輯：動態計算離今日(含)最近的 5 個有訂單的日期
  const upcomingDates = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. 統計每一天的訂單數量 (僅限今日及未來的日期)
    const dateCounts = {};
    orders.forEach(o => {
      if (!o.eventDate) return;
      const eDate = new Date(o.eventDate);
      eDate.setHours(0, 0, 0, 0);
      
      if (eDate >= today) {
        dateCounts[o.eventDate] = (dateCounts[o.eventDate] || 0) + 1;
      }
    });

    // 2. 將日期排序並取出前 5 個
    const sortedDates = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b));
    
    return sortedDates.slice(0, 5).map(dateStr => ({
      date: dateStr,
      count: dateCounts[dateStr]
    }));
  }, [orders]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-[fadeIn_0.3s_ease-out]">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">排程與備料看板</h2>
        <p className="text-gray-500 mt-1 text-sm md:text-base">以「活動出貨日」為核心的任務追蹤</p>
      </header>

      {/* 頂部統計卡片區 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* 系統總訂單數 */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <p className="text-gray-500 text-sm font-medium mb-2">系統總訂單數</p>
          <p className="text-4xl md:text-5xl font-bold text-gray-800">
            {orders.length} <span className="text-base font-normal text-gray-400">筆</span>
          </p>
        </div>

        {/* 🚀 全新設計：近期排程快選 (取代原本的紅色急單區塊) */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 md:col-span-2 flex flex-col justify-center">
          <p className="text-gray-700 text-sm font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amberRed" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            近期排程快選
          </p>
          
          {upcomingDates.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
              {upcomingDates.map(item => (
                <button
                  key={item.date}
                  onClick={() => setSelectedDate(item.date)} // 點擊自動更換下方查詢日期
                  className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all duration-300 ${
                    selectedDate === item.date 
                      ? 'bg-amberRed/10 border-amberRed text-amberRed shadow-sm scale-105' // 被選中的樣式
                      : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100 hover:border-gray-200' // 一般樣式
                  }`}
                >
                  <span className="text-sm font-bold block">{item.date.slice(5)}</span> {/* 只顯示 月-日，例如 12-25 */}
                  <span className={`text-[11px] mt-1 px-2 py-0.5 rounded-full ${selectedDate === item.date ? 'bg-amberRed text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {item.count} 筆
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
              近期尚無待出貨的排程
            </div>
          )}
        </div>
      </div>

      {/* 下半部：日期查詢與時間軸 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* 左側：日期選擇與備料統計 */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
            <label className="block font-bold text-gray-800 mb-3">自訂查詢日期</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amberRed outline-none font-medium text-gray-700" 
            />
          </div>

          <div className="bg-[#FFF8F1] rounded-2xl p-5 md:p-6 shadow-sm border border-[#FFE4C4]">
            <h3 className="font-bold text-[#8B4513] mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
              當日出貨/備料統計
            </h3>
            {dailyOrders.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">本日尚無訂單安排</p>
            ) : (
              <div>
                <div className="flex justify-between items-end border-b border-[#EEDC82] pb-3 mb-3">
                  <span className="text-sm text-gray-600">糖葫蘆總需數量</span>
                  <span className="text-3xl font-bold text-amberRed">{dailyMaterials.totalCandies} <span className="text-sm text-gray-600 font-normal">支</span></span>
                </div>
                <ul className="space-y-3">
                  {Object.entries(dailyMaterials.items).map(([id, item]) => (
                    <li key={id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700 font-medium">{item.name}</span>
                      <span className="font-bold text-gray-900 bg-white px-2 py-1 rounded-md shadow-sm border border-[#EEDC82]/50">x {item.qty}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 右側：當日交貨時間軸 */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-amberRed" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            當日交貨時間軸
          </h3>
          {dailyOrders.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">當日行程空檔，職人可以休息囉！</div>
          ) : (
            <div className="relative border-l-2 border-amberRed/30 ml-2 md:ml-4 space-y-6 md:space-y-8 pb-4">
              {dailyOrders.map((order, idx) => (
                <div key={idx} className="relative pl-5 md:pl-6">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-amberRed"></span>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-amberRed font-bold text-lg mr-2 block md:inline">{order.eventTime || '未定時'}</span>
                        <span className="bg-warmWood/20 text-darkWood text-xs px-2 py-1 rounded-md font-bold">{order.eventType}</span>
                      </div>
                      {order.pdfUrl ? (
                        <a href={order.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-amberRed hover:text-red-800 hover:underline flex items-center gap-1 bg-red-50 px-2 py-1.5 rounded-lg border border-red-100 transition-colors shadow-sm" title="點擊開啟 PDF">
                          #{order.orderNumber}
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">#{order.orderNumber}</span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-800 mb-1">{order.recipientName} ({order.deliveryCity})</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">{order.specificDetails}</p>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm overflow-x-auto">
                      <p className="font-bold text-gray-700 border-b border-gray-100 pb-1 mb-2">出貨明細：</p>
                      <p className="text-gray-600 whitespace-pre-line leading-relaxed">{order.itemsList}</p>
                    </div>
                    {order.notes && <p className="mt-3 text-xs text-red-500 bg-red-50 p-2 rounded-md">⚠️ 備註：{order.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}