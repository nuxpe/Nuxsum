import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = {
  api: {
    bodyParser: false
  }
};

async function readRawBody(readable) {
  const chunks = [];

  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method not allowed");
  }

  let event;

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers["stripe-signature"];

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Webhook signature error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        const userId = session.metadata?.userId;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        // Atualizar utilizador para pro
        // guardar stripe_customer_id e stripe_subscription_id
        // plan = 'pro'

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;

        // procurar user pelo stripe_customer_id ou subscription id
        // atualizar status e current_period_end
        // se status estiver ativo -> plan = 'pro'
        // se não estiver -> decidir conforme o teu modelo

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        // meter plan = 'free'
        // limpar ou atualizar subscription_status

        break;
      }

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}