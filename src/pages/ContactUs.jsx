import React, { useState } from 'react';
import useScrollFadeIn from '../hooks/useScrollFadeIn';

/**
 * ContactUs 頁面元件
 * 整合了寧夏夜市 61 號攤位的 Google Maps 精準釘選
 */
const ContactUs = () => {
    // 啟用滾動淡入動畫效果
    useScrollFadeIn();
    
    // 控制交通指引摺疊面板 (Accordion) 的展開狀態
    const [openAccordion, setOpenAccordion] = useState(0);

    // 完整還原圖片中的交通與停車資訊資料陣列
    const faqs = [
        { 
            id: 'mrt', title: '捷運 (MRT)', 
            icon: <svg className="w-5 h-5 text-warmWood group-hover:text-amberRed transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h0"/><path d="M16 15h0"/></svg>,
            content: (
                <ul className="pl-8 border-l-2 border-warmWood/30 pb-4 space-y-3 text-darkWood/80">
                    <li><strong>雙連站：</strong>步行約 8 分鐘可抵達「民生西路入口」；或可選擇轉乘公車 1 站。</li>
                    <li><strong>中山站：</strong>步行約 9 分鐘可抵達「南京西路入口」；或可選擇轉乘公車 1 站。</li>
                </ul>
            ) 
        },
        { 
            id: 'bus', title: '公車 (Bus)', 
            icon: <svg className="w-5 h-5 text-warmWood group-hover:text-amberRed transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>,
            content: (
                <ul className="pl-8 border-l-2 border-warmWood/30 pb-4 space-y-4 text-darkWood/80">
                    <li>
                        <strong>靜修女中 / 雙連市場站：</strong>直達民生西路入口。
                        <div className="text-sm text-darkWood/50 mt-1 leading-relaxed">搭乘路線：518, 42, 539, 811, 紅33</div>
                    </li>
                    <li>
                        <strong>民生重慶路口站：</strong>步行 2 分鐘可抵達民生西路入口。
                        <div className="text-sm text-darkWood/50 mt-1 leading-relaxed">搭乘路線：2, 215, 223, 250, 288, 302, 304, 306, 46, 601, 63, 636, 641, 704, 重慶幹線</div>
                    </li>
                    <li>
                        <strong>圓環站：</strong>沿南京西路步行 2 分鐘可抵達南京西路入口。
                        <div className="text-sm text-darkWood/50 mt-1 leading-relaxed">搭乘路線：2, 12, 46, 52, 282, 288, 306, 605, 622, 636, 660, 711</div>
                    </li>
                    <li>
                        <strong>朝陽公園站：</strong>步行 3 分鐘可抵達夜市中段。
                        <div className="text-sm text-darkWood/50 mt-1 leading-relaxed">搭乘路線：2, 215, 223, 250, 255, 288, 302, 304, 306, 42, 518, 601, 639, 641, 704, 811, 重慶幹線</div>
                    </li>
                    <li>
                        <strong>建成公園站：</strong>步行 5 分鐘可抵達平陽街入口。
                        <div className="text-sm text-darkWood/50 mt-1 leading-relaxed">搭乘路線：26, 266, 292, 304</div>
                    </li>
                </ul>
            ) 
        },
        { 
            id: 'parking', title: '停車場 (Parking)', 
            icon: <svg className="w-5 h-5 text-warmWood group-hover:text-amberRed transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>,
            content: (
                <ul className="pl-8 border-l-2 border-warmWood/30 pb-4 space-y-3 text-darkWood/80">
                    <li><strong>蓬萊國小地下停車場：</strong>距離最近 (225車位)，出入口在太原路與平陽街。</li>
                    <li><strong>建成公園停車場：</strong>步行 5 分鐘，出入口位於承德路二段。</li>
                    <li><strong>朝陽公園地下停車場：</strong>步行 3 分鐘，入口於重慶北路二段上。</li>
                    <li><strong>文化京都大樓停車場：</strong>步行 2 分鐘。<span className="text-amberRed font-medium text-sm">(註：週六晚間及週日無營業)</span></li>
                    <li><strong>民生西路停車場：</strong>步行 4 分鐘 (車位較少)。</li>
                </ul>
            ) 
        }
    ];

    // 地圖搜尋 URL：結合店家名稱與詳細地址
    const mapUrl = `https://maps.google.com/maps?q=古早味糖葫蘆%20臺北市大同區寧夏路061號攤位&t=&z=18&ie=UTF8&iwloc=&output=embed`;

    return (
        <div className="pt-32 pb-20 relative overflow-hidden min-h-screen">
            {/* 背景裝飾 */}
            <div className="absolute top-20 right-0 w-64 h-64 bg-warmWood opacity-10 rounded-bl-full z-0 pointer-events-none"></div>
            <div className="absolute bottom-40 left-0 w-48 h-48 bg-amberRed opacity-5 rounded-tr-full z-0 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16 fade-in-up">
                    <p className="text-warmWood font-sans tracking-[0.3em] text-sm mb-4 font-semibold uppercase">Contact & Location</p>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-darkWood mb-6 tracking-wide">尋找那抹<span className="text-amberRed">琥珀色</span></h1>
                    <div className="w-16 h-1 bg-warmWood mx-auto rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">
                    {/* 左側：攤位資訊與交通指引 */}
                    <div className="space-y-8 flex flex-col justify-between fade-in-up">
                        <div className="glass-panel-light p-8 md:p-10 rounded-[2rem] shadow-sm relative overflow-hidden">
                            <h3 className="font-serif text-2xl text-amberRed tracking-widest font-bold mb-6 flex items-center gap-3">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> 
                                攤位資訊
                            </h3>
                            <ul className="space-y-6 text-darkWood/80 font-sans text-lg">
                                <li className="flex items-start gap-4">
                                    <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-warmWood shrink-0"></span>
                                    <div><p className="font-bold text-darkWood mb-1">地址</p><p className="font-light text-base md:text-lg">臺北市大同區寧夏路<br/>寧夏夜市第61號攤位（蓬萊國小前）</p></div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-warmWood shrink-0"></span>
                                    <div><p className="font-bold text-darkWood mb-1">聯絡專線</p><p className="font-light text-base md:text-lg">0912-294-022 </p></div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-warmWood shrink-0"></span>
                                    <div><p className="font-bold text-darkWood mb-1">營業時間</p><p className="font-light text-base md:text-lg tracking-wider">每日 18:00 ~ 23:00 </p></div>
                                </li>
                            </ul>
                        </div>

                        {/* 交通指引摺疊面板 */}
                        <div className="glass-panel-light p-8 md:p-10 rounded-[2rem] shadow-sm">
                            <h3 className="font-serif text-2xl text-amberRed tracking-widest font-bold mb-6 flex items-center gap-3">交通指引</h3>
                            <div className="text-darkWood/80 font-sans text-base font-light w-full">
                                {faqs.map((faq, idx) => (
                                    <div key={idx} className="border-b border-warmWood/30">
                                        <button onClick={() => setOpenAccordion(openAccordion === idx ? -1 : idx)} className="w-full py-4 flex justify-between items-center group">
                                            <span className={`font-bold flex items-center gap-3 transition-colors ${openAccordion === idx ? 'text-amberRed' : 'text-darkWood group-hover:text-amberRed'}`}>
                                                {faq.icon}
                                                {faq.title}
                                            </span>
                                            <svg className={`w-5 h-5 transform transition-transform duration-300 ${openAccordion === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7"></path></svg>
                                        </button>
                                        {openAccordion === idx && <div className="animate-[fadeIn_0.3s_ease-out]">{faq.content}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* 右側：精準釘選 Google Map */}
                    <div className="w-full h-[500px] lg:h-auto rounded-[2rem] overflow-hidden shadow-xl fade-in-up border-4 border-pureWhite relative group">
                        <div className="absolute top-4 left-4 z-20 bg-pureWhite/95 backdrop-blur-md px-4 py-2 rounded-full shadow-md text-sm font-sans text-darkWood flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            寧夏夜市第 61 號攤位
                        </div>
                        <iframe 
                            src={mapUrl}
                            width="100%" 
                            height="100%" 
                            style={{ border: 0, filter: 'contrast(1.05) saturate(1.1)' }} 
                            allowFullScreen={true} 
                            loading="lazy" 
                            referrerPolicy="no-referrer-when-downgrade" 
                            className="transition-transform duration-700 group-hover:scale-105"
                            title="古早味糖葫蘆攤位地圖"
                        ></iframe>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;