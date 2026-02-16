export type RegistrationStatus = 
  | 'Não Iniciada'
  | 'Iniciada'
  | 'Em Andamento'
  | 'Pendente'
  | 'Concluída'
  | 'Recadastrado com Sucesso';

export type UserRole = 'MASTER' | 'EDITOR' | 'VIEWER';

export interface User {
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean; // Novo campo para controle de inativação
  isFirstLogin?: boolean;
  password?: string; // Utilizado apenas para validação interna no mock
}

export interface AccessRequest {
  id: string;
  username: string;
  email: string;
  requestDate: string; // ISO Date
  type: 'NEW_ACCOUNT' | 'PASSWORD_RESET'; // Define se é novo cadastro ou reset
}

export interface DetranContact {
  name: string;
  phone: string;
  email: string;
}

export interface DocumentItem {
  id: string;
  description: string;
  lastUpdated: string; // ISO Date
  isCompliant: boolean; // Indica se o documento está atualizado/entregue (flag verde)
}

export interface StatusHistoryItem {
  id: string;
  date: string; // ISO Date
  status: RegistrationStatus;
  notes: string;
  user?: string; // Nome do usuário que realizou a ação
}

export interface ConfigMetadata {
  lastUpdated: string; // ISO Date
  user: string;
}

export interface DetranData {
  uf: string;
  stateName: string;
  contact: DetranContact;
  documents: DocumentItem[];
  expirationDate: string | null; // ISO Date
  alertDays: number;
  configMetadata?: ConfigMetadata; // Metadados da última alteração de prazos
  contactMetadata?: ConfigMetadata; // Metadados da última alteração de contatos (Reutilizando a estrutura ConfigMetadata)
  statusHistory: StatusHistoryItem[];
  currentStatus: RegistrationStatus;
}

export interface DashboardStats {
  total: number;
  concluded: number;
  pending: number;
  inProgress: number;
  started: number;
  notStarted: number;
  expiring: number;
}