document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-portal-list]').forEach((portal) => {
    const toggle = portal.querySelector('[data-layout-toggle]');
    const list = portal.querySelector('.portal-list-grid');

    if (toggle && list) {
      toggle.addEventListener('click', () => {
        const layout = list.dataset.layout === 'fixed' ? 'masonry' : 'fixed';
        const nextLayout = layout === 'fixed' ? 'masonry' : 'fixed';

        list.dataset.layout = layout;
        toggle.setAttribute('aria-pressed', String(layout === 'masonry'));
        toggle.title = `Switch to ${nextLayout} layout`;
      });
    }

    const filterToggle = portal.querySelector('[data-filter-toggle]');
    const filter = portal.querySelector('[data-list-filter]');
    const input = portal.querySelector('[data-filter-input]');
    const sections = Array.from(portal.querySelectorAll('.portal-list__section'));
    const mobileViewport = window.matchMedia('(max-width: 768px)');

    if (!filterToggle || !filter || !input) return;

    const renderMatch = (link, query) => {
      const title = link.dataset.filterTitle || link.textContent.trim();
      link.dataset.filterTitle = title;
      link.textContent = '';

      if (!query) {
        link.textContent = title;
        return;
      }

      const lowerTitle = title.toLocaleLowerCase();
      const lowerQuery = query.toLocaleLowerCase();
      let start = 0;
      let matchIndex = lowerTitle.indexOf(lowerQuery);

      while (matchIndex !== -1) {
        link.append(document.createTextNode(title.slice(start, matchIndex)));
        const mark = document.createElement('mark');
        mark.className = 'portal-list__match';
        mark.textContent = title.slice(matchIndex, matchIndex + query.length);
        link.append(mark);
        start = matchIndex + query.length;
        matchIndex = lowerTitle.indexOf(lowerQuery, start);
      }

      link.append(document.createTextNode(title.slice(start)));
    };

    const filterEntries = () => {
      const query = input.value.trim();

      sections.forEach((section) => {
        let visibleItems = 0;

        section.querySelectorAll('.portal-list__item').forEach((item) => {
          const link = item.querySelector('.portal-card__link');
          const title = link.dataset.filterTitle || link.textContent.trim();
          const matches = !query || title.toLocaleLowerCase().includes(query.toLocaleLowerCase());

          item.hidden = !matches;
          renderMatch(link, matches ? query : '');
          if (matches) visibleItems += 1;
        });

        section.hidden = visibleItems === 0;
      });
    };

    const closeFilter = () => {
      input.value = '';
      filterEntries();

      if (mobileViewport.matches) {
        input.blur();
        return;
      }

      filter.hidden = true;
      filterToggle.setAttribute('aria-expanded', 'false');
      filterToggle.focus();
    };

    filterToggle.addEventListener('click', () => {
      const opening = filter.hidden;
      filter.hidden = !opening;
      filterToggle.setAttribute('aria-expanded', String(opening));

      if (opening) {
        input.focus();
      } else {
        closeFilter();
      }
    });

    input.addEventListener('input', filterEntries);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeFilter();
    });

    const syncFilterWithViewport = () => {
      if (mobileViewport.matches) {
        filter.hidden = false;
        filterToggle.setAttribute('aria-expanded', 'true');
      } else {
        input.value = '';
        filterEntries();
        filter.hidden = true;
        filterToggle.setAttribute('aria-expanded', 'false');
      }
    };

    syncFilterWithViewport();
    mobileViewport.addEventListener('change', syncFilterWithViewport);
  });
});
