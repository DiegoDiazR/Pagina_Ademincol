// Smart Sticky Header with requestAnimationFrame throttling and optimized performance
(function() {
    'use strict';
    
    const header = document.querySelector('.main-nav-container');
    if (!header) return;

    const scrollThreshold = 30;
    let ticking = false;
    let lastScrollY = 0;

    const updateHeader = () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > scrollThreshold && !header.classList.contains('is-sticky')) {
            header.classList.add('is-sticky');
        } else if (currentScrollY <= scrollThreshold && header.classList.contains('is-sticky')) {
            header.classList.remove('is-sticky');
        }
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        lastScrollY = window.scrollY;
        if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true, capture: false });
})();

// Optimized video loading with minimal main thread blocking
(function() {
    'use strict';
    
    const bgVideo = document.querySelector('.hero-bg-video');
    if (!bgVideo) return;

    // Only attempt autoplay if video is visible
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            attemptVideoAutoplay();
        }, { once: true });
    } else {
        attemptVideoAutoplay();
    }

    function attemptVideoAutoplay() {
        // Check if video is already playing
        if (bgVideo.paused) {
            bgVideo.play().catch(function() {
                // Autoplay was prevented - silent fail
            });
        }
    }
})();

