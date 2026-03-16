document.addEventListener("DOMContentLoaded", () => {
  const savedLanguage = localStorage.getItem("selectedLanguage") || "en-US";

  if (typeof setLanguage === "function") {
    setLanguage(savedLanguage);
  } else if (typeof applyTranslations === "function") {
    applyTranslations(savedLanguage);
  }

  lucide.createIcons();
});