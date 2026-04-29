import React, { useState, useMemo, useRef } from 'react';

export default function OrderTable({ 
  searchTerm, 
  setSearchTerm, 
  filteredOrders, 
  onEditClick, 
  onResendClick 
}) {
  // 🚀 1. 新增狀態過濾：預設為 'pending' (未完成)
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'completed' | 'all'
  
  // 排序狀態
  const [sortConfig, setSortConfig] = useState({ key: 'orderCreation', direction: 'desc' });

  // 🚀 2. 核心邏輯：根據「狀態頁籤」與「排序」計算最終顯示清單
  const finalDisplayOrders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 歸零時間以進行日期比對

    // 首先根據「活動日期」過濾狀態
    let statusItems = filteredOrders.filter(order => {
      if (!order.eventDate) return true;
      const eDate = new Date(order.eventDate.replace(/-/g, '/'));
      eDate.setHours(0, 0, 0, 0);

      if (statusFilter === 'pending') {
        return eDate >= today; // 未完成：今天(含)之後
      } else if (statusFilter === 'completed') {
        return eDate < today; // 已完成：昨天(含)之前
      }
      return true; // 全部
    });

    // 執行排序邏輯
    statusItems.sort((a, b) => {
      let dateA, dateB;
      if (sortConfig.key === 'orderCreation') {
        dateA = new Date(`${a.orderDate} ${a.orderTime || '00:00:00'}`).getTime();
        dateB = new Date(`${b.orderDate} ${b.orderTime || '00:00:00'}`).getTime();
      } else if (sortConfig.key === 'eventDate') {
        const safeDateA = a.eventDate ? a.eventDate.replace(/-/g, '/') : '1970/01/01';
        const safeDateB = b.eventDate ? b.eventDate.replace(/-/g, '/') : '1970/01/01';
        dateA = new Date(`${safeDateA} ${a.eventTime || '00:00'}`).getTime();
        dateB = new Date(`${safeDateB} ${b.eventTime || '00:00'}`).getTime();
      }
      if (dateA < dateB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (dateA > dateB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return statusItems;
  }, [filteredOrders, statusFilter, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="text-gray-300 ml-1">↕</span>;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  // 滑鼠拖曳滾動邏輯
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="w-[96%] max-w-[1600px] mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-bold text-gray-800 font-serif">訂單總覽</h2>
          <p className="text-gray-500 mt-2 text-lg">篩選狀態與排序，搜尋支援姓名、電話與編號</p>
        </div>
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="搜尋姓名、電話、編號..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-amberRed outline-none text-base shadow-sm" 
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </header>

      {/* 🚀 3. 狀態切換頁籤 UI */}
      <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-2xl w-fit border border-gray-200/50 shadow-sm">
        <button 
          onClick={() => setStatusFilter('pending')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === 'pending' ? 'bg-white text-amberRed shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}
        >
          🕒 未完成訂單
        </button>
        <button 
          onClick={() => setStatusFilter('completed')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === 'completed' ? 'bg-white text-emerald-600 shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}
        >
          ✅ 已完成訂單
        </button>
        <button 
          onClick={() => setStatusFilter('all')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === 'all' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-gray-500 hover:text-gray-700'}`}
        >
          📁 全部訂單
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div 
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="overflow-x-auto pb-2 cursor-grab active:cursor-grabbing select-none"
        >
          <table className="w-full text-left text-base text-gray-600 min-w-[1000px]">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-5 font-bold whitespace-nowrap cursor-pointer hover:bg-gray-100" onClick={() => requestSort('orderCreation')}>
                  訂單編號/建立時間 {getSortIcon('orderCreation')}
                </th>
                <th className="px-4 py-5 font-bold whitespace-nowrap cursor-pointer hover:bg-gray-100" onClick={() => requestSort('eventDate')}>
                  活動日期 {getSortIcon('eventDate')}
                </th>
                <th className="px-4 py-5 font-bold whitespace-nowrap">訂購人 / 收件人</th>
                <th className="px-4 py-5 font-bold whitespace-nowrap w-80">配送 / 自取資訊</th>
                <th className="px-4 py-5 font-bold text-right whitespace-nowrap">總金額</th>
                <th className="px-4 py-5 font-bold text-center whitespace-nowrap sticky right-0 bg-gray-50 z-10 shadow-[-4px_0_10px_-3px_rgba(0,0,0,0.05)] border-l border-gray-100">
                  客服操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {finalDisplayOrders.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-16 text-center text-gray-400 text-lg">目前沒有此分類的訂單紀錄</td></tr>
              ) : (
                finalDisplayOrders.map(order => {
                  const isPickup = order.deliveryCity === '自取';
                  let cleanAddress = '';
                  if (order.specificDetails) {
                    const lines = String(order.specificDetails).split('\n');
                    const addrLine = lines.find(l => l.includes('地址：'));
                    cleanAddress = addrLine ? addrLine.replace(/.*地址：/, '').trim() : lines[0].trim();
                  }
                  
                  let addressText = isPickup 
                    ? (cleanAddress && !cleanAddress.includes('需配合商家') ? cleanAddress : '門市自取')
                    : (cleanAddress || '未提供詳細地址');

                  return (
                    <tr key={order.orderNumber} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-5">
                        {(order.pdfUrl || order.pdfDownloadUrl) ? (
                          <a href={order.pdfUrl || order.pdfDownloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-800 hover:underline">
                            #{order.orderNumber}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                          </a>
                        ) : (
                          <div className="font-bold text-gray-900">#{order.orderNumber}</div>
                        )}
                        <div className="text-sm text-gray-400 mt-1">{order.orderDate} {order.orderTime?.substring(0,5)}</div>
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap ${new Date(order.eventDate?.replace(/-/g, '/')) < new Date(new Date().setHours(0,0,0,0)) ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                            {order.eventDate}
                          </span>
                          {order.isModified && (
                            <span className="bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2 py-1 rounded font-bold whitespace-nowrap">已改期</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1.5 font-medium">{order.eventTime || '未定時'}</div>
                      </td>

                      <td className="px-4 py-5">
                        <div className="whitespace-nowrap flex items-center gap-2 mb-1">
                          <span className="text-gray-400 text-xs bg-gray-100 px-1 rounded font-normal">訂</span>
                          <span className="font-bold text-gray-800">{order.ordererName}</span> 
                          <span className="text-gray-500 text-sm">({order.ordererPhone})</span>
                        </div>
                        <div className="whitespace-nowrap flex items-center gap-2">
                          <span className="text-gray-400 text-xs bg-gray-100 px-1 rounded font-normal">收</span>
                          <span className="font-bold text-gray-800">{order.recipientName}</span> 
                          <span className="text-gray-500 text-sm">({order.recipientPhone})</span>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex flex-col items-start gap-2">
                          {isPickup ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg text-sm font-bold whitespace-nowrap">🏪 門市自取</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm font-bold whitespace-nowrap">🚚 專車配送</span>
                          )}
                          <div className="text-sm text-gray-600 leading-relaxed line-clamp-2" title={addressText}>{addressText}</div>
                        </div>
                      </td>

                      <td className="px-4 py-5 text-right font-black text-gray-900 text-xl whitespace-nowrap">
                        NT$ {order.totalPrice?.toLocaleString()}
                      </td>

                      <td className="px-4 py-5 text-center sticky right-0 bg-white group-hover:bg-gray-50 transition-colors z-10 shadow-[-4px_0_10px_-3px_rgba(0,0,0,0.05)] border-l border-gray-50">
                        <div className="flex flex-col xl:flex-row items-center justify-center gap-2">
                          <button onClick={() => onEditClick(order)} className="w-full xl:w-auto px-3 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-bold border border-blue-200 shadow-sm transition-all whitespace-nowrap">修改資訊</button>
                          <button onClick={() => onResendClick(order)} className="w-full xl:w-auto px-3 py-2 bg-white text-amberRed hover:bg-red-50 rounded-xl text-sm font-bold border border-amberRed/30 shadow-sm transition-all whitespace-nowrap">補發 PDF</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}