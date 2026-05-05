import React, { useEffect, useMemo, useState } from 'react';
import liff from '@line/liff';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import DashboardStats from '../components/Admin/DashboardStats';
import OrderTable from '../components/Admin/OrderTable';
import AdminModals from '../components/Admin/AdminModals';
import RevenueReport from '../components/Admin/RevenueReport';
import {
  SCRIPT_URL,
  callGasApi,
  deleteAdminOrder,
  fetchAdminOrdersPage,
  fetchAdminSettings,
  getOrderSearchMode,
  resendAdminOrderPdf,
  saveAdminSettings,
  searchAdminOrders,
  updateAdminOrder
} from '../utils/adminOrdersApi';

const LIFF_ID = '2009807397-WPVPBokl';
const ORDER_PAGE_SIZE = 50;

const productMapping = {
  1: '蕃茄 (小/喜糖)',
  2: '蕃茄蜜餞 (小/喜糖)',
  3: '鳥梨 (小/喜糖)',
  4: '蕃茄+鳥梨 (小/喜糖)',
  5: '承租掃帚',
  6: '蕃茄 (經典)',
  7: '蕃茄蜜餞 (經典)',
  8: '鳥梨 (經典)'
};

const emptyEditModal = {
  isOpen: false,
  order: null,
  eventDate: '',
  eventTime: '',
  specificDetails: '',
  notes: ''
};

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const [authStatus, setAuthStatus] = useState('checking');
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState({ reminderEnabled: true, reminderTime: '11:00' });
  const [alertMsg, setAlertMsg] = useState(null);

  const [editModal, setEditModal] = useState(emptyEditModal);
  const [resendModal, setResendModal] = useState({ isOpen: false, order: null, email: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, order: null, confirmText: '' });

  const [passwordInput, setPasswordInput] = useState('');
  const [isVerifyingPwd, setIsVerifyingPwd] = useState(false);

  useEffect(() => {
    async function initializeLiff() {
      try {
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
          setAuthStatus('unauth');
          return;
        }

        const profile = await liff.getProfile();
        const res = await fetch(`${SCRIPT_URL}?action=verify_admin&userId=${profile.userId}`);
        const data = await res.json();

        if (data.status === 'success' && data.isAdmin) {
          setUserProfile(profile);
          setAuthStatus('logged_in');
        } else {
          setAuthStatus('unauthorized_user');
        }
      } catch (err) {
        console.error('LIFF admin check failed:', err);
        setAuthStatus('unauth');
      }
    }

    initializeLiff();
  }, []);

  const rawSearchTerm = searchTerm.trim();
  const searchMode = useMemo(() => getOrderSearchMode(rawSearchTerm), [rawSearchTerm]);
  const isSupportedSearch = searchMode === 'phone' || searchMode === 'orderNumber';

  const ordersQuery = useInfiniteQuery({
    queryKey: ['adminOrders'],
    queryFn: ({ pageParam = null }) => fetchAdminOrdersPage({ pageParam, pageSize: ORDER_PAGE_SIZE }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
    enabled: authStatus === 'logged_in'
  });

  const settingsQuery = useQuery({
    queryKey: ['adminSettings'],
    queryFn: fetchAdminSettings,
    enabled: authStatus === 'logged_in'
  });

  const searchQuery = useQuery({
    queryKey: ['adminOrderSearch', searchMode, rawSearchTerm],
    queryFn: () => searchAdminOrders(rawSearchTerm),
    enabled: authStatus === 'logged_in' && isSupportedSearch
  });

  const orders = useMemo(
    () => ordersQuery.data?.pages.flatMap(page => page.orders) ?? [],
    [ordersQuery.data]
  );

  useEffect(() => {
    if (settingsQuery.data) {
      setSettings(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const displayedOrders = rawSearchTerm
    ? (isSupportedSearch ? (searchQuery.data ?? []) : [])
    : orders;

  const { dailyOrders, dailyMaterials } = useMemo(() => {
    const dOrders = orders
      .filter(order => order.eventDate === selectedDate)
      .sort((a, b) => (a.eventTime || '').localeCompare(b.eventTime || ''));

    const materials = {};
    let totalCandies = 0;

    dOrders.forEach(order => {
      if (!order.cart) return;

      Object.entries(order.cart).forEach(([id, qty]) => {
        const pid = Number(id);
        if (!materials[pid]) {
          materials[pid] = { name: productMapping[pid] || `商品 ${pid}`, qty: 0 };
        }
        materials[pid].qty += Number(qty) || 0;
        if (pid !== 5) totalCandies += Number(qty) || 0;
      });
    });

    return { dailyOrders: dOrders, dailyMaterials: { items: materials, totalCandies } };
  }, [orders, selectedDate]);

  const invalidateAdminOrderQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    queryClient.invalidateQueries({ queryKey: ['adminOrderSearch'] });
  };

  const updateOrderMutation = useMutation({
    mutationFn: updateAdminOrder,
    onSuccess: () => {
      setAlertMsg('訂單資料與 PDF 已成功更新。');
      setEditModal(emptyEditModal);
      invalidateAdminOrderQueries();
    },
    onError: (err) => {
      console.error('Update order failed:', err);
      setAlertMsg(`更新失敗：${err.message}`);
    }
  });

  const resendPdfMutation = useMutation({
    mutationFn: resendAdminOrderPdf,
    onSuccess: (_, variables) => {
      setAlertMsg(`已補發 PDF 至 ${variables.email}`);
      setResendModal({ isOpen: false, order: null, email: '' });
    },
    onError: (err) => {
      console.error('Resend PDF failed:', err);
      setAlertMsg('補發失敗，請稍後再試。');
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteAdminOrder,
    onSuccess: (result) => {
      setAlertMsg(`訂單 #${result.orderNumber} 已刪除，Google Sheets 報表已同步標記為刪除。`);
      setDeleteModal({ isOpen: false, order: null, confirmText: '' });
      invalidateAdminOrderQueries();
    },
    onError: (err) => {
      console.error('Delete order failed:', err);
      setAlertMsg(`刪除失敗：${err.message}`);
    }
  });

  const saveSettingsMutation = useMutation({
    mutationFn: saveAdminSettings,
    onSuccess: () => {
      setAlertMsg('系統設定已更新。');
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
    },
    onError: (err) => {
      console.error('Save settings failed:', err);
      setAlertMsg('儲存設定失敗，請稍後再試。');
    }
  });

  const handleLogin = () => liff.login({ redirectUri: window.location.href });
  const handleLogout = () => {
    liff.logout();
    window.location.reload();
  };

  const handlePasswordLogin = async () => {
    if (!passwordInput) {
      setAlertMsg('請輸入管理密碼。');
      return;
    }

    setIsVerifyingPwd(true);
    try {
      const result = await callGasApi({ action: 'verify_password', password: passwordInput });
      if (result.status === 'success') {
        setUserProfile({ displayName: '管理員（密碼登入）', pictureUrl: null });
        setAuthStatus('logged_in');
      } else {
        setAlertMsg('密碼錯誤，請再確認一次。');
      }
    } catch (err) {
      setAlertMsg(`登入失敗：${err.message}`);
    } finally {
      setIsVerifyingPwd(false);
    }
  };

  const handleUpdateOrderTime = () => {
    if (!editModal.eventDate || !editModal.eventTime) {
      alert('請填寫活動日期與時間');
      return;
    }

    updateOrderMutation.mutate({
      order: editModal.order,
      eventDate: editModal.eventDate,
      eventTime: editModal.eventTime,
      specificDetails: editModal.specificDetails,
      notes: editModal.notes
    });
  };

  const handleResendPDF = () => {
    if (!resendModal.email) {
      alert('請輸入 Email');
      return;
    }

    resendPdfMutation.mutate({ order: resendModal.order, email: resendModal.email });
  };

  const handleDeleteOrder = () => {
    const targetOrder = deleteModal.order;
    if (!targetOrder?.id) {
      setAlertMsg('無法刪除：訂單缺少 Firebase 文件 ID。');
      return;
    }

    if (deleteModal.confirmText !== targetOrder.orderNumber) {
      setAlertMsg('請完整輸入訂單編號，確認後才能刪除。');
      return;
    }

    deleteOrderMutation.mutate({ order: targetOrder });
  };

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(settings);
  };

  if (authStatus === 'checking') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 text-2xl font-bold">
        載入中...
      </div>
    );
  }

  if (authStatus === 'unauth') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6 relative">
        {alertMsg && (
          <div className="absolute top-10 w-full max-w-sm z-50">
            <div className="bg-red-50 text-red-600 font-bold px-6 py-4 rounded-2xl shadow-lg border border-red-200 text-center mx-auto relative">
              {alertMsg}
              <button
                onClick={() => setAlertMsg(null)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-700"
              >
                x
              </button>
            </div>
          </div>
        )}

        <div className="bg-white p-10 md:p-12 rounded-3xl shadow-xl text-center max-w-md w-full">
          <h1 className="text-3xl font-bold text-amberRed mb-8 tracking-widest">後台管理登入</h1>
          <button
            onClick={handleLogin}
            className="w-full bg-[#06C755] text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-lg hover:scale-105 transition-transform mb-6"
          >
            使用 LINE 登入
          </button>
          <div className="flex items-center gap-3 my-8">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-gray-400 text-sm font-bold">或使用管理密碼</span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="請輸入管理密碼"
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
  }

  if (authStatus === 'unauthorized_user') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 text-red-500 font-bold text-2xl">
        無權限：此 LINE 帳號不是管理員。
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', icon: '📅', label: '每日總覽' },
    { id: 'orders', icon: '📋', label: '訂單管理' },
    { id: 'revenue', icon: '💰', label: '營收報表' },
    { id: 'settings', icon: '⚙️', label: '系統設定' }
  ];

  const isLoading = ordersQuery.isLoading || settingsQuery.isLoading;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 text-darkWood">
      <aside className={`fixed md:static inset-y-0 left-0 bg-white shadow-xl z-50 flex flex-col transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'w-64' : 'w-20'} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between overflow-hidden">
          {isSidebarExpanded ? (
            <h1 className="text-2xl font-bold text-amberRed tracking-widest whitespace-nowrap">後台管理</h1>
          ) : (
            <span className="text-2xl font-bold text-amberRed mx-auto">管</span>
          )}
          <button
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="hidden md:flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${isSidebarExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" strokeWidth="2" /></svg>
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
              <p className="text-xs text-green-600 font-bold whitespace-nowrap">管理員登入中</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-2 overflow-x-hidden">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-4 rounded-2xl text-xl transition-all ${activeTab === item.id ? 'bg-amberRed/10 text-amberRed font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'} ${!isSidebarExpanded ? 'justify-center' : ''}`}
              title={item.label}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {isSidebarExpanded && <span className="ml-4 whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-2">
          <button
            onClick={() => { window.location.href = '/leebobo-frontend/'; }}
            className={`w-full py-3 flex items-center justify-center text-lg text-gray-600 font-bold hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100 ${isSidebarExpanded ? 'px-4' : 'px-0'}`}
            title="回到網站首頁"
          >
            <span>↩</span>
            {isSidebarExpanded && <span className="ml-2">回到首頁</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full py-3 flex items-center justify-center text-lg text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-colors border border-red-50 ${isSidebarExpanded ? 'px-4' : 'px-0'}`}
            title="登出"
          >
            <span>⏻</span>
            {isSidebarExpanded && <span className="ml-2">登出</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative scrollbar-hide">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
            <div className="bg-white px-8 py-4 rounded-full shadow-2xl text-amberRed font-bold text-xl animate-pulse">
              載入資料中...
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardStats
            orders={orders}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            dailyOrders={dailyOrders}
            dailyMaterials={dailyMaterials}
          />
        )}

        {activeTab === 'orders' && (
          <OrderTable
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filteredOrders={displayedOrders}
            onEditClick={(order) => setEditModal({
              isOpen: true,
              order,
              eventDate: order.eventDate || '',
              eventTime: order.eventTime || '',
              specificDetails: order.specificDetails || '',
              notes: order.notes || ''
            })}
            onResendClick={(order) => setResendModal({ isOpen: true, order, email: order.ordererEmail || '' })}
            onDeleteClick={(order) => setDeleteModal({ isOpen: true, order, confirmText: '' })}
            loadedCount={orders.length}
            pageSize={ORDER_PAGE_SIZE}
            hasMoreOrders={!rawSearchTerm && Boolean(ordersQuery.hasNextPage)}
            isLoadingMoreOrders={ordersQuery.isFetchingNextPage}
            onLoadMore={() => ordersQuery.fetchNextPage()}
            isSearchMode={Boolean(rawSearchTerm)}
            searchMode={searchMode}
            isSearchingOrders={searchQuery.isFetching}
          />
        )}

        {activeTab === 'revenue' && (
          <div className="max-w-7xl mx-auto">
            <RevenueReport scriptUrl={SCRIPT_URL} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-[fadeIn_0.3s_ease-out]">
            <header>
              <h2 className="text-4xl font-bold text-gray-800">系統設定</h2>
              <p className="text-xl text-gray-500 mt-2">管理 LINE 提醒與後台通知設定。</p>
            </header>
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">LINE 提醒設定</h3>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xl font-bold text-gray-700">啟用提醒</label>
                    <p className="text-base text-gray-400 mt-1">開啟後會依照設定時間推送管理提醒。</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reminderEnabled}
                    onChange={e => setSettings({ ...settings, reminderEnabled: e.target.checked })}
                    className="w-8 h-8 accent-amberRed rounded-lg cursor-pointer"
                  />
                </div>
                <div className={`transition-all ${settings.reminderEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <label className="block text-lg font-bold text-gray-700 mb-3">提醒時間</label>
                  <input
                    type="time"
                    value={settings.reminderTime}
                    onChange={e => setSettings({ ...settings, reminderTime: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xl outline-none focus:ring-2 focus:ring-amberRed"
                  />
                </div>
                <div className="pt-6 border-t border-gray-100">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saveSettingsMutation.isPending}
                    className="px-12 py-4 bg-darkWood text-white font-bold text-xl rounded-2xl hover:bg-black transition-all shadow-lg disabled:opacity-50"
                  >
                    {saveSettingsMutation.isPending ? '儲存中...' : '儲存設定'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <AdminModals
          alertMsg={alertMsg}
          setAlertMsg={setAlertMsg}
          editModal={editModal}
          setEditModal={setEditModal}
          isUpdating={updateOrderMutation.isPending}
          onUpdateOrderTime={handleUpdateOrderTime}
          resendModal={resendModal}
          setResendModal={setResendModal}
          isResending={resendPdfMutation.isPending}
          onResendPDF={handleResendPDF}
          deleteModal={deleteModal}
          setDeleteModal={setDeleteModal}
          isDeleting={deleteOrderMutation.isPending}
          onDeleteOrder={handleDeleteOrder}
        />
      </main>

      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-6 right-6 z-40 bg-white p-4 rounded-full shadow-2xl border border-gray-200 text-amberRed"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2.5" strokeLinecap="round" /></svg>
      </button>
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}
    </div>
  );
}
