import React, { useState, useEffect } from 'react';

const Navbar = ({ currentPage, handleNavigate, cartCount }) => {
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsNavScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navTo = (e, page) => {
    e.preventDefault();
    handleNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const displayCartCount = cartCount > 99 ? '99+' : cartCount;

  return (
    <nav className="fixed w-full z-50 transition-all duration-500">
      <div className={`mx-auto flex justify-between items-center max-w-7xl transition-all duration-300 ${
        isNavScrolled 
          ? 'glass-nav-scrolled shadow-sm w-full px-6 py-4 rounded-none' 
          : 'glass-panel-light mx-4 mt-4 rounded-2xl px-6 py-4'
      }`}>
          <div className="font-serif text-2xl font-bold tracking-widest text-amberRed cursor-pointer" onClick={(e) => navTo(e, 'brand')}>
            李伯伯糖葫蘆
          </div>
          
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wider text-darkWood">
              <a href="#" onClick={(e) => navTo(e, 'brand')} className={`transition-colors duration-300 ${currentPage === 'brand' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>品牌故事</a>
              <a href="#" onClick={(e) => navTo(e, 'process')} className={`transition-colors duration-300 ${currentPage === 'process' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>訂購流程</a>
              <a href="#" onClick={(e) => navTo(e, 'list')} className={`transition-colors duration-300 ${['list', 'order', 'success'].includes(currentPage) ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>商品訂購</a>
              <a href="#" onClick={(e) => navTo(e, 'inquiry')} className={`transition-colors duration-300 ${currentPage === 'inquiry' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>訂單查詢</a>
              <a href="#" onClick={(e) => navTo(e, 'contact')} className={`transition-colors duration-300 ${currentPage === 'contact' ? 'text-amberRed font-bold' : 'hover:text-amberRed'}`}>聯絡我們</a>
              
              {['list', 'order'].includes(currentPage) && (
                  <button onClick={(e) => navTo(e, 'order')} className="relative flex items-center justify-center w-11 h-11 rounded-full bg-amberRed text-white shadow-md hover:bg-pureWhite hover:text-amberRed transition-all ml-4 animate-bounce">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                      {/* 🌟 絕對置中修正：使用 inline-style 強制覆蓋行高 */}
                      {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 flex items-center justify-center h-[22px] min-w-[22px] px-1.5 bg-pureWhite text-amberRed text-[11px] font-black rounded-full border-[1.5px] border-amberRed shadow-sm" style={{ lineHeight: 0, paddingTop: '1px' }}>
                          {displayCartCount}
                        </span>
                      )}
                  </button>
              )}
          </div>

          <div className="md:hidden flex items-center space-x-3">
              {['list', 'order'].includes(currentPage) && (
                  <button onClick={(e) => navTo(e, 'order')} className="relative flex items-center justify-center w-10 h-10 rounded-full bg-amberRed text-white shadow-md hover:bg-pureWhite hover:text-amberRed transition-all mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                      {/* 🌟 絕對置中修正 */}
                      {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 flex items-center justify-center h-[22px] min-w-[22px] px-1.5 bg-pureWhite text-amberRed text-[11px] font-black rounded-full border-[1.5px] border-amberRed shadow-sm" style={{ lineHeight: 0, paddingTop: '1px' }}>
                          {displayCartCount}
                        </span>
                      )}
                  </button>
              )}
              <button className="text-amberRed focus:outline-none p-1" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
          </div>
      </div>

      {isMobileMenuOpen && (
          <div className="md:hidden glass-panel-light mx-4 mt-2 p-5 rounded-2xl flex flex-col space-y-4 text-center text-darkWood tracking-wider shadow-lg">
              <a href="#" onClick={(e) => navTo(e, 'brand')} className="py-2 border-b border-warmWood/20">品牌故事</a>
              <a href="#" onClick={(e) => navTo(e, 'process')} className="py-2 border-b border-warmWood/20">訂購流程</a>
              <a href="#" onClick={(e) => navTo(e, 'list')} className="py-2 border-b border-warmWood/20">商品訂購</a>
              <a href="#" onClick={(e) => navTo(e, 'inquiry')} className="py-2 border-b border-warmWood/20">訂單查詢</a>
              <a href="#" onClick={(e) => navTo(e, 'contact')} className="py-2">聯絡我們</a>
          </div>
      )}
    </nav>
  );
};

export default Navbar;