(function () {
  const language = document.documentElement.lang;
  const storageKey = 'sysera-language';
  const languageTarget = (targetLanguage) => {
    if (location.hostname === 'sysera.tech') {
      return `https://sysera.tech${targetLanguage === 'ar' ? '/ar' : '/'}`;
    }
    if (location.protocol === 'file:') {
      return targetLanguage === 'ar' ? 'ar/index.html' : '../index.html';
    }
    return targetLanguage === 'ar' ? 'ar/' : '../';
  };
  let choice = null;

  try {
    choice = localStorage.getItem(storageKey);
  } catch (_) {
    // Navigation still works when storage is unavailable.
  }

  const browserLanguage = navigator.languages?.[0] || navigator.language || '';
  if (language === 'en' && (choice === 'ar' || (!choice && /^ar(?:-|$)/i.test(browserLanguage)))) {
    location.replace(`${languageTarget('ar')}${location.search}${location.hash}`);
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-language]').forEach((link) => {
      const targetLanguage = link.dataset.language;
      const targetPath = languageTarget(targetLanguage);
      const updateTarget = () => {
        link.setAttribute('href', `${targetPath}${location.search}${location.hash}`);
      };
      updateTarget();
      link.addEventListener('pointerenter', updateTarget);
      link.addEventListener('focus', updateTarget);
      link.addEventListener('contextmenu', updateTarget);
      link.addEventListener('click', () => {
        updateTarget();
        try {
          localStorage.setItem(storageKey, targetLanguage);
        } catch (_) {
          // The selected page can still open without persistence.
        }
      });
    });
  });
})();
