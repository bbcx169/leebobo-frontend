import React, { useMemo } from 'react';

export default function DashboardStats({ 
  orders, 
  selectedDate, 
  setSelectedDate, 
  dailyOrders, 
  dailyMaterials 
}) {

  // 🚀 新增邏輯：計算「待交貨訂單總數」(大於等於今日的訂單)
  const pendingOrdersCount = useMemo(() => {
    if (!orders || orders.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 將時間歸零以比對日期

    return orders.filter(o => {
      if (!o.eventDate) return false;
      const eDate = new Date(o.eventDate.replace(/-/g, '/'));
      eDate.setHours(0, 0, 0, 0);
      return eDate >= today;
    }).length;
  }, [orders]);

  // 🚀 新增邏輯：動態計算離今日(含)最近的 5 個有訂單的日期
  const upcomingDates = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. 統計每一天的訂單數量 (僅限今日及未來的日期)
    const dateCounts = {};
    orders.forEach(o => {
      if (!o.eventDate) return;
      const eDate = new Date(o.eventDate.replace(/-/g, '/'));
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
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">排程與備料看板</h2>
        <p className="text-gray-500 mt-2 text-base md:text-lg">以「活動出貨日」為核心的任務追蹤</p>
      </header>

      {/* 頂部統計卡片區 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* 🚀 更新：待交貨訂單總數 (字體加大) */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <p className="text-gray-500 text-base md:text-lg font-bold mb-2">待交貨訂單總數</p>
          <p className="text-5xl md:text-6xl font-black text-gray-800">
            {pendingOrdersCount} <span className="text-lg font-normal text-gray-400">筆</span>
          </p>
        </div>

        {/* 近期排程快選 */}
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 md:col-span-2 flex flex-col justify-center">
          <p className="text-gray-700 text-base md:text-lg font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-amberRed" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            近期排程快選
          </p>
          
          {upcomingDates.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
              {upcomingDates.map(item => (
                <button
                  key={item.date}
                  onClick={() => setSelectedDate(item.date)} 
                  className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-all duration-300 ${
                    selectedDate === item.date 
                      ? 'bg-amberRed/10 border-amberRed text-amberRed shadow-sm scale-105' 
                      : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className="text-base md:text-lg font-bold block">{item.date.slice(5)}</span> 
                  <span className={`text-sm mt-1 px-3 py-1 rounded-full font-bold ${selectedDate === item.date ? 'bg-amberRed text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {item.count} 筆
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-base bg-gray-50 rounded-xl border border-dashed border-gray-200">
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
            <label className="block text-lg font-bold text-gray-800 mb-3">自訂查詢日期</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amberRed outline-none font-bold text-gray-700 text-lg" 
            />
          </div>

          <div className="bg-[#FFF8F1] rounded-2xl p-5 md:p-6 shadow-sm border border-[#FFE4C4]">
            <h3 className="text-xl font-bold text-[#8B4513] mb-5 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
              當日出貨/備料統計
            </h3>
            {dailyOrders.length === 0 ? (
              <p className="text-gray-400 text-base text-center py-4">本日尚無訂單安排</p>
            ) : (
              <div>
                {/* 🚀 糖葫蘆總需數量 */}
                <div className="flex justify-between items-end border-b border-[#EEDC82] pb-3 mb-3">
                  <span className="text-base font-bold text-gray-700">糖葫蘆總需數量</span>
                  <span className="text-4xl font-black text-amberRed">{dailyMaterials.totalCandies} <span className="text-base text-gray-600 font-normal">支</span></span>
                </div>
                
                {/* 🚀 新增：掃帚總需數量 */}
                <div className="flex justify-between items-end border-b border-[#EEDC82] pb-4 mb-4">
                  <span className="text-base font-bold text-gray-700">掃帚總需數量</span>
                  <span className="text-4xl font-black text-blue-600">{dailyMaterials.items['5']?.qty || 0} <span className="text-base text-gray-600 font-normal">組</span></span>
                </div>

                <ul className="space-y-3">
                  {Object.entries(dailyMaterials.items)
                    .filter(([id]) => id !== '5') // 隱藏清單中的掃帚(ID:5)，因為上面已經獨立顯示
                    .map(([id, item]) => (
                    <li key={id} className="flex justify-between items-center text-base">
                      <span className="text-gray-800 font-bold">{item.name}</span>
                      <span className="font-black text-gray-900 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-[#EEDC82]/50 text-lg">x {item.qty}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 右側：當日交貨時間軸 */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-amberRed" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            當日交貨時間軸
          </h3>
          {dailyOrders.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-lg">當日行程空檔，職人可以休息囉！</div>
          ) : (
            <div className="relative border-l-4 border-amberRed/30 ml-3 md:ml-5 space-y-8 pb-6">
              {dailyOrders.map((order, idx) => {
                // 🚀 判斷是否為門市自取
                const isPickup = order.deliveryCity === '自取' || order.eventType === '自取';

                return (
                  <div key={idx} className="relative pl-6 md:pl-8">
                    <span className="absolute -left-[14px] top-1 w-6 h-6 rounded-full bg-white border-4 border-amberRed shadow-sm"></span>
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:shadow-md hover:border-amberRed/30 transition-all">
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                        <div className="flex flex-col items-start gap-2">
                          <span className="text-amberRed font-black text-2xl tracking-wide">{order.eventTime || '未定時'}</span>
                          {/* 🚀 新增：自取/配送標籤 */}
                          {isPickup ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-sm font-bold">🏪 門市自取</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-sm font-bold">🚚 專車配送</span>
                          )}
                        </div>
                        
                        {/* 🚀 修正：點擊訂單編號開啟 PDF */}
                        {order.pdfDownloadUrl ? (
                          <a href={order.pdfDownloadUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-amberRed hover:text-red-800 hover:underline flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg border border-red-100 shadow-sm transition-colors" title="點擊開啟 PDF">
                            #{order.orderNumber}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                          </a>
                        ) : (
                          <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-2 rounded-lg">#{order.orderNumber}</span>
                        )}
                      </div>
                      
                      {/* 🚀 新增：訂購人與收件人資訊 */}
                      <div className="bg-white p-4 rounded-xl border border-gray-200 text-base mb-4 shadow-sm space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded font-bold">訂購人</span>
                          <span className="font-bold text-gray-900 text-lg">{order.ordererName}</span>
                          <span className="text-gray-600 font-medium">({order.ordererPhone})</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded font-bold">{isPickup ? '取貨人' : '收貨人'}</span>
                          <span className="font-bold text-gray-900 text-lg">{order.recipientName}</span>
                          <span className="text-gray-600 font-medium">({order.recipientPhone})</span>
                        </div>
                      </div>

                      {/* 地點資訊 */}
                      <div className="mb-4">
                        <h4 className="font-bold text-gray-800 text-lg mb-1 flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                          {order.deliveryCity}
                        </h4>
                        <p className="text-base text-gray-600 bg-gray-100 p-3 rounded-lg">{order.specificDetails || '未提供詳細地點'}</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-xl border border-gray-200 text-base shadow-sm">
                        <p className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-3 text-lg">📦 出貨明細：</p>
                        <p className="text-gray-700 font-medium whitespace-pre-line leading-loose text-base">{order.itemsList}</p>
                        
                        {/* 🚀 新增：突顯租借掃帚 */}
                        {order.cart && order.cart['5'] > 0 && (
                          <div className="mt-4 inline-block bg-blue-50 text-blue-700 font-bold px-4 py-2 rounded-lg border border-blue-200 text-base shadow-sm">
                            🧹 包含租借掃帚 {order.cart['5']} 組
                          </div>
                        )}
                      </div>
                      
                      {order.notes && (
                        <p className="mt-4 text-base font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 shadow-sm flex items-start gap-2">
                          <span className="text-xl">⚠️</span> 
                          <span>備註：{order.notes}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}