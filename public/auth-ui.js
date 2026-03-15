import { getCurrentUser, signOutUser, onAuthStateChange } from "./auth.js";

const authLink = document.getElementById("authLink");
const userDropdown = document.getElementById("userDropdown");
const userDropdownToggle = document.getElementById("userDropdownToggle");
const userDropdownMenu = document.getElementById("userDropdownMenu");
const userDisplayName = document.getElementById("userDisplayName");
const logoutBtn = document.getElementById("logoutBtn");

function openUserDropdown() {
  userDropdownMenu?.classList.remove("hidden");
}

function closeUserDropdown() {
  userDropdownMenu?.classList.add("hidden");
}

function toggleUserDropdown() {
  userDropdownMenu?.classList.toggle("hidden");
}

export async function updateAuthUI() {
  const user = await getCurrentUser();

  if (user) {
    authLink?.classList.add("hidden");
    userDropdown?.classList.remove("hidden");

    if (userDisplayName) {
      userDisplayName.textContent = getEmailUsername(user.email);
    }
  } else {
    authLink?.classList.remove("hidden");
    userDropdown?.classList.add("hidden");
    closeUserDropdown();

    if (authLink) {
      authLink.href = "./login.html";

      const authText = authLink.querySelector("span");
      if (authText) {
        authText.textContent = t("login");
      }
    }
  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

export function initAuthUI() {
  userDropdownToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleUserDropdown();
  });

  document.addEventListener("click", (event) => {
    if (!userDropdown?.contains(event.target)) {
      closeUserDropdown();
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    await signOutUser();
    window.location.reload();
  });

  onAuthStateChange(() => {
    updateAuthUI();
  });

  updateAuthUI();
}