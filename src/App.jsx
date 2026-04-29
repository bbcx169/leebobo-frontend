import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// 引入全站共用元件
import Footer from './components/Footer';

// 引入所有獨立頁面組件
import BrandStory from './pages/BrandStory';
import OrderProcess from './pages/OrderProcess';
import ContactUs from './pages/ContactUs';
import ProductList from './pages/ProductList';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderInquiry from './pages/OrderInquiry';

// 引入後台管理的骨架頁面
import AdminDashboard from './pages/AdminDashboard';

// --------------------------------------------------------
// 💡 AppContent 是主要應用程式邏輯，被 BrowserRouter 包覆
// --------------------------------------------------------
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- 全域狀態管理 ---
  const [cart, setCart] = useState({}); 
  const [alertMsg, setAlertMsg] = useState(null); 
  const [submittedOrder, setSubmittedOrder] = useState(null); 
  const [isNavScrolled, setIsNavScrolled] = useState(false); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 

  // ==========================================
  // 🚀 核心優化：LIFF 登入路由攔截器 (修復 OAuth 憑證遺失問題)
  // ==========================================
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const liffStatePath = params.get('liff.state');

    if (liffStatePath) {
      console.log('偵測到 LIFF 重導向，準備跳轉至:', liffStatePath);
      
      // ⚠️ 關鍵修正：必須保留 LINE 傳回來的 code 和 state 參數
      params.delete('liff.state'); 
      const remainingParams = params.toString();
      
      const destination = liffStatePath + (remainingParams ? `?${remainingParams}` : '');
      
      navigate(destination, { replace: true });
    }
  }, [location.search, navigate]);

  // 1. 導覽列滾動效果
  useEffect(() => {
    const handleScroll = () => setIsNavScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. 當網址改變時，自動捲動到最上方
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // --- 購物車邏輯 ---
  const updateCart = (productId, delta) => {
    setCart(prev => {
      const currentQty = prev[productId] || 0;
      const newQty = currentQty + delta;
      if (newQty <= 0) { 
        const newCart = { ...prev }; 
        delete newCart[productId]; 
        return newCart; 
      }
      return { ...prev, [productId]: newQty };
    });
  };

  const handleQuantityChange = (productId, value) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
      setCart(prev => { 
        const newCart = { ...prev }; 
        delete newCart[productId]; 
        return newCart; 
      });
    } else { 
      setCart(prev => ({ ...prev, [productId]: num })); 
    }
  };

  const getCartTotalItems = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      // 排除掃帚組件的計算，只算糖葫蘆總數
      return parseInt(id) !== 5 ? sum + qty : sum;
    }, 0);
  };

  const cartCount = getCartTotalItems();
  const displayCount = cartCount > 99 ? '99+' : cartCount;

  // 💡 顧問新增：導覽列購物車圖示的防呆檢查
  const handleCartClick = () => {
    if (cartCount === 0) {
      setAlertMsg("您的購物車目前是空的，請先挑選喜歡的糖葫蘆喔！🍡");
      return;
    }
    handleNavigate('/order');
  };

  // --- 訂單與路由跳轉邏輯 ---
  const handleOrderSuccess = (orderData) => {
    setSubmittedOrder(orderData);
    setCart({}); 
    navigate('/success'); 
  };

  const handleNavigate = (path) => { 
    if (path === '/list') {
      setSubmittedOrder(null); 
    }
    navigate(path); 
    setIsMobileMenuOpen(false); 
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  // ==========================================
  // 後台專屬畫面渲染
  // ==========================================
  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    );
  }

  // ==========================================
  // 一般前台畫面渲染
  // ==========================================
  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans text-darkWood bg-creamBg">
      
      {/* 漸層背景 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-warmWood mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-amberRed mix-blend-multiply filter blur-[120px] opacity-[0.08] rounded-full"></div>
      </div>

      {/* --- 導覽列 --- */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${isNavScrolled ? 'px-0' : 'px-0'}`}>
        <div className={`mx-auto flex justify-between items-center max-w-7xl transition-all duration-300 ${isNavScrolled ? 'glass-nav-scrolled shadow-sm w-full px-6 py-4 rounded-none' : 'glass-panel-light mx-4 mt-4 rounded-2xl px-6 py-4'}`}>
            <div className="font-serif text-2xl font-bold tracking-widest text-amberRed cursor-pointer" onClick={() => handleNavigate('/')}>李伯伯糖葫蘆</div>
            
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wider text-darkWood">
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('/'); }} className={`transition-colors duration-300 ${location.pathname === '/' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>品牌故事</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('/process'); }} className={`transition-colors duration-300 ${location.pathname === '/process' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>訂購流程</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('/list'); }} className={`transition-colors duration-300 ${['/list', '/order', '/success'].includes(location.pathname) ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>商品訂購</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('/inquiry'); }} className={`transition-colors duration-300 ${location.pathname === '/inquiry' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>訂單查詢</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('/contact'); }} className={`transition-colors duration-300 ${location.pathname === '/contact' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>聯絡我們</a>
                
                {['/list', '/order'].includes(location.pathname) && (
                    /* 💡 修正：將跳轉邏輯改為 handleCartClick 進行攔截檢查 */
                    <button onClick={handleCartClick} className="relative flex items-center justify-center w-11 h-11 rounded-full bg-amberRed text-white shadow-md hover:bg-pureWhite hover:text-amberRed transition-all ml-4 animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                        {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pureWhite text-amberRed text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-md border-2 border-amberRed">{displayCount}</span>}
                    </button>
                )}
            </div>

            <div className="md:hidden flex items-center space-x-3">
                {['/list', '/order'].includes(location.pathname) && (
                    /* 💡 修正：手機版同步套用 handleCartClick */
                    <button onClick={handleCartClick} className="relative flex items-center justify-center w-10 h-10 rounded-full bg-amberRed text-white shadow-md hover:bg-pureWhite hover:text-amberRed transition-all animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                        {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pureWhite text-amberRed text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-md border-2 border-amberRed">{displayCount}</span>}
                    </button>
                )}
                <button className="text-amberRed focus:outline-none p-1" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
            </div>
        </div>

        {isMobileMenuOpen && (
            <div className="md:hidden glass-panel-light mx-4 mt-2 p-5 rounded-2xl flex flex-col space-y-4 text-center text-darkWood tracking-wider shadow-lg">
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('/'); }} className={`py-2 border-b border-warmWood/20 ${location.pathname === '/' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>品牌故事</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('/process'); }} className={`py-2 border-b border-warmWood/20 ${location.pathname === '/process' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>訂購流程</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('/list'); }} className={`py-2 border-b border-warmWood/20 ${['/list', '/order', '/success'].includes(location.pathname) ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>商品訂購</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('/inquiry'); }} className={`py-2 border-b border-warmWood/20 ${location.pathname === '/inquiry' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>訂單查詢</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('/contact'); }} className={`py-2 ${location.pathname === '/contact' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>聯絡我們</a>
            </div>
        )}
      </nav>

      {/* --- 系統提示彈窗 --- */}
      {alertMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setAlertMsg(null)}></div>
          <div className="bg-pureWhite rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full mx-4 relative z-10 fade-in-up is-visible">
            <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">系統提示</h3>
            <div className="text-gray-700 mb-6 text-sm leading-relaxed text-left">
              {Array.isArray(alertMsg) ? (
                <ul className="space-y-2">
                  {alertMsg.map((m, idx) => (
                    <li key={idx} className={m.includes('⚠️') || m.includes('✅') ? "text-amberRed font-bold text-base" : m.includes('💡') ? "text-gray-400 text-xs mt-4 break-all" : "text-gray-700"}>
                      {m}
                    </li>
                  ))}
                </ul>
              ) : alertMsg}
            </div>
            <button onClick={() => setAlertMsg(null)} className="w-full bg-amberRed hover:bg-darkWood text-white font-bold py-3 rounded-xl transition-colors">我知道了</button>
          </div>
        </div>
      )}

      {/* 🚀 頁面路由器 */}
      <div className="pt-24 pb-10 min-h-[85vh]">
        <Routes>
          <Route path="/" element={<BrandStory navigateTo={handleNavigate} />} />
          <Route path="/process" element={<OrderProcess navigateTo={handleNavigate} />} />
          <Route path="/contact" element={<ContactUs />} />
          {/* 💡 修正：傳入 setAlertMsg 給 ProductList */}
          <Route path="/list" element={<ProductList cart={cart} updateCart={updateCart} handleQuantityChange={handleQuantityChange} navigateTo={handleNavigate} setAlertMsg={setAlertMsg} />} />
          <Route path="/order" element={<Checkout cart={cart} updateCart={updateCart} handleQuantityChange={handleQuantityChange} navigateTo={handleNavigate} onOrderSuccess={handleOrderSuccess} setAlertMsg={setAlertMsg} />} />
          <Route path="/success" element={<OrderSuccess submittedOrder={submittedOrder} navigateTo={handleNavigate} />} />
          <Route path="/inquiry" element={<OrderInquiry setAlertMsg={setAlertMsg} />} />
          <Route path="*" element={<BrandStory navigateTo={handleNavigate} />} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

// --------------------------------------------------------
// 🚀 導出 App：在此處包覆 BrowserRouter 並設定 basename
// --------------------------------------------------------
export default function App() {
  return (
    <BrowserRouter basename="/leebobo-frontend">
      <AppContent />
    </BrowserRouter>
  );
}