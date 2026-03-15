import { getCurrentUser, signOutUser, onAuthStateChange } from "./auth.js";

const authLink = document.getElementById("authLink");
const logoutBtn = document.getElementById("logoutBtn");

function getEmailUsername(email) {
  if (!email) return "";
  return email.split("@")[0];
}

async function updateAuthUI() {
  const user = await getCurrentUser();

  if (user) {
    if (authLink) {
      const username = getEmailUsername(user.email);
      authLink.textContent = username;
      authLink.href = "#";
    }

    logoutBtn?.classList.remove("hidden");
  } else {
    if (authLink) {
      authLink.textContent = t("login");
      authLink.href = "./login.html";
    }

    logoutBtn?.classList.add("hidden");
  }
}

logoutBtn?.addEventListener("click", async () => {
  await signOutUser();
  window.location.reload();
});

onAuthStateChange(() => {
  updateAuthUI();
});

updateAuthUI();