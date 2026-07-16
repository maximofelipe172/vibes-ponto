import type { Role, UserStatus } from "@prisma/client";

/** Status do expediente do colaborador no dia atual. */
export type DayStatus = "SEM_REGISTRO" | "TRABALHANDO" | "ENCERRADO";

/** Resposta padrão das rotas de API. */
export interface ApiResponse {
  ok?: true;
  error?: string;
}

/** Resposta das rotas de autenticação. */
export interface AuthResponse extends ApiResponse {
  role?: Role;
}

/** Resposta da API POST /api/time-records. */
export interface ClockResponse {
  action: "ENTRADA" | "SAIDA";
  record: {
    id: string;
    entrada: string;
    saida: string | null;
  };
}

/** Registro de ponto serializado para exibição em tabelas. */
export interface TimeRecordRow {
  id: string;
  data: string;
  entrada: string;
  saida: string;
  total: string;
  colaborador?: string;
}

/** Pessoa listada ao abrir um card de indicador. */
export interface StatPerson {
  id: string;
  nome: string;
  email: string;
  role: Role;
  /** Informação contextual (ex.: horário de entrada). */
  detalhe?: string;
}

/** Card de indicador do painel, com as pessoas que ele conta. */
export interface StatCardData {
  key: string;
  label: string;
  value: number;
  description: string;
  icon: "Users" | "Shield" | "CheckCircle2" | "UserX" | "UserPlus";
  pessoas: StatPerson[];
}

/** Usuário serializado para a tela de gestão. */
export interface UserRow {
  id: string;
  nome: string;
  email: string;
  role: Role;
  status: UserStatus;
  cargo: string | null;
  departamento: string | null;
  criadoEm: string;
}
