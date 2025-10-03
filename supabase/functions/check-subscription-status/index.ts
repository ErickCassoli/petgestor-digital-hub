import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

type Plan = "free" | "pro";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRO_STATUSES = new Set<Stripe.Subscription.Status | string>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
]);

function requiredEnv(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing environment variable ${key}`);
  }
  return value;
}

const SUPABASE_URL = requiredEnv("SUPABASE_URL");
const SERVICE_ROLE_KEY = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const STRIPE_SECRET_KEY = requiredEnv("STRIPE_SECRET_KEY");

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2024-06-20",
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace(/Bearer\s+/i, "").trim() ?? "";
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: authData, error: userError } = await supabaseAdmin.auth.getUser(token);
  const user = authData?.user;

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = user.id;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, plan, plan_started_at, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return new Response(JSON.stringify({ error: "Profile not found" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let plan: Plan = profile?.plan === "pro" ? "pro" : "free";
  let planStartedAt = profile?.plan_started_at ?? null;
  let stripeCustomerId = profile?.stripe_customer_id ?? null;
  let subscriptionPayload: Record<string, unknown> | null = null;

  try {
    if (stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "all",
        limit: 1,
      });
      const subscription = subscriptions.data[0] ?? null;

      if (subscription) {
        const status = subscription.status;
        const item = subscription.items.data[0];
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id ?? null;

        plan = PRO_STATUSES.has(status) ? "pro" : "free";
        if (plan === "pro") {
          planStartedAt =
            profile?.plan === "pro" && profile?.plan_started_at
              ? profile.plan_started_at
              : new Date(subscription.current_period_start * 1000).toISOString();
        } else {
          planStartedAt = null;
        }
        stripeCustomerId = customerId ?? stripeCustomerId;

        await supabaseAdmin.from("subscriptions").upsert({
          id: subscription.id,
          user_id: userId,
          price_id: item?.price?.id ?? null,
          status,
          current_period_start: new Date(
            subscription.current_period_start * 1000,
          ).toISOString(),
          current_period_end: new Date(
            subscription.current_period_end * 1000,
          ).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          amount: item?.price?.unit_amount
            ? item.price.unit_amount / 100
            : null,
          currency: item?.price?.currency ?? null,
          interval: item?.price?.recurring?.interval ?? null,
          interval_count: item?.price?.recurring?.interval_count ?? null,
          stripe_customer_id: customerId,
          raw: subscription,
          updated_at: new Date().toISOString(),
        });

        subscriptionPayload = {
          id: subscription.id,
          status,
          priceId: item?.price?.id ?? null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          amount: item?.price?.unit_amount
            ? item.price.unit_amount / 100
            : null,
          currency: item?.price?.currency ?? null,
          interval: item?.price?.recurring?.interval ?? null,
          intervalCount: item?.price?.recurring?.interval_count ?? null,
        };
      }
    }
  } catch (stripeError) {
    console.error("Error syncing Stripe subscription:", stripeError);
  }

  try {
    await supabaseAdmin
      .from("profiles")
      .update({
        plan,
        plan_started_at: plan === "pro" ? planStartedAt : null,
        stripe_customer_id: stripeCustomerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  } catch (updateError) {
    console.error("Error updating profile plan:", updateError);
  }

  let freeLimits: Record<string, number> | null = null;
  try {
    const { data: limitsData } = await supabaseAdmin.rpc("free_limits");
    if (limitsData) {
      freeLimits = limitsData as Record<string, number>;
    }
  } catch (rpcError) {
    console.error("Error loading free limits:", rpcError);
  }

  const body = {
    plan,
    isSubscribed: plan === "pro",
    subscriptionData: subscriptionPayload,
    freeLimits,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
