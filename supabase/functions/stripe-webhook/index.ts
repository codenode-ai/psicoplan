import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing required environment variables");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Event verified", { type: event.type, id: event.id });
    } catch (err) {
      logStep("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event, supabaseClient);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event, supabaseClient);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event, supabaseClient);
        break;
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleSubscriptionEvent(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;
  
  logStep("Handling subscription event", { 
    type: event.type, 
    customerId, 
    status: subscription.status 
  });

  // Get customer details
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
    apiVersion: "2023-10-16" 
  });
  
  const customer = await stripe.customers.retrieve(customerId);
  const customerEmail = (customer as Stripe.Customer).email;
  
  if (!customerEmail) {
    logStep("No customer email found");
    return;
  }

  // Determine subscription status and tier
  const isActive = subscription.status === 'active';
  const subscriptionEnd = isActive ? 
    new Date(subscription.current_period_end * 1000).toISOString() : null;
  
  let subscriptionTier = null;
  if (isActive && subscription.items.data.length > 0) {
    const priceId = subscription.items.data[0].price.id;
    const price = await stripe.prices.retrieve(priceId);
    const amount = price.unit_amount || 0;
    
    if (amount <= 2999) {
      subscriptionTier = "plus";
    } else if (amount <= 5999) {
      subscriptionTier = "pro";
    }
  }

  // Update subscribers table
  const { error: subscriberError } = await supabase
    .from('subscribers')
    .upsert({
      email: customerEmail,
      stripe_customer_id: customerId,
      subscribed: isActive,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString(),
    }, { 
      onConflict: 'email' 
    });

  if (subscriberError) {
    logStep("Error updating subscriber", { error: subscriberError });
    throw subscriberError;
  }

  // Log system event
  await supabase.rpc('log_system_event', {
    log_level: 'info',
    log_message: `Subscription ${event.type}`,
    log_context: {
      customer_email: customerEmail,
      subscription_tier: subscriptionTier,
      subscription_status: subscription.status,
      webhook_event_id: event.id
    }
  });

  // Create notification for user
  if (event.type !== 'customer.subscription.deleted') {
    const { data: userData } = await supabase.auth.admin.getUserByEmail(customerEmail);
    
    if (userData.user) {
      await supabase.rpc('create_notification', {
        target_user_id: userData.user.id,
        notification_title: 'Assinatura Atualizada',
        notification_message: isActive ? 
          `Sua assinatura ${subscriptionTier} está ativa!` : 
          'Sua assinatura foi cancelada.',
        notification_type: isActive ? 'success' : 'warning'
      });
    }
  }

  logStep("Subscription event processed successfully");
}

async function handlePaymentSucceeded(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice;
  const customerId = invoice.customer as string;
  
  logStep("Handling payment succeeded", { invoiceId: invoice.id, customerId });

  // Get customer details
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
    apiVersion: "2023-10-16" 
  });
  
  const customer = await stripe.customers.retrieve(customerId);
  const customerEmail = (customer as Stripe.Customer).email;
  
  if (!customerEmail) return;

  // Create notification
  const { data: userData } = await supabase.auth.admin.getUserByEmail(customerEmail);
  
  if (userData.user) {
    await supabase.rpc('create_notification', {
      target_user_id: userData.user.id,
      notification_title: 'Pagamento Confirmado',
      notification_message: `Pagamento de R$ ${(invoice.amount_paid / 100).toFixed(2)} processado com sucesso!`,
      notification_type: 'success'
    });
  }

  // Log system event
  await supabase.rpc('log_system_event', {
    log_level: 'info',
    log_message: 'Payment succeeded',
    log_context: {
      customer_email: customerEmail,
      amount: invoice.amount_paid,
      invoice_id: invoice.id
    }
  });

  logStep("Payment succeeded processed");
}

async function handlePaymentFailed(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice;
  const customerId = invoice.customer as string;
  
  logStep("Handling payment failed", { invoiceId: invoice.id, customerId });

  // Get customer details  
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
    apiVersion: "2023-10-16" 
  });
  
  const customer = await stripe.customers.retrieve(customerId);
  const customerEmail = (customer as Stripe.Customer).email;
  
  if (!customerEmail) return;

  // Create notification
  const { data: userData } = await supabase.auth.admin.getUserByEmail(customerEmail);
  
  if (userData.user) {
    await supabase.rpc('create_notification', {
      target_user_id: userData.user.id,
      notification_title: 'Problema no Pagamento',
      notification_message: 'Houve um problema com seu pagamento. Verifique seus dados de cobrança.',
      notification_type: 'error'
    });
  }

  // Log system event
  await supabase.rpc('log_system_event', {
    log_level: 'warn',
    log_message: 'Payment failed',
    log_context: {
      customer_email: customerEmail,
      amount: invoice.amount_due,
      invoice_id: invoice.id
    }
  });

  logStep("Payment failed processed");
}