import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false
  }
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  let event;

  try {
    const rawBody = await buffer(req);
    const signature = req.headers["stripe-signature"];

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {

    // pagamento concluído
    if (event.type === "checkout.session.completed") {

      const session = event.data.object;

      const userId = session.metadata?.user_id;

      if (!userId) {
        console.error("Missing user_id in metadata");
        return res.status(400).send("Missing user_id");
      }

      const subscriptionId = session.subscription;
      const customerId = session.customer;

      await supabaseAdmin
        .from("profiles")
        .update({
          plan: "pro",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId
        })
        .eq("id", userId);

      console.log("User upgraded to Pro:", userId);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("Webhook handler error:", error);
    return res.status(500).send("Server error");
  }
}