(function () {
  const storageKey = 'sysera-theme';
  const root = document.documentElement;
  const isArabic = root.lang === 'ar';
  let savedTheme = null;

  try {
    savedTheme = localStorage.getItem(storageKey);
  } catch (_) {
    // The switch remains usable when storage is unavailable.
  }

  let theme = savedTheme === 'light' ? 'light' : 'dark';

  const applyTheme = () => {
    root.setAttribute('data-theme', theme);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    themeColor?.setAttribute('content', theme === 'light' ? '#f4f7f9' : '#08090D');
  };

  applyTheme();

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    const icon = button.querySelector('[data-theme-icon]');
    const label = button.querySelector('.theme-toggle-label');

    const updateButton = () => {
      const isLight = theme === 'light';
      button.setAttribute('aria-pressed', String(isLight));
      button.setAttribute('aria-label', isArabic
        ? (isLight ? 'الوضع الفاتح مفعّل، التبديل إلى الوضع الغامق' : 'الوضع الفاتح غير مفعّل، التبديل إلى الوضع الفاتح')
        : (isLight ? 'Light mode is on; switch to dark mode' : 'Light mode is off; switch to light mode'));
      if (icon) icon.textContent = isLight ? '☾' : '☼';
      if (label) label.textContent = isArabic ? (isLight ? 'غامق' : 'فاتح') : (isLight ? 'Dark' : 'Light');
    };

    updateButton();
    button.addEventListener('click', () => {
      theme = theme === 'light' ? 'dark' : 'light';
      applyTheme();
      updateButton();
      try {
        localStorage.setItem(storageKey, theme);
      } catch (_) {
        // The current page still reflects the visitor's choice.
      }
    });
  });
})();
