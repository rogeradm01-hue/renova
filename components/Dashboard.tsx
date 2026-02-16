import React, { useMemo } from 'react';
import { DetranData } from '../types';
import { checkExpirationStatus } from '../services/storageService';
import { STATUS_STYLES } from '../constants';
import { AlertCircle, CheckCircle2, Clock, PlayCircle, Timer, ChevronRight, BarChart3, Map as MapIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrazilMap from './BrazilMap';

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
      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex-1 min-w-[200px]"
      onClick={onClickFilter}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800">{count}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-blue-900">Dashboard Geral</h2>
            <p className="text-sm text-slate-500">Acompanhamento de Recadastramentos por Estado</p>
        </div>
      </div>

      {/* Warning Banner */}
      {stats.expiring > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-red-900 font-semibold">Atenção Necessária</h3>
              <p className="text-red-700 text-sm">
                Existem <strong>{stats.expiring}</strong> estados em período crítico de vencimento.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/detrans?filter=expiring')}
            className="px-4 py-2 bg-white text-red-700 border border-red-200 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Ver Detalhes
          </button>
        </div>
      )}

      {/* Top Section: Stats & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Cards Column */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 h-fit">
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

        {/* Map Column */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full min-h-[350px]">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-blue-900" />
                  Mapa do Brasil
              </h3>
          </div>
          
          <div className="flex-1 relative bg-slate-50/50">
             <BrazilMap data={data} />
          </div>

          {/* Map Legend */}
          <div className="px-4 py-3 bg-white border-t border-slate-100">
              <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px] sm:text-xs">
                  <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-600">Recadastrado</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                      <span className="text-slate-600">Iniciada</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-900"></span>
                      <span className="text-slate-600">Em Andamento</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-slate-900"></span>
                      <span className="text-slate-600 font-bold">Vencido</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-slate-400"></span>
                      <span className="text-slate-600">N/ Iniciada</span>
                  </div>
              </div>
          </div>
        </div>
      </div>

      {/* State List - Lines Format (Dark Navy Theme) */}
      <div className="bg-blue-900 rounded-xl border border-blue-800 shadow-sm overflow-hidden text-white">
        <div className="p-6 border-b border-blue-800 flex justify-between items-center bg-blue-950">
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
             <BarChart3 className="w-5 h-5 text-blue-200" />
             Progresso por Estado
           </h3>
           <span className="text-xs text-blue-900 font-bold bg-white px-2 py-1 rounded-full shadow-sm">
             {data.length} Estados
           </span>
        </div>

        <div className="divide-y divide-blue-800">
             {data.map(d => {
                 const isExpiring = checkExpirationStatus(d) && d.currentStatus !== 'Concluída' && d.currentStatus !== 'Recadastrado com Sucesso';
                 const progress = getProgressPercentage(d.currentStatus);
                 const isCompleted = progress === 100;

                 return (
                 <div 
                    key={d.uf} 
                    onClick={() => navigate(`/detran/${d.uf}`)}
                    className="group hover:bg-blue-800 transition-colors cursor-pointer p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                 >
                     {/* 1. UF & Name (MD: Col 1-4) */}
                     <div className="md:col-span-4 flex items-center gap-4">
                         <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm transition-transform group-hover:scale-105
                            ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-white text-blue-900'}
                         `}>
                             {d.uf}
                         </div>
                         <div>
                             <h4 className="font-bold text-white text-base">{d.stateName}</h4>
                             <p className="text-xs text-blue-200 flex items-center gap-1">
                                 Detran-{d.uf}
                                 {isExpiring && <span className="text-red-300 font-bold ml-1">• Vencendo</span>}
                             </p>
                         </div>
                     </div>

                     {/* 2. Progress Bar (MD: Col 5-8) */}
                     <div className="md:col-span-4 px-2">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-xs font-semibold text-blue-200">Progresso</span>
                            <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-300' : 'text-white'}`}>
                                {progress}%
                            </span>
                        </div>
                        <div className="w-full h-2.5 bg-blue-950 rounded-full overflow-hidden border border-blue-800">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-emerald-500' : 'bg-blue-400'}`}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                     </div>

                     {/* 3. Status & Info (MD: Col 9-11) */}
                     <div className="md:col-span-3 flex flex-col items-start md:items-end justify-center gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${STATUS_STYLES[d.currentStatus]}`}>
                            {d.currentStatus}
                        </span>
                        {d.expirationDate && (
                            <span className={`text-xs ${isExpiring ? 'text-red-300 font-bold' : 'text-blue-200'}`}>
                                Vence: {new Date(d.expirationDate).toLocaleDateString()}
                            </span>
                        )}
                     </div>

                     {/* 4. Arrow Action (MD: Col 12) */}
                     <div className="md:col-span-1 flex justify-end">
                        <ChevronRight className="w-5 h-5 text-blue-400 group-hover:text-white transition-colors" />
                     </div>
                 </div>
             )})}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;