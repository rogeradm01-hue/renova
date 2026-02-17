import React from 'react';
import { DetranData, RegistrationStatus } from '../types';
import { useNavigate } from 'react-router-dom';

interface ProgressChartProps {
  data: DetranData[];
}

// Mapeamento de cores sólidas para os blocos (diferente dos badges para melhor contraste em bloco)
const getStatusColorClass = (status: RegistrationStatus): string => {
  switch (status) {
    case 'Recadastrado com Sucesso': 
      return 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-100';
    case 'Concluída': 
      return 'bg-emerald-400 text-white border-emerald-500 shadow-emerald-50';
    case 'Pendente': 
      return 'bg-amber-400 text-amber-900 border-amber-500 shadow-amber-50';
    case 'Em Andamento': 
      return 'bg-blue-900 text-white border-blue-950 shadow-blue-100';
    case 'Iniciada': 
      return 'bg-orange-400 text-white border-orange-500 shadow-orange-50';
    case 'Não Iniciada': 
    default: 
      return 'bg-slate-100 text-slate-400 border-slate-200';
  }
};

const LEGEND_ITEMS: { status: RegistrationStatus; color: string; label: string }[] = [
  { status: 'Não Iniciada', color: 'bg-slate-100 border-slate-200', label: 'Não Iniciada' },
  { status: 'Iniciada', color: 'bg-orange-400', label: 'Iniciada' },
  { status: 'Em Andamento', color: 'bg-blue-900', label: 'Em Andamento' },
  { status: 'Pendente', color: 'bg-amber-400', label: 'Pendente' },
  { status: 'Concluída', color: 'bg-emerald-400', label: 'Concluída' },
  { status: 'Recadastrado com Sucesso', color: 'bg-emerald-600', label: 'Sucesso' },
];

const ProgressChart: React.FC<ProgressChartProps> = ({ data }) => {
  const navigate = useNavigate();

  // Ordenar alfabeticamente pela UF
  const sortedData = [...data].sort((a, b) => a.uf.localeCompare(b.uf));

  return (
    <div className="flex flex-col h-full p-4">
      
      {/* Grade de Estados */}
      <div className="flex-1 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-9 gap-3 content-start">
        {sortedData.map((state) => (
          <div
            key={state.uf}
            onClick={() => navigate(`/detran/${state.uf}`)}
            className={`
              aspect-square rounded-lg border shadow-sm flex items-center justify-center 
              cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md relative group
              ${getStatusColorClass(state.currentStatus)}
            `}
          >
            <span className="font-bold text-sm sm:text-base tracking-tight select-none">
              {state.uf}
            </span>

            {/* Tooltip Simples */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[150px] bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 text-center shadow-lg">
              <p className="font-bold">{state.stateName}</p>
              <p className="font-normal opacity-90">{state.currentStatus}</p>
              {/* Seta do tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${item.color} shadow-sm border border-transparent`}></div>
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressChart;