lucide.createIcons();

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

const sizeCards = document.querySelectorAll(".summary-size-card");
const languageToggle = document.getElementById("languageToggle");
const languageMenu = document.getElementById("languageMenu");
const languageOptions = document.querySelectorAll(".language-option");
const languageDropdown = document.querySelector(".language-dropdown");

/* =========================
   ESTADO
========================= */
let selectedSize = "size-medium";
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
  return translations[lang]?.[key] || translations["en-US"]?.[key] || key;
}

function applyLanguage(lang) {
  const tObj = translations[lang];
  if (!tObj) return;

  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (tObj[key]) element.textContent = tObj[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (tObj[key]) element.placeholder = tObj[key];
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
   CONTADOR DE CARACTERES
========================= */
function updateCharCounter() {
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
  charCounter.textContent = "0 / 12000";
  inputText.addEventListener("input", updateCharCounter);
}

/* =========================
   COPY RESULT
========================= */
function initCopyButton() {
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
  languageToggle.addEventListener("click", () => {
    languageMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", (event) => {
    if (languageDropdown && !languageDropdown.contains(event.target)) {
      languageMenu.classList.add("hidden");
    }
  });

  languageOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const lang = option.dataset.lang;
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

  if (!SpeechRecognition) {
    console.log("Speech recognition not supported in this browser.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = getCurrentLanguage();
  recognition.interimResults = true;
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

  let finalText = "";
  let interimText = "";

  for (let i = 0; i < event.results.length; i++) {

    const transcript = event.results[i][0].transcript;

    if (event.results[i].isFinal) {
      finalText += transcript + " ";
    } else {
      interimText += transcript;
    }

  }

  const base = recognitionBaseText ? recognitionBaseText + " " : "";

  inputText.value = base + finalText + interimText;

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
   SUMMARIZE
========================= */
async function summarizeText() {
  const text = inputText.value.trim();
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

function initSummarizeButton() {
  btnSummarize.addEventListener("click", summarizeText);
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
  initSummarizeButton()
  initSummarySizeCards();
  initCharCounter();
  initCopyButton();
  initLanguageDropdown();
  initSpeechRecognition();

  lucide.createIcons();
});