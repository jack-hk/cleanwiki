class CustomPagefind {
  constructor(options = {}) {
    console.log('CustomPagefind constructor called with options:', options);

    this.config = {
      element: '#search',
      initialPageSize: 5,
      loadMoreCount: 5,
      showSubResults: true,
      showImages: true,
      debounceTimeoutMs: 300,
      excerptLength: 30,
      thumbnailSources: {
        primary: 'image',
        fallback1: 'thumbnail',
        fallback2: 'featured'
      },
      placeholderImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23e5e7eb" width="400" height="400"/%3E%3C/svg%3E',
      ...options
    };

    this.container = document.querySelector(this.config.element);
    if (!this.container) {
      console.error('PageFind container not found:', this.config.element);
      return;
    }

    console.log('Container found:', this.container);

    this.currentQuery = '';
    this.allResults = [];
    this.displayedCount = 0;
    this.debounceTimer = null;
    this.isSearching = false;
    this.pagefindReady = false;

    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
    // Initialize PageFind asynchronously
    this.initPageFind().catch(err => console.error('Failed to initialize PageFind:', err));
  }

  async initPageFind() {
    // Wait for PageFind API to be loaded via the module import
    return new Promise((resolve) => {
      const checkPageFind = () => {
        if (window.pagefind && typeof window.pagefind.init === 'function') {
          console.log('PageFind API is available:', window.pagefind);
          this.initializePageFind().then(resolve);
        } else {
          console.log('Waiting for PageFind API...');
          setTimeout(checkPageFind, 100);
        }
      };

      // Listen for the pagefind-loaded event from the module script
      window.addEventListener('pagefind-loaded', () => {
        console.log('PageFind loaded event received');
        checkPageFind();
      });

      // Also check immediately in case module already loaded
      checkPageFind();
    });
  }

  async initializePageFind() {
    try {
      // Initialize PageFind with language and wasm loading
      console.log('Initializing PageFind with language...');
      // Get the document language or default to 'en'
      const docLang = document.documentElement.getAttribute('lang') || 'en';
      const lang = docLang.split('-')[0]; // Get primary language code

      console.log('Calling pagefind.init with language:', lang);
      await window.pagefind.init(lang);
      this.pagefindReady = true;
      console.log('PageFind initialized and ready for search');
    } catch (error) {
      console.error('Error initializing PageFind:', error);
      this.pagefindReady = true; // Mark ready anyway
    }
  }

  render() {
    this.container.innerHTML = `
      <div class="pagefind-search-wrapper-decor">
      </div>
      <div class="pagefind-search-container">
        <div class="pagefind-search-bg">
        <div class="pagefind-search-wrapper">
          <input
            type="text"
            class="pagefind-search-input"
            placeholder="Search this site..."
            autocomplete="off"
          />
          <span class="pagefind-search-count" aria-live="polite"></span>
          <button class="pagefind-search-clear-btn" aria-label="Clear search" style="display: none;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.28 5.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 5.22z"/>
            </svg>
          </button>
        </div>
          <button
    class="popover-search__close"
    popovertarget="Search"
    popovertargetaction="hide"
    aria-label="Close search">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </button>
        </div>
        <ul class="pagefind-results"></ul>
        <div class="pagefind-results-info"></div>
      </div>
    `;
  }

  attachEventListeners() {
    const input = this.container.querySelector('.pagefind-search-input');
    const clearBtn = this.container.querySelector('.pagefind-search-clear-btn');

    input.addEventListener('input', (e) => {
      this.handleInput(e.target.value);
      clearBtn.style.display = e.target.value ? 'flex' : 'none';
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      this.handleInput('');
      clearBtn.style.display = 'none';
      input.focus();
    });

    input.focus();
  }

  handleInput(query) {
    this.currentQuery = query;
    clearTimeout(this.debounceTimer);

    if (!query.trim()) {
      this.displayResults([]);
      return;
    }

    this.debounceTimer = setTimeout(() => {
      console.log('Debounce complete, performing search for:', query);
      this.performSearch(query);
    }, this.config.debounceTimeoutMs);
  }

  sortResults(results, query) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);

    return results.sort((a, b) => {
      // Get normalized titles
      const titleA = (a.meta?.title || a.title || '').split('|')[0].toLowerCase().trim();
      const titleB = (b.meta?.title || b.title || '').split('|')[0].toLowerCase().trim();

      // Score calculation function
      const calculateScore = (title, terms) => {
        let score = 0;

        // Exact match = highest priority
        if (title === terms.join(' ')) {
          score += 1000;
        }

        // Title starts with query = very high priority
        if (title.startsWith(terms.join(' '))) {
          score += 500;
        }

        // All query terms in title = high priority
        if (terms.every(term => title.includes(term))) {
          score += 250;
        }

        // Count how many query terms appear in title
        const matchingTerms = terms.filter(term => title.includes(term)).length;
        score += matchingTerms * 50;

        return score;
      };

      const scoreA = calculateScore(titleA, queryTerms);
      const scoreB = calculateScore(titleB, queryTerms);

      // Sort by score (descending) - higher scores come first
      return scoreB - scoreA;
    });
  }

  async performSearch(query) {
    console.log('performSearch called with query:', query, 'pagefindReady:', this.pagefindReady, 'pagefind exists:', !!window.pagefind);

    if (!this.pagefindReady || !window.pagefind) {
      console.error('PageFind not ready. Ready:', this.pagefindReady, 'Exists:', !!window.pagefind);
      return;
    }

    this.isSearching = true;
    this.displayedCount = 0;

    try {
      console.log('Calling window.pagefind.search() with query:', query);
      const searchResults = await window.pagefind.search(query);
      console.log('Search result object:', searchResults);

      // PageFind returns an object with results array
      if (searchResults && searchResults.results && Array.isArray(searchResults.results)) {
        console.log('Raw results count:', searchResults.results.length);

        // Each result object has a .data() async method that needs to be called
        // to load the full fragment data (title, excerpt, sub_results, etc.)
        const fullyLoadedResults = await Promise.all(
          searchResults.results.map(async (result) => {
            try {
              const data = await result.data();
              console.log('Loaded result data:', data);
              return {
                ...result,
                ...data
              };
            } catch (err) {
              console.error('Error loading result data:', err, 'for result:', result);
              return result;
            }
          })
        );

        // Sort results: prioritize exact/near-exact title matches
        this.allResults = this.sortResults(fullyLoadedResults, query);
      } else {
        this.allResults = [];
      }

      console.log('Found', this.allResults.length, 'fully loaded results');
      this.displayResults(this.allResults);
    } catch (error) {
      console.error('Search error:', error);
      console.error('Error stack:', error.stack);
      this.displayResults([]);
    } finally {
      this.isSearching = false;
    }
  }

  displayResults(results) {
    const resultsList = this.container.querySelector('.pagefind-results');
    const infoDiv = this.container.querySelector('.pagefind-results-info');
    const searchWrapper = this.container.querySelector('.pagefind-search-wrapper');
    const resultsCount = this.container.querySelector('.pagefind-search-count');

    if (!this.currentQuery.trim()) {
      resultsList.innerHTML = '';
      infoDiv.innerHTML = '';
      if (searchWrapper) {
        searchWrapper.classList.remove('has-results');
      }
      if (resultsCount) {
        resultsCount.textContent = '';
      }
      return;
    }

    if (results.length === 0) {
      resultsList.innerHTML = `
        <div class="pagefind-no-results">
          <h3 class="pagefind-no-results-title">No results found</h3>
          <p class="pagefind-no-results-text">Try different keywords</p>
        </div>
      `;
      infoDiv.innerHTML = '';
      if (searchWrapper) {
        searchWrapper.classList.remove('has-results');
      }
      if (resultsCount) {
        resultsCount.textContent = '0 results';
      }
      return;
    }

    this.displayedCount = Math.min(this.config.initialPageSize, results.length);
    const visibleResults = results.slice(0, this.displayedCount);

    resultsList.innerHTML = '';
    visibleResults.forEach((result) => {
      const element = this.createResultElement(result);
      if (element) {
        resultsList.appendChild(element);
      }
    });

    if (resultsCount) {
      const total = results.length;
      resultsCount.textContent = `${total} ${total === 1 ? 'result' : 'results'}`;
    }

    // Add has-results class when results are present
    if (searchWrapper) {
      searchWrapper.classList.add('has-results');
    }

    this.updateLoadMoreButton(results);
  }

  createResultElement(result) {
    const li = document.createElement('li');
    li.className = 'pagefind-result';

    const imageHtml = this.config.showImages ? this.createThumbnail(result) : '';

    // Get the main title and remove site name suffix (e.g., "| Golden Wastes")
    let mainTitle = result.meta?.title || result.title;
    mainTitle = mainTitle.split('|')[0].trim(); // Remove everything after |

    // Skip results with empty titles
    if (!mainTitle) {
      return null;
    }

    const contentHtml = `
      <div class="pagefind-result-content">
        <h3 class="pagefind-result-title">
          <a href="${result.url}">${this.escapeHtml(mainTitle)}</a>
        </h3>
        <p class="pagefind-result-excerpt">${result.excerpt}</p>
        ${this.config.showSubResults && result.sub_results?.length ? this.createSubResults(result.sub_results, mainTitle) : ''}
      </div>
    `;

    li.innerHTML = imageHtml + contentHtml;

    li.addEventListener('click', (e) => {
      if (e.target.tagName !== 'A') {
        const link = li.querySelector('a');
        if (link) link.click();
      }
    });

    return li;
  }

  createThumbnail(result) {
    let imageUrl = this.config.placeholderImage;

    if (this.config.thumbnailSources.primary && result.meta?.[this.config.thumbnailSources.primary]) {
      imageUrl = result.meta[this.config.thumbnailSources.primary];
    }

    if (imageUrl === this.config.placeholderImage && this.config.thumbnailSources.fallback1 && result.meta?.[this.config.thumbnailSources.fallback1]) {
      imageUrl = result.meta[this.config.thumbnailSources.fallback1];
    }

    if (imageUrl === this.config.placeholderImage && this.config.thumbnailSources.fallback2 && result.meta?.[this.config.thumbnailSources.fallback2]) {
      imageUrl = result.meta[this.config.thumbnailSources.fallback2];
    }

    // UPDATED: Now points to result.meta?.invert_dark (with underscore)
    const invertDark = result.meta?.invert_dark === 'true' ? ' data-invert-dark="true"' : '';

    return `
      <div class="pagefind-result-thumb">
        <img src="${imageUrl}" alt="${this.escapeHtml(result.meta?.image_alt || result.meta?.title || '')}"${invertDark}>
      </div>
    `;
  }

  createSubResults(subResults, mainTitle) {
    if (!Array.isArray(subResults) || subResults.length === 0) return '';

    // Normalize titles: remove site suffix, convert to lowercase, trim whitespace
    const normalizeTitle = (title) => {
      return title.split('|')[0].toLowerCase().trim();
    };

    const normalizedMainTitle = normalizeTitle(mainTitle);

    // Filter out sub-results that exactly match the main title (after cleaning both)
    const filteredResults = subResults.filter((sub) => {
      const normalizedSubTitle = normalizeTitle(sub.title);
      return normalizedSubTitle !== normalizedMainTitle;
    });

    // If no results remain after filtering, return empty
    if (filteredResults.length === 0) return '';

    // Show up to 3 results
    const limitedResults = filteredResults.slice(0, 3);
    let html = '<ul class="pagefind-result-subresults">';

    limitedResults.forEach((sub) => {
      // Remove site name suffix from subresult titles
      let subTitle = sub.title.split('|')[0].trim();

      html += `
        <li class="pagefind-result-subresult">
          <h4 class="pagefind-result-subresult-title">
            <a href="${sub.url}">${this.escapeHtml(subTitle)}</a>
          </h4>
          <p class="pagefind-result-subresult-excerpt">${sub.excerpt}</p>
        </li>
      `;
    });

    html += '</ul>';
    return html;
  }

  updateLoadMoreButton(allResults) {
    const infoDiv = this.container.querySelector('.pagefind-results-info');
    const resultsList = this.container.querySelector('.pagefind-results');

    if (this.displayedCount >= allResults.length) {
      infoDiv.innerHTML = '';
      return;
    }

    infoDiv.innerHTML = `
      <button class="pagefind-load-more">
        Load more results
      </button>
    `;

    const loadMoreBtn = infoDiv.querySelector('.pagefind-load-more');
    loadMoreBtn.addEventListener('click', () => {
      const newCount = Math.min(
        this.displayedCount + this.config.loadMoreCount,
        allResults.length
      );

      const newResults = allResults.slice(this.displayedCount, newCount);
      newResults.forEach((result) => {
        const element = this.createResultElement(result);
        if (element) {
          resultsList.appendChild(element);
        }
      });

      this.displayedCount = newCount;
      this.updateLoadMoreButton(allResults);
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Make CustomPagefind globally available
window.CustomPagefind = CustomPagefind;