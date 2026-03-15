function getDefaultBrowserLanguage() {
  const browserLang = navigator.language || "en-US";

  if (browserLang.startsWith("pt")) return "pt-PT";
  if (browserLang.startsWith("en")) return "en-US";
  if (browserLang.startsWith("id")) return "id-ID";
  if (browserLang.startsWith("zh")) return "zh-CN";

  return "en-US";
}

function getCurrentLanguage() {
  return localStorage.getItem("nuxsum_lang") || getDefaultBrowserLanguage();
}

function t(key) {
  const lang = getCurrentLanguage();
  return translations?.[lang]?.[key] || translations?.["en-US"]?.[key] || key;
}

function applyLanguage(lang) {
  const tObj = translations?.[lang];
  if (!tObj) return;

  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (tObj[key]) {
      element.textContent = tObj[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (tObj[key]) {
      element.placeholder = tObj[key];
    }
  });
}

function setLanguage(lang) {
  localStorage.setItem("nuxsum_lang", lang);
  applyLanguage(lang);
}

function initLanguageDropdown() {
  const languageToggle = document.getElementById("languageToggle");
  const languageMenu = document.getElementById("languageMenu");
  const languageOptions = document.querySelectorAll(".language-option");
  const languageDropdown = document.querySelector(".language-dropdown");

  if (!languageToggle || !languageMenu || !languageDropdown) return;

  languageToggle.addEventListener("click", () => {
    languageMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", (event) => {
    if (!languageDropdown.contains(event.target)) {
      languageMenu.classList.add("hidden");
    }
  });

  languageOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const lang = option.dataset.lang;
      if (!lang) return;

      setLanguage(lang);
      languageMenu.classList.add("hidden");
    });
  });
}

function initCommonPage() {
  let savedLang = localStorage.getItem("nuxsum_lang");

  if (!savedLang) {
    savedLang = getDefaultBrowserLanguage();
    localStorage.setItem("nuxsum_lang", savedLang);
  }

  applyLanguage(savedLang);
  initLanguageDropdown();

  if (window.lucide) {
    lucide.createIcons();
  }
}

function getEmailUsername(email) {
  if (!email) return "";
  return email.split("@")[0];
}