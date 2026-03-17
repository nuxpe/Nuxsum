import { supabase, getCurrentUser } from "./auth.js";
import { initAuthUI } from "./auth-ui.js";

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
const textInputWrapper = document.getElementById("textInputWrapper");
const urlInputWrapper = document.getElementById("urlInputWrapper");
const fileInputWrapper = document.getElementById("fileInputWrapper");
const inputUrl = document.getElementById("inputUrl");
const fileDropzone = document.getElementById("fileDropzone");
const inputFile = document.getElementById("inputFile");
const selectedFileName = document.getElementById("selectedFileName");
const typeCards = document.querySelectorAll(".summary-type-card");
const summaryStats = document.getElementById("summaryStats");
const originalWordCount = document.getElementById("originalWordCount");
const summaryWordCount = document.getElementById("summaryWordCount");
const reductionPercent = document.getElementById("reductionPercent");
const loadingState = document.getElementById("loadingState");
const loadingMessage = document.getElementById("loadingMessage");

/* Modal Pro */
const upgradeModal = document.getElementById("upgradeModal");
const upgradeModalOverlay = document.getElementById("upgradeModalOverlay");
const closeUpgradeModalBtn = document.getElementById("closeUpgradeModal");
const cancelUpgradeBtn = document.getElementById("cancelUpgradeBtn");
const confirmUpgradeBtn = document.getElementById("confirmUpgradeBtn");
const upgradeModalTitle = document.getElementById("upgradeModalTitle");
const upgradeModalText = document.getElementById("upgradeModalText");

/* =========================
   ESTADO
========================= */
let currentUserPlan = "free";
let currentCharLimit = 5000;
let selectedSize = "size-medium";
let selectedType = "type-formal";
let selectedInputType = "Text";
let recognition = null;
let isListening = false;
let recognitionBaseText = "";
let loadingInterval = null;
let loadingMessageIndex = 0;


/* =========================
   smart loading
========================= */
function getLoadingMessages() {
  return [
    t("loadingReading"),
    t("loadingKeyPoints"),
    t("loadingWriting")
  ];
}

function startLoadingAnimation() {
  const messages = getLoadingMessages();

  loadingMessageIndex = 0;
  loadingMessage.textContent = messages[loadingMessageIndex];

  loadingState.classList.remove("hidden");

  loadingInterval = setInterval(() => {
    loadingMessageIndex = (loadingMessageIndex + 1) % messages.length;
    loadingMessage.textContent = messages[loadingMessageIndex];
  }, 1600);
}

function stopLoadingAnimation() {
  loadingState.classList.add("hidden");

  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
}

/* =========================
   HELPERS PRO
========================= */
function countWords(text) {
  if (!text) return 0;

  return text
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(word => word.length > 0).length;
}

function formatWordLabel(count) {
  return `${count} ${count === 1 ? t("word") : t("words")}`;
}

function calculateReductionPercentage(originalCount, summaryCount) {
  if (!originalCount || originalCount <= 0) return 0;

  const reduction = ((originalCount - summaryCount) / originalCount) * 100;
  return Math.max(0, Math.round(reduction));
}

function updateSummaryStats(originalText, summaryText) {
  const originalCount = countWords(originalText);
  const summaryCount = countWords(summaryText);
  const reduction = calculateReductionPercentage(originalCount, summaryCount);

  originalWordCount.textContent = formatWordLabel(originalCount);
  summaryWordCount.textContent = formatWordLabel(summaryCount);
  reductionPercent.textContent = `${reduction}%`;

  summaryStats.classList.remove("hidden");
}

function resetSummaryStats() {
  summaryStats.classList.add("hidden");
}

/* =========================
   HELPERS PRO
========================= */
function isProUser() {
  return currentUserPlan === "pro";
}

function isProLocked(element) {
  return element?.dataset?.pro === "true" && !isProUser();
}

function openUpgradeModal(featureKey = "proFeature") {
  if (!upgradeModal) {
    showToast(t(featureKey));
    return;
  }

  if (upgradeModalTitle) {
    upgradeModalTitle.textContent = t("upgradeTitle");
  }

  if (upgradeModalText) {
    upgradeModalText.textContent = t(featureKey);
  }

  upgradeModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeUpgradeModal() {
  if (!upgradeModal) return;

  upgradeModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function initUpgradeModal() {
  if (!upgradeModal) return;

  closeUpgradeModalBtn?.addEventListener("click", closeUpgradeModal);
  cancelUpgradeBtn?.addEventListener("click", closeUpgradeModal);
  upgradeModalOverlay?.addEventListener("click", closeUpgradeModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !upgradeModal.classList.contains("hidden")) {
      closeUpgradeModal();
    }
  });

  confirmUpgradeBtn?.addEventListener("click", () => {
    closeUpgradeModal();

    setTimeout(() => {
      window.location.href = "./pricing.html";
    }, 120);
  });
}

