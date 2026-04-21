import React from 'react';

export default function DashboardStats({ 
  orders, 
  urgentOrders, 
  selectedDate, 
  setSelectedDate, 
  dailyOrders, 
  dailyMaterials 
}) {
  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-[fadeIn_0.3s_ease-out]">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">排程與備料看板</h2>
        <p className="text-gray-500 mt-1 text-sm md:text-base">以「活動出貨日」為核心的任務追蹤</p>
      </header>

      {/* 數據卡片區 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-gray-500 text-sm font-medium mb-1">系統總訂單數</p>
          <p className="text-3xl md:text-4xl font-bold text-gray-800">{orders.length} <span className="text-sm font-normal text-gray-400">筆</span></p>
        </div>
        <div className="bg-red-50 rounded-2xl p-5 md:p-6 shadow-sm border border-red-100 md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500">
            <svg className="w-16 h-16 md:w-24 md:h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/></svg>
          </div>
          <p className="text-red-600 text-sm font-bold mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> 效期急單警示 (未來 3 天內)
          </p>
          <p className="text-3xl md:text-4xl font-bold text-red-700 mb-3">{urgentOrders.length} <span className="text-sm font-normal text-red-500">筆待出貨</span></p>
          {urgentOrders.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {urgentOrders.map(o => (
                <div key={o.orderNumber} className="bg-white/60 px-3 py-2 rounded-lg shrink-0 border border-red-200/50 text-xs snap-start min-w-[140px] flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-gray-800 block">{o.eventDate} {o.eventTime}</span>
                    <span className="text-gray-600 truncate block">{o.recipientName} ({o.deliveryCity})</span>
                  </div>
                  <div className="mt-2 border-t border-red-100/50 pt-2">
                    {o.pdfUrl && (
                      <a href={o.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-amberRed hover:text-red-800 hover:underline">
                        #{o.orderNumber}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-400">目前沒有即遇到期的急單。</p>
          )}
        </div>
      </div>

      {/* 備料與行程區 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
            <label className="block font-bold text-gray-800 mb-3">選擇查詢日期</label>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amberRed outline-none font-medium" />
          </div>
          <div className="bg-[#FFF8F1] rounded-2xl p-5 md:p-6 shadow-sm border border-[#FFE4C4]">
            <h3 className="font-bold text-[#8B4513] mb-4 flex items-center gap-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>當日出貨/備料統計</h3>
            {dailyOrders.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">本日尚無訂單安排</p>
            ) : (
              <div>
                <div className="flex justify-between items-end border-b border-[#EEDC82] pb-3 mb-3">
                  <span className="text-sm text-gray-600">糖葫蘆總需數量</span>
                  <span className="text-2xl font-bold text-amberRed">{dailyMaterials.totalCandies} <span className="text-sm text-gray-600 font-normal">支</span></span>
                </div>
                <ul className="space-y-3">
                  {Object.entries(dailyMaterials.items).map(([id, item]) => (
                    <li key={id} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="font-bold text-gray-900 bg-white px-2 py-1 rounded-md shadow-sm border border-[#EEDC82]/50">x {item.qty}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><svg className="w-5 h-5 text-amberRed" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>當日交貨時間軸</h3>
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
                        <span className="bg-warmWood/20 text-warmWood text-xs px-2 py-1 rounded-md font-bold">{order.eventType}</span>
                      </div>
                      {order.pdfUrl && (
                        <a href={order.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-amberRed hover:text-red-800 hover:underline flex items-center gap-1 bg-red-50 px-2 py-1.5 rounded-lg border border-red-100 transition-colors shadow-sm">
                          #{order.orderNumber}
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </a>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-800 mb-1">{order.recipientName} ({order.deliveryCity})</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">{order.specificDetails}</p>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-sm overflow-x-auto">
                      <p className="font-bold text-gray-700 border-b border-gray-100 pb-1 mb-2">出貨明細：</p>
                      <p className="text-gray-600 whitespace-pre-line leading-relaxed">{order.itemsList}</p>
                    </div>
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