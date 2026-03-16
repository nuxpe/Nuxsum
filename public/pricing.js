import { getCurrentSession } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  initCommonPage();

  const upgradeProBtn = document.getElementById("upgradeProBtn");

  upgradeProBtn?.addEventListener("click", async () => {
    try {
      const session = await getCurrentSession();

      if (!session?.access_token) {
        alert("Tens de iniciar sessão primeiro.");
        return;
      }

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

      window.location.href = data.url;
    } catch (error) {
      console.error("Upgrade error:", error);
      alert(t("serverError"));
    }
  });
});