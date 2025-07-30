-- Fix security warnings: Add proper search_path to functions

-- Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
    AND archived = false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- Update is_super_admin function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
    AND archived = false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- Update get_user_plan function
CREATE OR REPLACE FUNCTION public.get_user_plan()
RETURNS user_plan AS $$
BEGIN
  RETURN (
    SELECT plano FROM public.users 
    WHERE user_id = auth.uid() 
    AND archived = false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_id, email, nome_completo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update check_patient_limit function
CREATE OR REPLACE FUNCTION public.check_patient_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  user_plan user_plan;
  plan_limit INTEGER;
BEGIN
  -- Get current patient count for this user
  SELECT COUNT(*) INTO current_count
  FROM public.pacientes 
  WHERE user_id = NEW.user_id AND status = 'ativo';
  
  -- Get user's plan
  SELECT plano INTO user_plan
  FROM public.users 
  WHERE user_id = NEW.user_id;
  
  -- Set limits based on plan
  CASE user_plan
    WHEN 'free' THEN plan_limit := 5;
    WHEN 'plus' THEN plan_limit := 50;
    WHEN 'pro' THEN plan_limit := NULL; -- unlimited
  END CASE;
  
  -- Check if limit would be exceeded
  IF plan_limit IS NOT NULL AND current_count >= plan_limit THEN
    RAISE EXCEPTION 'Limite de pacientes excedido para o plano %. Limite: %', user_plan, plan_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Update log_admin_action function
CREATE OR REPLACE FUNCTION public.log_admin_action(
  action_text TEXT,
  target_user_id UUID DEFAULT NULL,
  action_details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.admin_logs (admin_user_id, action, target_user_id, details)
  VALUES (auth.uid(), action_text, target_user_id, action_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';