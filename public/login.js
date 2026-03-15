import { signInWithEmail, signUpWithEmail } from "./auth.js";

const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const authMessage = document.getElementById("authMessage");

function showMessage(text, isError = false) {
  if (!authMessage) return;

  authMessage.textContent = text;
  authMessage.style.color = isError ? "#ff8a8a" : "";
}

function getFormValues() {
  const email = authEmail?.value.trim();
  const password = authPassword?.value || "";

  return { email, password };
}

function validateForm(email, password) {
  if (!email) {
    showMessage(t("authFillEmail"), true);
    return false;
  }

  if (!password || password.length < 6) {
    showMessage(t("authPasswordMin"), true);
    return false;
  }

  return true;
}

loginBtn?.addEventListener("click", async () => {
  const { email, password } = getFormValues();

  if (!validateForm(email, password)) return;

  showMessage(t("authSigningIn"));

  try {
    await signInWithEmail(email, password);
    showMessage(t("authLoginSuccess"));
    window.location.href = "./index.html";
  } catch (error) {
    console.error(error);
    showMessage(error.message || t("authLoginError"), true);
  }
});

signupBtn?.addEventListener("click", async () => {
  const { email, password } = getFormValues();

  if (!validateForm(email, password)) return;

  showMessage(t("authSigningUp"));

  try {
    const data = await signUpWithEmail(email, password);

    if (data?.user && !data?.session) {
      showMessage(t("authCheckEmail"));
      return;
    }

    showMessage(t("authSignupSuccess"));
    window.location.href = "./index.html";
  } catch (error) {
    console.error(error);
    showMessage(error.message || t("authSignupError"), true);
  }
});