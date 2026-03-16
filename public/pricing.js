import { getCurrentSession } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  initCommonPage();

  const upgradeProBtn = document.getElementById("upgradeProBtn");

  upgradeProBtn?.addEventListener("click", async () => {
    try {
      const session = await getCurrentSession();

      if (!session?.access_token) {
        alert("You need to sign in first.");
        window.location.href = "./index.html";
        return;
      }

      upgradeProBtn.disabled = true;
      upgradeProBtn.textContent = "Loading...";

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout error");
      }

      if (!data.url) {
        throw new Error("Missing checkout URL");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Upgrade error:", error);
      alert(t("serverError"));
      upgradeProBtn.disabled = false;
      upgradeProBtn.textContent = t("pricingUpgradeBtn");
    }
  });
});