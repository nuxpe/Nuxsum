import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { stripeCustomerId } = req.body;

    if (!stripeCustomerId) {
      return res.status(400).json({ error: "Missing stripeCustomerId" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.APP_URL}/account.html`
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("create-portal-session error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}