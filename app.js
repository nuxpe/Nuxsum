lucide.createIcons();

const toast = document.getElementById("toast");
const inputText = document.getElementById("inputText");
const btnSummarize = document.getElementById("btnSummarize");
const output = document.getElementById("output");
const charCounter = document.getElementById("charCounter");
const buttonSummarizeText = document.getElementById("btnSummarizeText");
const btnMic = document.getElementById("btnMic");
const copyIconWrapper = document.getElementById("copyIconWrapper");

const sizeCards = document.querySelectorAll(".summary-size-card");
let selectedSize = "size-medium";

const languageToggle = document.getElementById("languageToggle");
const languageMenu = document.getElementById("languageMenu");
const languageOptions = document.querySelectorAll(".language-option");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let isListening = false;
let shouldKeepListening = false;
let finalTranscript = "";

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

sizeCards.forEach((card) => {
  if (card.dataset.size === "size-medium") {
    card.classList.add("selected");
  }
});

if (!SpeechRecognition) {
  console.log("Speech recognition not supported in this browser.");
  showToast(t("speechNotSupported"));
} else {
  recognition = new SpeechRecognition();

  recognition.lang = getCurrentLanguage();
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.continuous = true;

  btnMic.addEventListener("click", () => {
    if (!recognition) return;

    recognition.lang = getCurrentLanguage();

    if (!shouldKeepListening) {
      shouldKeepListening = true;
      finalTranscript = inputText.value ? inputText.value.trim() + " " : "";

      try {
        recognition.start();
        showToast(t("listening"));
      } catch (error) {
        console.log("Recognition start blocked:", error);
        shouldKeepListening = false;
      }
    } else {
      shouldKeepListening = false;
      recognition.stop();
      showToast(t("stoppedListening"));
    }
  });

  recognition.addEventListener("start", () => {
    isListening = true;
    btnMic.classList.add("listening");
  });

  recognition.addEventListener("result", (event) => {
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
      } else {
        interimTranscript += transcript;
      }
    }

    inputText.value = finalTranscript + interimTranscript;
    inputText.dispatchEvent(new Event("input"));
  });

  recognition.addEventListener("end", () => {
    isListening = false;
    btnMic.classList.remove("listening");

    if (shouldKeepListening) {
      try {
        recognition.start();
      } catch (error) {
        console.log("Recognition restart blocked:", error);
      }
    }
  });

  recognition.addEventListener("error", (event) => {
    console.log("Speech recognition error:", event.error);

    isListening = false;
    btnMic.classList.remove("listening");

    if (event.error === "not-allowed") {
      shouldKeepListening = false;
      showToast(t("speechNotSupported"));
      return;
    }

    if (event.error === "aborted") {
      return;
    }
  });
}

languageToggle.addEventListener("click", () => {
  languageMenu.classList.toggle("hidden");
});

document.addEventListener("click", (event) => {
  const dropdown = document.querySelector(".language-dropdown");

  if (dropdown && !dropdown.contains(event.target)) {
    languageMenu.classList.add("hidden");
  }
});

languageOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const lang = option.dataset.lang;

    localStorage.setItem("nuxsum_lang", lang);
    applyLanguage(lang);

    if (recognition) {
      recognition.lang = lang;
    }

    languageMenu.classList.add("hidden");
  });
});

copyIconWrapper.addEventListener("click", () => {
  const text = output.textContent.trim();

  if (!text) return;

  navigator.clipboard.writeText(text);

  copyIconWrapper.innerHTML = '<i data-lucide="check"></i>';
  copyIconWrapper.style.pointerEvents = "none";
  lucide.createIcons();
  showToast(t("copied"));

  setTimeout(() => {
    copyIconWrapper.innerHTML = '<i data-lucide="clipboard"></i>';
    copyIconWrapper.style.pointerEvents = "auto";
    lucide.createIcons();
  }, 1000);
});

charCounter.textContent = "0 / 12000";

inputText.addEventListener("input", () => {
  const count = inputText.value.length;

  charCounter.textContent = `${count} / 12000`;

  if (count >= 12000) {
    charCounter.style.color = "red";
  } else if (count > 10000) {
    charCounter.style.color = "orange";
  } else {
    charCounter.style.color = "white";
  }
});

sizeCards.forEach((card) => {
  card.addEventListener("click", () => {
    sizeCards.forEach((item) => item.classList.remove("selected"));
    card.classList.add("selected");
    selectedSize = card.dataset.size;
  });
});

btnSummarize.addEventListener("click", async () => {
  const text = inputText.value.trim();
  const size = selectedSize;

  if (!text) {
    output.textContent = t("emptyInput");
    return;
  }

  btnSummarize.disabled = true;
  btnSummarize.classList.add("desabled-btn");
  buttonSummarizeText.textContent = t("waitingSummary");
  output.textContent = t("writingSummary");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, size, lang: getCurrentLanguage() }),
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

  } catch (e) {
    clearTimeout(timeoutId);
    console.error("Summarize error:", e);

    if (e.name === "AbortError") {
      output.textContent = t("requestTimeout");
    } else {
      output.textContent = t("serverError");
    }
  } finally {
    btnSummarize.disabled = false;
    btnSummarize.classList.remove("desabled-btn");
    buttonSummarizeText.textContent = t("summarize");
  }
});

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

function applyLanguage(lang) {
  const tObj = translations[lang];

  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (tObj[key]) element.textContent = tObj[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (tObj[key]) element.placeholder = tObj[key];
  });
}

document.addEventListener("DOMContentLoaded", () => {
  let savedLang = localStorage.getItem("nuxsum_lang");

  if (!savedLang) {
    savedLang = getDefaultBrowserLanguage();
    localStorage.setItem("nuxsum_lang", savedLang);
  }

  applyLanguage(savedLang);

  if (recognition) {
    recognition.lang = savedLang;
  }

  lucide.createIcons();
});