function getProMessageKeyByInputType(inputType) {
  if (inputType === "URL") return "proUrlFeature";
  if (inputType === "File") return "proFileFeature";
  return "proFeature";
}

function getProMessageKeyBySize(size) {
  if (size === "size-long") return "proLongFeature";
  return "proFeature";
}

function getProMessageKeyByType(type) {
  if (type === "type-academic") return "proAcademicFeature";
  return "proFeature";
}



/* =========================
   PRO HANDLERS
========================= */
function updateProUI() {
  const proElements = document.querySelectorAll('[data-pro="true"]');
  const proUser = isProUser();

  document.body.classList.toggle("user-pro", proUser);
  document.body.classList.toggle("user-free", !proUser);

  proElements.forEach((element) => {
    if (proUser) {
      element.classList.remove("pro-locked", "locked", "disabled");
      element.removeAttribute("aria-disabled");
    } else {
      element.classList.add("pro-locked");
      element.setAttribute("aria-disabled", "true");
    }
  });

  lucide.createIcons();
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
      if (isProLocked(card)) {
        openUpgradeModal(getProMessageKeyByType(card.dataset.summaryType));
        return;
      }

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
      if (isProLocked(card)) {
        openUpgradeModal(getProMessageKeyBySize(card.dataset.summarySize));
        return;
      }

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
      if (isProLocked(tab)) {
        openUpgradeModal(getProMessageKeyByInputType(tab.dataset.inputType));
        return;
      }

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
  charCounter.textContent = `${count} / ${currentCharLimit}`;

  if (count >= currentCharLimit) {
    charCounter.style.color = "red";
  } else if (count > currentCharLimit * 0.85) {
    charCounter.style.color = "orange";
  } else {
    charCounter.style.color = "white";
  }
}

function initCharCounter() {
  if (!charCounter || !inputText) return;

  charCounter.textContent = `0 / ${currentCharLimit}`;
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
   ESTADO DO BOTÃO
========================= */
function setSummarizeLoadingState(isLoading, loadingTextKey = "waitingSummary") {
  if (!btnSummarize || !buttonSummarizeText) return;

  btnSummarize.disabled = isLoading;
  btnSummarize.classList.toggle("disabled-btn", isLoading);
  buttonSummarizeText.textContent = isLoading ? t(loadingTextKey) : t("summarize");
}

/* =========================
   USER PLAN
========================= */
async function updateCurrentUserPlan() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      currentUserPlan = "free";
      currentCharLimit = 5000;
      updateProUI();
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      currentUserPlan = "free";
      currentCharLimit = 5000;
      updateProUI();
      return;
    }

    currentUserPlan = data?.plan || "free";
    currentCharLimit = currentUserPlan === "pro" ? 20000 : 5000;

    updateProUI();
  } catch (error) {
    console.error("Failed to get user plan:", error);
    currentUserPlan = "free";
    currentCharLimit = 5000;
    updateProUI();
  }
}

/* =========================
   SUMMARIZE TEXT
========================= */
async function summarizeText() {
  const text = inputText?.value.trim();
  const size = selectedSize;
  const type = selectedType;
  const lang = getCurrentLanguage();

  resetSummaryStats();

  if (!text) {
    output.textContent = t("emptyInput");
    return;
  }

  if (text.length > currentCharLimit) {
    output.textContent =
      currentUserPlan === "pro"
        ? `You can only summarize up to ${currentCharLimit} characters.`
        : "Free plan limit reached. Upgrade to Pro to unlock 20000 characters.";
    return;
  }

  setSummarizeLoadingState(true);
  output.classList.remove("show");
  output.textContent = "";
  startLoadingAnimation();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const user = await getCurrentUser();

    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user?.id || null,
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

    const summary = data.summary || t("emptySummary");

    output.classList.remove("show");
    output.textContent = summary;

    requestAnimationFrame(() => {
      output.classList.add("show");
    });

    updateSummaryStats(text, summary);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Summarize error:", error);

    if (error.name === "AbortError") {
      output.textContent = t("requestTimeout");
    } else {
      output.textContent = t("serverError");
    }
  } finally {
    stopLoadingAnimation();
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
    const user = await getCurrentUser();

    const response = await fetch("/api/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: user?.id || null,
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
   FILE UPLOAD
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
document.addEventListener("DOMContentLoaded", async () => {
  initCommonPage();
  initAuthUI();
  await updateCurrentUserPlan();
  initUpgradeModal();
  initSummarizeButton();
  initFileUpload();
  initSummaryTypeCards();
  initSummarySizeCards();
  initSummaryInputTypeTabs();
  initCharCounter();
  initCopyButton();
  initSpeechRecognition();
});