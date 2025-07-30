-- Psicoplan Database Schema
-- Sistema completo para gestão de consultórios psicológicos

-- Create custom types
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE public.user_plan AS ENUM ('free', 'plus', 'pro');
CREATE TYPE public.session_type AS ENUM ('presencial', 'online');
CREATE TYPE public.session_status AS ENUM ('agendada', 'realizada', 'cancelada');
CREATE TYPE public.patient_status AS ENUM ('ativo', 'inativo');
CREATE TYPE public.payment_method AS ENUM ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia');

-- Users table (profiles)
CREATE TABLE public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nome_completo TEXT NOT NULL,
    plano user_plan NOT NULL DEFAULT 'free',
    role user_role NOT NULL DEFAULT 'user',
    archived BOOLEAN NOT NULL DEFAULT false,
    termos_aceitos BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pacientes table
CREATE TABLE public.pacientes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo TEXT NOT NULL,
    cpf TEXT,
    telefone TEXT,
    email TEXT,
    data_nascimento DATE,
    tags TEXT[] DEFAULT '{}',
    observacoes TEXT,
    status patient_status NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sessoes table
CREATE TABLE public.sessoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo session_type NOT NULL DEFAULT 'presencial',
    status session_status NOT NULL DEFAULT 'agendada',
    link TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prontuarios table
CREATE TABLE public.prontuarios (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sessao_id UUID NOT NULL REFERENCES public.sessoes(id) ON DELETE CASCADE,
    anotacao TEXT NOT NULL,
    data_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Financeiro table
CREATE TABLE public.financeiro (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    sessao_id UUID REFERENCES public.sessoes(id) ON DELETE SET NULL,
    valor NUMERIC(10,2) NOT NULL,
    data_recebimento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    forma_pagamento payment_method NOT NULL DEFAULT 'dinheiro',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Admin logs table
CREATE TABLE public.admin_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_users_user_id ON public.users(user_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_plano ON public.users(plano);

CREATE INDEX idx_pacientes_user_id ON public.pacientes(user_id);
CREATE INDEX idx_pacientes_status ON public.pacientes(status);

CREATE INDEX idx_sessoes_user_id ON public.sessoes(user_id);
CREATE INDEX idx_sessoes_paciente_id ON public.sessoes(paciente_id);
CREATE INDEX idx_sessoes_data_hora ON public.sessoes(data_hora);
CREATE INDEX idx_sessoes_status ON public.sessoes(status);

CREATE INDEX idx_prontuarios_user_id ON public.prontuarios(user_id);
CREATE INDEX idx_prontuarios_sessao_id ON public.prontuarios(sessao_id);

CREATE INDEX idx_financeiro_user_id ON public.financeiro(user_id);
CREATE INDEX idx_financeiro_paciente_id ON public.financeiro(paciente_id);
CREATE INDEX idx_financeiro_data_recebimento ON public.financeiro(data_recebimento);

CREATE INDEX idx_admin_logs_admin_user_id ON public.admin_logs(admin_user_id);
CREATE INDEX idx_admin_logs_created_at ON public.admin_logs(created_at);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Create security functions
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_plan()
RETURNS user_plan AS $$
BEGIN
  RETURN (
    SELECT plano FROM public.users 
    WHERE user_id = auth.uid() 
    AND archived = false
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
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

-- Function to handle new user creation
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check patient limits based on plan
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
$$ LANGUAGE plpgsql;

-- Trigger to check patient limits
CREATE TRIGGER check_patient_limit_trigger
  BEFORE INSERT ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION public.check_patient_limit();

-- Function to log admin actions
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update users" 
ON public.users FOR UPDATE 
USING (public.is_admin());

-- Pacientes policies
CREATE POLICY "Users can manage their own patients" 
ON public.pacientes FOR ALL 
USING (user_id = auth.uid());

-- Sessoes policies
CREATE POLICY "Users can manage their own sessions" 
ON public.sessoes FOR ALL 
USING (user_id = auth.uid());

-- Prontuarios policies
CREATE POLICY "Users can manage their own records" 
ON public.prontuarios FOR ALL 
USING (user_id = auth.uid());

-- Financeiro policies
CREATE POLICY "Users can manage their own financial records" 
ON public.financeiro FOR ALL 
USING (user_id = auth.uid());

-- Admin logs policies
CREATE POLICY "Admins can view admin logs" 
ON public.admin_logs FOR SELECT 
USING (public.is_admin());

CREATE POLICY "System can insert admin logs" 
ON public.admin_logs FOR INSERT 
WITH CHECK (true);