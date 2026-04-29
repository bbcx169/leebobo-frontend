// src/pages/ProductList.jsx

import React from 'react';
import useScrollFadeIn from '../hooks/useScrollFadeIn';
import { products } from '../constants/data'; // 💡 修正 3：精準指向 data.js

// 💡 修正 1：移除 setCart，改由 App.jsx 統一傳入相關函數，並新增 setAlertMsg 進行防呆提示
const ProductList = ({ cart, updateCart, handleQuantityChange, navigateTo, setAlertMsg }) => {
  // 觸發滾動淡入動畫
  useScrollFadeIn();

  // 💡 顧問新增：前往購物車的防呆檢查
  const handleGoToCart = () => {
    // 計算購物車內所有品項的總數量
    const totalQty = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    if (totalQty === 0) {
      // 若總數為 0，則攔截跳轉並給予委婉提示
      setAlertMsg("您的購物車目前是空的，請先挑選喜歡的糖葫蘆喔！🍡");
      return;
    }

    // 若有商品，則順利前往購物車頁面 (結帳頁)
    navigateTo('order');
  };

  return (
    <div className="relative z-10 container mx-auto px-6 pt-32 pb-16 max-w-7xl fade-in-up">
      {/* 頁面標題區塊  */}
      <header className="text-center mb-16">
        <div className="inline-block relative cursor-pointer" onClick={handleGoToCart}>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-amberRed mb-4 tracking-widest drop-shadow-sm font-serif">商品選購</h1>
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-1.5 bg-warmWood rounded-full shadow-sm"></div>
        </div>
        <p className="mt-8 text-lg md:text-xl text-darkWood tracking-[0.2em] font-medium opacity-80">傳承寧夏夜市三十年・琥珀糖衣下的酸甜記憶</p>
      </header>

      {/* 產品網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {products.map((product) => (
          <div key={product.id} className="group relative rounded-3xl p-5 transition-all duration-500 ease-out bg-pureWhite/50 backdrop-blur-[10px] border border-pureWhite/80 shadow-[0_8px_32px_0_rgba(165,42,42,0.05)] hover:-translate-y-2 hover:bg-pureWhite/80 hover:shadow-[0_20px_40px_0_rgba(165,42,42,0.1)] hover:border-pureWhite flex flex-col h-full">
            
            {/* 圖片容器與價格圓標 */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-5 shadow-sm bg-pureWhite/60 flex items-center justify-center p-3">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-xl transition-transform duration-700 ease-in-out group-hover:scale-110 drop-shadow-sm mix-blend-multiply" loading="lazy" />
              <div className={`absolute top-3 ${product.id >= 1 && product.id <= 4 ? 'left-3' : 'right-3'} w-14 h-14 bg-amberRed rounded-full flex flex-col items-center justify-center text-white shadow-md border-2 border-pureWhite transform group-hover:rotate-12 transition-transform duration-300`}>
                <span className="text-[10px] font-medium opacity-90 -mb-1 tracking-wider">NT$</span>
                <span className="text-lg font-bold font-serif">{product.price}</span>
              </div>
            </div>

            {/* 產品資訊區 */}
            <div className="px-2 flex-grow flex flex-col text-left">
              <h3 className="text-xl font-bold text-amberRed mb-3 group-hover:text-darkWood transition-colors tracking-wide font-serif">{product.name}</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {product.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 text-xs font-bold tracking-widest rounded-full bg-warmWood/15 text-darkWood border border-warmWood/30 shadow-sm backdrop-blur-sm">{tag}</span>
                ))}
              </div>
              <p className="text-[13px] text-darkWood/70 leading-relaxed whitespace-pre-line group-hover:text-darkWood transition-colors flex-grow">{product.description}</p>
              
              {/* 數量控制區 */}
              <div className="mt-4 pt-4 border-t border-warmWood/30 flex items-center justify-between">
                <span className="text-sm font-bold text-darkWood/80">數量</span>
                <div className="flex items-center space-x-3 bg-pureWhite/80 rounded-full px-1 py-1 shadow-sm border border-pureWhite">
                  <button onClick={() => updateCart(product.id, -1)} className="w-8 h-8 rounded-full bg-pureWhite text-amberRed font-bold shadow-sm hover:bg-amberRed hover:text-white transition-colors flex items-center justify-center text-lg">-</button>
                  
                  {/* 💡 修正 2：補回隱藏 input number 預設箭頭的 Tailwind 與行內樣式 */}
                  <input 
                    type="number" 
                    min="0" 
                    value={cart[product.id] || 0} 
                    onChange={(e) => handleQuantityChange(product.id, e.target.value)} 
                    className="w-10 text-center font-bold text-darkWood bg-transparent border-none outline-none focus:ring-0 p-0 m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
                    style={{ MozAppearance: 'textfield' }}
                  />
                  
                  <button onClick={() => updateCart(product.id, 1)} className="w-8 h-8 rounded-full bg-pureWhite text-amberRed font-bold shadow-sm hover:bg-amberRed hover:text-white transition-colors flex items-center justify-center text-lg">+</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 底部跳轉按鈕 */}
      <div className="mt-12 flex justify-center">
        <button onClick={handleGoToCart} className="group relative flex items-center gap-3 px-8 py-4 bg-amberRed text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-darkWood transition-all">
          前往購物車
          <svg xmlns="http://www.w3.org/2000/svg" className="transform group-hover:translate-x-1 transition-transform" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ProductList;