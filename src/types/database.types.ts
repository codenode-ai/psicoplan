// Psicoplan Database Types

export type UserRole = 'user' | 'admin' | 'super_admin';
export type UserPlan = 'free' | 'plus' | 'pro';
export type SessionType = 'presencial' | 'online';
export type SessionStatus = 'agendada' | 'realizada' | 'cancelada';
export type PatientStatus = 'ativo' | 'inativo';
export type PaymentMethod = 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  nome_completo: string;
  plano: UserPlan;
  role: UserRole;
  archived: boolean;
  termos_aceitos: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  user_id: string;
  nome_completo: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  data_nascimento?: string;
  tags: string[];
  observacoes?: string;
  status: PatientStatus;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  paciente_id: string;
  data_hora: string;
  tipo: SessionType;
  status: SessionStatus;
  link?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

// Extended types for joins
export interface SessionWithPatient extends Session {
  paciente?: {
    nome_completo: string;
  };
}

export interface MedicalRecord {
  id: string;
  user_id: string;
  sessao_id: string;
  anotacao: string;
  data_registro: string;
  created_at: string;
  // Relations
  sessao?: Session;
}

export interface FinancialRecord {
  id: string;
  user_id: string;
  paciente_id: string;
  sessao_id?: string;
  valor: number;
  data_recebimento: string;
  forma_pagamento: PaymentMethod;
  observacoes?: string;
  created_at: string;
  // Relations
  paciente?: Patient;
  sessao?: Session;
}

export interface AdminLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_user_id?: string;
  details: Record<string, any>;
  created_at: string;
}

// Plan limits
export const PLAN_LIMITS = {
  free: { pacientes: 5, sessoes: 50 },
  plus: { pacientes: 50, sessoes: 500 },
  pro: { pacientes: Infinity, sessoes: Infinity }
} as const;

// Utility types for forms
export type CreatePatientData = Omit<Patient, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdatePatientData = Partial<CreatePatientData>;

export type CreateSessionData = Omit<Session, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateSessionData = Partial<CreateSessionData>;

export type CreateMedicalRecordData = Omit<MedicalRecord, 'id' | 'user_id' | 'created_at'>;
export type CreateFinancialRecordData = Omit<FinancialRecord, 'id' | 'user_id' | 'created_at'>;