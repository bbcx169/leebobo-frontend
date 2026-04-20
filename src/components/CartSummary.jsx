// src/components/CartSummary.jsx

import React from 'react';
import { products } from '../constants/data';

const CartSummary = ({ 
  cart, 
  updateCart, 
  handleQuantityChange, 
  navigateTo, 
  candyQty, 
  broomQty, 
  candySubtotal, 
  broomRent, 
  broomDeposit, 
  shippingFee, 
  shippingHint, 
  totalPrice 
}) => {
  
  // 計算免運進度百分比 (最高鎖定在 100%)
  const freeShippingProgress = Math.min((candySubtotal / 5000) * 100, 100);

  return (
    <section className="w-full lg:w-5/12 bg-pureWhite/65 backdrop-blur-[12px] border border-pureWhite shadow-[0_10px_30px_-10px_rgba(165,42,42,0.08)] rounded-2xl p-6 md:p-8 lg:sticky lg:top-28 flex flex-col">
      
      <h2 className="text-2xl font-bold text-darkWood mb-6 flex items-center gap-2 shrink-0 font-serif">
        <svg className="w-6 h-6 text-amberRed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
        </svg> 
        挑選甜蜜組合
      </h2>
      
      <div className="space-y-4 mb-4 overflow-y-auto custom-scrollbar pr-2 min-h-[200px] max-h-[350px] xl:max-h-[450px]">
        {Object.keys(cart).length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center h-full">
              <p className="text-darkWood/50 mb-5 text-lg">您的購物車目前是空的喔！</p>
              <button type="button" onClick={() => navigateTo('list')} className="group inline-flex items-center gap-2 px-6 py-2.5 border-2 border-amberRed text-amberRed rounded-full font-bold tracking-widest hover:bg-amberRed hover:text-white transition-all shadow-sm hover:shadow-md">
                  <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  返回選購
              </button>
          </div>
        ) : (
          Object.entries(cart).map(([id, qty]) => {
            const p = products.find(prod => prod.id === parseInt(id)); 
            if (!p) return null;
            return (
              <div key={id} className="flex items-center justify-between p-3 bg-pureWhite/60 rounded-xl border border-pureWhite shadow-sm group transition-all hover:bg-white">
                
                <div className="flex-1 pr-2">
                  <h3 className="font-bold text-darkWood line-clamp-1">{p.name}</h3>
                  <span className="text-amberRed font-medium text-sm">NT$ {p.price}</span>
                </div>
                
                <div className="flex items-center gap-2 bg-pureWhite rounded-lg p-1 border border-warmWood/20 shadow-sm">
                  <button type="button" onClick={() => updateCart(p.id, -1)} className="w-7 h-7 flex items-center justify-center rounded text-darkWood/60 hover:bg-creamBg transition-colors">-</button>
                  <input 
                    type="number" 
                    min="0" 
                    value={qty} 
                    onChange={(e) => handleQuantityChange(p.id, e.target.value)} 
                    className="w-9 text-center font-bold text-darkWood bg-transparent border-none outline-none focus:ring-0 p-0 m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" 
                    style={{ MozAppearance: 'textfield' }}
                  />
                  <button type="button" onClick={() => updateCart(p.id, 1)} className="w-7 h-7 flex items-center justify-center rounded text-darkWood/60 hover:bg-creamBg transition-colors">+</button>
                </div>

                <button 
                  type="button" 
                  onClick={() => handleQuantityChange(p.id, 0)} 
                  className="ml-2 w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-darkWood/30 hover:bg-red-50 hover:text-amberRed transition-all shadow-sm border border-transparent hover:border-red-100"
                  title="移除此商品"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
                
              </div>
            );
          })
        )}
      </div>

      {/* 動態行銷提示與進度條區塊 */}
      {(candyQty > 0 || broomQty > 0) && (
        <div className="shrink-0 bg-pureWhite/80 rounded-xl p-4 mb-5 border border-warmWood/30 shadow-sm animate-[fadeIn_0.5s_ease-out]">
          
          {/* 最低起訂量提示 */}
          <div className="mb-4">
            {candyQty < 50 ? (
              <p className="text-[13px] text-amberRed font-bold flex items-center gap-1.5">
                <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                還差 {50 - candyQty} 支達最低出貨門檻 (50支)
              </p>
            ) : (
              <p className="text-[13px] text-[#06C755] font-bold flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                ✅ 已達 50 支最低出貨門檻
              </p>
            )}
          </div>

          {/* 免運門檻進度條 */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-darkWood/80 flex items-center gap-1">
                雙北免運進度
                <span className="text-[10px] font-normal opacity-70">(不含掃帚租押金)</span>
              </span>
              {candySubtotal >= 5000 ? (
                <span className="text-[#06C755] tracking-wide">🎉 已達標免運！</span>
              ) : (
                <span className="text-amberRed tracking-wide">再買 NT$ {(5000 - candySubtotal).toLocaleString()} 享免運</span>
              )}
            </div>
            <div className="w-full bg-creamBg rounded-full h-2.5 border border-warmWood/20 overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${candySubtotal >= 5000 ? 'bg-[#06C755]' : 'bg-gradient-to-r from-warmWood to-amberRed'}`} 
                style={{ width: `${freeShippingProgress}%` }}
              ></div>
            </div>
          </div>

        </div>
      )}

      {/* 結帳明細總計區塊 */}
      <div className="shrink-0 mt-auto pt-2 border-t border-warmWood/40">
        <div className="space-y-3 mt-4 mb-4">
          <div className="flex justify-between text-sm text-darkWood/70"><span>商品小計 ({candyQty} 支)</span><span>NT$ {candySubtotal.toLocaleString()}</span></div>
          {broomQty > 0 && (
            <>
              <div className="flex justify-between text-sm text-darkWood/70"><span>掃帚租金 ({broomQty} 組)</span><span>NT$ {broomRent.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm text-darkWood/70 items-center">
                <span className="flex items-center gap-1.5">
                  掃帚押金 
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shadow-sm tracking-widest">
                    (歸還後退回)
                  </span>
                </span>
                <span>NT$ {broomDeposit.toLocaleString()}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-sm text-darkWood/70"><span>配送運費 <span className="text-xs text-amberRed font-medium">{shippingHint}</span></span><span>NT$ {shippingFee.toLocaleString()}</span></div>
        </div>
        <hr className="border-warmWood/40 mb-4" />
        <div className="flex justify-between items-end">
          <span className="text-darkWood font-bold text-lg">預估總金額</span>
          <div className="text-right">
            <span className="text-sm text-amberRed mr-1 font-bold">NT$</span>
            <span className="text-3xl font-bold text-amberRed inline-block">{totalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartSummary;