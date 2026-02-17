import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, Users, Leaf, Map } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-white text-slate-700 font-sans">
      {/* Header */}
      {user && (
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
            <div className="flex items-center gap-6">
              {/* Logo / Institution Area */}
              <div className="flex items-center gap-3 select-none cursor-pointer group" onClick={() => navigate('/')}>
                 <div className="relative pt-1">
                    <h1 className="text-2xl font-bold text-[#1e293b] tracking-wide group-hover:opacity-90 transition-opacity" style={{ fontFamily: 'Inter, sans-serif' }}>
                        RENOVA
                    </h1>
                    {/* Stylized Leaf Accent positioned over the 'O' */}
                    <Leaf className="absolute -top-1.5 left-[52%] -translate-x-1/2 w-4 h-4 text-[#66bb6a] fill-[#66bb6a] transform -rotate-[20deg]" strokeWidth={2.5} />
                 </div>
                 
                 <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                 
                 <p className="text-xs text-slate-500 font-medium hidden sm:block leading-tight">
                    Gestão de<br/>Recadastramento
                 </p>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-1 ml-2">
                <button
                    onClick={() => navigate('/')}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive('/') ? 'text-blue-900 bg-blue-50' : 'text-slate-600 hover:text-blue-900 hover:bg-slate-100'}
                    `}
                    title="Ir para o Início"
                >
                    <Home className="w-5 h-5" />
                    <span className="hidden md:inline">Início</span>
                </button>

                <button
                    onClick={() => navigate('/detrans')}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                        ${isActive('/detrans') ? 'text-blue-900 bg-blue-50' : 'text-slate-600 hover:text-blue-900 hover:bg-slate-100'}
                    `}
                    title="Gerenciar Estados"
                >
                    <Map className="w-5 h-5" />
                    <span className="hidden md:inline">Gerenciar Estados</span>
                </button>

                {/* Master Menu */}
                {user.role === 'MASTER' && (
                    <button
                        onClick={() => navigate('/users')}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                            ${isActive('/users') ? 'text-blue-900 bg-blue-50' : 'text-slate-600 hover:text-blue-900 hover:bg-slate-100'}
                        `}
                        title="Gestão de Usuários"
                    >
                        <Users className="w-5 h-5" />
                        <span className="hidden md:inline">Usuários</span>
                    </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-700">{user.username}</p>
                <div className="flex items-center justify-end gap-1">
                    <span className="text-xs text-slate-500">{user.email}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded uppercase font-bold">{user.role === 'MASTER' ? 'Master' : user.role === 'EDITOR' ? 'Editor' : 'Visualizador'}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-red-700 rounded-md transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;