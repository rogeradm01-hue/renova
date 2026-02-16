import { RegistrationStatus } from "./types";

export const BRAZIL_STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
];

export const STATUS_OPTIONS: RegistrationStatus[] = [
  'Não Iniciada',
  'Iniciada',
  'Em Andamento',
  'Pendente',
  'Concluída',
  'Recadastrado com Sucesso',
];

export const INSTITUTION_NAME = "RENOVA";

// Mapeamento de estilos para os badges de status
export const STATUS_STYLES: Record<RegistrationStatus, string> = {
  'Não Iniciada': 'bg-slate-100 text-slate-500 border-slate-200',
  'Iniciada': 'bg-slate-200 text-slate-700 border-slate-300',
  'Em Andamento': 'bg-blue-900 text-white border-blue-900 shadow-sm', // Destaque em Azul Marinho
  'Pendente': 'bg-amber-50 text-amber-700 border-amber-200',
  'Concluída': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Recadastrado com Sucesso': 'bg-emerald-100 text-emerald-800 border-emerald-300',
};