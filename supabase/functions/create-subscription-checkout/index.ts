import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function requiredEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing environment variable ${key}`);
  }
  return value;
}

const SUPABASE_URL = requiredEnv("SUPABASE_URL");
const SERVICE_ROLE_KEY = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_ANON_KEY = requiredEnv("SUPABASE_ANON_KEY");
const STRIPE_SECRET_KEY = requiredEnv("STRIPE_SECRET_KEY");

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { returnUrl, email, priceId } = await req.json();
    if (!returnUrl || !priceId) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(returnUrl);
    // success url
    url.searchParams.set("success", "true");
    const successUrl = url.toString();
    // cancel url
    url.searchParams.delete("success");
    url.searchParams.set("canceled", "true");
    const cancelUrl = url.toString();

    let stripeCustomerId: string | null = null;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    stripeCustomerId = profile?.stripe_customer_id ?? null;

    if (!stripeCustomerId && email) {
      const candidates = await stripe.customers.list({ email, limit: 1 });
      if (candidates.data.length) {
        stripeCustomerId = candidates.data[0].id;
      }
    }

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: email ?? undefined,
        metadata: { user_id: user.id },
      });
      stripeCustomerId = customer.id;
    }

    await supabaseAdmin
      .from("profiles")
      .update({
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: stripeCustomerId,
      customer_email: stripeCustomerId ? undefined : email ?? undefined,
      metadata: {
        user_id: user.id,
      },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error creating Stripe checkout session:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
