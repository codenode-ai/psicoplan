-- Fix the functions with proper schema qualification

-- Update check_patient_limit function with proper schema qualification
CREATE OR REPLACE FUNCTION public.check_patient_limit()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SET search_path = public;

-- Update get_user_plan function with proper schema qualification
CREATE OR REPLACE FUNCTION public.get_user_plan()
RETURNS public.user_plan AS $$
BEGIN
  RETURN (
    SELECT plano FROM public.users 
    WHERE user_id = auth.uid() 
    AND archived = false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;