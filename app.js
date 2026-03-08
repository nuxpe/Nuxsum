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

// marcar medium por defeito
sizeCards.forEach((card) => {
  if (card.dataset.size == "size-medium") {
    card.classList.add("selected");
  }
});

// for thje mic functionality
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let isListening = false

if (!SpeechRecognition) {
  console.log("Speech recognition not supported in this browser.");
}
const recognition = new SpeechRecognition();
recognition.lang = "pt-PT";
recognition.interimResults = false;
recognition.maxAlternatives = 1;

btnMic.addEventListener("click", () => {
  if (!isListening) {
    recognition.start();
    isListening = true;
    btnMic.classList.add("listening");
    showToast("Listening...");
  } else {
    recognition.stop();
    isListening = false;
    btnMic.classList.remove("listening");
    showToast("stopped listening");
  }
});

recognition.addEventListener("end", () => {
  isListening = false;
  btnMic.classList.remove("listening");
});
recognition.addEventListener("result", (event) => {
  const transcript = event.results[0][0].transcript;
  inputText.value += (inputText.value ? " " : "") + transcript;
  inputText.dispatchEvent(new Event("input"));
});

recognition.addEventListener("start", () => {
  btnMic.classList.add("listening");
});

recognition.addEventListener("end", () => {
  btnMic.classList.remove("listening");
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