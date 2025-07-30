-- Corrigir search_path para todas as funções de segurança
-- 1. Corrigir função check_patient_limit
CREATE OR REPLACE FUNCTION public.check_patient_limit()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  current_count INTEGER;
  user_plan_value public.user_plan;
  plan_limit INTEGER;
BEGIN
  -- Get current patient count for this user
  SELECT COUNT(*) INTO current_count
  FROM public.pacientes 
  WHERE user_id = NEW.user_id AND status = 'ativo';
  
  -- Get user's plan
  SELECT plano INTO user_plan_value
  FROM public.users 
  WHERE user_id = NEW.user_id;
  
  -- Set limits based on plan
  CASE user_plan_value
    WHEN 'free' THEN plan_limit := 5;
    WHEN 'plus' THEN plan_limit := 50;
    WHEN 'pro' THEN plan_limit := NULL; -- unlimited
  END CASE;
  
  -- Check if limit would be exceeded
  IF plan_limit IS NOT NULL AND current_count >= plan_limit THEN
    RAISE EXCEPTION 'Limite de pacientes excedido para o plano %. Limite: %', user_plan_value, plan_limit;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Corrigir função get_user_plan
CREATE OR REPLACE FUNCTION public.get_user_plan()
RETURNS user_plan
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (
    SELECT plano FROM public.users 
    WHERE user_id = auth.uid() 
    AND archived = false
  );
END;
$$;

-- 3. Corrigir função is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND archived = false
  );
END;
$$;

-- 4. Corrigir função is_super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
    AND archived = false
  );
END;
$$;

-- 5. Corrigir função handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.users (user_id, email, nome_completo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Adicionar triggers para atualizações automáticas de timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Criar triggers para updated_at em todas as tabelas que precisam
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pacientes_updated_at
    BEFORE UPDATE ON public.pacientes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessoes_updated_at
    BEFORE UPDATE ON public.sessoes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at
    BEFORE UPDATE ON public.subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar trigger para controle de limite de pacientes
CREATE TRIGGER check_patient_limit_trigger
    BEFORE INSERT ON public.pacientes
    FOR EACH ROW
    EXECUTE FUNCTION public.check_patient_limit();

-- Adicionar trigger para novos usuários
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

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

-- Adicionar trigger para sincronizar planos
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