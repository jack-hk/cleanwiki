(function() {
  const IFRAME_SELECTOR = '#cusdis_thread iframe';
  const CONFIRM_BTN_ID = 'cusdis-confirm-button';
  const CONFIRM_SECTION_ID = 'cusdis-confirmation';
  const CONTAINER_ID = 'cusdis-container';
  const MAX_INJECT_ATTEMPTS = 60;
  const INJECT_RETRY_DELAY = 100;

  function getComputedVariables() {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    const variables = {};

    for (let i = 0; i < styles.length; i++) {
      const propName = styles[i];
      if (propName.startsWith('--')) {
        const value = styles.getPropertyValue(propName).trim();
        variables[propName] = value;
      }
    }

    return variables;
  }

  function injectStyles() {
    const iframe = document.querySelector(IFRAME_SELECTOR);
    if (!iframe) return false;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (!iframeDoc || !iframeDoc.head) return false;

      if (!iframeDoc.querySelector('style[data-cusdis-vars]')) {
        const variables = getComputedVariables();
        let varsCss = ':root { ';
        for (const [key, value] of Object.entries(variables)) {
          varsCss += `${key}: ${value}; `;
        }
        varsCss += '}';

        const varsStyle = document.createElement('style');
        varsStyle.setAttribute('data-cusdis-vars', 'true');
        varsStyle.textContent = varsCss;
        iframeDoc.head.appendChild(varsStyle);

        const customStyle = document.createElement('style');
        customStyle.setAttribute('data-cusdis-custom', 'true');
        customStyle.textContent = getIframeStyles();
        iframeDoc.head.appendChild(customStyle);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function getIframeStyles() {
    return `
// ===================================================
// Cusdis iframe Styles Template
// ===================================================
// This file documents the available styles for customizing
// the Cusdis comment iframe. These styles are NOT compiled
// into the main CSS file to avoid affecting the page.
//
// Instead, styles are injected directly into the iframe
// via the getIframeStyles() function in cusdis-confirm.js
//
// To modify iframe appearance:
// 1. Edit this file as a reference
// 2. Update the getIframeStyles() function in cusdis-confirm.js
//    to apply your custom styles to the iframe only
// ===================================================

bg-transparent{
background: var(--color-background-light) !important;
  }

  textarea{
  background: var(--color-background-light) !important;
    border-radius: 4px !important;
      border: 1px solid var(--color-border-default) !important;
  }
input {
  background: var(--color-background-light) !important;
  border: 1px solid var(--color-border-default) !important;
  border-radius: 4px !important;
  color: var(--color-text-default) !important;
  font-size: var(--font-size-base) !important;
}

label {
  color: var(--color-text-default) !important;
  font-family: var(--font-base) !important;
  font-size: var(--font-size-sm) !important;
  font-weight: var(--font-weight-heading) !important;
}


button {
  background-color: transparent !important;
  border: 1px solid var(--color-border-default) !important;
  border-radius: 4px !important;
  color: var(--color-text-default) !important;
  cursor: pointer !important;
  padding: 0.15rem 0.4rem !important;
  font-size: var(--font-size-base) !important;
  transition: background-color 0.3s ease !important;

  &:hover {
    background-color: var(--color-primary) !important;
    border: 1px solid transparent !important;
    color: var(--color-text-light) !important;
  }
}

button.font-bold{
  padding: 0.5rem 1rem !important;
  color: var(--color-text-light) !important;
  background-color: var(--color-primary) !important;
}

.mr-2 {
  font-size: var(--font-size-lg) !important;
}

.text-sm {
  color: var(--color-text-muted) !important;
  font-size: var(--font-size-xs) !important;
}

.font-bold.text-sm {
  font-size: var(--font-size-sm) !important;
}

.bg-blue-500
{
font-weight: bold !important;
border-radius: 4px !important;
background: var(--color-accent) !important;
}

.my-2 {
  margin-bottom: 0.5rem !important;
  margin-top: 0.5rem !important;
}

.my-4 {
  background-color: var(--color-background-light) !important;
  border: 1px solid var(--color-border-default) !important;
  border-radius: 4px !important;
  padding: 1rem !important;
}

    `.trim();
  }

  function tryInject(attempts = 0) {
    if (injectStyles()) return;
    if (attempts < MAX_INJECT_ATTEMPTS) {
      setTimeout(() => tryInject(attempts + 1), INJECT_RETRY_DELAY);
    }
  }

  const confirmBtn = document.getElementById(CONFIRM_BTN_ID);
  const confirmSection = document.getElementById(CONFIRM_SECTION_ID);
  const commentsContainer = document.getElementById(CONTAINER_ID);

  confirmBtn.addEventListener('click', () => {
    confirmSection.style.display = 'none';
    commentsContainer.style.display = 'block';
    tryInject();
  });
})();
