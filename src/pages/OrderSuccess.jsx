import React, { useState, useEffect } from 'react';
// 🌟 引入共用收據積木
import OrderReceipt from '../components/OrderReceipt';
// 💡 引入商品目錄資料，解決明細變成空白的問題！
import { products } from '../constants/data'; 

const OrderSuccess = ({ submittedOrder, navigateTo, onNavigate }) => {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPdfDownloaded, setIsPdfDownloaded] = useState(false);
  
  // 💡 寄送 Email 相關狀態
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailStatus, setEmailStatus] = useState('idle'); // idle, loading, success, error
  const [emailErrMsg, setEmailErrMsg] = useState('');

  // 載入時自動帶入顧客先前填寫的 Email
  useEffect(() => {
    if (submittedOrder?.payload?.ordererEmail) {
      setEmailAddress(submittedOrder.payload.ordererEmail);
    }
  }, [submittedOrder]);

  // 💡 智慧導航處理
  const handleNavigate = (path) => {
    if (navigateTo) navigateTo(path);
    else if (onNavigate) onNavigate(path);
  };

  // 處理 PDF 下載功能
  const handleDownloadPDF = (url) => {
    if (url) {
      window.open(url, '_blank');
      setIsPdfDownloaded(true);
    } else {
      alert("⚠️ 尚未取得 PDF 下載連結，請稍後再試或聯繫客服。");
    }
  };

  // 💡 處理寄送 PDF 的 API 請求
  const handleSendEmail = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      setEmailErrMsg("信箱格式不正確，請輸入有效的 Email");
      setEmailStatus('error');
      return;
    }

    setEmailStatus('loading');
    setEmailErrMsg('');

    try {
      const SCRIPT_URL = import.meta.env.VITE_GAS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzf8kJ6Ka8yGabg--MCRJ8eyucBbsGRDbceGEeH-CQDLqOMXhTCysZVrPKL0MLpSg4L/exec';
      
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'resendPdf',
          orderNumber: submittedOrder.orderNumber,
          email: emailAddress
        })
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        setEmailStatus('success');
        // 成功後 3 秒自動收合輸入框
        setTimeout(() => setShowEmailInput(false), 3000);
      } else {
        setEmailStatus('error');
        setEmailErrMsg(result.message || "發送失敗，請聯繫客服");
      }
    } catch (error) {
      setEmailStatus('error');
      setEmailErrMsg("網路連線異常，請稍後再試");
    }
  };

  if (!submittedOrder) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center pt-32 pb-16">
        <div className="w-16 h-16 bg-[#FAF7F2] rounded-full flex items-center justify-center mb-4 border border-[#D2B48C]/30">
          <svg className="w-8 h-8 text-[#D2B48C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <p className="text-[#3E2723]/80 mb-2 text-xl font-bold">目前沒有剛送出的訂單紀錄喔！</p>
        <p className="text-[#3E2723]/50 mb-8 text-sm text-center">如果您剛送出訂單，可能是畫面重新載入導致資料遺失。<br/>您可以前往「訂單查詢」查看紀錄。</p>
        <div className="flex gap-4">
            <button onClick={() => handleNavigate('list')} className="px-6 py-2.5 border-2 border-[#A52A2A] text-[#A52A2A] hover:bg-[#A52A2A] hover:text-white transition-colors rounded-full font-bold">返回商品選購</button>
            <button onClick={() => handleNavigate('inquiry')} className="px-6 py-2.5 bg-[#A52A2A] text-white rounded-full font-bold shadow-md hover:bg-[#802020] transition-colors">前往訂單查詢</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 pt-32 pb-16 animate-[fadeIn_0.8s_ease-out]">
      
      {/* --- 成功提示卡片 --- */}
      <div className="bg-white/95 border border-white shadow-[0_15px_40px_-10px_rgba(165,42,42,0.1)] rounded-3xl p-6 md:p-12 text-center mb-8">
        <div className="w-20 h-20 bg-[#06C755]/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-[#06C755]/20">
          <svg className="w-10 h-10 text-[#06C755]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-[#3E2723] mb-4 font-serif">訂單已成功送出！</h2>
        <p className="text-[#3E2723]/70 text-lg mb-8">感謝您的訂購，專人將盡快與您聯繫確認訂單細節。</p>

        <div className="bg-[#06C755]/10 border border-[#06C755]/30 text-[#06C755] p-4 rounded-xl text-sm font-bold mb-8 flex items-center justify-center gap-3">
            ✅ 訂單已成功寫入系統！{submittedOrder.payload?.ordererEmail ? '明細已自動寄送至您的信箱。' : '您可以點擊下方按鈕下載或寄送 PDF 留存。'}
        </div>
      </div>

      {/* --- 訂單明細與 PDF 下載/寄送按鈕 --- */}
      <div className="mb-8">
        <OrderReceipt order={submittedOrder} products={products} />
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4 mt-6">
          <button 
            onClick={() => handleDownloadPDF(submittedOrder.pdfDownloadUrl)} 
            className={`inline-flex items-center justify-center gap-2 text-white py-3.5 px-8 rounded-xl font-bold shadow-md transition-all w-full sm:w-auto ${isPdfDownloaded ? 'bg-[#06C755] hover:bg-[#05b34c]' : 'bg-[#3E2723] hover:bg-[#2A1A17]'}`}
          >
            {isPdfDownloaded ? (
              <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg> 再次下載</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> 下載明細 (PDF)</>
            )}
          </button>

          <button 
            onClick={() => setShowEmailInput(!showEmailInput)} 
            className="inline-flex items-center justify-center gap-2 bg-white text-[#A52A2A] border-2 border-[#A52A2A] py-3.5 px-8 rounded-xl font-bold shadow-sm transition-all hover:bg-[#A52A2A] hover:text-white w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            寄送明細 (PDF)
          </button>
        </div>

        {/* 💡 Email 展開輸入區塊 */}
        {showEmailInput && (
          <div className="bg-[#FAF7F2] border border-[#D2B48C]/50 rounded-xl p-5 max-w-md mx-auto animate-[fadeIn_0.3s_ease-out] shadow-inner text-center">
            <p className="text-sm text-[#3E2723]/80 font-bold mb-3">請確認或輸入要接收明細的電子信箱：</p>
            <div className="flex flex-col gap-3">
              <input 
                type="email" 
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="例如：yourname@example.com"
                className="w-full px-4 py-3 rounded-lg border border-[#D2B48C]/50 focus:outline-none focus:ring-2 focus:ring-[#A52A2A] bg-white text-[#3E2723]"
              />
              {/* 💡 這裡就是修改為綠色的按鈕 */}
              <button 
                onClick={handleSendEmail}
                disabled={emailStatus === 'loading' || !emailAddress}
                className="w-full bg-[#06C755] hover:bg-[#05b34c] disabled:bg-[#06C755]/50 text-white font-bold py-3 rounded-lg shadow-sm transition-all"
              >
                {emailStatus === 'loading' ? '處理中，請稍候...' : '確認發送'}
              </button>
            </div>
            {emailStatus === 'error' && <p className="text-red-500 text-sm mt-3 font-bold">{emailErrMsg}</p>}
            {emailStatus === 'success' && <p className="text-[#06C755] text-sm mt-3 font-bold">✅ 明細已成功寄出！請至信箱查收。</p>}
          </div>
        )}
      </div>

      <hr className="border-[#D2B48C]/30 mb-8" />

      {/* --- 行銷活動：LINE 照片募集 --- */}
      <div className="bg-gradient-to-br from-[#FFF8F8] to-white border border-[#A52A2A]/20 rounded-2xl p-6 md:p-8 text-left shadow-[0_8px_24px_rgba(165,42,42,0.05)] mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#A52A2A]/10 text-[#A52A2A] text-xs font-bold rounded-full tracking-widest mb-4 border border-[#A52A2A]/20">✨ 完成訂單特惠獨享</div>
          <h3 className="text-2xl font-bold text-[#3E2723] mb-4 font-serif">【LINE 照片募集】分享甜蜜時刻</h3>
          <p className="text-[#3E2723]/80 text-sm md:text-base leading-relaxed mb-6">那一場盛宴中，糖葫蘆的紅豔與甜脆，是否為您留下了美好印象？<br className="hidden md:block" />我們正在募集大家手機裡的精彩瞬間！只要您願意與我們分享這份甜蜜，我們就請您吃最道地的寧夏夜市糖葫蘆。</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-[#D2B48C]/30 shadow-sm flex flex-col gap-2">
              <h4 className="font-bold text-[#3E2723] flex items-center gap-2 text-base"><span className="text-2xl">📸</span> 募集任務</h4>
              <p className="text-sm text-[#3E2723]/70 leading-relaxed mt-1">上傳 <span className="font-bold text-[#A52A2A]">5-10 張</span> 活動/婚宴現場清晰糖葫蘆照片至 LINE 官方帳號。</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl border border-[#D2B48C]/30 shadow-sm flex flex-col gap-2">
              <h4 className="font-bold text-[#3E2723] flex items-center gap-2 text-base"><span className="text-2xl">🎁</span> 任務獎勵</h4>
              <p className="text-sm text-[#3E2723]/70 leading-relaxed mt-1">官方回覆確認後，憑訊息至攤位：<br/>👉 免費兌換 <span className="font-bold text-[#A52A2A] text-lg">5 支</span> 糖葫蘆！<br/><span className="text-xs opacity-70 block mt-1">【40 元（含）以下品項，口味任選】</span></p>
            </div>
          </div>

          <div className={`mt-6 rounded-xl bg-white/60 overflow-hidden transition-all duration-300 ${isTermsOpen ? 'border border-[#A52A2A]/30 shadow-sm' : 'border-2 border-[#A52A2A] shadow-[0_0_15px_rgba(165,42,42,0.3)]'}`}>
            <button
              onClick={() => setIsTermsOpen(!isTermsOpen)}
              className={`w-full px-4 md:px-5 py-4 flex justify-between items-center transition-colors text-left ${isTermsOpen ? 'bg-[#A52A2A]/5 hover:bg-[#A52A2A]/10' : 'bg-gradient-to-r from-[#A52A2A] to-[#802020] hover:from-[#802020] hover:to-[#A52A2A]'}`}
            >
              <span className={`font-bold flex items-center gap-2 text-[13px] md:text-sm tracking-wide ${isTermsOpen ? 'text-[#A52A2A]' : 'text-white'}`}>
                <span className={isTermsOpen ? '' : 'animate-pulse'}>👉 參加【LINE 照片募集】活動前，請先花一分鐘閱讀《照片使用授權聲明》</span>
              </span>
              <svg className={`w-5 h-5 shrink-0 transform transition-transform duration-300 ${isTermsOpen ? 'rotate-180 text-[#A52A2A]' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isTermsOpen ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-5 md:p-6 text-sm text-[#3E2723]/80 text-left space-y-6 border-t border-[#A52A2A]/20 bg-white/90">
                  <div>
                      <h4 className="font-bold text-[#802020] mb-2 text-base">一、 授權內容與用途</h4>
                      <p className="leading-relaxed mb-2">您同意將本次提供給本品牌（冰糖璃工作室）之所有照片（以下稱「授權照片」），無償且非專屬授權予本品牌使用。本品牌得將授權照片用於官方網站、社群媒體（包含但不限於 Facebook、Instagram、LINE 官方帳號等）及實體宣傳物，進行以下用途：</p>
                      <ul className="list-disc pl-5 space-y-1.5">
                        <li><strong className="text-[#3E2723]">活動宣傳：</strong>未來相關檔期與活動之推廣。</li>
                        <li><strong className="text-[#3E2723]">產品行銷：</strong>糖葫蘆產品、婚禮喜糖、掃帚租借等服務之視覺素材。</li>
                        <li><strong className="text-[#3E2723]">成果呈現：</strong>品牌歷程紀錄與活動精華分享。</li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold text-[#802020] mb-2 text-base">二、 授權權利與方式</h4>
                      <ul className="list-disc pl-5 space-y-1.5">
                        <li>您同意本品牌在上述用途範圍內，擁有對授權照片進行重製、公開傳輸、公開播送、公開展示之權利。</li>
                        <li>為配合各平台版面配置與品牌視覺，本品牌得對授權照片進行合理之改作（包含但不限於裁切、調整色調、添加品牌 Logo 或活動排版文字）。</li>
                        <li>本授權為全球性、無期限且無償之授權。本品牌承諾照片僅作前述品牌營運行銷用途，絕不將照片單獨作為商品進行販售。</li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold text-[#802020] mb-2 text-base">三、 權利擔保與肖像權</h4>
                      <ul className="list-disc pl-5 space-y-1.5">
                        <li>您聲明並保證您是授權照片的合法著作權人，或已取得著作權人之合法同意。</li>
                        <li>若授權照片中包含您以外之他人清晰面貌（例如：親友、婚宴賓客），請務必確認已取得該當事人之「肖像權使用同意」。</li>
                        <li>若因照片內容引發著作權或肖像權等侵權爭議，將由提供照片之參加者自行承擔相關法律責任，概與本品牌無涉。</li>
                      </ul>
                  </div>
                  <div>
                      <h4 className="font-bold text-[#802020] mb-2 text-base">四、 隱私與退出機制</h4>
                      <p className="leading-relaxed">本品牌十分珍視您的心意。若您未來改變心意，不希望照片繼續在官方平台上公開展示，可隨時透過 LINE 官方帳號聯繫我們，本品牌將於合理作業時間內將您的照片從官方經營之數位平台上移除。</p>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[#3E2723]/80 text-base mb-6 text-center"><span className="text-[#A52A2A] font-bold inline-block">請務必加入 LINE 官方帳號留言，以利後續聯繫與確認訂單唷！</span></p>
      
      {/* --- LINE 強制導流區塊 --- */}
      <div className="bg-gradient-to-br from-[#FAF7F2] to-[#D2B48C]/30 border border-[#D2B48C]/50 rounded-2xl p-6 md:p-8 max-w-md mx-auto shadow-sm relative overflow-hidden text-center">
        <h3 className="text-xl md:text-2xl font-bold text-[#A52A2A] mb-2 tracking-wide font-serif">🎁 加入 LINE 官方帳號</h3>
        <p className="text-[#3E2723]/80 font-medium mb-6">立刻領取專屬優惠券！</p>
        <img src="https://qr-official.line.me/gs/M_687vjdlz_GW.png?oat_content=qr" alt="LINE 官方帳號 QR Code" className="w-40 h-40 md:w-48 md:h-48 object-contain mx-auto mb-6 bg-white p-2 rounded-xl shadow-sm border border-white/50" loading="lazy" />
        <a href="https://lin.ee/5QYll8k" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-lg py-3.5 px-6 rounded-xl shadow-md transition-transform hover:-translate-y-1">
          點此加入好友
        </a>
      </div>

      <div className="mt-10">
        <button onClick={() => handleNavigate('list')} className="text-[#D2B48C] font-bold hover:text-[#A52A2A] transition-colors flex items-center justify-center gap-2 mx-auto tracking-widest">
          ← 返回選購繼續逛逛
        </button>
      </div>
    </div>
  );
};

export default OrderSuccess;