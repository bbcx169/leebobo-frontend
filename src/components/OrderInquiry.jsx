import React, { useState } from 'react';
import { products } from '../constants/data';
import useScrollFadeIn from '../hooks/useScrollFadeIn';
import OrderReceipt from '../components/OrderReceipt';

// 讀取環境變數 API
const SCRIPT_URL = import.meta.env.VITE_GAS_SCRIPT_URL;

const OrderInquiry = ({ setAlertMsg }) => {
  // 載入與訂購流程一致的滾動淡入動畫邏輯
  useScrollFadeIn();

  // 查詢相關狀態
  const [inqName, setInqName] = useState('');
  const [inqPhone, setInqPhone] = useState('');
  const [inqDate, setInqDate] = useState('');
  const [inqStatus, setInqStatus] = useState('idle'); 
  const [inqData, setInqData] = useState(null); 
  const [inqMatches, setInqMatches] = useState([]);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [isPdfDownloaded, setIsPdfDownloaded] = useState(false);

  // --- 查詢 API 邏輯 ---
  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setIsPdfDownloaded(false);

    // 🚀 嚴格前端驗證：確保手機格式為 10 位數字，且為 09 開頭
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(inqPhone)) {
        setAlertMsg(["⚠️ 手機號碼格式錯誤", "請輸入 10 位數字的手機號碼 (例如: 0912345678)！"]);
        return;
    }

    if (!inqName || !inqPhone || !inqDate) { 
        setAlertMsg("請完整填寫所有查詢欄位！"); 
        return; 
    }
    
    setInqStatus('loading');
    try {
        const url = `${SCRIPT_URL}?action=query_order&name=${encodeURIComponent(inqName)}&phone=${encodeURIComponent(inqPhone)}&date=${encodeURIComponent(inqDate)}`;
        const res = await fetch(url);
        const resData = await res.json();
        
        if (resData.status === 'success') {
            if (resData.data.length > 1) {
                setInqMatches(resData.data); 
                setInqStatus('multiple_matches');
            } else if (resData.data.length === 1) {
                setInqMatches(resData.data); 
                setInqData(resData.data[0]); 
                setResendEmail(resData.data[0].ordererEmail || ''); 
                setInqStatus('success');
            } else { 
                setInqStatus('not_found'); 
            }
        } else { 
            setInqStatus('not_found'); 
        }
    } catch (err) { 
        console.error(err); 
        setInqStatus('error');
        setAlertMsg(["⚠️ 查詢連線失敗", "請檢查您的網路連線，或稍後再重試。"]);
    }
  };

  const handleDownloadPDF = (url) => {
    if (url) { 
        window.open(url, '_blank'); 
        setIsPdfDownloaded(true); 
    } else { 
        setAlertMsg("⚠️ 尚未取得 PDF 下載連結，請稍後再試或聯繫客服。"); 
    }
  };

  const handleResendEmail = async () => {
      if (!resendEmail) { 
          setAlertMsg("請輸入聯絡信箱！"); 
          return; 
      }
      setIsResending(true);
      try {
          const response = await fetch(SCRIPT_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ action: 'resendPdf', orderNumber: inqData.orderNumber, email: resendEmail })
          });
          const result = await response.json();
          if (result.status === 'success') {
              setAlertMsg("✅ 訂單 PDF 明細已成功補發至您的信箱！"); 
              setShowEmailPrompt(false);
          } else { 
              setAlertMsg(["補發失敗，請稍後再試。", `錯誤：${result.message}`]); 
          }
      } catch(err) { 
          setAlertMsg(["補發失敗，請稍後再試。", `錯誤：${err.message}`]); 
      } finally { 
          setIsResending(false); 
      }
  };

  const handleGoBack = () => {
      setShowEmailPrompt(false);
      setIsPdfDownloaded(false);
      
      if (inqMatches.length > 1) {
          setInqStatus('multiple_matches');
          setInqData(null);
      } else {
          setInqStatus('idle');
          setInqName('');
          setInqPhone('');
          setInqDate('');
          setInqMatches([]);
          setInqData(null);
      }
  };

  return (
    <div className="relative z-10 container mx-auto px-4 sm:px-6 pt-32 pb-12 lg:pb-20 max-w-5xl">
        
        <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#D2B48C] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse"></div>
            <div className="absolute inset-0 bg-wood-texture mix-blend-overlay opacity-40"></div>
        </div>

        <header className="text-center mb-12 fade-in-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-amberRed mb-4 tracking-widest font-serif drop-shadow-sm">訂單查詢</h1>
            <div className="mx-auto w-24 h-1.5 bg-warmWood rounded-full shadow-sm mb-6"></div>
            <p className="text-lg md:text-xl text-darkWood tracking-[0.15em] font-medium opacity-90">隨時掌握您的甜蜜預約進度</p>
        </header>

        {inqStatus === 'multiple_matches' ? (
            <div className="bg-pureWhite/95 border border-pureWhite shadow-xl rounded-2xl p-6 md:p-10 mx-auto max-w-2xl relative overflow-hidden animate-[fadeIn_0.5s_ease-out]">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-warmWood to-amberRed"></div>
                <h3 className="text-2xl font-bold text-darkWood mb-4 font-serif text-center">找到多筆符合的訂單</h3>
                <p className="text-darkWood/80 font-medium mb-8 text-center">您在同一天有多筆預約，請選擇您要查看的明細：</p>
                
                <div className="space-y-4">
                    {inqMatches.map((order, idx) => (
                        <div key={idx} onClick={() => { 
                            setInqData(order); 
                            setResendEmail(order.ordererEmail || ''); 
                            setInqStatus('success'); 
                            setIsPdfDownloaded(false); 
                        }} className="bg-pureWhite/80 hover:bg-white border border-warmWood/30 hover:border-amberRed cursor-pointer p-5 rounded-xl shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                            <div>
                                <p className="font-bold text-darkWood mb-1 text-lg">訂購時間：{order.orderDate} {order.orderTime}</p>
                                <p className="text-sm text-darkWood/70">總金額：NT$ {order.totalPrice.toLocaleString()}</p>
                            </div>
                            <div className="text-amberRed transform group-hover:translate-x-2 transition-transform">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-8 text-center border-t border-warmWood/20 pt-6">
                    <button onClick={() => { setInqStatus('idle'); setInqName(''); setInqPhone(''); setInqDate(''); setInqMatches([]); }} className="text-warmWood font-bold hover:text-darkWood transition-colors">
                        ← 返回重新查詢
                    </button>
                </div>
            </div>
        ) : (inqStatus === 'idle' || inqStatus === 'loading' || inqStatus === 'error' || inqStatus === 'not_found') ? (
            <div className="bg-pureWhite/95 border border-pureWhite shadow-xl rounded-2xl p-6 md:p-10 mx-auto max-w-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-warmWood to-amberRed"></div>
                <p className="text-darkWood/80 font-medium mb-8 text-center">請輸入以下三項資訊進行身分驗證，以確保您的個資安全。</p>
                
                <form onSubmit={handleInquirySubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-darkWood mb-1">訂購人姓名</label>
                        <input type="text" required value={inqName} onChange={e=>setInqName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite focus:outline-none focus:ring-2 focus:ring-amberRed transition-colors" placeholder="例：王大明" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-darkWood mb-1">訂購人手機號碼</label>
                        {/* 🚀 嚴格限制：新增 minLength 並強化 pattern */}
                        <input 
                            type="tel" 
                            required 
                            pattern="09[0-9]{8}" 
                            maxLength="10" 
                            minLength="10"
                            title="請輸入 10 位數字的手機號碼 (需為 09 開頭)"
                            value={inqPhone} 
                            onChange={e=> {
                                // 確保只能輸入數字
                                const val = e.target.value.replace(/\D/g, '');
                                setInqPhone(val);
                            }} 
                            className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite focus:outline-none focus:ring-2 focus:ring-amberRed transition-colors" 
                            placeholder="例：0912345678" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-darkWood mb-1">活動日期 <span className="text-xs text-amberRed font-bold ml-1 tracking-wider">(請選西元年)</span></label>
                        <input type="date" required value={inqDate} onChange={e=>setInqDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 bg-pureWhite focus:outline-none focus:ring-2 focus:ring-amberRed transition-colors" />
                    </div>
                    <button type="submit" disabled={inqStatus === 'loading'} className="w-full bg-amberRed hover:bg-darkWood disabled:bg-warmWood/50 text-white font-bold text-lg py-4 rounded-xl shadow-md transition-all mt-4">
                        {inqStatus === 'loading' ? '安全驗證與查詢中...' : '送出查詢'}
                    </button>
                </form>

                {inqStatus === 'not_found' && (
                    <div className="mt-8 bg-red-50 border border-red-200 text-amberRed p-5 rounded-xl text-sm leading-relaxed">
                        <strong>⚠️ 找不到符合的訂單。</strong><br/><br/>請確認您的資料是否正確？
                        <a href="https://lin.ee/5QYll8k" target="_blank" rel="noopener noreferrer" className="mt-3 block text-center bg-[#06C755] text-white py-2 rounded-lg font-bold w-full hover:bg-[#05b34c] transition-colors">聯繫 LINE 客服協助</a>
                    </div>
                )}
            </div>
        ) : (
            <div className="bg-pureWhite/95 border border-pureWhite shadow-xl rounded-3xl p-6 md:p-12 text-center animate-[fadeIn_0.5s_ease-out]">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="text-3xl font-bold mb-4 font-serif text-darkWood">查詢成功！</h2>
                <p className="text-darkWood/70 mb-8">以下為您的訂單明細紀錄。</p>

                <div className="mb-8 text-left">
                    <OrderReceipt 
                        order={{
                            orderNumber: inqData.orderNumber,
                            payload: inqData, 
                            cart: inqData.cart, 
                            candyQty: Object.entries(inqData.cart).reduce((s, [id, q]) => parseInt(id) !== 5 ? s + q : s, 0),
                            broomQty: inqData.cart['5'] || 0, 
                            candySubtotal: inqData.candySubtotal, 
                            broomRent: inqData.broomRent,
                            broomDeposit: inqData.broomDeposit, 
                            shippingFee: inqData.shippingFee, 
                            totalPrice: inqData.totalPrice
                        }} 
                        products={products}
                    />
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                    <button onClick={() => handleDownloadPDF(inqData.pdfDownloadUrl)} className={`inline-flex items-center justify-center gap-2 text-white py-3.5 px-8 rounded-xl font-bold shadow-md transition-all w-full sm:w-auto ${isPdfDownloaded ? 'bg-[#06C755] hover:bg-[#05b34c]' : 'bg-darkWood hover:bg-[#2A1A17]'}`}>
                        {isPdfDownloaded ? "✅ 下載完成" : "📄 下載訂單明細 (PDF)"}
                    </button>
                    <button onClick={() => setShowEmailPrompt(!showEmailPrompt)} className="inline-flex items-center justify-center gap-2 bg-amberRed hover:bg-[#802020] text-white py-3.5 px-8 rounded-xl font-bold shadow-md transition-all w-full sm:w-auto">
                        📧 傳送 PDF (Email)
                    </button>
                </div>

                {showEmailPrompt && (
                    <div className="bg-creamBg border border-warmWood/30 p-6 rounded-2xl max-w-md mx-auto mb-8 animate-[fadeIn_0.3s_ease-out]">
                        <h4 className="font-bold text-darkWood mb-3">請輸入欲接收明細的信箱：</h4>
                        <input type="email" value={resendEmail} onChange={e=>setResendEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-warmWood/30 mb-4 focus:ring-2 focus:ring-amberRed outline-none" placeholder="example@gmail.com" />
                        <button onClick={handleResendEmail} disabled={isResending} className="w-full bg-[#06C755] text-white font-bold py-3 rounded-xl hover:bg-[#05b34c] disabled:opacity-50">
                            {isResending ? "傳送中..." : "確認傳送"}
                        </button>
                    </div>
                )}

                <div className="mt-8 border-t border-warmWood/20 pt-6">
                   <button onClick={handleGoBack} className="text-amberRed font-bold hover:text-darkWood transition-colors">
                      {inqMatches.length > 1 ? '← 返回訂單列表' : '← 查詢其他訂單'}
                   </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default OrderInquiry;