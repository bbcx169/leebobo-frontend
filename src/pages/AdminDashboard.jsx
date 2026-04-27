import React, { useState, useEffect, useMemo } from 'react';
import liff from '@line/liff';

// 🚀 引入展示元件
import DashboardStats from '../components/Admin/DashboardStats';
import OrderTable from '../components/Admin/OrderTable';
import AdminModals from '../components/Admin/AdminModals';

// ==========================================
// 全域常數設定
// ==========================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzf8kJ6Ka8yGabg--MCRJ8eyucBbsGRDbceGEeH-CQDLqOMXhTCysZVrPKL0MLpSg4L/exec';
const LIFF_ID = '2009807397-WPVPBokl';

const productMapping = {
  1: "蕃茄 (小/喜糖)", 2: "蕃茄蜜餞 (小/喜糖)", 3: "鳥梨 (小/喜糖)", 4: "蕃茄+鳥梨 (小/喜糖)",
  5: "承租掃帚", 6: "蕃茄 (經典)", 7: "蕃茄蜜餞 (經典)", 8: "鳥梨 (經典)"
};

export default function AdminDashboard() {
  // ==========================================
  // 1. 核心狀態管理
  // ==========================================
  const [authStatus, setAuthStatus] = useState('checking'); // checking, unauth, unauthorized_user, logged_in
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 🚀 導覽列伸縮狀態 (預設關閉，僅顯示圖示)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [settings, setSettings] = useState({ reminderEnabled: true, reminderTime: '11:00' });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  
  const [resendModal, setResendModal] = useState({ isOpen: false, order: null, email: '' });
  const [isResending, setIsResending] = useState(false);

  // 🚀 修改訂單狀態：擴充 notes 欄位
  const [editModal, setEditModal] = useState({ 
    isOpen: false, 
    order: null, 
    eventDate: '', 
    eventTime: '', 
    location: '',
    notes: '' 
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ==========================================
  // 2. API 呼叫與資料獲取
  // ==========================================
  const callGasApi = async (payload) => {
    try {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message || '處理失敗');
      return result;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  };

  useEffect(() => {
    async function initializeLiff() {
      try {
        await liff.init({ liffId: LIFF_ID });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          const res = await fetch(`${SCRIPT_URL}?action=verify_admin&userId=${profile.userId}`);
          const data = await res.json();
          if (data.status === 'success' && data.isAdmin) {
            setUserProfile(profile);
            setAuthStatus('logged_in');
            fetchOrders(); 
            fetchSettings(); 
          } else {
            setAuthStatus('unauthorized_user');
          }
        } else {
          setAuthStatus('unauth');
        }
      } catch (err) {
        setAuthStatus('unauth');
      }
    }
    initializeLiff();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${SCRIPT_URL}?action=get_all_orders`);
      const data = await res.json();
      if (data.status === 'success') setOrders(data.data);
    } catch (err) {
      setAlertMsg("無法取得訂單資料，請檢查網路連線");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${SCRIPT_URL}?action=get_settings`);
      const data = await res.json();
      if (data.status === 'success') setSettings(data.data);
    } catch (err) {}
  };

  const handleLogin = () => liff.login({ redirectUri: window.location.href });
  const handleLogout = () => { liff.logout(); window.location.reload(); };

  // 🚀 更新：處理包含「備註」的訂單更新請求
  const handleUpdateOrderTime = async () => {
    if (!editModal.eventDate || !editModal.eventTime) return alert("請填寫日期與時間");
    setIsUpdating(true);
    try {
      await callGasApi({ 
        action: 'update_order_time', 
        orderNumber: editModal.order.orderNumber, 
        newDate: editModal.eventDate, 
        newTime: editModal.eventTime,
        newDetails: editModal.location,
        newNotes: editModal.notes // 傳送新備註
      });
      setAlertMsg("✅ 訂單與 PDF 已成功更新！");
      setEditModal({ isOpen: false, order: null, eventDate: '', eventTime: '', location: '', notes: '' });
      fetchOrders();
    } catch (err) {
      setAlertMsg("❌ 更新失敗：" + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResendPDF = async () => {
    if (!resendModal.email) return alert("請輸入 Email");
    setIsResending(true);
    try {
      await callGasApi({ action: 'resendPdf', orderNumber: resendModal.order.orderNumber, email: resendModal.email });
      setAlertMsg(`✅ 已補發至 ${resendModal.email}`);
      setResendModal({ isOpen: false, order: null, email: '' });
    } catch (err) {
      setAlertMsg("❌ 補發失敗");
    } finally {
      setIsResending(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await callGasApi({ action: 'save_settings', ...settings });
      setAlertMsg("✅ 系統設定已更新！");
    } catch (err) {
      setAlertMsg("❌ 儲存失敗");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // ==========================================
  // 3. 資料處理邏輯
  // ==========================================
  const { dailyOrders, dailyMaterials } = useMemo(() => {
    const dOrders = orders.filter(o => o.eventDate === selectedDate).sort((a, b) => a.eventTime.localeCompare(b.eventTime));
    const materials = {}; let totalCandies = 0;
    dOrders.forEach(order => {
      if (!order.cart) return;
      Object.entries(order.cart).forEach(([id, qty]) => {
        const pid = parseInt(id);
        if (!materials[pid]) materials[pid] = { name: productMapping[pid] || `商品(${pid})`, qty: 0 };
        materials[pid].qty += qty; if (pid !== 5) totalCandies += qty; 
      });
    });
    return { dailyOrders: dOrders, dailyMaterials: { items: materials, totalCandies } };
  }, [orders, selectedDate]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const t = searchTerm.toLowerCase();
    return orders.filter(o => o.orderNumber?.toLowerCase().includes(t) || o.ordererName?.toLowerCase().includes(t) || o.ordererPhone?.includes(t));
  }, [orders, searchTerm]);

  // ==========================================
  // 4. 權限渲染判斷
  // ==========================================
  if (authStatus === 'checking') return <div className="h-screen flex items-center justify-center bg-gray-50 text-2xl font-bold">驗證中...</div>;
  
  if (authStatus === 'unauth') return (
    <div className="h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-amberRed mb-8 tracking-widest">李伯伯管理後台</h1>
        <button onClick={handleLogin} className="w-full bg-[#06C755] text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-lg hover:scale-105 transition-transform">
          LINE 管理員登入
        </button>
      </div>
    </div>
  );

  if (authStatus === 'unauthorized_user') return <div className="h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold text-2xl">抱歉，您沒有管理員權限。</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 text-darkWood">
      
      {/* 🚀 伸縮式側邊導覽列 */}
      <aside className={`fixed md:static inset-y-0 left-0 bg-white shadow-xl z-50 flex flex-col transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'w-64' : 'w-20'} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* 頂部 Logo 與 切換按鈕 */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between overflow-hidden">
           {isSidebarExpanded ? (
             <h1 className="text-2xl font-bold text-amberRed tracking-widest whitespace-nowrap">李伯伯</h1>
           ) : (
             <span className="text-2xl font-bold text-amberRed mx-auto">李</span>
           )}
           <button 
             onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
             className="hidden md:flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-full transition-colors"
           >
             <svg className={`w-5 h-5 text-gray-400 transition-transform ${isSidebarExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
             </svg>
           </button>
        </div>
        
        {/* 使用者資訊 */}
        <div className={`px-4 py-6 bg-gray-50 border-b border-gray-100 flex items-center transition-all ${isSidebarExpanded ? 'gap-4' : 'justify-center'}`}>
          {userProfile?.pictureUrl && <img src={userProfile.pictureUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0"/>}
          {isSidebarExpanded && (
            <div className="overflow-hidden">
              <p className="text-lg font-bold text-gray-800 truncate">{userProfile?.displayName}</p>
              <p className="text-xs text-green-600 font-bold whitespace-nowrap">● 管理中</p>
            </div>
          )}
        </div>

        {/* 功能選單 */}
        <nav className="flex-1 p-3 space-y-2 overflow-x-hidden">
          <button 
            onClick={() => {setActiveTab('dashboard'); setIsMobileMenuOpen(false);}} 
            className={`w-full flex items-center px-4 py-4 rounded-2xl text-xl transition-all ${activeTab === 'dashboard' ? 'bg-amberRed/10 text-amberRed font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'} ${!isSidebarExpanded ? 'justify-center' : ''}`}
            title="排程與備料"
          >
            <span className="flex-shrink-0">📊</span>
            {isSidebarExpanded && <span className="ml-4 whitespace-nowrap">排程與備料</span>}
          </button>
          
          <button 
            onClick={() => {setActiveTab('orders'); setIsMobileMenuOpen(false);}} 
            className={`w-full flex items-center px-4 py-4 rounded-2xl text-xl transition-all ${activeTab === 'orders' ? 'bg-amberRed/10 text-amberRed font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'} ${!isSidebarExpanded ? 'justify-center' : ''}`}
            title="訂單總覽"
          >
            <span className="flex-shrink-0">📋</span>
            {isSidebarExpanded && <span className="ml-4 whitespace-nowrap">訂單總覽</span>}
          </button>
          
          <button 
            onClick={() => {setActiveTab('settings'); setIsMobileMenuOpen(false);}} 
            className={`w-full flex items-center px-4 py-4 rounded-2xl text-xl transition-all ${activeTab === 'settings' ? 'bg-amberRed/10 text-amberRed font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'} ${!isSidebarExpanded ? 'justify-center' : ''}`}
            title="系統設定"
          >
            <span className="flex-shrink-0">⚙️</span>
            {isSidebarExpanded && <span className="ml-4 whitespace-nowrap">系統設定</span>}
          </button>
        </nav>
        
        {/* 登出按鈕 */}
        <div className="p-3 border-t border-gray-100">
          <button 
            onClick={handleLogout} 
            className={`w-full py-3 flex items-center justify-center text-lg text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-colors border border-red-50 ${isSidebarExpanded ? 'px-4' : 'px-0'}`}
            title="登出系統"
          >
            <span>🚪</span>
            {isSidebarExpanded && <span className="ml-2">登出</span>}
          </button>
        </div>
      </aside>

      {/* 🚀 主內容區 */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative scrollbar-hide">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <div className="bg-white px-8 py-4 rounded-full shadow-2xl text-amberRed font-bold text-xl animate-pulse border border-amberRed/20">更新資料中...</div>
          </div>
        )}

        {/* 1. 排程與備料看板 */}
        {activeTab === 'dashboard' && (
          <DashboardStats 
            orders={orders} 
            selectedDate={selectedDate} 
            setSelectedDate={setSelectedDate} 
            dailyOrders={dailyOrders} 
            dailyMaterials={dailyMaterials} 
          />
        )}

        {/* 2. 訂單總覽表格 */}
        {activeTab === 'orders' && (
          <OrderTable 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            filteredOrders={filteredOrders}
            onEditClick={(o) => setEditModal({ 
              isOpen: true, 
              order: o, 
              eventDate: o.eventDate || '', 
              eventTime: o.eventTime || '', 
              location: o.specificDetails || '',
              notes: o.notes || '' // 將備註帶入彈窗
            })}
            onResendClick={(o) => setResendModal({ isOpen: true, order: o, email: o.ordererEmail || '' })}
          />
        )}

        {/* 3. 系統設定 */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-[fadeIn_0.3s_ease-out]">
            <header>
              <h2 className="text-4xl font-bold text-gray-800">系統設定</h2>
              <p className="text-xl text-gray-500 mt-2">管理 LINE 每日提醒機器人作業</p>
            </header>
            
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">LINE 每日出貨提醒</h3>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xl font-bold text-gray-700">啟用提醒功能</label>
                    <p className="text-base text-gray-400 mt-1">開啟後，系統將於每日指定時間發送明日訂單報表。</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.reminderEnabled} 
                    onChange={e => setSettings({...settings, reminderEnabled: e.target.checked})} 
                    className="w-8 h-8 accent-amberRed rounded-lg cursor-pointer"
                  />
                </div>
                
                <div className={`transition-all ${settings.reminderEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <label className="block text-lg font-bold text-gray-700 mb-3">發送時間</label>
                  <input 
                    type="time" 
                    value={settings.reminderTime} 
                    onChange={e => setSettings({...settings, reminderTime: e.target.value})} 
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xl outline-none focus:ring-2 focus:ring-amberRed"
                  />
                </div>
                
                <div className="pt-6 border-t border-gray-100">
                  <button 
                    onClick={handleSaveSettings} 
                    disabled={isSavingSettings}
                    className="w-full md:w-auto px-12 py-4 bg-darkWood text-white font-bold text-xl rounded-2xl hover:bg-black transition-all shadow-lg disabled:opacity-50"
                  >
                    {isSavingSettings ? '儲存中...' : '儲存設定'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🚀 彈窗組件大集合 */}
        <AdminModals 
          alertMsg={alertMsg} setAlertMsg={setAlertMsg}
          editModal={editModal} setEditModal={setEditModal} isUpdating={isUpdating} onUpdateOrderTime={handleUpdateOrderTime}
          resendModal={resendModal} setResendModal={setResendModal} isResending={isResending} onResendPDF={handleResendPDF}
        />
      </main>

      {/* 手機版選單按鈕 */}
      <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden fixed top-6 right-6 z-40 bg-white p-4 rounded-full shadow-2xl border border-gray-200 text-amberRed">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2.5" strokeLinecap="round"/></svg>
      </button>
      
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}
    </div>
  );
}