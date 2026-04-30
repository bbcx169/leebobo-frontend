import React, { useMemo, useState, useEffect } from 'react';

export default function DashboardStats({ 
  orders, 
  selectedDate, 
  setSelectedDate, 
  dailyOrders, 
  dailyMaterials 
}) {

  const [isInitialDateSet, setIsInitialDateSet] = useState(false);

  const pendingOrdersCount = useMemo(() => {
    if (!orders || orders.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    return orders.filter(o => {
      if (!o.eventDate) return false;
      const eDate = new Date(o.eventDate.replace(/-/g, '/'));
      eDate.setHours(0, 0, 0, 0);
      return eDate >= today;
    }).length;
  }, [orders]);

  const upcomingDates = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateCounts = {};
    orders.forEach(o => {
      if (!o.eventDate) return;
      const eDate = new Date(o.eventDate.replace(/-/g, '/'));
      eDate.setHours(0, 0, 0, 0);
      
      if (eDate >= today) {
        dateCounts[o.eventDate] = (dateCounts[o.eventDate] || 0) + 1;
      }
    });

    const sortedDates = Object.keys(dateCounts).sort((a, b) => new Date(a) - new Date(b));
    
    return sortedDates.slice(0, 5).map(dateStr => ({
      date: dateStr,
      count: dateCounts[dateStr]
    }));
  }, [orders]);

  useEffect(() => {
    if (!isInitialDateSet && upcomingDates.length > 0) {
      setSelectedDate(upcomingDates[0].date);
      setIsInitialDateSet(true);
    }
  }, [upcomingDates, isInitialDateSet, setSelectedDate]);

  return (
    <>
      {/* 🚀 注入列印專屬魔法 CSS：A4 左右二等份排版與外層限制解除 */}
      <style type="text/css" media="print">
        {`
          @page {
            size: A4 portrait;
            margin: 8mm; /* 窄邊距確保左右並排空間充足 */
          }
          html, body, #root {
            height: auto !important;
            overflow: visible !important;
            background-color: white !important;
          }
          /* 核心修復：解除捲軸與高度限制，防止底部內容裁切 */
          .overflow-y-auto, .h-screen, .h-full, .max-h-screen {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
          }
          /* 隱藏不必要元素 */
          nav, aside, header, .fixed, .sticky {
            display: none !important;
          }
        `}
      </style>

      {/* 網頁主容器 */}
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-[fadeIn_0.3s_ease-out] print:space-y-0 print:max-w-full print:m-0 print:p-0">
        
        {/* 網頁標題 - 列印時隱藏 */}
        <header className="print:hidden">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">排程備料看板</h2>
          <p className="text-gray-500 mt-2 text-base md:text-lg">以「活動出貨日」為核心的任務追蹤</p>
        </header>

        {/* 頂部統計卡片區 - 列印時隱藏 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 print:hidden">
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <p className="text-gray-500 text-base md:text-lg font-bold mb-2">待交貨訂單總數</p>
            <p className="text-5xl md:text-6xl font-black text-gray-800">
              {pendingOrdersCount} <span className="text-lg font-normal text-gray-400">筆</span>
            </p>
          </div>

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 print:block print:gap-0">
          
          {/* 左側：日期選擇與備料統計 - 列印時完全隱藏 */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6 print:hidden">
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
                  <div className="flex justify-between items-end border-b border-[#EEDC82] pb-3 mb-3">
                    <span className="text-base font-bold text-gray-700">糖葫蘆總需數量</span>
                    <span className="text-4xl font-black text-amberRed">{dailyMaterials.totalCandies} <span className="text-base text-gray-600 font-normal">支</span></span>
                  </div>
                  
                  <div className="flex justify-between items-end border-b border-[#EEDC82] pb-4 mb-4">
                    <span className="text-base font-bold text-gray-700">掃帚總需數量</span>
                    <span className="text-4xl font-black text-blue-600">{dailyMaterials.items['5']?.qty || 0} <span className="text-base text-gray-600 font-normal">組</span></span>
                  </div>

                  <ul className="space-y-3">
                    {Object.entries(dailyMaterials.items)
                      .filter(([id]) => id !== '5')
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

          {/* 右側：當日交貨時間軸 (列印模式核心) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 print:p-0 print:border-none print:shadow-none print:w-full">
            
            <div className="flex justify-between items-center mb-6 print:hidden">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-amberRed" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>當日交貨時間軸</span>
              </h3>
              
              {dailyOrders.length > 0 && (
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amberRed text-white rounded-xl font-bold hover:bg-red-800 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                  列印出貨單
                </button>
              )}
            </div>

            {dailyOrders.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-lg print:hidden">當日行程空檔，職人可以休息囉！</div>
            ) : (
              // 🚀 關鍵：print:grid-cols-2 實現左右並排
              <div className="relative border-l-4 border-amberRed/30 ml-3 md:ml-5 space-y-8 pb-6 print:border-none print:ml-0 print:space-y-0 print:grid print:grid-cols-2 print:gap-6 print:pb-0">
                {dailyOrders.map((order, idx) => {
                  const isPickup = order.deliveryCity === '自取' || order.eventType === '自取';

                  return (
                    <div key={idx} className="relative pl-6 md:pl-8 print:pl-0 print:break-inside-avoid">
                      <span className="absolute -left-[14px] top-1 w-6 h-6 rounded-full bg-white border-4 border-amberRed shadow-sm print:hidden"></span>
                      
                      {/* 訂單卡片： 
                          列印版使用 print:flex-col 與 min-h-[92vh] 來確保 A4 佈局
                      */}
                      <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 hover:shadow-md transition-all 
                                      print:bg-white print:border-2 print:border-dashed print:border-gray-500 print:shadow-none print:rounded-none 
                                      print:p-5 print:min-h-[92vh] print:flex print:flex-col">
                        
                        {/* 專屬出貨單表頭 */}
                        <div className="hidden print:block text-center text-xl font-bold text-gray-800 border-b-2 border-black pb-2 mb-4 tracking-widest">
                          {selectedDate} 出貨單
                        </div>

                        {/* 時間與單號 - 固定的基礎高度 */}
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 print:flex-row print:justify-between print:border-b print:border-gray-300 print:pb-3 print:mb-3">
                          <div className="flex flex-col items-start gap-2">
                            <span className="text-amberRed font-black text-2xl tracking-wide print:text-black print:text-2xl">{order.eventTime || '未定時'}</span>
                            {isPickup ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-sm font-bold print:bg-transparent print:border-gray-500 print:text-black print:text-sm print:px-2 print:py-0">🏪 門市自取</span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-sm font-bold print:bg-transparent print:border-gray-500 print:text-black print:text-sm print:px-2 print:py-0">🚚 專車配送</span>
                            )}
                          </div>
                          
                          <div className="print:hidden">
                            {(order.pdfUrl || order.pdfDownloadUrl) ? (
                              <a href={order.pdfUrl || order.pdfDownloadUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-amberRed hover:text-red-800 hover:underline flex items-center gap-1.5 bg-red-50 px-3 py-2 rounded-lg border border-red-100 shadow-sm transition-colors" title="點擊開啟 PDF">
                                #{order.orderNumber}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                              </a>
                            ) : (
                              <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-2 rounded-lg">#{order.orderNumber}</span>
                            )}
                          </div>
                          <div className="hidden print:block text-base font-bold text-gray-600 mt-1">
                            單號：#{order.orderNumber}
                          </div>
                        </div>
                        
                        {/* 聯絡人資訊 - 固定的基礎高度 */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 text-base mb-4 shadow-sm space-y-2 print:border-none print:shadow-none print:p-0 print:mb-4 print:space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded font-bold print:bg-transparent print:text-gray-800 print:text-base print:p-0">訂購人：</span>
                            <span className="font-bold text-gray-900 text-lg print:text-lg">{order.ordererName}</span>
                            <span className="text-gray-600 font-medium print:text-gray-800 print:text-base">({order.ordererPhone})</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded font-bold print:bg-transparent print:text-gray-800 print:text-base print:p-0">{isPickup ? '取貨人：' : '收件人：'}</span>
                            <span className="font-bold text-gray-900 text-lg print:text-lg">{order.recipientName}</span>
                            <span className="text-gray-600 font-medium print:text-gray-800 print:text-base">({order.recipientPhone})</span>
                          </div>
                        </div>

                        {/* 🚀 地點資訊區塊 - 獲得 1 份權重分配 (print:flex-0.5) */}
                        <div className="mb-4 print:mb-4 print:flex-0.5 print:min-h-0">
                          <h4 className="font-bold text-gray-800 text-lg mb-1 flex items-center gap-2 print:text-base print:mb-1">
                            <svg className="w-5 h-5 text-gray-400 print:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span className="hidden print:inline mr-1">📍地點：</span>{order.deliveryCity}
                          </h4>
                          <p className="text-base text-gray-600 bg-gray-100 p-3 rounded-lg print:bg-transparent print:p-0 print:text-black print:text-base">{order.specificDetails || '未提供詳細地點'}</p>
                        </div>
                        
                        {/* 🚀 出貨明細區塊 - 佔比調整為 2.5 倍權重 (print:flex-[3]) */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 text-base shadow-sm print:border-t-2 print:border-gray-800 print:rounded-none print:shadow-none print:p-3 print:mt-2 print:flex-[3] print:min-h-0">
                          <p className="font-bold text-gray-800 border-b border-gray-100 pb-2 mb-3 text-lg print:border-b-2 print:border-gray-800 print:text-lg print:pb-2 print:mb-3">📦 出貨明細：</p>
                          <p className="text-gray-700 font-medium whitespace-pre-line leading-loose text-base print:text-black print:text-base print:leading-relaxed">{order.itemsList}</p>
                          
                          {order.cart && order.cart['5'] > 0 && (
                            <div className="mt-4 inline-block bg-blue-50 text-blue-700 font-bold px-4 py-2 rounded-lg border border-blue-200 text-base shadow-sm print:bg-transparent print:border-2 print:border-black print:text-black print:text-base print:mt-4 print:px-3 print:py-1">
                              🧹 包含租借掃帚 {order.cart['5']} 組
                            </div>
                          )}
                        </div>
                        
                        {/* 🚀 備註區塊 - 獲得 1 份權重分配 (print:flex-1) 並加入自動換行撐開 */}
                        {order.notes && (
                          <div className="mt-4 text-base font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 shadow-sm flex items-start gap-2 print:bg-transparent print:border-dashed print:border-2 print:border-black print:text-black print:text-base print:p-3 print:mt-4 print:flex-1 print:min-h-0">
                            <span className="text-xl print:hidden">⚠️</span> 
                            <span>備註：{order.notes}</span>
                          </div>
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
    </>
  );
}