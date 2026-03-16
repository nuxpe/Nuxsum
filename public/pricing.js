import { getCurrentSession, getCurrentUser, supabase } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  lucide.createIcons();
  initCommonPage();

  const upgradeProBtn = document.getElementById("upgradeProBtn");
  const manageBillingBtn = document.getElementById("manageBillingBtn");

  await updatePricingUI();

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

      const contentType = res.headers.get("content-type") || "";
      let data = {};

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        throw new Error(rawText || "Invalid server response");
      }

      if (!res.ok) {
        throw new Error(data.error || "Checkout error");
      }

      if (!data.url) {
        throw new Error("Missing checkout URL");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Upgrade error:", error);
      alert(error.message || t("serverError"));

      if (upgradeProBtn) {
        upgradeProBtn.disabled = false;
        upgradeProBtn.textContent = t("pricingUpgradeBtn");
      }
    }
  });

  manageBillingBtn?.addEventListener("click", async () => {
    try {
      const session = await getCurrentSession();

      if (!session?.access_token) {
        alert("You need to sign in first.");
        window.location.href = "./index.html";
        return;
      }

      manageBillingBtn.disabled = true;
      manageBillingBtn.textContent = "Loading...";

      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const contentType = res.headers.get("content-type") || "";
      let data = {};

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        throw new Error(rawText || "Invalid server response");
      }

      if (!res.ok) {
        throw new Error(data.error || "Portal error");
      }

      if (!data.url) {
        throw new Error("Missing portal URL");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Portal error:", error);
      alert(error.message || t("serverError"));

      if (manageBillingBtn) {
        manageBillingBtn.disabled = false;
        manageBillingBtn.textContent = t("pricingManageSubscription");
      }
    }
  });
});

async function updatePricingUI() {
  const upgradeBtn = document.getElementById("upgradeProBtn");
  const manageBtn = document.getElementById("manageBillingBtn");

  try {
    const user = await getCurrentUser();

    if (!user) {
      upgradeBtn?.classList.remove("hidden");
      manageBtn?.classList.add("hidden");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Pricing UI profile error:", error);
      upgradeBtn?.classList.remove("hidden");
      manageBtn?.classList.add("hidden");
      return;
    }

    if (data?.plan === "pro") {
      upgradeBtn?.classList.add("hidden");
      manageBtn?.classList.remove("hidden");
    } else {
      upgradeBtn?.classList.remove("hidden");
      manageBtn?.classList.add("hidden");
    }
  } catch (error) {
    console.error("Pricing UI error:", error);
    upgradeBtn?.classList.remove("hidden");
    manageBtn?.classList.add("hidden");
  }
}