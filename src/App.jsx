import React, { useState, useEffect } from 'react';

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

function App() {
  // --- 全域狀態管理 ---
  const [currentPage, setCurrentPage] = useState('brand'); // 當前頁面
  const [cart, setCart] = useState({}); // 購物車資料
  const [alertMsg, setAlertMsg] = useState(null); // 系統提示訊息
  const [submittedOrder, setSubmittedOrder] = useState(null); // 剛送出的訂單暫存
  
  // 💡 1. 新增：用來強制重置 OrderInquiry 狀態的 key
  const [resetKey, setResetKey] = useState(Date.now()); 

  // --- 介面互動狀態 ---
  const [isNavScrolled, setIsNavScrolled] = useState(false); // 導覽列是否捲動過
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 手機選單開關

  // --- 監聽視窗捲動：控制導覽列背景變色 ---
  useEffect(() => {
    const handleScroll = () => setIsNavScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 切換頁面時：自動捲動到頂端 ---
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // --- 購物車增減邏輯 ---
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

  // --- 購物車直接輸入數字邏輯 ---
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

  // --- 計算購物車總品項數量 (排除掃帚 id: 5) ---
  const getCartTotalItems = () => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      // 只要 ID 不是 5 (掃帚)，就將數量加進總數
      return parseInt(id) !== 5 ? sum + qty : sum;
    }, 0);
  };

  // 準備顯示用的計數變數
  const cartCount = getCartTotalItems();
  const displayCount = cartCount > 99 ? '99+' : cartCount;

  // --- 訂單成功送出後的處理函式 ---
  const handleOrderSuccess = (orderData) => {
    setSubmittedOrder(orderData);
    setCart({}); // 清空購物車
    setCurrentPage('success'); // 跳轉到成功頁面
  };

  // --- 導覽跳轉函式 ---
  const handleNavigate = (page) => { 
    const targetPage = page === 'products' ? 'list' : page;
    
    // 若回到商品列表，清除上一筆訂單的暫存資料
    if (targetPage === 'list') {
      setSubmittedOrder(null);
    }
    
    setCurrentPage(targetPage); 
    // 💡 2. 新增：每次點擊導覽列，都給予一個全新的時間戳，強制目標元件洗掉舊狀態
    setResetKey(Date.now()); 
    // 點擊選單後立即關閉手機版導覽列，提升 UX
    setIsMobileMenuOpen(false); 
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans text-darkWood bg-creamBg">
      
      {/* 全站共用的漸層呼吸光球背景 (保持固定於視窗) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* 奶茶色光球 (左上) */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-warmWood mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse rounded-full"></div>
        {/* 棗紅色光球 (右下) */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-amberRed mix-blend-multiply filter blur-[120px] opacity-[0.08] rounded-full"></div>
      </div>

      {/* --- 導覽列 (Navbar) --- */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${isNavScrolled ? 'px-0' : 'px-0'}`}>
        <div className={`mx-auto flex justify-between items-center max-w-7xl transition-all duration-300 ${isNavScrolled ? 'glass-nav-scrolled shadow-sm w-full px-6 py-4 rounded-none' : 'glass-panel-light mx-4 mt-4 rounded-2xl px-6 py-4'}`}>
            <div className="font-serif text-2xl font-bold tracking-widest text-amberRed cursor-pointer" onClick={() => handleNavigate('brand')}>李伯伯糖葫蘆</div>
            
            {/* 桌面版選單 */}
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wider text-darkWood">
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('brand'); }} className={`transition-colors duration-300 ${currentPage === 'brand' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>品牌故事</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('process'); }} className={`transition-colors duration-300 ${currentPage === 'process' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>訂購流程</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('list'); }} className={`transition-colors duration-300 ${['list', 'order', 'success'].includes(currentPage) ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>商品訂購</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('inquiry'); }} className={`transition-colors duration-300 ${currentPage === 'inquiry' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>訂單查詢</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('contact'); }} className={`transition-colors duration-300 ${currentPage === 'contact' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>聯絡我們</a>
                
                {/* 購物車按鈕 (僅在訂購模式顯示) */}
                {['list', 'order'].includes(currentPage) && (
                    <button onClick={() => handleNavigate('order')} className="relative flex items-center justify-center w-11 h-11 rounded-full bg-amberRed text-white shadow-md hover:bg-pureWhite hover:text-amberRed transition-all ml-4 animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                        {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pureWhite text-amberRed text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-md border-2 border-amberRed">{displayCount}</span>}
                    </button>
                )}
            </div>

            {/* 手機版按鈕組合 */}
            <div className="md:hidden flex items-center space-x-3">
                {['list', 'order'].includes(currentPage) && (
                    <button onClick={() => handleNavigate('order')} className="relative flex items-center justify-center w-10 h-10 rounded-full bg-amberRed text-white shadow-md hover:bg-pureWhite hover:text-amberRed transition-all animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                        {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-pureWhite text-amberRed text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center shadow-md border-2 border-amberRed">{displayCount}</span>}
                    </button>
                )}
                <button className="text-amberRed focus:outline-none p-1" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
            </div>
        </div>

        {/* 手機版下拉選單內容 */}
        {isMobileMenuOpen && (
            <div className="md:hidden glass-panel-light mx-4 mt-2 p-5 rounded-2xl flex flex-col space-y-4 text-center text-darkWood tracking-wider shadow-lg">
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('brand'); }} className={`py-2 border-b border-warmWood/20 ${currentPage === 'brand' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>品牌故事</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('process'); }} className={`py-2 border-b border-warmWood/20 ${currentPage === 'process' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>訂購流程</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('list'); }} className={`py-2 border-b border-warmWood/20 ${['list', 'order', 'success'].includes(currentPage) ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>商品訂購</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('inquiry'); }} className={`py-2 border-b border-warmWood/20 ${currentPage === 'inquiry' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>訂單查詢</a>
                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('contact'); }} className={`py-2 ${currentPage === 'contact' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>聯絡我們</a>
            </div>
        )}
      </nav>

      {/* --- 全域系統提示彈窗 (Alert Modal) --- */}
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

      {/* ========================================== */}
      {/* 🚀 頁面路由器 (Router) - 根據 State 切換組件 */}
      {/* ========================================== */}
      
      {/* 品牌故事頁面 */}
      {currentPage === 'brand' && <BrandStory navigateTo={handleNavigate} />}
      
      {/* 訂購流程頁面 */}
      {currentPage === 'process' && <OrderProcess navigateTo={handleNavigate} />}
      
      {/* 聯絡我們頁面 */}
      {currentPage === 'contact' && <ContactUs />}
      
      {/* 商品選購列表 */}
      {currentPage === 'list' && (
        <ProductList 
          cart={cart} 
          updateCart={updateCart} 
          handleQuantityChange={handleQuantityChange} 
          navigateTo={handleNavigate} 
        />
      )}

      {/* 結帳與表單頁面 */}
      {currentPage === 'order' && (
        <Checkout 
          cart={cart} 
          updateCart={updateCart} 
          handleQuantityChange={handleQuantityChange} 
          navigateTo={handleNavigate} 
          onOrderSuccess={handleOrderSuccess} 
          setAlertMsg={setAlertMsg}
        />
      )}

      {/* 下單成功頁面 */}
      {currentPage === 'success' && (
        <OrderSuccess 
          submittedOrder={submittedOrder} 
          navigateTo={handleNavigate} 
        />
      )}

      {/* 訂單查詢頁面 */}
      {currentPage === 'inquiry' && (
        <OrderInquiry 
          key={resetKey} // 💡 3. 新增：綁定 key。當 resetKey 改變時，React 會強制卸載並重新掛載此元件，達到完全清空狀態的效果
          setAlertMsg={setAlertMsg} 
        />
      )}

      {/* --- 頁尾 --- */}
      <Footer />
    </div>
  );
}

export default App;