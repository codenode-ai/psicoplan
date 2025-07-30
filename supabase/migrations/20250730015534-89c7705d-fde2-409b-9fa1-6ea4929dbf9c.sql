-- Criar função para sincronização de planos de usuário
CREATE OR REPLACE FUNCTION public.sync_user_plan_from_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Atualizar plano do usuário baseado na assinatura
  IF NEW.subscribed = true AND NEW.subscription_tier IS NOT NULL THEN
    UPDATE public.users 
    SET plano = CASE 
      WHEN NEW.subscription_tier = 'plus' THEN 'plus'::user_plan
      WHEN NEW.subscription_tier = 'pro' THEN 'pro'::user_plan
      ELSE 'free'::user_plan
    END
    WHERE user_id = NEW.user_id;
  ELSE
    -- Se não tem assinatura ativa, definir como free
    UPDATE public.users 
    SET plano = 'free'::user_plan
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar função para métricas de dashboard otimizada
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  -- Verificar se o usuário pode acessar seus próprios dados
  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  
  SELECT json_build_object(
    'total_pacientes', (
      SELECT COUNT(*) FROM public.pacientes 
      WHERE user_id = target_user_id AND status = 'ativo'
    ),
    'sessoes_mes', (
      SELECT COUNT(*) FROM public.sessoes 
      WHERE user_id = target_user_id 
      AND data_hora >= date_trunc('month', CURRENT_DATE)
      AND data_hora < date_trunc('month', CURRENT_DATE) + interval '1 month'
    ),
    'receita_mes', (
      SELECT COALESCE(SUM(valor), 0) FROM public.financeiro 
      WHERE user_id = target_user_id 
      AND data_recebimento >= date_trunc('month', CURRENT_DATE)
      AND data_recebimento < date_trunc('month', CURRENT_DATE) + interval '1 month'
    ),
    'proximas_sessoes', (
      SELECT COUNT(*) FROM public.sessoes 
      WHERE user_id = target_user_id 
      AND data_hora >= CURRENT_TIMESTAMP
      AND data_hora <= CURRENT_TIMESTAMP + interval '7 days'
      AND status = 'agendada'
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Criar triggers
CREATE TRIGGER sync_user_plan_trigger
    AFTER INSERT OR UPDATE ON public.subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_plan_from_subscription();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pacientes_user_id_status ON public.pacientes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sessoes_user_id_data ON public.sessoes(user_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_financeiro_user_id_data ON public.financeiro(user_id, data_recebimento);
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON public.subscribers(email);