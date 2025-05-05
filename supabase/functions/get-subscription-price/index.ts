// supabase/functions/get-subscription-price/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  // inclua todos os headers que o browser vai mandar
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  // se você estiver usando fetch(..., { credentials: 'include' })
  "Access-Control-Allow-Credentials": "true",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    // responde ao preflight
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16"
    });
    const price = await stripe.prices.retrieve("price_1RLFGG2LlieYPA2tKF1LDpDf");
    const body = JSON.stringify({
      unit_amount: price.unit_amount,
      currency:    price.currency,
    });

    return new Response(body, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch price" }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  }
});
