// Portal Card Carousel for Mobile and Tablet
(function () {
  'use strict';

  class PortalCardCarousel {
    constructor(element) {
      this.carousel = element;
      this.spread = this.carousel.querySelector('.portal-card__spread');
      this.cards = Array.from(this.spread.querySelectorAll('.card'));
      this.currentIndex = 0;
      this.startX = 0;
      this.isDragging = false;

      if (this.cards.length === 0) return;

      this.init();
    }

    init() {
      // Only create controls if carousel should be active
      const carouselOnDesktop = this.carousel.dataset.carouselDesktop === 'true';
      if (carouselOnDesktop || window.innerWidth < 1200) {
        this.createControls();
      }
      this.attachEventListeners();
      this.updateCarousel();
    }

    createControls() {
      // Create carousel controls wrapper
      const controlsWrapper = document.createElement('div');
      controlsWrapper.className = 'portal-card__carousel-controls';

      // Create prev button
      const prevBtn = document.createElement('button');
      prevBtn.className = 'portal-card__carousel-btn portal-card__carousel-btn--prev';
      prevBtn.setAttribute('aria-label', 'Previous card');
      prevBtn.innerHTML = '<span>‹</span>';
      prevBtn.addEventListener('click', () => this.prev());

      // Create next button
      const nextBtn = document.createElement('button');
      nextBtn.className = 'portal-card__carousel-btn portal-card__carousel-btn--next';
      nextBtn.setAttribute('aria-label', 'Next card');
      nextBtn.innerHTML = '<span>›</span>';
      nextBtn.addEventListener('click', () => this.next());

      // Create dots indicator
      const dotsWrapper = document.createElement('div');
      dotsWrapper.className = 'portal-card__carousel-dots';

      this.cards.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'portal-card__carousel-dot';
        dot.setAttribute('aria-label', `Go to card ${index + 1}`);
        if (index === 0) dot.classList.add('portal-card__carousel-dot--active');
        dot.addEventListener('click', () => this.goToSlide(index));
        dotsWrapper.appendChild(dot);
      });

      controlsWrapper.appendChild(prevBtn);
      controlsWrapper.appendChild(nextBtn);
      controlsWrapper.appendChild(dotsWrapper);

      this.carousel.appendChild(controlsWrapper);

      this.prevBtn = prevBtn;
      this.nextBtn = nextBtn;
      this.dots = Array.from(dotsWrapper.querySelectorAll('.portal-card__carousel-dot'));
    }

    attachEventListeners() {
      // Touch events for swipe
      this.spread.addEventListener('touchstart', (e) => this.handleTouchStart(e));
      this.spread.addEventListener('touchmove', (e) => this.handleTouchMove(e));
      this.spread.addEventListener('touchend', () => this.handleTouchEnd());

      // Mouse events for drag
      this.spread.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      this.spread.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.spread.addEventListener('mouseup', () => this.handleMouseUp());
      this.spread.addEventListener('mouseleave', () => this.handleMouseUp());

      // Keyboard navigation
      document.addEventListener('keydown', (e) => {
        if (!this.isCarouselActive()) return;
        if (e.key === 'ArrowLeft') this.prev();
        if (e.key === 'ArrowRight') this.next();
      });

      // Update on resize
      window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
      // Check if controls need to be created on resize
      const carouselOnDesktop = this.carousel.dataset.carouselDesktop === 'true';
      const needsControls = carouselOnDesktop || window.innerWidth < 1200;
      const hasControls = !!this.prevBtn;

      if (needsControls && !hasControls) {
        // Create controls if needed but don't exist
        this.createControls();
      }

      this.updateCarousel();
    }

    isCarouselActive() {
      // Check if carousel should be active on desktop
      const carouselOnDesktop = this.carousel.dataset.carouselDesktop === 'true';
      
      if (carouselOnDesktop) {
        // Carousel enabled on all screen sizes
        return true;
      }
      
      // Default: only on mobile and tablet (not desktop)
      return window.innerWidth < 1200;
    }

    handleTouchStart(e) {
      if (!this.isCarouselActive()) return;
      this.startX = e.touches[0].clientX;
      this.isDragging = true;
    }

    handleTouchMove(e) {
      if (!this.isDragging || !this.isCarouselActive()) return;
      e.preventDefault();
    }

    handleTouchEnd() {
      if (!this.isDragging || !this.isCarouselActive()) return;
      this.isDragging = false;
    }

    handleMouseDown(e) {
      if (!this.isCarouselActive()) return;
      this.startX = e.clientX;
      this.isDragging = true;
      this.spread.style.cursor = 'grabbing';
    }

    handleMouseMove(e) {
      if (!this.isDragging || !this.isCarouselActive()) return;
      e.preventDefault();
      const diff = e.clientX - this.startX;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          this.prev();
        } else {
          this.next();
        }
        this.isDragging = false;
        this.spread.style.cursor = 'grab';
      }
    }

    handleMouseUp() {
      if (!this.isCarouselActive()) return;
      this.isDragging = false;
      this.spread.style.cursor = 'grab';
    }

    prev() {
      this.currentIndex = (this.currentIndex - 1 + this.cards.length) % this.cards.length;
      this.updateCarousel();
    }

    next() {
      this.currentIndex = (this.currentIndex + 1) % this.cards.length;
      this.updateCarousel();
    }

    goToSlide(index) {
      this.currentIndex = index;
      this.updateCarousel();
    }

    updateCarousel() {
      if (!this.isCarouselActive()) {
        // Reset for desktop view
        this.cards.forEach((card) => {
          card.classList.remove('portal-card__carousel-card--active', 'portal-card__carousel-card--prev', 'portal-card__carousel-card--next');
          card.style.transform = '';
          card.style.opacity = '';
        });
        return;
      }

      // Update cards
      this.cards.forEach((card, index) => {
        card.classList.remove('portal-card__carousel-card--active', 'portal-card__carousel-card--prev', 'portal-card__carousel-card--next');

        if (index === this.currentIndex) {
          card.classList.add('portal-card__carousel-card--active');
        } else if (index === (this.currentIndex - 1 + this.cards.length) % this.cards.length) {
          card.classList.add('portal-card__carousel-card--prev');
        } else if (index === (this.currentIndex + 1) % this.cards.length) {
          card.classList.add('portal-card__carousel-card--next');
        }
      });

      // Update dots
      if (this.dots) {
        this.dots.forEach((dot, index) => {
          dot.classList.toggle('portal-card__carousel-dot--active', index === this.currentIndex);
        });
      }

      // Update button states
      if (this.prevBtn && this.nextBtn) {
        this.prevBtn.disabled = false;
        this.nextBtn.disabled = false;
      }
    }
  }

  // Initialize carousel on DOM ready
  function initCarousels() {
    const carousels = document.querySelectorAll('.portal-card__main');
    carousels.forEach((carousel) => new PortalCardCarousel(carousel));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousels);
  } else {
    initCarousels();
  }
})();
