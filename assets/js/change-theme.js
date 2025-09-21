document.addEventListener('DOMContentLoaded', () => {
  const radios = document.querySelectorAll('input[name="theme"]');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const themeKey = 'theme';

  const detectSystemTheme = () => {
    return prefersDark.matches ? 'dark' : 'light';
  };

  const applyTheme = (theme) => {
    if (theme === 'auto') {
      const systemTheme = detectSystemTheme();
      document.documentElement.setAttribute('data-theme', systemTheme);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }

    localStorage.setItem(themeKey, theme);

    radios.forEach((radio) => {
      radio.checked = radio.value === theme;
    });
  };

  radios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        applyTheme(radio.value);
      }
    });
  });

  prefersDark.addEventListener('change', () => {
    const currentTheme = localStorage.getItem(themeKey);
    if (currentTheme === 'auto') {
      applyTheme('auto');
      console.log('System theme changed, auto mode reapplied');
    }
  });

  const savedTheme = localStorage.getItem(themeKey) || 'auto';
  applyTheme(savedTheme);

  window.toggleTheme = () => {
    const currentTheme = localStorage.getItem(themeKey) || 'auto';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
  };
});
