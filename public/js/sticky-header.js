// Mobile menu toggle
(function () {
    'use strict';
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.floating-nav .nav-links');
    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', function () {
        const isOpen = navLinks.classList.toggle('active');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Mega menu toggle on mobile (tap on "Servicios")
    const dropdownTrigger = document.querySelector('.nav-item-dropdown .nav-link-dropdown');
    const dropdownItem = document.querySelector('.nav-item-dropdown');
    if (dropdownTrigger && dropdownItem) {
        dropdownTrigger.addEventListener('click', function (e) {
            if (window.innerWidth <= 992) {
                e.preventDefault();
                dropdownItem.classList.toggle('open');
            }
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('#custom-header')) {
            navLinks.classList.remove('active');
            if (dropdownItem) dropdownItem.classList.remove('open');
        }
    });
})();

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

