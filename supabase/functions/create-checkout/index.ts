import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutItem {
  quantity: number;
}

interface CheckoutRequest {
  saleId: string;
  saleTotal: number;
  items: CheckoutItem[];
  clientName?: string;
  returnUrl: string;
}

const isCheckoutRequest = (value: unknown): value is CheckoutRequest => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  const hasSaleId = typeof candidate.saleId === "string" && candidate.saleId.length > 0;
  const hasSaleTotal = typeof candidate.saleTotal === "number";
  const hasReturnUrl = typeof candidate.returnUrl === "string" && candidate.returnUrl.length > 0;
  const items = candidate.items;

  const hasItems = Array.isArray(items) && items.every((item) => {
    return typeof item === "object" && item !== null && typeof (item as Record<string, unknown>).quantity === "number";
  });

  return hasSaleId && hasSaleTotal && hasReturnUrl && hasItems;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const body = (await req.json()) as unknown;

    if (!isCheckoutRequest(body)) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const { saleId, saleTotal, items, clientName, returnUrl } = body;

    if (saleTotal <= 0 || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid sale data" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const lineItems = items.map((item) => ({
      price: "price_1RLFGG2LlieYPA2tKF1LDpDf",
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${returnUrl}?success=true&sale_id=${saleId}`,
      cancel_url: `${returnUrl}?canceled=true&sale_id=${saleId}`,
      client_reference_id: saleId,
      metadata: {
        saleId,
        clientName: clientName || "Cliente não informado",
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    const message = error instanceof Error ? error.message : "Error creating checkout session";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});


