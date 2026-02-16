import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DetranData } from '../types';
import { checkExpirationStatus } from '../services/storageService';
import { STATUS_STYLES } from '../constants';
import { Search, MapPin, AlertCircle } from 'lucide-react';

interface DetranListProps {
  data: DetranData[];
}

const DetranList: React.FC<DetranListProps> = ({ data }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(d => 
    d.stateName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.uf.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-blue-900">Gerenciar Estados</h2>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou UF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-900 focus:border-blue-900 outline-none shadow-sm text-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredData.map(detran => {
          const isCritical = checkExpirationStatus(detran) && detran.currentStatus !== 'Concluída';
          
          return (
            <div 
              key={detran.uf}
              onClick={() => navigate(`/detran/${detran.uf}`)}
              className={`bg-white rounded-xl p-5 border transition-all cursor-pointer hover:shadow-lg group relative overflow-hidden
                ${isCritical ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200 hover:border-blue-400'}
              `}
            >
              {isCritical && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1 z-10">
                      <AlertCircle className="w-3 h-3" /> VENCENDO
                  </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-blue-900 border border-slate-200 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                      {detran.uf}
                   </div>
                   <div>
                      <h3 className="font-semibold text-slate-800 group-hover:text-blue-900 transition-colors">{detran.stateName}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                         <MapPin className="w-3 h-3" /> Detran-{detran.uf}
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-3 mb-2">
                  <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Status:</span>
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_STYLES[detran.currentStatus]}`}>
                        {detran.currentStatus}
                      </span>
                  </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Vencimento:</span>
                      <span className={`font-medium ${isCritical ? 'text-red-600' : 'text-slate-700'}`}>
                          {detran.expirationDate ? new Date(detran.expirationDate).toLocaleDateString() : '-'}
                      </span>
                  </div>
              </div>
              
              <div className="pt-3 border-t border-slate-100 text-center mt-3">
                  <span className="text-blue-900 text-sm font-semibold group-hover:underline">Gerenciar</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DetranList;