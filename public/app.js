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
const inputTypeTabs = document.querySelectorAll(".inputTypeOption");
const sizeCards = document.querySelectorAll(".summary-size-card");
const languageToggle = document.getElementById("languageToggle");
const languageMenu = document.getElementById("languageMenu");
const languageOptions = document.querySelectorAll(".language-option");
const languageDropdown = document.querySelector(".language-dropdown");
const textInputWrapper = document.getElementById("textInputWrapper");
const urlInputWrapper = document.getElementById("urlInputWrapper");
const fileInputWrapper = document.getElementById("fileInputWrapper");
const inputUrl = document.getElementById("inputUrl");
const fileDropzone = document.getElementById("fileDropzone");
const inputFile = document.getElementById("inputFile");
const selectedFileName = document.getElementById("selectedFileName");
const typeCards = document.querySelectorAll(".summary-type-card");

/* =========================
   ESTADO
========================= */
let selectedSize = "size-medium";
let selectedType = "type-formal";
let selectedInputType = "Text";
let recognition = null;
let isListening = false;
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
   SUMMARY TYPE
========================= */
function initSummaryTypeCards() {
  if (!typeCards.length) return;

  typeCards.forEach((card) => {
    if (card.dataset.summaryType === "type-formal") {
      card.classList.add("selected");
      selectedType = "type-formal";
    }

    card.addEventListener("click", () => {
      typeCards.forEach((item) => item.classList.remove("selected"));
      card.classList.add("selected");
      selectedType = card.dataset.summaryType || "type-formal";
    });
  });
}

/* =========================
   SUMMARY SIZE
========================= */
function initSummarySizeCards() {
  if (!sizeCards.length) return;

  sizeCards.forEach((card) => {
    if (card.dataset.summarySize === "size-medium") {
      card.classList.add("selected");
      selectedSize = "size-medium";
    }

    card.addEventListener("click", () => {
      sizeCards.forEach((item) => item.classList.remove("selected"));
      card.classList.add("selected");
      selectedSize = card.dataset.summarySize || "size-medium";
    });
  });
}

/* =========================
   SUMMARY INPUT TABS
========================= */
function updateInputTypeUI() {
  if (!textInputWrapper || !urlInputWrapper || !fileInputWrapper || !output) return;

  textInputWrapper.classList.add("hidden");
  urlInputWrapper.classList.add("hidden");
  fileInputWrapper.classList.add("hidden");

  if (selectedInputType === "Text") {
    textInputWrapper.classList.remove("hidden");
  } else if (selectedInputType === "URL") {
    urlInputWrapper.classList.remove("hidden");
  } else if (selectedInputType === "File") {
    fileInputWrapper.classList.remove("hidden");
  }

  output.textContent = "";
}

function initSummaryInputTypeTabs() {
  if (!inputTypeTabs.length) return;

  inputTypeTabs.forEach((tab) => {
    if (tab.dataset.inputType === "Text") {
      tab.classList.add("active");
      selectedInputType = "Text";
    }

    tab.addEventListener("click", () => {
      inputTypeTabs.forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      selectedInputType = tab.dataset.inputType || "Text";
      updateInputTypeUI();
    });
  });

  updateInputTypeUI();
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
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

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
    const transcript =
      event.results[event.results.length - 1][0].transcript.trim();

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
   ESTADO DO BOTÃO
========================= */
function setSummarizeLoadingState(isLoading, loadingTextKey = "waitingSummary") {
  if (!btnSummarize || !buttonSummarizeText) return;

  btnSummarize.disabled = isLoading;
  btnSummarize.classList.toggle("disabled-btn", isLoading);
  buttonSummarizeText.textContent = isLoading ? t(loadingTextKey) : t("summarize");
}

/* =========================
   SUMMARIZE TEXT
========================= */
async function summarizeText() {
  const text = inputText?.value.trim();
  const size = selectedSize;
  const type = selectedType;
  const lang = getCurrentLanguage();

  if (!text) {
    output.textContent = t("emptyInput");
    return;
  }

  setSummarizeLoadingState(true);
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
        type,
        lang
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
    setSummarizeLoadingState(false);
  }
}

/* =========================
   SUMMARIZE URL
========================= */
async function summarizeFromUrl(url, size, type) {
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
        type,
        lang: getCurrentLanguage()
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type") || "";
    let data = {};

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const rawText = await response.text();
      console.error("Non-JSON response from /api/extract:", rawText);
      throw new Error("Invalid server response");
    }

    if (!response.ok) {
      throw new Error(data.error || t("serverError"));
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error(t("requestTimeout"));
    }

    throw error;
  }
}

/* =========================
   BOTÃO SUMMARIZE
========================= */
async function handleSummarizeClick() {
  if (!output || !btnSummarize || !buttonSummarizeText) return;

  if (selectedInputType === "Text") {
    await summarizeText();
    return;
  }

  if (selectedInputType === "URL") {
    if (!inputUrl) {
      output.textContent = t("serverError");
      return;
    }

    const url = inputUrl.value.trim();

    if (!url) {
      output.textContent = t("urlEmpty");
      return;
    }

    setSummarizeLoadingState(true);
    output.textContent = t("urlProcessing");

    try {
      const data = await summarizeFromUrl(url, selectedSize, selectedType);
      output.textContent = data.summary || t("emptySummary");
    } catch (error) {
      console.error("URL summarize error:", error);
      output.textContent = error.message || t("serverError");
    } finally {
      setSummarizeLoadingState(false);
    }

    return;
  }

  if (selectedInputType === "File") {
    if (!inputFile || !inputFile.files || !inputFile.files[0]) {
      output.textContent = t("fileEmpty");
      return;
    }

    output.textContent = t("fileNotImplemented");
  }
}

function initSummarizeButton() {
  if (!btnSummarize) return;
  btnSummarize.addEventListener("click", handleSummarizeClick);
}

/* =========================
   UPLOAD FILES
========================= */
function updateSelectedFileUI(file) {
  if (!selectedFileName || !inputFile) return;

  if (!file) {
    selectedFileName.textContent = "";
    selectedFileName.classList.add("hidden");
    return;
  }

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    selectedFileName.textContent = t("fileTooLarge");
    selectedFileName.classList.remove("hidden");
    inputFile.value = "";
    return;
  }

  selectedFileName.textContent = `${t("selectedFile")} ${file.name}`;
  selectedFileName.classList.remove("hidden");
}

function initFileUpload() {
  if (!fileDropzone || !inputFile) return;

  inputFile.addEventListener("change", () => {
    const file = inputFile.files?.[0];
    updateSelectedFileUI(file);
  });

  fileDropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    fileDropzone.classList.add("dragover");
  });

  fileDropzone.addEventListener("dragleave", () => {
    fileDropzone.classList.remove("dragover");
  });

  fileDropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    fileDropzone.classList.remove("dragover");

    const files = event.dataTransfer?.files;
    if (!files || !files.length) return;

    inputFile.files = files;
    updateSelectedFileUI(files[0]);
  });
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
  initFileUpload();
  initSummaryTypeCards();
  initSummarySizeCards();
  initSummaryInputTypeTabs();
  initCharCounter();
  initCopyButton();
  initLanguageDropdown();
  initSpeechRecognition();

  lucide.createIcons();
});