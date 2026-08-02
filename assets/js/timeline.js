(function () {
  'use strict';

  const initialiseTimeline = (timeline) => {
    const viewport = timeline.querySelector('[data-timeline-viewport]');
    const controls = timeline.querySelector('[data-timeline-controls]');
    const leftButton = timeline.querySelector('[data-timeline-left]');
    const rightButton = timeline.querySelector('[data-timeline-right]');

    if (!viewport) return;

    const update = () => {
      const tolerance = 2;
      const scrollable = viewport.scrollWidth > viewport.clientWidth + tolerance;
      const canScrollLeft = scrollable && viewport.scrollLeft > tolerance;
      const canScrollRight =
        scrollable &&
        viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - tolerance;

      timeline.classList.toggle('timeline--is-scrollable', scrollable);
      timeline.classList.toggle('timeline--can-scroll-left', canScrollLeft);
      timeline.classList.toggle('timeline--can-scroll-right', canScrollRight);

      if (controls) controls.hidden = !scrollable;
      if (leftButton) leftButton.disabled = !canScrollLeft;
      if (rightButton) rightButton.disabled = !canScrollRight;
    };

    const scroll = (direction) => {
      viewport.scrollBy({
        left: direction * Math.max(viewport.clientWidth * 0.8, 180),
        behavior: 'smooth',
      });
    };

    leftButton?.addEventListener('click', () => scroll(-1));
    rightButton?.addEventListener('click', () => scroll(1));
    viewport.addEventListener('scroll', update, { passive: true });

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(update);
      observer.observe(viewport);
      const track = viewport.querySelector('.timeline__track');
      if (track) observer.observe(track);
    } else {
      window.addEventListener('resize', update);
    }

    update();
  };

  const initialiseTimelines = () => {
    document.querySelectorAll('[data-timeline-scroll]').forEach(initialiseTimeline);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseTimelines);
  } else {
    initialiseTimelines();
  }
})();
