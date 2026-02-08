/**
 * MSM Design - Main script
 * Mobile menu, hero slideshow, service card slideshows
 */
document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = mobileMenu.querySelectorAll('a');

    // Toggle menu
    menuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });

    // --- Hero Slideshow ---
    const heroSlides = document.querySelectorAll('#hero-slideshow .hero-slide');
    let currentHeroSlide = 0;
    const heroSlideInterval = 3500; // 3.5 seconds per slide

    if (heroSlides.length > 1) { // Only run if there's more than one slide
        setInterval(() => {
            heroSlides[currentHeroSlide].classList.remove('active');
            currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;
            heroSlides[currentHeroSlide].classList.add('active');
        }, heroSlideInterval);
    }

    // --- Service Card Slideshows ---
    const serviceCards = document.querySelectorAll('.service-card');
    const serviceSlideInterval = 5000; // 5 seconds per slide

    serviceCards.forEach(card => {
        const slides = card.querySelectorAll('.slide');
        if (slides.length <= 1) return; // Don't run if only 1 slide

        let currentSlide = 0;

        setInterval(() => {
            // Remove active class from current slide
            slides[currentSlide].classList.remove('active');

            // Increment slide index, looping back to 0
            currentSlide = (currentSlide + 1) % slides.length;

            // Add active class to new slide
            slides[currentSlide].classList.add('active');
        }, serviceSlideInterval);
    });
});