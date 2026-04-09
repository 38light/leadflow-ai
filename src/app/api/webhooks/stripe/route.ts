import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createServerClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await createServerClient();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Look up user by stripe_customer_id in profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (profile) {
        const planItem = subscription.items.data[0];
        const planId = planItem?.price?.lookup_key ?? "free";

        const { error: upsertError } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: profile.user_id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            plan: planId as "free" | "starter" | "pro" | "enterprise",
            status: subscription.status === "active" ? "active" :
                    subscription.status === "trialing" ? "trialing" :
                    subscription.status === "past_due" ? "past_due" : "canceled",
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, { onConflict: "user_id" });

        if (upsertError) {
          console.error("[Stripe Webhook] Failed to upsert subscription:", upsertError);
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (profile) {
        await supabase
          .from("subscriptions")
          .update({ status: "canceled", plan: "free" })
          .eq("user_id", profile.user_id);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (profile) {
        await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("user_id", profile.user_id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
