/* =========================
   ELEMENTOS DOM
========================= */
const toast = document.getElementById("toast");
const inputText = document.getElementById("inputText");
const btnSummarize = document.getElementById("btnSummarize");
const output = document.getElementById("output");
const charCounter = document.getElementById("charCounter");
const buttonSummarizeText = document.getElementById("btnSummarizeText");
const btnMic = document.getElementById("btnMic");
const copyIconWrapper = document.getElementById("copyIconWrapper");
const inputTypeTabs = document.querySelectorAll(".inputTypeOption");
const sizeCards = document.querySelectorAll(".summary-size-card");
const languageToggle = document.getElementById("languageToggle");
const languageMenu = document.getElementById("languageMenu");
const languageOptions = document.querySelectorAll(".language-option");
const languageDropdown = document.querySelector(".language-dropdown");

/* opcionais, caso cries depois */
const inputUrl = document.getElementById("inputUrl");
const inputFile = document.getElementById("inputFile");

/* =========================
   ESTADO
========================= */
let selectedSize = "size-medium";
let selectedInputType = "Text";
let recognition = null;
let isListening = false;
let finalTranscript = "";
let recognitionBaseText = "";

/* =========================
   IDIOMA
========================= */
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

  if (recognition) {
    recognition.lang = lang;
  }
}

function setLanguage(lang) {
  localStorage.setItem("nuxsum_lang", lang);
  applyLanguage(lang);
}

/* =========================
   TOAST
========================= */
function showToast(text) {
  if (!toast) return;

  toast.textContent = text;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

/* =========================
   SUMMARY SIZE
========================= */
function initSummarySizeCards() {
  sizeCards.forEach((card) => {
    if (card.dataset.size === "size-medium") {
      card.classList.add("selected");
    }

    card.addEventListener("click", () => {
      sizeCards.forEach((item) => item.classList.remove("selected"));
      card.classList.add("selected");
      selectedSize = card.dataset.size;
    });
  });
}

/* =========================
   SUMMARY INPUT TABS
========================= */
function updateInputModeUI() {
  if (!inputText && !inputUrl && !inputFile) return;

  if (inputText) {
    inputText.style.display = selectedInputType === "Text" ? "block" : "none";
  }

  if (inputUrl) {
    inputUrl.style.display = selectedInputType === "URL" ? "block" : "none";
  }

  if (inputFile) {
    inputFile.style.display = selectedInputType === "File" ? "block" : "none";
  }

  if (charCounter) {
    charCounter.style.display = selectedInputType === "Text" ? "block" : "none";
  }

  if (btnMic) {
    btnMic.style.display = selectedInputType === "Text" ? "flex" : "none";
  }
}

function initSummaryInputTypeTabs() {
  inputTypeTabs.forEach((tab) => {
    const inputType = tab.dataset.inputType;

    if (inputType === "Text") {
      tab.classList.add("active");
      selectedInputType = "Text";
    }

    tab.addEventListener("click", () => {
      inputTypeTabs.forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      selectedInputType = inputType || "Text";

      updateInputModeUI();
      console.log("selectedInputType:", selectedInputType);
    });
  });

  updateInputModeUI();
}

/* =========================
   CONTADOR DE CARACTERES
========================= */
function updateCharCounter() {
  if (!inputText || !charCounter) return;

  const count = inputText.value.length;
  charCounter.textContent = `${count} / 12000`;

  if (count >= 12000) {
    charCounter.style.color = "red";
  } else if (count > 10000) {
    charCounter.style.color = "orange";
  } else {
    charCounter.style.color = "white";
  }
}

function initCharCounter() {
  if (!charCounter || !inputText) return;

  charCounter.textContent = "0 / 12000";
  inputText.addEventListener("input", updateCharCounter);
}

/* =========================
   COPY RESULT
========================= */
function initCopyButton() {
  if (!copyIconWrapper || !output) return;

  copyIconWrapper.addEventListener("click", async () => {
    const text = output.textContent.trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);

      copyIconWrapper.innerHTML = '<i data-lucide="check"></i>';
      copyIconWrapper.style.pointerEvents = "none";
      lucide.createIcons();
      showToast(t("copied"));

      setTimeout(() => {
        copyIconWrapper.innerHTML = '<i data-lucide="clipboard"></i>';
        copyIconWrapper.style.pointerEvents = "auto";
        lucide.createIcons();
      }, 1000);
    } catch (error) {
      console.error("Copy failed:", error);
      showToast(t("serverError"));
    }
  });
}

