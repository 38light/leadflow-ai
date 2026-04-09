import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { getStripe } from "@/lib/stripe/client";
import { z } from "zod";

const depositSchema = z.object({
  amount: z.number().int().min(100).max(1000000), // cents
  contact_name: z.string().max(200),
  description: z.string().max(500).optional(),
  conversation_id: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  await getUser();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let input;
  try {
    input = depositSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "aud",
          product_data: {
            name: input.description ?? "Booking Deposit",
          },
          unit_amount: input.amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=cancelled`,
    metadata: {
      contact_name: input.contact_name,
      conversation_id: input.conversation_id ?? "",
    },
  });

  return NextResponse.json({
    data: {
      url: session.url,
      session_id: session.id,
    },
  });
}
