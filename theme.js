(() => {
  const storageKey = 'city-weather-theme';
  const root = document.documentElement;

  function preferredTheme() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (error) {
      // Storage may be unavailable; fall back to the system preference.
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      button.textContent = nextTheme === 'light' ? '☀ Light' : '☾ Dark';
      button.setAttribute('aria-label', 'Switch to ' + nextTheme + ' mode');
      button.setAttribute('title', 'Switch to ' + nextTheme + ' mode');
      button.setAttribute('aria-pressed', String(theme === 'light'));
    });

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === 'light' ? '#f4f5f7' : '#0b0b0c';
  }

  applyTheme(preferredTheme());

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-theme-toggle]');
    if (!button) return;

    const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(storageKey, nextTheme);
    } catch (error) {
      // The current page can still change theme without persistent storage.
    }
    applyTheme(nextTheme);
  });
})();