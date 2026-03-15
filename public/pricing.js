document.addEventListener("DOMContentLoaded", () => {
  initCommonPage();

  const upgradeProBtn = document.getElementById("upgradeProBtn");

  upgradeProBtn?.addEventListener("click", async () => {
    try {
      /*
        Mais tarde trocas isto pela tua rota real de Stripe, por exemplo:
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: "pro" })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Checkout error");
        }

        window.location.href = data.url;
      */

      alert(t("pricingStripePlaceholder"));
    } catch (error) {
      console.error("Upgrade error:", error);
      alert(t("serverError"));
    }
  });
});