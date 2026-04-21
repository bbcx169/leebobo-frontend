import React from 'react';

export default function AdminModals({
  alertMsg, setAlertMsg,
  editModal, setEditModal, isUpdating, onUpdateOrderTime,
  resendModal, setResendModal, isResending, onResendPDF
}) {
  return (
    <>
      {/* 系統提示 Modal */}
      {alertMsg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-3">系統訊息</h3>
            <p className="text-gray-600 mb-6 whitespace-pre-line">{alertMsg}</p>
            <button onClick={() => setAlertMsg(null)} className="w-full bg-amberRed text-white font-bold py-2.5 rounded-xl hover:bg-red-800">確定</button>
          </div>
        </div>
      )}

      {/* 修改交貨時間 Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2 border-b border-gray-100 pb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              修改交貨時間
            </h3>
            <p className="text-sm text-gray-500 mb-4 mt-3">訂單編號：<span className="font-bold text-gray-800">#{editModal.order.orderNumber}</span></p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">新活動日期</label>
                <input type="date" value={editModal.eventDate} onChange={e => setEditModal({...editModal, eventDate: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">新活動時間</label>
                <input type="time" value={editModal.eventTime} onChange={e => setEditModal({...editModal, eventTime: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditModal({ isOpen: false, order: null })} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl">取消</button>
              <button onClick={onUpdateOrderTime} disabled={isUpdating} className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50">
                {isUpdating ? '處理中...' : '確認修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 補發 PDF Modal */}
      {resendModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2 border-b border-gray-100 pb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-amberRed" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              補發訂單明細
            </h3>
            <p className="text-sm text-gray-500 mb-4 mt-3">發送至：<span className="font-bold text-gray-800">#{resendModal.order.orderNumber}</span></p>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-1">接收人 Email</label>
              <input type="email" value={resendModal.email} onChange={e => setResendModal({...resendModal, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setResendModal({ isOpen: false, order: null })} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl">取消</button>
              <button onClick={onResendPDF} disabled={isResending} className="flex-1 px-4 py-2.5 bg-amberRed text-white font-bold rounded-xl disabled:opacity-50">
                {isResending ? '發送中...' : '確認發送'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}