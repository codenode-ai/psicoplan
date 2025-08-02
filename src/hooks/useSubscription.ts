import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null
  });
  const [loading, setLoading] = useState(false);

  const checkSubscription = async () => {
    if (!user || !session) return;
    
    // Verifica se a sessão é válida primeiro
    const now = Date.now() / 1000;
    if (session.expires_at && session.expires_at < now) {
      console.log('Session expired, skipping subscription check');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        // Se erro for de autenticação, não mostra toast
        if (error.message?.includes('Session') || error.message?.includes('Authentication')) {
          console.log('Session invalid, skipping subscription check');
          return;
        }
        throw error;
      }
      
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Só mostra toast para erros que não sejam de sessão
      if (!error.message?.includes('Session') && !error.message?.includes('Authentication')) {
        toast({
          title: "Erro",
          description: "Erro ao verificar status da assinatura",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async (plan: 'plus' | 'pro') => {
    if (!user || !session) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar sessão de pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user || !session) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      // Open customer portal in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir portal do cliente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && session) {
      checkSubscription();
    }
  }, [user, session]);

  return {
    subscription,
    loading,
    checkSubscription,
    createCheckout,
    openCustomerPortal
  };
}