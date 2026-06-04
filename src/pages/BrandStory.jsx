import React from 'react';
import useScrollFadeIn from '../hooks/useScrollFadeIn';

// 👇 1. 從 assets/images/BrandStory 資料夾匯入圖片
import heroImg from '../assets/images/BrandStory/hero.jpg';       // 首圖 (職人熬糖意象)
import originImg from '../assets/images/BrandStory/origin.jpg';   // 品牌起源 (寧夏夜市的溫暖燈火)
import craftImg from '../assets/images/BrandStory/craft.jpg';     // 職人精神 (琥珀色糖葫蘆意象)

const BrandStory = ({ navigateTo }) => {
    // 載入滾動淡入動畫 Hook
    useScrollFadeIn();

    return (
        <div className="relative overflow-hidden w-full">
            {/* --- 區塊一：首屏主視覺 (Hero Section) --- */}
            <header className="relative flex flex-col md:flex-row min-h-screen bg-creamBg overflow-hidden">
                <div className="w-full md:w-[45%] flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-32 md:pt-0 relative z-10">
                    <div className="absolute left-0 bottom-1/4 w-64 h-64 bg-warmWood opacity-10 rounded-tr-full rounded-br-full z-0 pointer-events-none transform -translate-x-1/2"></div>
                    <div className="absolute right-10 top-1/4 w-32 h-32 bg-amberRed opacity-5 rounded-full z-0 pointer-events-none"></div>

                    <div className="relative z-10 fade-in-up">
                        <p className="text-warmWood font-sans tracking-[0.3em] text-sm md:text-base mb-6 font-semibold uppercase">Modern Heritage</p>
                        <h1 className="text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-amberRed mb-8 leading-[1.1] tracking-wide">品牌故事<br/>三十年慢火熬糖</h1>
                        <div className="w-16 h-1 bg-warmWood mb-8 rounded-full"></div>
                        <p className="text-darkWood/80 font-sans font-light text-lg md:text-xl leading-relaxed tracking-wide max-w-sm">品牌故事｜三十年慢火熬糖，封存兩代人的幸福滋味</p>
                        <div className="mt-12 flex items-center space-x-4 cursor-pointer group" onClick={() => window.scrollTo({top: window.innerHeight, behavior: 'smooth'})}>
                            <span className="text-amberRed font-serif tracking-widest text-sm group-hover:text-darkWood transition-colors duration-300">探索故事</span>
                            <div className="w-10 h-10 rounded-full border border-amberRed flex items-center justify-center group-hover:bg-amberRed group-hover:text-white transition-all duration-300 text-amberRed">
                                <svg className="w-4 h-4 transform group-hover:translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-[55%] h-[60vh] md:h-screen relative mt-12 md:mt-0">
                    <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-creamBg to-transparent z-10 hidden md:block"></div>
                    <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-creamBg to-transparent z-10 md:hidden"></div>
                    
                    {/* 👇 2. 將 src 替換為 heroImg 變數 */}
                    <img src={heroImg} alt="職人熬糖意象" className="w-full h-full object-cover object-center" style={{filter: 'brightness(1.05) contrast(1.05) saturate(1.1)'}} fetchPriority="high" />
                    
                    <div className="absolute bottom-8 right-8 glass-panel-light p-4 rounded-xl hidden md:block">
                        <p className="text-darkWood font-serif text-sm tracking-widest">純砂糖 / 慢火熬</p>
                    </div>
                </div>
            </header>

            {/* --- 區塊二：品牌起源 (Origin) --- */}
            <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
                <div className="flex flex-col-reverse md:flex-row items-center gap-12 lg:gap-20">
                    <div className="w-full md:w-5/12 fade-in-up space-y-6">
                        <div className="inline-block px-4 py-1 border border-warmWood text-warmWood font-serif tracking-widest rounded-full text-sm">Origin</div>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-darkWood leading-snug">品牌故事｜三十年慢火熬糖，<br/><span className="text-amberRed">封存兩代人的幸福滋味</span></h2>
                        <p className="font-sans text-darkWood/70 leading-loose text-lg font-light text-justify">在燈火通明、人潮熙攘的寧夏夜市裡，有一個攤位，三十年來飄散著熟悉的清甜糖香。那是「李伯伯糖葫蘆」守護了三十年的味道，也是無數台北人記憶裡，那口咬下去會「喀滋」一聲的純粹快樂。</p>
                    </div>
                    <div className="w-full md:w-7/12 img-container rounded-[2rem] overflow-hidden shadow-xl fade-in-up relative">
                        
                        {/* 👇 3. 將 src 替換為 originImg 變數 */}
                        <img src={originImg} alt="寧夏夜市的溫暖燈火" className="w-full h-[450px] object-cover img-zoom" loading="lazy" />
                    
                    </div>
                </div>
            </section>

            {/* --- 區塊三：職人精神 (Craftsmanship) --- */}
            <section className="bg-pureWhite py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                    <div className="w-full md:w-6/12 img-container rounded-[2rem] overflow-hidden shadow-xl fade-in-up relative">
                        
                        {/* 👇 4. 將 src 替換為 craftImg 變數 */}
                        <img src={craftImg} alt="琥珀色糖葫蘆意象" className="w-full h-[550px] object-cover img-zoom" style={{filter: 'brightness(1.1) saturate(1.2)'}} loading="lazy" />
                    
                    </div>
                    <div className="w-full md:w-6/12 fade-in-up space-y-6 md:pl-8">
                        <div className="inline-block px-4 py-1 border border-amberRed text-amberRed font-serif tracking-widest rounded-full text-sm">Craftsmanship</div>
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-darkWood leading-snug">一把慢火、一鍋糖漿，<br/><span className="text-amberRed">熬出不妥協的職人堅持</span></h2>
                        <blockquote className="border-l-4 border-warmWood pl-6 py-2 my-6">
                            <p className="font-serif text-xl text-darkWood/80 italic leading-relaxed">「我們不求做快，只求做得心安理得。看著客人咬下第一口時點頭如搗蒜的滿足神情，這三十年的燙傷與汗水，就都值了。」</p>
                            <footer className="text-sm text-warmWood mt-3 tracking-widest">— 李伯伯糖葫蘆</footer>
                        </blockquote>
                        <p className="font-sans text-darkWood/70 leading-loose text-lg font-light text-justify">三十年前，李伯伯守著一鍋冒著微熱煙霧的糖漿，開始了這段甜蜜的旅程。</p>
                        <p className="font-sans text-darkWood/70 leading-loose text-lg font-light text-justify">在講求速度與成本的現代，我們至今始終堅持著最傳統的工法：拒絕任何人工色素與化學添加物，純粹使用砂糖與水，在特定的高溫下憑經驗慢火熬煮。</p>
                        <p className="font-sans text-darkWood/70 leading-loose text-lg font-light text-justify">每一顆香甜草莓、優質番茄，都經過嚴格的清洗與手工擦拭。裹糖時的動作必須快中帶穩，多一分太厚咬不開，少一分太薄易出水。唯有三十年練就的手感，才能讓水果表面附著上一層如水晶般透亮、「薄脆且絕對不黏牙」的黃金糖衣。</p>
                    </div>
                </div>
            </section>

            {/* --- 區塊四：世代記憶 (Memory) --- */}
            <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
                <div className="max-w-3xl mx-auto fade-in-up space-y-6">
                    <div className="inline-block px-4 py-1 border border-warmWood text-warmWood font-serif tracking-widest rounded-full text-sm">Memory</div>
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-darkWood leading-snug">從阿公到孫子，<br/><span className="text-amberRed">一條串起世代記憶的紅色橋樑</span></h2>
                    <p className="font-sans text-darkWood/70 leading-loose text-lg font-light text-justify">在攤位前，我們最常看見的，是一幅最美的風景：<br/>一位上了年紀的阿公，牽著蹦蹦跳跳的孫子來到攤位前，指著紅澄澄的蕃茄蜜餞糖葫蘆說：「阿公小時候最喜歡吃這個了！」</p>
                    <p className="font-sans text-darkWood/70 leading-loose text-lg font-light text-justify">那一刻，糖葫蘆不再只是一道夜市小吃，而是一座跨越世代的橋樑。阿公買下的，是他童年裡最珍藏、最單純的快樂記憶；而他想透過這串閃閃發亮的糖葫蘆，把這份甜，親手傳遞給他最疼愛的下一代。</p>
                    <p className="font-sans text-darkWood/70 leading-loose text-lg font-light text-justify">這份「讓大人懷念、小孩安心」的初衷，就是李伯伯三十年來不曾改變的承諾。</p>
                </div>
            </section>

            {/* --- 區塊四：底部行動呼籲 (Call to Action) --- */}
            <section className="py-24 relative overflow-hidden bg-creamBg">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[1px] border-warmWood/20 rounded-full z-0"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[1px] border-amberRed/10 rounded-full z-0"></div>
                <div className="max-w-2xl mx-auto text-center px-6 relative z-10 fade-in-up">
                    <p className="text-warmWood font-sans tracking-[0.2em] text-sm mb-4">TASTE THE MEMORY</p>
                    <h3 className="text-3xl md:text-4xl font-serif font-bold text-amberRed mb-6">走出夜市，將這份古早的喜氣帶進你的重要時刻</h3>
                    <div className="space-y-5 text-darkWood/70 font-sans mb-10 text-lg font-light leading-relaxed">
                        <p>隨著時代轉變，李伯伯糖葫蘆也悄悄換上了新裝。為了解決傳統糖葫蘆容易融化、黏手的痛點，我們研發了更精準的控溫技術，並採用獨立封口的現代化包裝。</p>
                        <p>這口酸甜，開始走出寧夏夜市，走進了新人的婚禮二進、企業的商務派對、以及家族的團聚時刻。</p>
                        <p>外表紅潤、象徵圓圓滿滿的糖葫蘆，在婚禮的燈光下閃爍著喜慶的光芒。當賓客們從新人手中接過這份禮物，現場揚起的驚呼與笑容，跟三十年前夜市攤位前的滿足一模一樣。</p>
                        <p>無論是路過寧夏夜市想解解饞的你，還是正在籌備一生一次婚禮的你，李伯伯都將繼續用這鍋慢火熬煮的真功夫，為你的生活，鍍上一層亮晶晶的幸福糖衣。</p>
                    </div>
                    <button onClick={() => navigateTo('list')} className="inline-block bg-amberRed text-white font-serif tracking-widest px-10 py-4 rounded-full hover:bg-darkWood transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">商品訂購</button>
                </div>
            </section>
        </div>
    );
};

export default BrandStory;
