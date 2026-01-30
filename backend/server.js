import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();

const app = express();
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5500";
const deliveryFeeGbp = Number(process.env.DELIVERY_FEE_GBP || 3);

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment");
}

const stripe = new Stripe(stripeSecretKey);

app.use(cors({
  origin: frontendUrl,
  methods: ["GET", "POST"],
}));
app.use(express.json({ limit: "1mb" }));

const toPence = (value) => Math.round(Number(value) * 100);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    const lineItems = items.map((item) => {
      const unitAmount = toPence(item.price);
      if (!unitAmount || unitAmount <= 0) {
        throw new Error(`Invalid price for ${item.name}`);
      }

      return {
        price_data: {
          currency: "gbp",
          product_data: {
            name: item.name,
            images: item.image ? [`${frontendUrl}/${item.image}`] : [],
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity || 1,
      };
    });

    if (deliveryFeeGbp > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: "Delivery Fee",
          },
          unit_amount: toPence(deliveryFeeGbp),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${frontendUrl}/success.html`,
      cancel_url: `${frontendUrl}/cancel.html`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message || "Server error" });
  }
});

const port = process.env.PORT || 4242;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
