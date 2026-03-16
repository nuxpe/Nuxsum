import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const {
      data: { user },
      error: userError
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "Invalid user" });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_PRO,
          quantity: 1
        }
      ],
      success_url: `${process.env.PUBLIC_SITE_URL}/pricing-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_SITE_URL}/pricing.html`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        plan: "pro"
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan: "pro"
        }
      }
    });

    return res.status(200).json({
      url: checkoutSession.url
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
}