/* =========================
   DROPDOWN DE IDIOMA
========================= */
function initLanguageDropdown() {
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

/* =========================
   MICROFONE
========================= */
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition || !btnMic || !inputText) {
    console.log("Speech recognition not supported in this browser.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = getCurrentLanguage();
  recognition.interimResults = false;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  btnMic.addEventListener("click", () => {
    if (!recognition) {
      showToast(t("speechNotSupported"));
      return;
    }

    if (!isListening) {
      recognitionBaseText = inputText.value.trim();
      finalTranscript = "";
      recognition.lang = getCurrentLanguage();

      try {
        recognition.start();
        isListening = true;
        btnMic.classList.add("listening");
        showToast(t("listening"));
      } catch (error) {
        console.error("Speech start error:", error);
      }
    } else {
      isListening = false;
      recognition.stop();
      btnMic.classList.remove("listening");
      showToast(t("stoppedListening"));
    }
  });

  recognition.addEventListener("result", (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim();

    if (!transcript) return;

    inputText.value = recognitionBaseText
      ? `${recognitionBaseText} ${transcript}`.trim()
      : transcript;

    recognitionBaseText = inputText.value;
    inputText.dispatchEvent(new Event("input"));
  });

  recognition.addEventListener("end", () => {
    btnMic.classList.remove("listening");

    if (isListening) {
      try {
        recognition.start();
        btnMic.classList.add("listening");
      } catch (error) {
        console.log("Recognition restart blocked:", error);
      }
    }
  });

  recognition.addEventListener("error", (event) => {
    console.log("Speech recognition error:", event.error);
    btnMic.classList.remove("listening");

    if (event.error === "not-allowed") {
      isListening = false;
      showToast(t("speechNotSupported"));
      return;
    }

    if (event.error === "aborted") {
      return;
    }
  });
}

/* =========================
   SUMMARIZE TEXT
========================= */
async function summarizeText() {
  const text = inputText?.value.trim();
  const size = selectedSize;

  if (!text) {
    output.textContent = t("emptyInput");
    return;
  }

  btnSummarize.disabled = true;
  btnSummarize.classList.add("disabled-btn");
  buttonSummarizeText.textContent = t("waitingSummary");
  output.textContent = t("writingSummary");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        size,
        lang: getCurrentLanguage()
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get("content-type") || "";
    let data = {};

    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const rawText = await res.text();
      console.log("Resposta não JSON:", rawText);
      throw new Error("Invalid server response");
    }

    if (!res.ok) {
      output.textContent = data.error || t("serverError");
      return;
    }

    output.textContent = data.summary || t("emptySummary");
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Summarize error:", error);

    if (error.name === "AbortError") {
      output.textContent = t("requestTimeout");
    } else {
      output.textContent = t("serverError");
    }
  } finally {
    btnSummarize.disabled = false;
    btnSummarize.classList.remove("disabled-btn");
    buttonSummarizeText.textContent = t("summarize");
  }
}

/* =========================
   SUMMARIZE URL
========================= */
async function summarizeFromUrl(url, size) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch("/api/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url,
        size,
        lang: getCurrentLanguage()
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao resumir URL");
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/* =========================
   BOTÃO SUMMARIZE
========================= */
async function handleSummarizeClick() {
  if (!output) return;

  if (selectedInputType === "Text") {
    await summarizeText();
    return;
  }

  if (selectedInputType === "URL") {
    if (!inputUrl) {
      output.textContent = "URL mode ainda não está ligado na interface.";
      return;
    }

    const url = inputUrl.value.trim();

    if (!url) {
      output.textContent = "Insere uma URL primeiro.";
      return;
    }

    btnSummarize.disabled = true;
    btnSummarize.classList.add("disabled-btn");
    buttonSummarizeText.textContent = t("waitingSummary");
    output.textContent = t("writingSummary");

    try {
      const data = await summarizeFromUrl(url, selectedSize);
      output.textContent = data.summary || t("emptySummary");
    } catch (error) {
      console.error("URL summarize error:", error);

      if (error.name === "AbortError") {
        output.textContent = t("requestTimeout");
      } else {
        output.textContent = error.message || t("serverError");
      }
    } finally {
      btnSummarize.disabled = false;
      btnSummarize.classList.remove("disabled-btn");
      buttonSummarizeText.textContent = t("summarize");
    }

    return;
  }

  if (selectedInputType === "File") {
    output.textContent = "File mode ainda não está implementado.";
  }
}

function initSummarizeButton() {
  if (!btnSummarize) return;
  btnSummarize.addEventListener("click", handleSummarizeClick);
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  let savedLang = localStorage.getItem("nuxsum_lang");

  if (!savedLang) {
    savedLang = getDefaultBrowserLanguage();
    localStorage.setItem("nuxsum_lang", savedLang);
  }

  applyLanguage(savedLang);
  initSummarizeButton();
  initSummarySizeCards();
  initSummaryInputTypeTabs();
  initCharCounter();
  initCopyButton();
  initLanguageDropdown();
  initSpeechRecognition();

  lucide.createIcons();
});