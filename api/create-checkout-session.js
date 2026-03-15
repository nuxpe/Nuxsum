import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: "Missing user data" });
    }

    // Aqui deves ir à BD buscar stripe_customer_id, se já existir
    let stripeCustomerId = null;

    // Exemplo simples: criar sempre customer se ainda não existir
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId
      }
    });

    stripeCustomerId = customer.id;

    // Aqui também devias guardar stripeCustomerId na tua BD

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_PRO_MONTHLY,
          quantity: 1
        }
      ],
      success_url: `${process.env.APP_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/pricing.html`,
      metadata: {
        userId
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("create-checkout-session error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}