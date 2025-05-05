import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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

    // Auth check
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    
    if (!user || !user.email) {
      throw new Error("Unauthorized or invalid user");
    }

    // Check if the user has a subscription
    const customers = await stripe.customers.list({ 
      email: user.email,
      limit: 1
    });

    if (customers.data.length === 0) {
      // No customer found in Stripe
      return new Response(
        JSON.stringify({ 
          isSubscribed: false,
          trialActive: false,
          subscriptionData: null
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    const customerId = customers.data[0].id;
    
    // Get subscription data
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.default_payment_method'],
      limit: 1
    });
    
    if (subscriptions.data.length === 0) {
      // No active subscription found
      return new Response(
        JSON.stringify({ 
          isSubscribed: false,
          trialActive: false,
          subscriptionData: null
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    const subscription = subscriptions.data[0];
    
    // Get plan details
    const priceId = subscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId);
    
    // Update the user's profile with subscription data
    await supabaseClient.from('profiles')
      .update({ 
        is_subscribed: true,
        // Keep trial_end_date as is
      })
      .eq('id', user.id);
    
    // Prepare subscription data for response
    const subscriptionData = {
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      priceId: priceId,
      amount: price.unit_amount ? price.unit_amount / 100 : 0, // Convert from cents to currency units
      currency: price.currency,
      interval: price.recurring?.interval,
      intervalCount: price.recurring?.interval,
    };
    
    return new Response(
      JSON.stringify({ 
        isSubscribed: true,
        trialActive: false, // Trial is not active if there's a subscription
        subscriptionData: subscriptionData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error checking subscription status" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
