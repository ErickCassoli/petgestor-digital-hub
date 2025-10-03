import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

type Plan = "free" | "pro";

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
const STRIPE_SECRET_KEY = requiredEnv("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = requiredEnv("STRIPE_WEBHOOK_SECRET");

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const PRO_STATUSES = new Set<Stripe.Subscription.Status | string>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
]);

function resolveCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  if ("deleted" in customer && customer.deleted) return null;
  return customer.id ?? null;
}

async function findUserIdByCustomer(customerId: string | null): Promise<string | null> {
  if (!customerId) return null;
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

async function upsertSubscription(userId: string, subscription: Stripe.Subscription) {
  const item = subscription.items.data[0] ?? null;
  const customerId = resolveCustomerId(subscription.customer);

  await supabaseAdmin.from("subscriptions").upsert({
    id: subscription.id,
    user_id: userId,
    price_id: item?.price?.id ?? null,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    amount: item?.price?.unit_amount ? item.price.unit_amount / 100 : null,
    currency: item?.price?.currency ?? null,
    interval: item?.price?.recurring?.interval ?? null,
    interval_count: item?.price?.recurring?.interval_count ?? null,
    stripe_customer_id: customerId,
    raw: subscription,
    updated_at: new Date().toISOString(),
  });

  const plan: Plan = PRO_STATUSES.has(subscription.status) ? "pro" : "free";

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("plan, plan_started_at")
    .eq("id", userId)
    .maybeSingle();

  let planStartedAt: string | null = profile?.plan_started_at ?? null;
  if (plan === "pro") {
    planStartedAt = profile?.plan === "pro" && profile?.plan_started_at
      ? profile.plan_started_at
      : new Date(subscription.current_period_start * 1000).toISOString();
  } else {
    planStartedAt = null;
  }

  await supabaseAdmin
    .from("profiles")
    .update({
      plan,
      plan_started_at: plan === "pro" ? planStartedAt : null,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("Error verifying Stripe webhook signature:", error);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId =
          subscription.metadata?.user_id ??
          (await findUserIdByCustomer(resolveCustomerId(subscription.customer)));
        if (userId) {
          await upsertSubscription(userId, subscription);
        }
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const userId =
            session.metadata?.user_id ??
            (await findUserIdByCustomer(resolveCustomerId(subscription.customer)));
          if (userId) {
            await upsertSubscription(userId, subscription);
          }
        } else if (session.customer && session.metadata?.user_id) {
          await supabaseAdmin
            .from("profiles")
            .update({
              stripe_customer_id: resolveCustomerId(session.customer),
              updated_at: new Date().toISOString(),
            })
            .eq("id", session.metadata.user_id);
        }
        break;
      }
      default: {
        // ignore other events
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling Stripe webhook:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
