import React from 'react';

export default function AdminModals({
  // 系統提示狀態
  alertMsg, 
  setAlertMsg,
  
  // 改期狀態與事件
  editModal, 
  setEditModal, 
  isUpdating, 
  onUpdateOrderTime,
  
  // 補發 PDF 狀態與事件
  resendModal, 
  setResendModal, 
  isResending, 
  onResendPDF
}) {

  // 💡 顧問優化：解析原始 location 字串，拆分為地點名稱與地址
  // 邏輯：從 "地點：XXX\n地址：YYY" 格式中提取內容
  const parseLocation = (rawStr = '') => {
    const locMatch = rawStr.match(/地點：(.*?)(?:\n|$)/);
    const addrMatch = rawStr.match(/地址：(.*?)(?:\n|$)/);
    
    // 如果字串中包含標籤，則提取內容；若無標籤（舊資料），則將整段視為地點名稱
    return {
      locName: locMatch ? locMatch[1] : (rawStr.includes('地址：') ? '' : rawStr),
      addrValue: addrMatch ? addrMatch[1] : ''
    };
  };

  const { locName, addrValue } = parseLocation(editModal?.location);

  // 💡 顧問優化：當使用者修改拆分欄位時，自動合併為 GAS 標籤格式
  const handleLocationPartChange = (type, value) => {
    let newLocName = type === 'locName' ? value : locName;
    let newAddrValue = type === 'addrValue' ? value : addrValue;
    
    // 合併為標準格式：地點：[內容]\n地址：[內容]
    const formattedLocation = `地點：${newLocName}\n地址：${newAddrValue}`;
    
    setEditModal({
      ...editModal,
      location: formattedLocation
    });
  };

  return (
    <>
      {/* 1. 系統提示 Modal */}
      {alertMsg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-auto shadow-xl transform transition-all animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-lg font-bold text-gray-900 mb-3">系統訊息</h3>
            <div className="text-gray-600 mb-6 whitespace-pre-line text-sm leading-relaxed">
              {Array.isArray(alertMsg) ? alertMsg.join('\n') : alertMsg}
            </div>
            <button 
              onClick={() => setAlertMsg(null)} 
              className="w-full bg-amberRed text-white font-bold py-2.5 rounded-xl hover:bg-red-800 transition-colors"
            >
              確定
            </button>
          </div>
        </div>
      )}

      {/* 2. 修改訂單資訊 Modal (優化版：拆分地址標籤) */}
      {editModal?.isOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-xl font-bold text-gray-900 mb-2 border-b border-gray-100 pb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              修改訂單資訊
            </h3>
            <p className="text-sm text-gray-500 mb-4 mt-3">訂單編號：<span className="font-bold text-gray-800">#{editModal.order?.orderNumber}</span></p>
            
            <div className="space-y-4 mb-6">
              {/* 日期與時間 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">新活動日期</label>
                  <input 
                    type="date" 
                    value={editModal.eventDate} 
                    onChange={e => setEditModal({...editModal, eventDate: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">新活動時間</label>
                  <input 
                    type="time" 
                    value={editModal.eventTime} 
                    onChange={e => setEditModal({...editModal, eventTime: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                  />
                </div>
              </div>

              {/* 🚀 顧問優化：拆分地點名稱 */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">地點名稱 (餐廳/門市/大樓)</label>
                <input 
                  type="text"
                  value={locName} 
                  onChange={e => handleLocationPartChange('locName', e.target.value)} 
                  placeholder="例如：寧夏夜市攤位、某某婚宴會館"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              {/* 🚀 顧問優化：拆分詳細地址 */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">詳細地址</label>
                <input 
                  type="text"
                  value={addrValue} 
                  onChange={e => handleLocationPartChange('addrValue', e.target.value)} 
                  placeholder="例如：臺北市大同區寧夏路..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              {/* 修改備註 */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">修改備註</label>
                <textarea 
                  value={editModal.notes || ''} 
                  onChange={e => setEditModal({...editModal, notes: e.target.value})} 
                  placeholder="請輸入訂單備註 (若無則留白)..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[60px] resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setEditModal({ isOpen: false, order: null, eventDate: '', eventTime: '', location: '', notes: '' })} 
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={onUpdateOrderTime} 
                disabled={isUpdating} 
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isUpdating ? '處理中...' : '確認修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 補發 PDF Modal */}
      {resendModal?.isOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 animate-[fadeIn_0.2s_ease-out]">
            <h3 className="text-xl font-bold text-gray-900 mb-2 border-b border-gray-100 pb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-amberRed" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              補發訂單明細 PDF
            </h3>
            <p className="text-sm text-gray-500 mb-4 mt-3">系統將重新發送訂單 <span className="font-bold text-gray-800">#{resendModal.order?.orderNumber}</span> 的 PDF 明細至客戶信箱。</p>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-400 mb-1">接收人 Email</label>
              <input 
                type="email" 
                value={resendModal.email} 
                onChange={e => setResendModal({...resendModal, email: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amberRed outline-none" 
                placeholder="請輸入電子信箱" 
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setResendModal({ isOpen: false, order: null, email: '' })} 
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={onResendPDF} 
                disabled={isResending} 
                className="flex-1 px-4 py-2.5 bg-amberRed text-white font-bold rounded-xl hover:bg-red-800 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isResending ? '發送中...' : '確認發送'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}