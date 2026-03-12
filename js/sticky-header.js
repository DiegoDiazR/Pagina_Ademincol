// Smart Sticky Header
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.main-nav-container');
    const scrollThreshold = 10; // Snaps almost immediately to avoid gap visibility

    const handleScroll = () => {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('is-sticky');
        } else {
            header.classList.remove('is-sticky');
        }
    };

    window.addEventListener('scroll', handleScroll);
});
