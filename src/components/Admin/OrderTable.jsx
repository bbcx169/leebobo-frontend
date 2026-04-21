import React from 'react';

export default function OrderTable({ 
  searchTerm, 
  setSearchTerm, 
  filteredOrders, 
  onEditClick, 
  onResendClick 
}) {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">訂單總覽</h2>
          <p className="text-gray-500 mt-1 text-sm md:text-base">搜尋歷史訂單與重發明細</p>
        </div>
        <div className="relative w-full md:w-72">
          <input 
            type="text" 
            placeholder="搜尋姓名、電話、訂單編號..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-amberRed outline-none text-sm shadow-sm" 
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-4 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-sm text-gray-600 min-w-[800px]">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-6 py-4 font-bold whitespace-nowrap">訂單編號/時間</th>
                <th className="px-6 py-4 font-bold whitespace-nowrap">活動日期</th>
                <th className="px-6 py-4 font-bold whitespace-nowrap">訂購人/收件人</th>
                <th className="px-6 py-4 font-bold text-right whitespace-nowrap">總金額</th>
                <th className="px-6 py-4 font-bold text-center whitespace-nowrap">客服操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">找不到符合條件的訂單</td></tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.orderNumber} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {order.pdfUrl ? (
                        <a href={order.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-amberRed hover:text-red-800 hover:underline">
                          #{order.orderNumber}
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        </a>
                      ) : (
                        <div className="font-medium text-gray-900">#{order.orderNumber}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">{order.orderDate}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap ${new Date(order.eventDate) < new Date(new Date().setHours(0,0,0,0)) ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                        {order.eventDate}
                      </span>
                      <div className="text-xs text-gray-500 mt-1 font-medium">{order.eventTime || '未定時'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="whitespace-nowrap"><span className="text-gray-400 text-xs mr-1">訂</span>{order.ordererName}</div>
                      <div className="mt-1 whitespace-nowrap"><span className="text-gray-400 text-xs mr-1">收</span>{order.recipientName} ({order.deliveryCity})</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 whitespace-nowrap">
                      NT$ {order.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => onEditClick(order)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold border border-blue-200 transition-colors">
                          改期
                        </button>
                        <button onClick={() => onResendClick(order)} className="px-3 py-1.5 bg-warmWood/10 text-[#8B4513] hover:bg-warmWood/20 rounded-lg text-xs font-bold border border-warmWood/30 transition-colors">
                          補發
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}