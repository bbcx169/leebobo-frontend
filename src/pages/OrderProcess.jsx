import React, { useState } from 'react';
// ⚠️ 注意這裡：沒有大括號的預設匯入
import useScrollFadeIn from '../hooks/useScrollFadeIn';

const OrderProcess = ({ navigateTo }) => {
    // 啟用滾動淡入動畫
    useScrollFadeIn();
    
    // 控制 FAQ 展開狀態
    const [openFaqId, setOpenFaqId] = useState("cat-0-item-0");
    
    const timelineSteps = [
        { id: 1, title: "挑選品項", desc: ["選擇經典或婚禮系列", "確認商品口味與數量"], icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg> },
        { id: 2, title: "確認門檻", desc: ["最低起訂量 50 支", "活動日前 14 天預訂"], icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> },
        { id: 3, title: "填寫資訊", desc: ["選擇您的活動類別", "填寫精確收貨與場地資訊"], icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg> },
        { id: 4, title: "送出訂單", desc: ["確認總金額與運費", "系統自動生成 PDF 備份"], icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> },
        { id: 5, title: "LINE 確認", desc: ["加入李伯伯官方 LINE", "傳送訂單編號進行確認"], icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.122.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.572-3.843 2.572-5.992z"/></svg> }
    ];

    const faqCategories = [
        { category: "📦 關於訂購規範", items: [{ q: "最低訂購數量是多少？", a: "為了維持職人熬糖的品質與新鮮度，單筆訂單糖葫蘆總數需達 50 支（不限口味組合）才予出貨。" }, { q: "我需要提前多久訂購？", a: "所有產品皆為接單後新鮮製作。請務必於活動日前 14 天完成預訂，以利職人備料。" }, { q: "送出訂單後如何確認是否成功？", a: "送出後系統會生成 PDF 明細，請務必點擊連結加入「LINE 官方帳號」告知訂單編號，待專人核對細節後訂單才正式成立。" }, { q: "可以更改訂購數量或口味嗎？", a: "若需調整請於活動日 7 天前透過 LINE 或 電話 聯繫。因 14 天內已進入備料階段，我們將盡力協助但不保證能修改。" }] },
        { category: "🚚 配送與取貨", items: [{ q: "運費如何計算？", a: "臺北市與新北市：商品金額滿 $5,000 元享免運；未達門檻則酌收 $350 元運費。外縣市：目前受限於物流品質，暫不提供宅配，需由顧客配合自取。" }, { q: "可以指定精準的送達時間嗎？", a: "可選擇時段，但受路況影響，建議將收貨時間設定在活動開始前 1-2 小時，保留彈性緩衝。" }] },
        { category: "❄️ 食用與保存", items: [{ q: "糖葫蘆可以保存多久？", a: "糖衣極易受濕度與溫度影響，我們堅持無添加。強烈建議在收貨後 2 小時內食用完畢口感最佳。" }, { q: "如果不立刻吃，該怎麼保存？", a: "請務必放入「冷藏」保存。注意：請勿放入冷凍庫，以免糖衣因溫差退冰而融化受潮。" }, { q: "李伯伯的糖葫蘆會黏牙嗎？", a: "不會。李伯伯堅持古法手工熬製糖漿，特點是糖衣「薄、脆、不黏牙」。" }] },
        { category: "🌹 婚禮專屬：甜蜜常見問題", items: [{ q: "婚禮系列與一般款有什麼不同？", a: "婚禮系列專為喜宴設計，採用小巧好入口的「喜糖尺寸」，並賦予「永結同心」、「佳偶天成」等專屬寓意。" }, { q: "糖葫蘆有附包裝嗎？可以當二進禮嗎？", a: "有的。每支均附透明包裝與喜慶紅心貼紙，非常適合直接作為桌上禮或二進小禮使用。" }, { q: "什麼時間點收貨最合適？", a: "強烈建議將收貨時間設定在宴客開始前 2 小時，並請婚企人員協助先存放在冷藏環境。" }] }
    ];

    return (
        <div className="relative z-10 container mx-auto px-4 sm:px-6 pt-32 pb-12 lg:pb-20 max-w-5xl">
            {/* 背景特效 */}
            <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#D2B48C] rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-pulse"></div>
                <div className="absolute inset-0 bg-wood-texture mix-blend-overlay opacity-40"></div>
            </div>

            <header className="text-center mb-12 fade-in-up">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-amberRed mb-4 tracking-widest font-serif drop-shadow-sm">訂購流程</h1>
                <div className="mx-auto w-24 h-1.5 bg-warmWood rounded-full shadow-sm mb-6"></div>
                <p className="text-lg md:text-xl text-darkWood tracking-[0.15em] font-medium opacity-90">將寧夏夜市的甜蜜，原封不動送到您手中</p>
            </header>

            {/* 溫馨提醒區塊 */}
            <div className="mb-16 transform transition-all hover:scale-[1.01] fade-in-up">
                <div className="bg-gradient-to-r from-[#A52A2A]/10 to-[#A52A2A]/5 border border-[#A52A2A]/30 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm backdrop-blur-md">
                    <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 bg-white border-2 border-[#A52A2A]/20 rounded-full flex items-center justify-center text-amberRed shadow-sm relative overflow-hidden">
                        <svg className="w-7 h-7 md:w-8 md:h-8 relative z-10 animate-bounce text-amberRed" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path><path d="M12 2v2"></path><path d="M4 8h2"></path><path d="M18 8h2"></path><path d="M6 4l1 1"></path><path d="M18 4l-1 1"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-amberRed mb-2 font-serif">賞味溫馨小提醒</h3>
                        <p className="text-gray-700 leading-relaxed">糖葫蘆最怕<span className="font-bold text-[#802020]">高溫與水氣</span>！我們堅持純手工無添加防腐劑，收到後強烈建議 <span className="bg-amberRed text-white px-2 py-0.5 rounded text-sm font-bold mx-1">2小時內</span> 食用完畢。若未立即食用，請務必 <span className="font-bold underline decoration-amberRed decoration-2 underline-offset-2">冷藏保存</span>，切勿冷凍以免糖衣退冰受潮融化。</p>
                    </div>
                </div>
            </div>

            {/* 訂購五步驟 */}
            <section className="mb-20 fade-in-up">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-10 text-center font-serif flex items-center justify-center gap-3">
                    <span className="w-8 h-px bg-gray-300"></span>訂購五步驟<span className="w-8 h-px bg-gray-300"></span>
                </h2>
                <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl p-8 shadow-sm bg-wood-texture relative">
                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4">
                        <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-1 bg-warmWood/30 -translate-y-[20px] rounded-full z-0"></div>
                        {timelineSteps.map((step, index) => (
                            <div key={step.id} className="relative z-10 flex md:flex-col items-center gap-4 md:gap-3 w-full md:w-1/5 group">
                                <div className="w-14 h-14 shrink-0 rounded-full bg-white border-4 border-amberRed text-amberRed flex items-center justify-center font-bold text-xl shadow-md group-hover:bg-amberRed group-hover:text-white transition-all duration-300 transform group-hover:scale-110">{step.icon}</div>
                                {index !== timelineSteps.length - 1 && <div className="md:hidden absolute top-14 bottom-[-32px] left-[27px] w-0.5 bg-warmWood/50 z-0"></div>}
                                <div className="pt-2 md:pt-4 w-full">
                                    <h4 className="text-lg font-bold text-amberRed mb-2 font-serif tracking-wide md:text-center">{step.id}. {step.title}</h4>
                                    <ul className="flex flex-col gap-1.5 w-full md:w-auto items-start md:items-center">
                                        {step.desc.map((line, i) => (
                                            <li key={i} className="text-[13px] text-gray-600 flex items-start gap-1.5 text-left"><span className="text-warmWood text-[10px] mt-1 shrink-0">◆</span><span className="leading-snug">{line}</span></li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 配送與租賃區塊 */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20 fade-in-up">
                <div className="glass-panel-light p-8 rounded-3xl hover:bg-white/70 transition-colors">
                    <div className="flex items-center gap-3 mb-6 border-b border-warmWood/30 pb-4">
                        <div className="p-2 bg-amberRed/10 rounded-lg text-amberRed"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg></div>
                        <h2 className="text-2xl font-bold text-gray-800 font-serif">配送與運費</h2>
                    </div>
                    <div className="space-y-5">
                        <div>
                            <h4 className="font-bold text-[#8B4513] mb-1 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amberRed"></span>雙北地區專車配送</h4>
                            <p className="text-sm text-gray-700 pl-3.5">商品小計滿 <span className="font-bold text-amberRed">NT$5,000</span> 享免運。<br/>未達門檻酌收 NT$350 運費。</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-[#8B4513] mb-1 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amberRed"></span>外縣市地區</h4>
                            <p className="text-sm text-gray-700 pl-3.5">為確保糖衣脆度，目前暫無宅配，需配合商家時間地點進行自取。</p>
                        </div>
                    </div>
                </div>
                <div className="glass-panel-light p-8 rounded-3xl hover:bg-white/70 transition-colors">
                    <div className="flex items-center gap-3 mb-6 border-b border-warmWood/30 pb-4">
                        <div className="p-2 bg-warmWood/20 rounded-lg text-[#8B4513]"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg></div>
                        <h2 className="text-2xl font-bold text-gray-800 font-serif">稻草掃帚租賃</h2>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-700">我們提供充滿傳統復古風味的稻草掃帚租借，為您的活動增添寧夏夜市的獨特氛圍（只租不賣）。</p>
                        <ul className="text-sm text-gray-700 space-y-2 bg-white/40 p-4 rounded-xl border border-white">
                            <li className="flex justify-between items-center"><span className="font-bold text-gray-800">單組租金</span> <span className="text-amberRed font-bold">NT$ 200</span></li>
                            <li className="flex justify-between items-center border-b border-gray-200 pb-2"><span className="font-bold text-gray-800">單組押金</span> <span>NT$ 1,800</span></li>
                            <li className="text-xs text-gray-500 pt-1 leading-relaxed">活動結束歸還且無毀損，即退還全額押金。若損壞將自押金扣除 NT$1,000。請勿插置糖葫蘆以外之異物。</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 常見問題 FAQ */}
            <section className="mb-20 fade-in-up">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center font-serif flex items-center justify-center gap-3">
                    <span className="w-8 h-px bg-gray-300"></span>常見問題 FAQ<span className="w-8 h-px bg-gray-300"></span>
                </h2>
                <div className="space-y-8">
                    {faqCategories.map((cat, catIdx) => (
                        <div key={catIdx} className="bg-white/60 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-sm border border-white/80">
                            <h3 className="text-xl font-bold text-[#8B4513] mb-6 border-b border-warmWood/30 pb-3">{cat.category}</h3>
                            <div className="space-y-3">
                                {cat.items.map((item, itemIdx) => {
                                    const id = `cat-${catIdx}-item-${itemIdx}`;
                                    const isOpen = openFaqId === id;
                                    return (
                                        <div key={id} className={`border rounded-xl transition-all duration-300 overflow-hidden cursor-pointer ${isOpen ? 'border-amberRed bg-white/90 shadow-md' : 'border-white/60 bg-white/40 hover:border-amberRed/40'}`} onClick={() => setOpenFaqId(isOpen ? null : id)}>
                                            <div className="p-4 md:p-5 flex justify-between items-center gap-4">
                                                <h4 className={`font-bold text-[15px] md:text-base transition-colors ${isOpen ? 'text-amberRed' : 'text-gray-800'}`}>Q：{item.q}</h4>
                                                <span className={`shrink-0 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-amberRed' : ''}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7"></path></svg></span>
                                            </div>
                                            {isOpen && (
                                                <div className="px-4 md:px-5 pb-4 md:pb-5 animate-[fadeIn_0.3s_ease-out]">
                                                    <div className="pt-2 border-t border-gray-100 flex items-start gap-2">
                                                        <span className="font-bold text-amberRed">A：</span>
                                                        <p className="text-sm md:text-[15px] text-gray-700 leading-relaxed break-words">{item.a}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 導流按鈕區塊 */}
            <section className="text-center fade-in-up">
                <div className="relative bg-gradient-to-br from-white/80 to-[#f8f5f2]/80 backdrop-blur-xl border border-white rounded-3xl p-8 md:p-12 shadow-[0_20px_40px_-10px_rgba(165,42,42,0.15)] overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-warmWood rounded-full mix-blend-multiply filter blur-[50px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                    <h2 className="relative z-10 text-2xl md:text-3xl font-bold text-gray-800 mb-4 font-serif">讓琥珀色的甜蜜，點亮您的重要時刻</h2>
                    <p className="relative z-10 text-gray-600 mb-8 max-w-xl mx-auto leading-relaxed">無論是浪漫婚宴、校園慶典還是企業活動，李伯伯傳承三十年的手工糖葫蘆，將為賓客帶來視覺與味蕾的雙重驚喜。現在就前往挑選，讓我們為您新鮮熬製這份專屬的甜蜜祝福！</p>
                    <button onClick={() => navigateTo('list')} className="relative z-10 inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amberRed to-[#802020] text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all border border-white/20 group">
                        <svg className="w-6 h-6 transform group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                        立即挑選甜蜜組合
                    </button>
                </div>
            </section>
        </div>
    );
};

export default OrderProcess;