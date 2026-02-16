import React, { useState, useEffect } from 'react';
import { AccessRequest, User, UserRole } from '../types';
import { getAccessRequests, getAllUsers, approveRequest, deleteAccessRequest, toggleUserStatus, deleteUser, updateUserRole } from '../services/storageService';
import { Check, X, UserCheck, Shield, Eye, Edit3, Clock, Ban, Power, Trash2, ChevronDown, KeyRound, UserPlus } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRequests(getAccessRequests());
    setUsers(getAllUsers());
  };

  const handleApprove = (requestId: string, role: 'EDITOR' | 'VIEWER') => {
    approveRequest(requestId, role);
    setMessage(`Acesso aprovado como ${role === 'EDITOR' ? 'Editor' : 'Visualizador'}.`);
    setTimeout(() => setMessage(''), 3000);
    loadData();
  };

  const handleApproveReset = (requestId: string) => {
      approveRequest(requestId); // No role needed for reset
      setMessage('Reset de senha aprovado. O usuário deve usar a senha padrão 123456.');
      setTimeout(() => setMessage(''), 3000);
      loadData();
  };

  const handleReject = (requestId: string) => {
    if (window.confirm('Tem certeza que deseja rejeitar esta solicitação?')) {
        deleteAccessRequest(requestId);
        loadData();
    }
  };

  const handleToggleStatus = (e: React.MouseEvent, user: User) => {
      e.preventDefault();
      e.stopPropagation();

      if (user.role === 'MASTER') return;
      
      const action = user.isActive ? 'inativar' : 'ativar';
      if (window.confirm(`Tem certeza que deseja ${action} o acesso de ${user.username}?`)) {
          toggleUserStatus(user.email);
          setMessage('Alteração realizada com sucesso');
          setTimeout(() => setMessage(''), 3000);
          loadData();
      }
  };

  const handleDeleteUser = (e: React.MouseEvent, user: User) => {
      e.preventDefault();
      e.stopPropagation(); 

      if (user.role === 'MASTER') {
          alert('O usuário Master não pode ser excluído.');
          return;
      }

      if (window.confirm(`ATENÇÃO: Deseja realmente EXCLUIR PERMANENTEMENTE o usuário ${user.username}? Esta ação não pode ser desfeita.`)) {
          deleteUser(user.email);
          setUsers(current => current.filter(u => u.email !== user.email));
          setMessage('Usuário excluído com sucesso');
          setTimeout(() => setMessage(''), 3000);
          setTimeout(loadData, 200); 
      }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>, user: User) => {
      const newRole = e.target.value as UserRole;
      if (user.role === 'MASTER' || newRole === 'MASTER') return; // Segurança extra

      if (window.confirm(`Deseja alterar o perfil de ${user.username} de ${user.role} para ${newRole}?`)) {
          updateUserRole(user.email, newRole);
          setMessage('Perfil do usuário atualizado com sucesso');
          setTimeout(() => setMessage(''), 3000);
          loadData();
      } else {
          // Recarrega para reverter visualmente se cancelado
          loadData();
      }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <UserCheck className="w-8 h-8" />
            Gestão de Usuários
         </h2>
      </div>

      {message && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg border border-emerald-200 shadow-sm animate-pulse">
              {message}
          </div>
      )}

      {/* Solicitações Pendentes */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-900" />
                Solicitações de Acesso / Reset Pendentes
            </h3>
            <span className="bg-blue-900 text-white text-xs font-bold px-2 py-1 rounded-full">
                {requests.length}
            </span>
        </div>
        
        {requests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic">
                Nenhuma solicitação pendente no momento.
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Tipo</th>
                            <th className="px-6 py-3">Data/Hora</th>
                            <th className="px-6 py-3">Nome</th>
                            <th className="px-6 py-3">E-mail</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(req => {
                            const isReset = req.type === 'PASSWORD_RESET';
                            return (
                                <tr key={req.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${isReset ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                            {isReset ? <KeyRound className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                                            {isReset ? 'Reset Senha' : 'Novo Cadastro'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(req.requestDate).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {req.username}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {req.email}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {isReset ? (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleApproveReset(req.id)}
                                                    className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded hover:bg-amber-100 transition-colors font-medium"
                                                    title="Aprovar reset de senha (redefine para 123456)"
                                                >
                                                    <KeyRound className="w-3 h-3" /> Aprovar Reset
                                                </button>
                                            ) : (
                                                <>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleApprove(req.id, 'EDITOR')}
                                                        className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-100 transition-colors"
                                                        title="Aprovar como Editor (Acesso Total)"
                                                    >
                                                        <Edit3 className="w-3 h-3" /> Editor
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleApprove(req.id, 'VIEWER')}
                                                        className="flex items-center gap-1 bg-slate-50 text-slate-700 border border-slate-200 px-3 py-1.5 rounded hover:bg-slate-100 transition-colors"
                                                        title="Aprovar como Visualizador (Apenas Leitura)"
                                                    >
                                                        <Eye className="w-3 h-3" /> Visualizar
                                                    </button>
                                                </>
                                            )}
                                            <button 
                                                type="button"
                                                onClick={() => handleReject(req.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                                title="Rejeitar Solicitação"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
      </section>

      {/* Usuários Cadastrados */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Usuários Ativos
            </h3>
        </div>
        <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Nome</th>
                            <th className="px-6 py-3">E-mail</th>
                            <th className="px-6 py-3">Perfil</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, idx) => (
                            <tr key={idx} className={`border-b hover:bg-slate-50 transition-colors ${!u.isActive ? 'bg-slate-50 opacity-75' : 'bg-white'}`}>
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {u.username}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {u.email}
                                </td>
                                <td className="px-6 py-4">
                                    {u.role === 'MASTER' ? (
                                        <span className="bg-purple-50 text-purple-700 border-purple-200 px-2 py-1 rounded-full text-xs font-bold border">
                                            MASTER
                                        </span>
                                    ) : (
                                        <div className="relative inline-block">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(e, u)}
                                                className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-bold border cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 transition-all
                                                    ${u.role === 'EDITOR' 
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500' 
                                                        : 'bg-slate-100 text-slate-600 border-slate-200 focus:ring-slate-500'}
                                                `}
                                            >
                                                <option value="EDITOR">EDITOR</option>
                                                <option value="VIEWER">VIEWER</option>
                                            </select>
                                            <ChevronDown className={`w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${u.role === 'EDITOR' ? 'text-blue-500' : 'text-slate-500'}`} />
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border flex items-center justify-center gap-1 w-24 mx-auto
                                        ${u.isActive 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                            : 'bg-red-50 text-red-700 border-red-200'}
                                    `}>
                                        {u.isActive ? <Check className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                                        {u.isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {u.role !== 'MASTER' && (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggleStatus(e, u)}
                                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors
                                                    ${u.isActive 
                                                        ? 'text-red-600 border-red-200 hover:bg-red-50' 
                                                        : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                                                    }
                                                `}
                                                title={u.isActive ? 'Inativar acesso do usuário' : 'Ativar acesso do usuário'}
                                            >
                                                <Power className="w-3 h-3" />
                                                {u.isActive ? 'Inativar' : 'Ativar'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteUser(e, u)}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                                title="Excluir usuário permanentemente"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Excluir
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
             </table>
        </div>
      </section>
    </div>
  );
};

export default UserManagement;