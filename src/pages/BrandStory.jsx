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
                        <h1 className="text-5xl lg:text-6xl xl:text-7xl font-serif font-bold text-amberRed mb-8 leading-[1.1] tracking-wide">一串晶瑩<br/>半生守候</h1>
                        <div className="w-16 h-1 bg-warmWood mb-8 rounded-full"></div>
                        <p className="text-darkWood/80 font-sans font-light text-lg md:text-xl leading-relaxed tracking-wide max-w-sm">源自寧夏夜市的職人堅持。<br/>每一抹琥珀色的糖衣，都是歲月淬鍊的甜蜜記憶。</p>
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
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-darkWood leading-snug">繁華流轉中的<br/><span className="text-amberRed">溫暖燈火</span></h2>
                        <p className="font-sans text-darkWood/70 leading-loose text-lg font-light text-justify">走進台北寧夏夜市，在鼎沸的人聲與璀璨的霓虹中，總有一處散發著溫潤琥珀光芒的角落。那是「李伯伯糖葫蘆」最初的起點。</p>
                        <p className="font-sans text-darkWood/70 leading-loose text-lg font-light text-justify">五十年前，一輛質樸的手推車，一鍋慢火熬煮的砂糖。我們不僅僅是在販售甜點，更是在這座喧囂的城市裡，為每一個歸人保留一份純粹、質樸的童年回憶。</p>
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
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-darkWood leading-snug">職人李順慶的<br/><span className="text-amberRed">半生火候</span></h2>
                        <blockquote className="border-l-4 border-warmWood pl-6 py-2 my-6">
                            <p className="font-serif text-xl text-darkWood/80 italic leading-relaxed">「火候不到，糖會黏牙；火候過了，糖會發苦。做糖葫蘆，就像做人，講究的是剛剛好的分寸。」</p>
                            <footer className="text-sm text-warmWood mt-3 tracking-widest">— 創辦人 李順慶</footer>
                        </blockquote>
                        <p className="font-sans text-darkWood/70 leading-loose text-lg font-light text-justify">嚴選在地新鮮果物，堅持傳統純糖熬製。李伯伯的手，佈滿了歲月與高溫留下的痕跡。那拉絲的琥珀色糖漿，在晨光與微光中閃爍，不僅裹住了鮮甜，更裹進了數十年如一日的匠心。</p>
                    </div>
                </div>
            </section>

            {/* --- 區塊四：底部行動呼籲 (Call to Action) --- */}
            <section className="py-24 relative overflow-hidden bg-creamBg">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[1px] border-warmWood/20 rounded-full z-0"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[1px] border-amberRed/10 rounded-full z-0"></div>
                <div className="max-w-2xl mx-auto text-center px-6 relative z-10 fade-in-up">
                    <p className="text-warmWood font-sans tracking-[0.2em] text-sm mb-4">TASTE THE MEMORY</p>
                    <h3 className="text-3xl md:text-4xl font-serif font-bold text-amberRed mb-6">品嚐歲月熬煮的甜蜜</h3>
                    <p className="text-darkWood/70 font-sans mb-10 text-lg font-light leading-relaxed">從寧夏夜市出發，結合現代美學。<br/>現在，我們將這份琥珀色的溫暖，送到您手中。</p>
                    <button onClick={() => navigateTo('list')} className="inline-block bg-amberRed text-white font-serif tracking-widest px-10 py-4 rounded-full hover:bg-darkWood transition-colors duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">商品訂購</button>
                </div>
            </section>
        </div>
    );
};

export default BrandStory;