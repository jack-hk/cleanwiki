document.addEventListener('DOMContentLoaded', () => {
  const detectSystemTheme = () => {
    if (window.matchMedia) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';
      return systemTheme;
    }
    return 'light'; // Default to light if matchMedia is not available
  };

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    const systemTheme = detectSystemTheme();
    document.documentElement.setAttribute('data-theme', systemTheme);
  }

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    console.log(`Theme switched to ${newTheme}`); // Debug log to confirm the theme switch
  };

  // Listen for system theme changes (this will trigger a theme change based on system preference)
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      console.log(`System theme changed to ${newTheme}`); // Debug log for system theme change
    });

  // Expose the toggleTheme function globally
  window.toggleTheme = toggleTheme;

  console.log('Theme toggle script loaded successfully!');
});
