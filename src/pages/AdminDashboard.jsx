import React, { useState, useEffect, useMemo } from 'react';
import liff from '@line/liff';

// 引入拆分後的元件
import DashboardStats from '../components/Admin/DashboardStats';
import OrderTable from '../components/Admin/OrderTable';
import AdminModals from '../components/Admin/AdminModals';

// 常數設定
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzf8kJ6Ka8yGabg--MCRJ8eyucBbsGRDbceGEeH-CQDLqOMXhTCysZVrPKL0MLpSg4L/exec';
const LIFF_ID = '2009807397-WPVPBokl';
const productMapping = { 1: "蕃茄 (小/喜糖)", 2: "蕃茄蜜餞 (小/喜糖)", 3: "鳥梨 (小/喜糖)", 4: "蕃茄+鳥梨 (小/喜糖)", 5: "承租掃帚", 6: "蕃茄 (經典)", 7: "蕃茄蜜餞 (經典)", 8: "鳥梨 (經典)" };

export default function AdminDashboard() {
  // 核心狀態
  const [authStatus, setAuthStatus] = useState('checking');
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 彈窗狀態
  const [settings, setSettings] = useState({ reminderEnabled: true, reminderTime: '11:00' });
  const [resendModal, setResendModal] = useState({ isOpen: false, order: null, email: '' });
  const [editModal, setEditModal] = useState({ isOpen: false, order: null, eventDate: '', eventTime: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 初始化與登入
  useEffect(() => {
    async function init() {
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
          } else setAuthStatus('unauthorized_user');
        } else setAuthStatus('unauth');
      } catch (err) { setAuthStatus('unauth'); }
    }
    init();
  }, []);

  // API 呼叫方法
  const callGasApi = async (payload) => {
    const res = await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
    return await res.json();
  };

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${SCRIPT_URL}?action=get_all_orders`);
      const data = await res.json();
      if (data.status === 'success') setOrders(data.data);
    } catch (err) { setAlertMsg("網路連線錯誤"); }
    finally { setIsLoading(false); }
  };

  const fetchSettings = async () => {
    const res = await fetch(`${SCRIPT_URL}?action=get_settings`);
    const data = await res.json();
    if (data.status === 'success') setSettings(data.data);
  };

  // 業務處理邏輯 (與 Stage 2 相同，僅傳遞給元件)
  const urgentOrders = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const limit = new Date(today); limit.setDate(today.getDate() + 3);
    return orders.filter(o => o.eventDate && new Date(o.eventDate) >= today && new Date(o.eventDate) <= limit);
  }, [orders]);

  const { dailyOrders, dailyMaterials } = useMemo(() => {
    const dOrders = orders.filter(o => o.eventDate === selectedDate);
    const mat = {}; let total = 0;
    dOrders.forEach(o => Object.entries(o.cart || {}).forEach(([id, qty]) => {
      const pid = parseInt(id); if(!mat[pid]) mat[pid] = { name: productMapping[pid], qty: 0 };
      mat[pid].qty += qty; if(pid !== 5) total += qty;
    }));
    return { dailyOrders: dOrders, dailyMaterials: { items: mat, totalCandies: total } };
  }, [orders, selectedDate]);

  const filteredOrders = useMemo(() => orders.filter(o => 
    !searchTerm || [o.orderNumber, o.ordererName, o.ordererPhone].some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [orders, searchTerm]);

  // 頁面切換控制
  const handleLogout = () => { liff.logout(); window.location.reload(); };

  if (authStatus === 'checking') return <div className="h-screen flex items-center justify-center">驗證中...</div>;
  if (authStatus !== 'logged_in') return <div className="h-screen flex items-center justify-center">請重新登入</div>;

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* 側邊欄與行動版 Navbar (簡略顯示，保持與原版一致) */}
      <aside className="hidden md:flex w-64 bg-white shadow-md flex-col">
        <div className="p-6 border-b text-center font-bold text-amberRed text-xl">李伯伯糖葫蘆</div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-4 py-3 rounded-xl ${activeTab === 'dashboard' ? 'bg-amberRed/10 text-amberRed font-bold' : ''}`}>排程與備料</button>
          <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-xl ${activeTab === 'orders' ? 'bg-amberRed/10 text-amberRed font-bold' : ''}`}>訂單總覽</button>
          <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-500">安全登出</button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 relative">
        {isLoading && <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center">讀取中...</div>}
        
        {activeTab === 'dashboard' ? (
          <DashboardStats 
            orders={orders} urgentOrders={urgentOrders} 
            selectedDate={selectedDate} setSelectedDate={setSelectedDate}
            dailyOrders={dailyOrders} dailyMaterials={dailyMaterials}
          />
        ) : (
          <OrderTable 
            searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
            filteredOrders={filteredOrders}
            onEditClick={(o) => setEditModal({ isOpen: true, order: o, eventDate: o.eventDate, eventTime: o.eventTime })}
            onResendClick={(o) => setResendModal({ isOpen: true, order: o, email: o.ordererEmail })}
          />
        )}

        <AdminModals 
          alertMsg={alertMsg} setAlertMsg={setAlertMsg}
          editModal={editModal} setEditModal={setEditModal} isUpdating={isUpdating}
          onUpdateOrderTime={async () => {
            setIsUpdating(true);
            try {
              await callGasApi({ action: 'update_order_time', orderNumber: editModal.order.orderNumber, newDate: editModal.eventDate, newTime: editModal.eventTime });
              setAlertMsg("修改成功！"); setEditModal({ isOpen: false }); fetchOrders();
            } catch (err) { setAlertMsg("修改失敗"); }
            finally { setIsUpdating(false); }
          }}
          resendModal={resendModal} setResendModal={setResendModal} isResending={isResending}
          onResendPDF={async () => {
            setIsResending(true);
            try {
              await callGasApi({ action: 'admin_resend_pdf', orderNumber: resendModal.order.orderNumber, email: resendModal.email });
              setAlertMsg("PDF 已成功補發！"); setResendModal({ isOpen: false });
            } catch (err) { setAlertMsg("補發失敗"); }
            finally { setIsResending(false); }
          }}
        />
      </main>
    </div>
  );
}