// src/components/OrderInquiry.jsx
import React, { useState } from 'react';
import { useScrollFadeIn } from '../hooks/useScrollFadeIn';
import { SCRIPT_URL } from '../constants';

const OrderInquiry = () => {
  useScrollFadeIn();
  
  // === 狀態管理 ===
  const [query, setQuery] = useState({ name: '', phone: '', date: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null); // 搜尋結果列表
  const [selectedOrder, setSelectedOrder] = useState(null); // 目前選中的單筆訂單
  const [statusMsg, setStatusMsg] = useState({ show: false, text: '', type: '' });

  // 輔助函數：顯示提示訊息
  const showStatus = (text, type = 'info') => {
    setStatusMsg({ show: true, text, type });
    if (type !== 'loading') {
      setTimeout(() => setStatusMsg({ show: false, text: '', type: '' }), 3000);
    }
  };

  // 處理查詢
  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResults(null);
    setSelectedOrder(null);
    showStatus('查詢中，請稍候...', 'loading');

    try {
      const params = new URLSearchParams({
        action: 'queryOrder',
        name: query.name,
        phone: query.phone,
        date: query.date
      });

      const response = await fetch(`${SCRIPT_URL}?${params.toString()}`);
      const data = await response.json();

      if (data.status === 'success') {
        if (data.data.length === 0) {
          showStatus('找不到符合的訂單，請確認資料是否正確。', 'error');
        } else if (data.data.length === 1) {
          // 只有一筆，直接顯示細節
          setSelectedOrder(data.data[0]);
          setResults(null);
          setStatusMsg({ show: false, text: '', type: '' });
        } else {
          // 有多筆，顯示列表供選擇
          setResults(data.data);
          setStatusMsg({ show: false, text: '', type: '' });
        }
      } else {
        showStatus('查詢失敗：' + data.message, 'error');
      }
    } catch (error) {
      showStatus('連線發生錯誤，請稍後再試。', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 處理補發郵件請求
  const handleResendEmail = async (orderNumber) => {
    showStatus('補發郵件中...', 'loading');
    try {
      const params = new URLSearchParams({ action: 'resendEmail', orderNumber });
      const response = await fetch(`${SCRIPT_URL}?${params.toString()}`);
      const data = await response.json();
      if (data.status === 'success') showStatus('郵件已重新發送！', 'success');
      else showStatus('發送失敗，請聯繫客服。', 'error');
    } catch (e) {
      showStatus('發送發生錯誤。', 'error');
    }
  };

  return (
    <div className="pt-24 pb-24 min-h-screen fade-in-up">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* 標題區 */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-amberRed mb-4">訂單查詢</h2>
          <p className="text-darkWood/70 font-sans">輸入訂購資訊，隨時掌握您的甜蜜進度。</p>
        </div>

        {/* 提示訊息 */}
        {statusMsg.show && (
          <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-lg text-white font-bold transition-all ${
            statusMsg.type === 'error' ? 'bg-red-500' : statusMsg.type === 'loading' ? 'bg-amberRed' : 'bg-green-600'
          }`}>
            {statusMsg.text}
          </div>
        )}

        {/* 視圖一：搜尋表單 (當沒有結果且沒選中訂單時顯示) */}
        {!results && !selectedOrder && (
          <form onSubmit={handleSearch} className="bg-pureWhite p-8 rounded-[2rem] shadow-xl border border-warmWood/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-bold text-darkWood mb-2">訂購人姓名</label>
                <input type="text" required value={query.name} onChange={e => setQuery({...query, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amberRed outline-none" placeholder="李大明" />
              </div>
              <div>
                <label className="block text-sm font-bold text-darkWood mb-2">手機號碼</label>
                <input type="tel" required value={query.phone} onChange={e => setQuery({...query, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amberRed outline-none" placeholder="0912345678" />
              </div>
              <div>
                <label className="block text-sm font-bold text-darkWood mb-2">活動日期</label>
                <input type="date" required value={query.date} onChange={e => setQuery({...query, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amberRed outline-none" />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-4 bg-amberRed text-white rounded-xl font-bold text-lg hover:bg-darkWood transition-all shadow-md">
              {isLoading ? '查詢中...' : '立即查詢訂單'}
            </button>
          </form>
        )}

        {/* 視圖二：多筆結果列表 */}
        {results && (
          <div className="bg-pureWhite p-8 rounded-[2rem] shadow-xl border border-warmWood/20">
            <h3 className="text-xl font-bold mb-6 text-darkWood">找到多筆訂單，請選擇：</h3>
            <div className="space-y-4">
              {results.map((order, idx) => (
                <div key={idx} onClick={() => { setSelectedOrder(order); setResults(null); }} className="p-4 border border-warmWood/20 rounded-xl hover:bg-creamBg cursor-pointer transition-all flex justify-between items-center group">
                  <div>
                    <div className="font-bold text-amberRed">#{order.orderNumber}</div>
                    <div className="text-sm text-darkWood/60">{order.timestamp}</div>
                  </div>
                  <div className="text-amberRed group-hover:translate-x-1 transition-transform">→</div>
                </div>
              ))}
            </div>
            <button onClick={() => setResults(null)} className="mt-8 text-warmWood font-bold hover:text-amberRed">← 返回重新搜尋</button>
          </div>
        )}

        {/* 視圖三：單筆訂單詳細內容 */}
        {selectedOrder && (
          <div className="bg-pureWhite overflow-hidden rounded-[2rem] shadow-2xl border border-warmWood/20 animate-[fadeIn_0.5s_ease-out]">
            {/* 訂單頭部 */}
            <div className="bg-amberRed p-8 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-amber-200 text-sm tracking-widest uppercase font-bold mb-1">Order Details</p>
                  <h3 className="text-3xl font-serif font-bold">#{selectedOrder.orderNumber}</h3>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-sm">
                  {selectedOrder.status || '已收單'}
                </div>
              </div>
              <p className="text-white/80 text-sm">成立時間：{selectedOrder.timestamp}</p>
            </div>

            {/* 內容詳情 */}
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-darkWood border-l-4 border-warmWood pl-3 mb-4">基本資訊</h4>
                  <ul className="space-y-2 text-sm text-darkWood/80">
                    <li><span className="font-bold">訂購人：</span>{selectedOrder.ordererName}</li>
                    <li><span className="font-bold">活動類型：</span>{selectedOrder.eventType}</li>
                    <li><span className="font-bold">日期時間：</span>{selectedOrder.eventDate} {selectedOrder.eventTime}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-darkWood border-l-4 border-warmWood pl-3 mb-4">配送地點</h4>
                  <p className="text-sm text-darkWood/80 leading-relaxed">{selectedOrder.locationName}<br/>{selectedOrder.address}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-darkWood border-l-4 border-warmWood pl-3 mb-4">訂購明細</h4>
                <div className="bg-creamBg/50 rounded-xl p-4 text-sm text-darkWood/80 whitespace-pre-line leading-loose">
                  {selectedOrder.details}
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <a href={selectedOrder.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-4 bg-darkWood text-white rounded-xl font-bold hover:bg-black transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  下載 PDF 明細
                </a>
                <button onClick={() => handleResendEmail(selectedOrder.orderNumber)} className="flex items-center justify-center gap-2 py-4 border-2 border-warmWood text-warmWood rounded-xl font-bold hover:bg-warmWood hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  重新發送 Email
                </button>
              </div>

              <button onClick={() => setSelectedOrder(null)} className="w-full text-center text-darkWood/40 text-sm hover:text-amberRed transition-colors">← 返回搜尋其他訂單</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderInquiry;