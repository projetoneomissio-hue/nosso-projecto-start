import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event: Stripe.Event;

    // If webhook secret is configured, verify signature
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err);
        console.error("[STRIPE-WEBHOOK] Signature verification failed:", errMessage);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // For development without signature verification
      event = JSON.parse(body);
      console.log("[STRIPE-WEBHOOK] Warning: Webhook signature not verified");
    }

    console.log("[STRIPE-WEBHOOK] Event received:", event.type);

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const pagamentoId = session.metadata?.pagamento_id;
        
        if (!pagamentoId) {
          console.log("[STRIPE-WEBHOOK] No pagamento_id in metadata, skipping");
          break;
        }

        console.log("[STRIPE-WEBHOOK] Processing payment:", pagamentoId);

        // For PIX, we need to check if payment actually succeeded
        if (session.payment_status === "paid") {
          const { error } = await supabase
            .from("pagamentos")
            .update({
              status: "pago",
              data_pagamento: new Date().toISOString().split("T")[0],
              forma_pagamento: session.payment_method_types?.[0] === "pix" ? "PIX Online" : "Cartão Online",
              observacoes: `Stripe Session: ${session.id}`,
            })
            .eq("id", pagamentoId);

          if (error) {
            console.error("[STRIPE-WEBHOOK] Error updating payment:", error);
            throw error;
          }

          console.log("[STRIPE-WEBHOOK] Payment marked as paid:", pagamentoId);
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const pagamentoId = session.metadata?.pagamento_id;
        
        if (pagamentoId) {
          console.log("[STRIPE-WEBHOOK] Payment failed:", pagamentoId);
          // Optionally update status or send notification
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[STRIPE-WEBHOOK] PaymentIntent succeeded:", paymentIntent.id);
        
        // Handle payment link payments
        const pagamentoId = paymentIntent.metadata?.pagamento_id;
        if (pagamentoId) {
          const { error } = await supabase
            .from("pagamentos")
            .update({
              status: "pago",
              data_pagamento: new Date().toISOString().split("T")[0],
              forma_pagamento: "Online (Stripe)",
              observacoes: `Stripe PI: ${paymentIntent.id}`,
            })
            .eq("id", pagamentoId);

          if (error) {
            console.error("[STRIPE-WEBHOOK] Error updating payment:", error);
          } else {
            console.log("[STRIPE-WEBHOOK] Payment updated via PaymentIntent:", pagamentoId);
          }
        }
        break;
      }

      default:
        console.log("[STRIPE-WEBHOOK] Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[STRIPE-WEBHOOK] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
