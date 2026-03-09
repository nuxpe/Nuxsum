lucide.createIcons();
const toast = document.getElementById("toast")
const inputText = document.getElementById("inputText");
const btnSummarize = document.getElementById("btnSummarize");
const output = document.getElementById("output");
const charCounter = document.getElementById("charCounter");
const buttonSummarizeText = document.getElementById("btnSummarizeText")
const btnMic = document.getElementById("btnMic")
const copyIconWrapper = document.getElementById("copyIconWrapper");
// card sizes
const sizeCards = document.querySelectorAll(".summary-size-card");
let selectedSize = "size-medium";
//traslations
const languageToggle = document.getElementById("languageToggle");
const languageMenu = document.getElementById("languageMenu");
const languageOptions = document.querySelectorAll(".language-option");

// marcar medium por defeito
sizeCards.forEach((card) => {
  if (card.dataset.size == "size-medium") {
    card.classList.add("selected");
  }
});

// for thje mic functionality
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let isListening = false;
let shouldKeepListening = false;
let finalTranscript = "";

if (!SpeechRecognition) {
  console.log("Speech recognition not supported in this browser.");
  showToast("Your browser doesn't support speech-to-text.");
} else {
  const recognition = new SpeechRecognition();

  recognition.lang = localStorage.getItem("nuxsum_lang") || "en-US";
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.continuous = true;

  btnMic.addEventListener("click", () => {
    if (!shouldKeepListening) {
      shouldKeepListening = true;
      recognition.start();
      showToast("Listening...");
    } else {
      shouldKeepListening = false;
      recognition.stop();
      showToast("Stopped listening");
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
      recognition.start();
    }
  });

}


// event listerns

languageToggle.addEventListener("click", () => {
  languageMenu.classList.toggle("hidden");
});

document.addEventListener("click", (event) => {
  const dropdown = document.querySelector(".language-dropdown");

  if (!dropdown.contains(event.target)) {
    languageMenu.classList.add("hidden");
  }
});

languageOptions.forEach(option => {
  option.addEventListener("click", () => {
    const lang = option.dataset.lang;

    applyLanguage(lang);
    recognition.lang = lang;
    localStorage.setItem("nuxsum_lang", lang);

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
  showToast("Copied!")


  setTimeout(() => {
    copyIconWrapper.innerHTML = '<i data-lucide="clipboard"></i>';
    copyIconWrapper.style.pointerEvents = "auto";
    lucide.createIcons();
  }, 1000);
});



charCounter.textContent = "0 / 12000";

inputText.addEventListener("input", () => {
  const count = inputText.value.trim().length;

  charCounter.textContent = `${count} / 12000`;

  if (count >= 12000) {
    charCounter.style.color = "red";
  } else if (count > 10000) {
    charCounter.style.color = "orange";
  } else {
    charCounter.style.color = "white";
  }
});

// logica dos cards
sizeCards.forEach((card) => {
  card.addEventListener("click", () => {
    sizeCards.forEach((item) => {
      item.classList.remove("selected");
    });

    card.classList.add("selected");
    selectedSize = card.dataset.size;
  });
});

btnSummarize.addEventListener("click", async () => {
  const text = inputText.value.trim();
  const size = selectedSize;

  if (!text) {
    output.textContent = "write or paste any text first.";
    return;
  }

  btnSummarize.disabled = true;
  btnSummarize.classList.add("desable-btn")
  buttonSummarizeText.textContent = "wait for the summary...";
  output.textContent = "Writing the summary...";

  try {
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, size })
    });

    const data = await res.json();

    if (!res.ok) {
      output.textContent = data.error || "Server Error, try again...";
      return;
    }

    output.textContent = data.summary || "Empty summary";
  } catch (e) {
    console.error(e);
    output.textContent = "Erro: " + e.message;
  } finally {
    btnSummarize.disabled = false;
    btnSummarize.classList.remove("desable-btn")
    buttonSummarizeText.textContent = "Summarize";
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

  const t = translations[lang];

  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;
    if (t[key]) element.textContent = t[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
    const key = element.dataset.i18nPlaceholder;
    if (t[key]) element.placeholder = t[key];
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("nuxsum_lang") || "en-US";
  applyLanguage(savedLang);
  recognition.lang = savedLang;

  lucide.createIcons();
});