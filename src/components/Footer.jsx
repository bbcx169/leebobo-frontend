// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // 👈 引入 Link 元件以實現內部路由跳轉

// 👇 1. 從 assets/images/Footer 資料夾匯入圖片
import lineIcon from '../assets/images/Footer/line.png';
import fbIcon from '../assets/images/Footer/facebook.png';
import nmIcon from '../assets/images/Footer/nightmarket.png';
import logoIcon from '../assets/images/Footer/logo.png';

const Footer = () => {
  return (
    <footer className="bg-traditional-pattern relative text-darkWood py-12 border-t border-warmWood/40 shadow-inner mt-auto">
      {/* 背景裝飾層 */}
      <div className="absolute inset-0 bg-pureWhite/50 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* 左側：品牌資訊與聯絡方式 */}
        <div className="lg:col-span-5 text-center lg:text-left space-y-5">
          <h4 className="font-serif text-xl text-amberRed tracking-widest font-bold">寧夏夜市古早味糖葫蘆</h4>
          <ul className="space-y-4 text-darkWood/80 font-sans text-sm md:text-base">
            <li className="flex items-start justify-center lg:justify-start gap-3">
              <span className="mt-1.5 inline-block w-2.5 h-2.5 rounded-full bg-warmWood shrink-0"></span>
              <span className="text-left">地址：臺北市大同區寧夏夜市第61號攤位<br/>(蓬萊國小前)</span>
            </li>
            <li className="flex items-center justify-center lg:justify-start gap-3">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-warmWood shrink-0"></span>
              <span>聯絡電話：0912-294-022</span>
            </li>
            <li className="flex items-center justify-center lg:justify-start gap-3">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-warmWood shrink-0"></span>
              <span>營業時間：18:00 ~ 23:00</span>
            </li>
          </ul>
        </div>

        {/* 右側：社群媒體與相關連結圖示 */}
        <div className="lg:col-span-7 flex flex-wrap justify-center lg:justify-end items-center gap-6 lg:gap-10">
          <a href="https://line.me/R/ti/p/@687vjdlz?oat_content=url&ts=04100108" target="_blank" rel="noopener noreferrer" className="block hover:scale-105 transition-transform duration-300">
            <img src={lineIcon} alt="LINE 官方帳號" className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 object-contain rounded-xl drop-shadow-md" loading="lazy" />
          </a>
          <a href="https://www.facebook.com/ningxia.tanghulu" target="_blank" rel="noopener noreferrer" className="block hover:scale-105 transition-transform duration-300">
            <img src={fbIcon} alt="Facebook 粉絲專頁" className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 object-contain rounded-xl drop-shadow-md" loading="lazy" />
          </a>
          <a href="https://www.facebook.com/profile.php?id=100057620284780" target="_blank" rel="noopener noreferrer" className="block hover:scale-105 transition-transform duration-300">
            <img src={nmIcon} alt="寧夏夜市" className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 object-contain" loading="lazy" />
          </a>
          
          {/* 🚀 【精確修改區塊】僅將 <a> 替換為 <Link to="/admin">，其他完全不變 */}
          <Link to="/admin" className="block hover:scale-105 transition-transform duration-300">
            <img src={logoIcon} alt="冰糖璃" className="h-20 md:h-24 lg:h-28 w-auto object-contain drop-shadow-md" loading="lazy" />
          </Link>
        </div>
      </div>

      {/* 底部版權宣告 */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 mt-12 text-center text-xs font-sans text-darkWood/60">
        Copyright © 2026 冰糖璃工作室. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;