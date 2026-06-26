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

    // --- Review Carousel ---
    const reviewTrack = document.getElementById('review-track');
    const reviewDotsContainer = document.getElementById('review-dots');
    const reviewPrev = document.getElementById('review-prev');
    const reviewNext = document.getElementById('review-next');
    const reviewCarousel = document.getElementById('review-carousel');

    if (reviewTrack && reviewDotsContainer) {
        const reviewSlides = reviewTrack.querySelectorAll('.review-slide');
        let currentReview = 0;
        let reviewTimer = null;
        const reviewInterval = 5000;

        reviewSlides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'review-dot' + (index === 0 ? ' active' : '');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', 'Go to review ' + (index + 1));
            dot.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
            dot.addEventListener('click', () => goToReview(index, true));
            reviewDotsContainer.appendChild(dot);
        });

        const reviewDots = reviewDotsContainer.querySelectorAll('.review-dot');

        function goToReview(index, resetTimer) {
            currentReview = (index + reviewSlides.length) % reviewSlides.length;
            reviewTrack.style.transform = 'translateX(-' + (currentReview * 100) + '%)';
            reviewDots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentReview);
                dot.setAttribute('aria-selected', i === currentReview ? 'true' : 'false');
            });
            if (resetTimer) startReviewTimer();
        }

        function startReviewTimer() {
            if (reviewTimer) clearInterval(reviewTimer);
            reviewTimer = setInterval(() => goToReview(currentReview + 1, false), reviewInterval);
        }

        if (reviewPrev) {
            reviewPrev.addEventListener('click', () => goToReview(currentReview - 1, true));
        }
        if (reviewNext) {
            reviewNext.addEventListener('click', () => goToReview(currentReview + 1, true));
        }
        if (reviewCarousel) {
            reviewCarousel.addEventListener('mouseenter', () => {
                if (reviewTimer) clearInterval(reviewTimer);
            });
            reviewCarousel.addEventListener('mouseleave', startReviewTimer);
        }

        startReviewTimer();
    }
});