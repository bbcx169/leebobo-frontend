import { useEffect } from 'react';

export default function useScrollFadeIn(dependencies = []) {
    useEffect(() => {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05 });
        
        const timer = setTimeout(() => {
            const elements = document.querySelectorAll('.fade-in-up');
            elements.forEach(el => {
                if(!el.classList.contains('is-visible')) {
                    const rect = el.getBoundingClientRect();
                    // 如果元素已經在視窗內，直接顯示；否則加入觀察
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        el.classList.add('is-visible');
                    } else {
                        observer.observe(el);
                    }
                }
            });
        }, 100);
        
        return () => { 
            clearTimeout(timer);
            observer.disconnect(); 
        };
    }, dependencies);
}