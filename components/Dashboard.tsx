import React, { useMemo } from 'react';
import { DetranData } from '../types';
import { checkExpirationStatus } from '../services/storageService';
import { STATUS_STYLES } from '../constants';
import { AlertCircle, CheckCircle2, Clock, PlayCircle, Timer, ChevronRight, BarChart3, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProgressChart from './ProgressChart';

interface DashboardProps {
  data: DetranData[];
}

const getProgressPercentage = (status: string): number => {
  switch (status) {
    case 'Recadastrado com Sucesso':
      return 100;
    case 'Concluída':
      return 90;
    case 'Pendente':
      return 75;
    case 'Em Andamento':
      return 50;
    case 'Iniciada':
      return 25;
    case 'Não Iniciada':
    default:
      return 0;
  }
};

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const s = {
      total: data.length,
      concluded: 0,
      inProgress: 0,
      started: 0,
      notStarted: 0,
      pending: 0,
      expiring: 0,
      success: 0,
    };

    data.forEach(d => {
      if (checkExpirationStatus(d) && d.currentStatus !== 'Concluída' && d.currentStatus !== 'Recadastrado com Sucesso') {
        s.expiring++;
      }
      
      switch (d.currentStatus) {
        case 'Concluída': s.concluded++; break;
        case 'Recadastrado com Sucesso': s.success++; break;
        case 'Em Andamento': s.inProgress++; break;
        case 'Iniciada': s.started++; break;
        case 'Não Iniciada': s.notStarted++; break;
        case 'Pendente': s.pending++; break;
      }
    });
    return s;
  }, [data]);

  const StatCard = ({ title, count, icon: Icon, color, onClickFilter }: any) => (
    <div 
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex items-center gap-4 group relative overflow-hidden"
      onClick={onClickFilter}
    >
      {/* Decorative background accent */}
      <div className={`absolute right-0 top-0 w-20 h-20 opacity-5 transform translate-x-6 -translate-y-6 rounded-full ${color} pointer-events-none`}></div>

      {/* Icon Left */}
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-sm shrink-0 ${color} group-hover:scale-105 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Content Right */}
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{title}</span>
        <h3 className="text-2xl font-bold text-slate-800 leading-none">{count}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-blue-900">Dashboard Geral</h2>
            <p className="text-sm text-slate-500">Acompanhamento de Recadastramentos por Estado</p>
        </div>
      </div>

      {/* Warning Banner */}
      {stats.expiring > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-red-900 font-bold text-sm">Atenção Necessária</h3>
              <p className="text-red-700 text-xs">
                Existem <strong>{stats.expiring}</strong> estados em período crítico de vencimento.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/detrans?filter=expiring')}
            className="px-3 py-1 bg-white text-red-700 border border-red-200 rounded text-xs font-bold hover:bg-red-50 transition-colors uppercase tracking-wide"
          >
            Ver Detalhes
          </button>
        </div>
      )}

      {/* Top Section: Stats & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Cards Column */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 h-fit">
             <StatCard 
              title="Em Vencimento" 
              count={stats.expiring} 
              icon={Timer} 
              color="bg-red-600" 
            />
            <StatCard 
              title="Finalizados" 
              count={stats.concluded + stats.success} 
              icon={CheckCircle2} 
              color="bg-emerald-600" 
            />
            <StatCard 
              title="Em Andamento" 
              count={stats.inProgress + stats.started} 
              icon={PlayCircle} 
              color="bg-blue-900" 
            />
            <StatCard 
              title="Pendentes/Parados" 
              count={stats.pending + stats.notStarted} 
              icon={Clock} 
              color="bg-slate-500" 
            />
        </div>

        {/* Chart Column (Status Grid) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full min-h-[250px]">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-bold text-slate-600 flex items-center gap-2 uppercase tracking-wide">
                  <LayoutGrid className="w-4 h-4 text-blue-900" />
                  Panorama de Status
              </h3>
          </div>
          
          <div className="flex-1 relative bg-white p-2">
             <ProgressChart data={data} />
          </div>
        </div>
      </div>

      {/* State List - Lines Format (Dark Navy Theme) */}
      <div className="bg-blue-900 rounded-xl border border-blue-800 shadow-sm overflow-hidden text-white">
        <div className="p-4 border-b border-blue-800 flex justify-between items-center bg-blue-950">
           <h3 className="text-base font-bold text-white flex items-center gap-2">
             <BarChart3 className="w-5 h-5 text-blue-200" />
             Progresso por Estado
           </h3>
           <span className="text-[10px] text-blue-900 font-bold bg-white px-2 py-0.5 rounded-full shadow-sm">
             {data.length} UFs
           </span>
        </div>

        <div className="divide-y divide-blue-800">
             {data.map(d => {
                 const isExpiring = checkExpirationStatus(d) && d.currentStatus !== 'Concluída' && d.currentStatus !== 'Recadastrado com Sucesso';
                 const progress = getProgressPercentage(d.currentStatus);
                 const isCompleted = progress === 100;
                 
                 // Determinar texto e cor do alerta
                 let alertText = null;
                 let alertColor = "";

                 if (isExpiring && d.expirationDate) {
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const exp = new Date(d.expirationDate);
                    exp.setHours(0,0,0,0);
                    
                    if (exp < today) {
                        alertText = "Vencido";
                        alertColor = "text-red-300";
                    } else {
                        alertText = "Iniciar Recadastramento";
                        alertColor = "text-amber-300";
                    }
                 }

                 return (
                 <div 
                    key={d.uf} 
                    onClick={() => navigate(`/detran/${d.uf}`)}
                    className="group hover:bg-blue-800 transition-colors cursor-pointer p-3 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                 >
                     {/* 1. UF & Name (MD: Col 1-4) */}
                     <div className="md:col-span-4 flex items-center gap-3">
                         <div className={`
                            w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-105
                            ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-white text-blue-900'}
                         `}>
                             {d.uf}
                         </div>
                         <div className="min-w-0">
                             <h4 className="font-bold text-white text-sm truncate">{d.stateName}</h4>
                             <p className="text-[10px] text-blue-200 flex items-center gap-1">
                                 {alertText && <span className={`${alertColor} font-bold uppercase border px-1 rounded border-current`}>{alertText}</span>}
                             </p>
                         </div>
                     </div>

                     {/* 2. Progress Bar (MD: Col 5-8) */}
                     <div className="md:col-span-4 px-2">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-[10px] font-semibold text-blue-200">Progresso</span>
                            <span className={`text-[10px] font-bold ${isCompleted ? 'text-emerald-300' : 'text-white'}`}>
                                {progress}%
                            </span>
                        </div>
                        <div className="w-full h-1.5 bg-blue-950 rounded-full overflow-hidden border border-blue-800">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-emerald-500' : 'bg-blue-400'}`}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                     </div>

                     {/* 3. Status & Info (MD: Col 9-11) */}
                     <div className="md:col-span-3 flex flex-col items-start md:items-end justify-center gap-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${STATUS_STYLES[d.currentStatus]}`}>
                            {d.currentStatus}
                        </span>
                        {d.expirationDate && (
                            <span className={`text-[10px] ${isExpiring ? 'text-red-300 font-bold' : 'text-blue-200'}`}>
                                {new Date(d.expirationDate).toLocaleDateString()}
                            </span>
                        )}
                     </div>

                     {/* 4. Arrow Action (MD: Col 12) */}
                     <div className="md:col-span-1 flex justify-end">
                        <ChevronRight className="w-4 h-4 text-blue-400 group-hover:text-white transition-colors" />
                     </div>
                 </div>
             )})}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;