import React, { useState, useEffect, useMemo } from 'react';
import liff from '@line/liff';

// 🚀 引入展示元件
import DashboardStats from '../components/Admin/DashboardStats';
import OrderTable from '../components/Admin/OrderTable';
import AdminModals from '../components/Admin/AdminModals';
import RevenueReport from '../components/Admin/RevenueReport'; // 👈 確保此組件已建立

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
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, orders, revenue, settings
  
  // 導覽列伸縮狀態 (預設關閉)
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

  // 🚀 新增：密碼備用登入狀態
  const [passwordInput, setPasswordInput] = useState('');
  const [isVerifyingPwd, setIsVerifyingPwd] = useState(false);

  // ==========================================
  // 2. API 呼叫與權限驗證
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

  // 🚀 新增：備用密碼登入邏輯
  const handlePasswordLogin = async () => {
    if (!passwordInput) {
      setAlertMsg("請輸入管理員通關密碼");
      return;
    }
    setIsVerifyingPwd(true);
    try {
      // 呼叫我們即將在 GAS 中新增的 verify_password API
      const result = await callGasApi({ action: 'verify_password', password: passwordInput });
      
      if (result.status === 'success') {
        setUserProfile({ displayName: '管理員 (密碼登入)', pictureUrl: null });
        setAuthStatus('logged_in');
        fetchOrders();
        fetchSettings();
      } else {
        setAlertMsg("❌ 密碼錯誤，請確認後重試");
      }
    } catch (err) {
      setAlertMsg("連線異常：" + err.message);
    } finally {
      setIsVerifyingPwd(false);
    }
  };

  // ==========================================
  // 3. 資料處理邏輯 (解決 DashboardStats 的 Crash 問題)
  // ==========================================
  const { dailyOrders, dailyMaterials } = useMemo(() => {
    const dOrders = orders
      .filter(o => o.eventDate === selectedDate)
      .sort((a, b) => (a.eventTime || '').localeCompare(b.eventTime || ''));
      
    const materials = {}; 
    let totalCandies = 0;
    
    dOrders.forEach(order => {
      if (!order.cart) return;
      Object.entries(order.cart).forEach(([id, qty]) => {
        const pid = parseInt(id);
        if (!materials[pid]) materials[pid] = { name: productMapping[pid] || `商品(${pid})`, qty: 0 };
        materials[pid].qty += qty; 
        if (pid !== 5) totalCandies += qty; 
      });
    });
    return { dailyOrders: dOrders, dailyMaterials: { items: materials, totalCandies } };
  }, [orders, selectedDate]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    const t = searchTerm.toLowerCase();
    return orders.filter(o => 
      o.orderNumber?.toLowerCase().includes(t) || 
      o.ordererName?.toLowerCase().includes(t) || 
      o.ordererPhone?.includes(t)
    );
  }, [orders, searchTerm]);

  // ==========================================
  // 4. 業務事件處理
  // ==========================================
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
        newNotes: editModal.notes
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
  // 5. 渲染邏輯
  // ==========================================
  if (authStatus === 'checking') return <div className="h-screen flex items-center justify-center bg-gray-50 text-2xl font-bold">驗證中...</div>;
  
  // 🚀 更新：加入密碼備用登入介面的 unauth 狀態
  if (authStatus === 'unauth') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6 relative">
      {/* 若有系統訊息則疊加顯示 */}
      {alertMsg && (
        <div className="absolute top-10 w-full max-w-sm z-50">
          <div className="bg-red-50 text-red-600 font-bold px-6 py-4 rounded-2xl shadow-lg border border-red-200 text-center mx-auto relative">
            {alertMsg}
            <button onClick={() => setAlertMsg(null)} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-700">✕</button>
          </div>
        </div>
      )}

      <div className="bg-white p-10 md:p-12 rounded-3xl shadow-xl text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-amberRed mb-8 tracking-widest">李伯伯管理後台</h1>
        
        {/* LINE 登入按鈕 */}
        <button onClick={handleLogin} className="w-full bg-[#06C755] text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-lg hover:scale-105 transition-transform mb-6">
          LINE 快捷登入
        </button>
        
        {/* 分隔線 */}
        <div className="flex items-center gap-3 my-8">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-gray-400 text-sm font-bold">或使用備用通道</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {/* 密碼登入區塊 */}
        <div className="space-y-4">
          <input 
            type="password" 
            placeholder="請輸入通關密碼" 
            value={passwordInput} 
            onChange={e => setPasswordInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
            className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg outline-none focus:ring-2 focus:ring-gray-400 text-center tracking-widest placeholder:tracking-normal"
          />
          <button 
            onClick={handlePasswordLogin} 
            disabled={isVerifyingPwd}
            className="w-full bg-gray-800 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-black transition-colors disabled:opacity-50"
          >
            {isVerifyingPwd ? '驗證中...' : '密碼登入'}
          </button>
        </div>
      </div>
    </div>
  );

  if (authStatus === 'unauthorized_user') return <div className="h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold text-2xl">抱歉，您沒有管理員權限。</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 text-darkWood">
      
      {/* 側邊導覽列 */}
      <aside className={`fixed md:static inset-y-0 left-0 bg-white shadow-xl z-50 flex flex-col transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'w-64' : 'w-20'} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between overflow-hidden">
           {isSidebarExpanded ? <h1 className="text-2xl font-bold text-amberRed tracking-widest whitespace-nowrap">李伯伯</h1> : <span className="text-2xl font-bold text-amberRed mx-auto">李</span>}
           <button onClick={() => setIsSidebarExpanded(!isSidebarExpanded)} className="hidden md:flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-full transition-colors">
             <svg className={`w-5 h-5 text-gray-400 transition-transform ${isSidebarExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" strokeWidth="2"/></svg>
           </button>
        </div>
        
        <div className={`px-4 py-6 bg-gray-50 border-b border-gray-100 flex items-center transition-all ${isSidebarExpanded ? 'gap-4' : 'justify-center'}`}>
          {userProfile?.pictureUrl ? (
            <img src={userProfile.pictureUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0" alt="avatar" />
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex-shrink-0 bg-amberRed flex items-center justify-center text-white font-bold text-sm">管</div>
          )}
          {isSidebarExpanded && (
            <div className="overflow-hidden">
              <p className="text-lg font-bold text-gray-800 truncate">{userProfile?.displayName}</p>
              <p className="text-xs text-green-600 font-bold whitespace-nowrap">● 管理中</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-2 overflow-x-hidden">
          {[
            { id: 'dashboard', icon: '📊', label: '排程與備料' },
            { id: 'orders', icon: '📋', label: '訂單總覽' },
            { id: 'revenue', icon: '💰', label: '營收報表' },
            { id: 'settings', icon: '⚙️', label: '系統設定' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => {setActiveTab(item.id); setIsMobileMenuOpen(false);}} 
              className={`w-full flex items-center px-4 py-4 rounded-2xl text-xl transition-all ${activeTab === item.id ? 'bg-amberRed/10 text-amberRed font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'} ${!isSidebarExpanded ? 'justify-center' : ''}`}
              title={item.label}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {isSidebarExpanded && <span className="ml-4 whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>
        
        {/* 🚀 更新：返回前台與登出區塊 */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          {/* 返回前台按鈕 */}
          <button 
            onClick={() => window.location.href = '/'} 
            className={`w-full py-3 flex items-center justify-center text-lg text-gray-600 font-bold hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100 ${isSidebarExpanded ? 'px-4' : 'px-0'}`}
            title="返回前台首頁"
          >
            <span>🏠</span>
            {isSidebarExpanded && <span className="ml-2">返回前台</span>}
          </button>
          
          {/* 登出按鈕 */}
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

      {/* 主內容區 */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative scrollbar-hide">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <div className="bg-white px-8 py-4 rounded-full shadow-2xl text-amberRed font-bold text-xl animate-pulse">更新資料中...</div>
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
              notes: o.notes || ''
            })}
            onResendClick={(o) => setResendModal({ isOpen: true, order: o, email: o.ordererEmail || '' })}
          />
        )}

        {/* 3. 營收報表渲染區塊 */}
        {activeTab === 'revenue' && (
          <div className="max-w-7xl mx-auto">
             <RevenueReport scriptUrl={SCRIPT_URL} />
          </div>
        )}

        {/* 4. 系統設定 */}
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
                  <input type="checkbox" checked={settings.reminderEnabled} onChange={e => setSettings({...settings, reminderEnabled: e.target.checked})} className="w-8 h-8 accent-amberRed rounded-lg cursor-pointer" />
                </div>
                <div className={`transition-all ${settings.reminderEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <label className="block text-lg font-bold text-gray-700 mb-3">發送時間</label>
                  <input type="time" value={settings.reminderTime} onChange={e => setSettings({...settings, reminderTime: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xl outline-none focus:ring-2 focus:ring-amberRed" />
                </div>
                <div className="pt-6 border-t border-gray-100">
                  <button onClick={handleSaveSettings} disabled={isSavingSettings} className="px-12 py-4 bg-darkWood text-white font-bold text-xl rounded-2xl hover:bg-black transition-all shadow-lg disabled:opacity-50">儲存設定</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 彈窗組件大集合 */}
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