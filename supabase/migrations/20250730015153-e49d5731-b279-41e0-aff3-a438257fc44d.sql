-- Migração para corrigir problemas de segurança e adicionar melhorias
-- Primeiro, remover triggers existentes para recriar corretamente
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_pacientes_updated_at ON public.pacientes;
DROP TRIGGER IF EXISTS update_sessoes_updated_at ON public.sessoes;
DROP TRIGGER IF EXISTS update_subscribers_updated_at ON public.subscribers;
DROP TRIGGER IF EXISTS check_patient_limit_trigger ON public.pacientes;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS sync_user_plan_trigger ON public.subscribers;

-- Recriar triggers para updated_at
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

-- Adicionar trigger para sincronizar planos
CREATE TRIGGER sync_user_plan_trigger
    AFTER INSERT OR UPDATE ON public.subscribers
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_user_plan_from_subscription();

-- Criar tabela de logs de sistema para monitoramento
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  message text NOT NULL,
  context jsonb DEFAULT '{}',
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de logs
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Política para logs (apenas admins podem ver)
CREATE POLICY "Admins can view system logs" ON public.system_logs
FOR SELECT
USING (is_admin());

CREATE POLICY "System can insert logs" ON public.system_logs
FOR INSERT
WITH CHECK (true);

-- Criar tabela de notificações para usuários
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de notificações
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para notificações
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Adicionar trigger para updated_at nas notificações
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar notificações
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id uuid,
  notification_title text,
  notification_message text,
  notification_type text DEFAULT 'info'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (target_user_id, notification_title, notification_message, notification_type)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Função para log do sistema
CREATE OR REPLACE FUNCTION public.log_system_event(
  log_level text,
  log_message text,
  log_context jsonb DEFAULT '{}',
  target_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.system_logs (level, message, context, user_id)
  VALUES (log_level, log_message, log_context, target_user_id)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;