
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const { saleId, saleTotal, items, clientName, returnUrl } = await req.json();

    if (!saleId || !saleTotal || !items || !returnUrl) {
      throw new Error("Missing required parameters");
    }
    
    // Using line items with your specific price ID when a product matches
    const lineItems = items.map((item: any) => {
      // Check if this is the specific product you want to use the fixed price ID for
      // You might want to add logic here to determine when to use the fixed price ID
      // For now, we'll use it for all items as an example
      return {
        price: "price_1RLFGG2LlieYPA2tKF1LDpDf",
        quantity: item.quantity,
      };
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${returnUrl}?success=true&sale_id=${saleId}`,
      cancel_url: `${returnUrl}?canceled=true&sale_id=${saleId}`,
      client_reference_id: saleId,
      metadata: {
        saleId,
        clientName: clientName || "Cliente não informado"
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error creating checkout session" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
