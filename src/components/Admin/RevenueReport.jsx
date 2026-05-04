import React, { useState, useEffect } from 'react';
// ✨ 1. 引入 Firebase 相關方法
import { db } from '../../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';

// 產品對照表 (用於計算排行)
const PRODUCTS = {
  '1': { name: '蕃茄 (小/喜糖)', price: 20 },
  '2': { name: '蕃茄蜜餞 (小/喜糖)', price: 25 },
  '3': { name: '鳥梨 (小/喜糖)', price: 20 },
  '4': { name: '蕃茄+鳥梨 (小/喜糖)', price: 20 },
  '5': { name: '承租掃帚', price: 2000 },
  '6': { name: '蕃茄 (經典)', price: 30 },
  '7': { name: '蕃茄蜜餞 (經典)', price: 35 },
  '8': { name: '鳥梨 (經典)', price: 35 }
};

/**
 * RevenueReport - 營收報表組件 (Firebase 版本)
 */
export default function RevenueReport() {
  // ==========================================
  // 1. 狀態管理
  // ==========================================
  const [targetMonth, setTargetMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==========================================
  // 2. ✨ 從 Firebase 取得資料並在前端計算報表
  // ==========================================
  const fetchReport = async (month) => {
    setIsLoading(true);
    setError(null);
    try {
      const ordersRef = collection(db, "orders");
      const querySnapshot = await getDocs(ordersRef);

      let actualRevenue = 0;
      let totalDeposit = 0;
      let flavorCounts = {};
      let matchedOrdersCount = 0;

      querySnapshot.forEach((doc) => {
        const order = doc.data();
        
        // 篩選出「活動日期」開頭符合目標月份的訂單 (例如 "2026-05")
        if (order.eventDate && order.eventDate.startsWith(month)) {
          matchedOrdersCount++;

          // 計算金額
          const candySub = Number(order.candyTotal) || 0; 
          const bRent = Number(order.broomRent) || 0;    
          const bDep = Number(order.broomDeposit) || 0;
          const ship = Number(order.shippingFee) || 0;

          actualRevenue += (candySub + bRent + ship);
          totalDeposit += bDep;

          // 計算商品口味銷量
          if (order.cart) {
            Object.entries(order.cart).forEach(([id, qty]) => {
              if (id !== '5' && qty > 0) { 
                const flavorName = PRODUCTS[id] ? PRODUCTS[id].name : `口味_${id}`;
                flavorCounts[flavorName] = (flavorCounts[flavorName] || 0) + qty;
              }
            });
          }
        }
      });

      // 將口味統計轉換為陣列並排序 (由高到低)
      const sortedFlavors = Object.keys(flavorCounts)
        .sort((a, b) => flavorCounts[b] - flavorCounts[a])
        .map(name => ({ name, count: flavorCounts[name] }));

      // 更新畫面資料
      setReportData({ 
        targetMonth: month, 
        actualRevenue, 
        totalDeposit, 
        orderCount: matchedOrdersCount, 
        flavorStats: sortedFlavors 
      });

    } catch (err) {
      console.error("Firebase 獲取報表失敗:", err);
      setError('無法讀取資料庫，請確認網路連線或 Firebase 狀態');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    fetchReport(targetMonth);
  }, []);

  // 處理月份變更
  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    setTargetMonth(newMonth);
    fetchReport(newMonth);
  };

  // ==========================================
  // 3. 渲染 UI
  // ==========================================
  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 標題與月份選擇區 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-darkWood mb-2">營收報表</h2>
          <p className="text-gray-500 font-medium italic">依據活動執行日認列營收，精確區分押金與實收</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <span className="pl-4 font-bold text-gray-400 uppercase text-xs tracking-widest">查詢月份</span>
          <input 
            type="month" 
            value={targetMonth}
            onChange={handleMonthChange}
            className="px-4 py-2 bg-creamBg rounded-xl font-bold text-darkWood border-none focus:ring-2 focus:ring-amberRed"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amberRed mb-4"></div>
          <p className="text-gray-400 font-bold">李伯伯正在計算帳目中...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-red-50 text-red-600 rounded-3xl border border-red-100 font-bold text-center">
          ⚠️ 系統提示：{error}
        </div>
      ) : reportData ? (
        <>
          {/* 財務統計卡片區 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 實際營收 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">實際營收</p>
              <h3 className="text-3xl font-black text-emerald-600 mb-1">
                NT$ {reportData.actualRevenue.toLocaleString()}
              </h3>
              <p className="text-xs text-gray-400 font-medium">含糖葫蘆、掃帚租金與運費</p>
            </div>

            {/* 代收押金 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">代收押金</p>
              <h3 className="text-3xl font-black text-amber-500 mb-1">
                NT$ {reportData.totalDeposit.toLocaleString()}
              </h3>
              <p className="text-xs text-gray-400 font-medium">此為負債項目，活動後需退還</p>
            </div>

            {/* 完成訂單數 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">有效訂單</p>
              <h3 className="text-3xl font-black text-blue-600 mb-1">
                {reportData.orderCount} <span className="text-lg">筆</span>
              </h3>
              <p className="text-xs text-gray-400 font-medium">該月份已完成之活動總數</p>
            </div>
          </div>

          {/* 商品熱銷排行區 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-black text-darkWood">商品口味熱銷排行</h3>
              <div className="bg-creamBg px-4 py-1 rounded-full text-xs font-black text-amberRed uppercase tracking-widest">
                Product Statistics
              </div>
            </div>
            
            <div className="p-8">
              {reportData.flavorStats.length > 0 ? (
                <div className="space-y-8">
                  {reportData.flavorStats.map((stat, index) => {
                    // 計算長條圖比例 (以排行第一名為 100%)
                    const maxCount = reportData.flavorStats[0].count;
                    const percentage = maxCount > 0 ? (stat.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={stat.name} className="relative group">
                        <div className="flex justify-between items-end mb-3">
                          <div className="flex items-center gap-4">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-black ${
                              index === 0 ? 'bg-amberRed text-white' : 
                              index === 1 ? 'bg-orange-400 text-white' :
                              index === 2 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="font-bold text-darkWood text-lg">{stat.name}</span>
                          </div>
                          <span className="font-black text-darkWood text-xl">
                            {stat.count} <span className="text-xs text-gray-400 font-bold uppercase">支</span>
                          </span>
                        </div>
                        
                        {/* 背景軌道 */}
                        <div className="h-3 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                          {/* 動態長條圖 */}
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              index === 0 ? 'bg-amberRed' : 'bg-amberRed/30'
                            }`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">📊</div>
                  <p className="text-gray-400 font-bold text-lg">該月份目前尚無活動資料</p>
                </div>
              )}
            </div>

            {/* 頁尾提醒 */}
            <div className="bg-creamBg/30 p-6 text-center border-t border-gray-50">
              <p className="text-xs text-gray-400 font-bold tracking-wide">
                💡 提示：本報表數據已直接由 Firebase 資料庫即時運算產生。
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}