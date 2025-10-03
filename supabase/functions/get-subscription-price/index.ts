// supabase/functions/get-subscription-price/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  "Access-Control-Allow-Credentials": "true"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS_HEADERS
    });
  }
  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
      apiVersion: "2023-10-16"
    });
    // IDs vêm dos secrets: PriceM, PriceT, PriceS
    const [monthly, trimestral, semestral] = await Promise.all([
      stripe.prices.retrieve(Deno.env.get("PriceM")),
      stripe.prices.retrieve(Deno.env.get("PriceT")),
      stripe.prices.retrieve(Deno.env.get("PriceS"))
    ]);
    const body = JSON.stringify({
      monthly: {
        id: monthly.id,
        unit_amount: monthly.unit_amount,
        currency: monthly.currency
      },
      trimestral: {
        id: trimestral.id,
        unit_amount: trimestral.unit_amount,
        currency: trimestral.currency
      },
      semestral: {
        id: semestral.id,
        unit_amount: semestral.unit_amount,
        currency: semestral.currency
      }
    });
    return new Response(body, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({
      error: "Failed to fetch prices"
    }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json"
      }
    });
  }
});
