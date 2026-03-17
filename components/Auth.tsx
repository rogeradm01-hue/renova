import React, { useState } from 'react';
import { User } from '../types';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, AlertTriangle, Leaf } from 'lucide-react';
import { validateLogin, createAccessRequest, changeUserPassword, createPasswordResetRequest } from '../services/storageService';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [viewState, setViewState] = useState<'LOGIN' | 'REQUEST_ACCESS' | 'CHANGE_PASSWORD' | 'RESET_PASSWORD_REQUEST'>('LOGIN');
  const [showPassword, setShowPassword] = useState(false);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  // Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Feedback
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password Validation Regex
  const validatePasswordStrength = (pwd: string) => {
    // Letters, numbers, special char @ or *
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@*])[A-Za-z\d@*]+$/;
    return regex.test(pwd);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    const result = validateLogin(email, password);
    
    if (result.success && result.user) {
      if (result.user.isFirstLogin) {
        setViewState('CHANGE_PASSWORD');
        setError('');
        setSuccess('É necessário alterar sua senha padrão no primeiro acesso.');
      } else {
        onLogin(result.user);
      }
    } else {
      setError(result.message || 'Erro ao entrar.');
    }
  };

  const handleRequestAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !username) {
      setError('Preencha nome e e-mail.');
      return;
    }

    createAccessRequest(username, email);
    setSuccess('Solicitação enviada ao usuário Máster com sucesso!');
    setTimeout(() => {
        setViewState('LOGIN');
        setSuccess('');
        setEmail('');
        setUsername('');
    }, 3000);
  };

  const handleResetRequestSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      if (!email) {
          setError('Preencha o e-mail cadastrado.');
          return;
      }

      const result = createPasswordResetRequest(email);
      if (result.success) {
          setSuccess(result.message);
          setTimeout(() => {
            setViewState('LOGIN');
            setSuccess('');
            setEmail('');
        }, 4000);
      } else {
          setError(result.message);
      }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!validatePasswordStrength(newPassword)) {
      setError('A senha deve conter letras, números e o caractere especial @ ou *');
      return;
    }

    changeUserPassword(email, newPassword);
    
    // Login automático após troca
    const result = validateLogin(email, newPassword);
    if (result.success && result.user) {
       onLogin(result.user);
    } else {
       // Fallback
       setViewState('LOGIN');
       setSuccess('Senha alterada. Faça login novamente.');
       setPassword('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-200 via-white to-white">
      <div className="bg-white/95 backdrop-blur-sm p-10 rounded-2xl shadow-2xl w-full max-w-md border border-white/60">
        
        {/* Header Logic with Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative mb-2 pt-2">
                <h1 className="text-6xl font-bold text-[#1e293b] tracking-wider drop-shadow-sm select-none" style={{ fontFamily: 'Inter, sans-serif' }}>
                    RENOVA
                </h1>
                {/* Stylized Leaf Accent positioned over the 'O' */}
                <div className="absolute top-[-14px] left-[52%] -translate-x-1/2 pointer-events-none">
                     <Leaf className="w-10 h-10 text-[#66bb6a] fill-[#66bb6a] transform -rotate-[20deg]" strokeWidth={2} />
                </div>
            </div>
            
            <div className="mt-4 text-center">
              <h2 className="text-lg font-semibold text-blue-900">
                {viewState === 'LOGIN' && 'Acesso ao Sistema'}
                {viewState === 'REQUEST_ACCESS' && 'Solicitar Acesso'}
                {viewState === 'CHANGE_PASSWORD' && 'Troca de Senha'}
                {viewState === 'RESET_PASSWORD_REQUEST' && 'Reset de Senha'}
              </h2>
              <p className="text-slate-500 mt-1 text-xs uppercase tracking-wide font-medium">
                {viewState === 'LOGIN' && 'Gestão de Recadastramento'}
                {viewState === 'REQUEST_ACCESS' && 'Cadastro de Novo Usuário'}
                {viewState === 'CHANGE_PASSWORD' && 'Segurança da Conta'}
                {viewState === 'RESET_PASSWORD_REQUEST' && 'Recuperação de Acesso'}
              </p>
            </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100 flex items-center gap-2">
            <Leaf className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {/* FORMS */}
        
        {/* 1. LOGIN FORM */}
        {viewState === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
              <input
                type="email"
                placeholder="E-mail Corporativo"
                required
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white transition-all shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Sua Senha"
                required
                className="w-full pl-10 pr-12 py-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white transition-all shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" className="w-full bg-[#1e293b] hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Acessar Plataforma
            </button>
            
            <div className="text-center pt-2">
                <button 
                    type="button"
                    onClick={() => { setViewState('RESET_PASSWORD_REQUEST'); setError(''); setSuccess(''); setEmail(''); }} 
                    className="text-xs text-slate-500 hover:text-blue-700 hover:underline transition-colors"
                >
                    Esqueceu sua senha? Solicitar reset ao Máster
                </button>
            </div>
          </form>
        )}

        {/* 2. REQUEST ACCESS FORM */}
        {viewState === 'REQUEST_ACCESS' && (
          <form onSubmit={handleRequestAccessSubmit} className="space-y-5">
             <div className="relative group">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 w-5 h-5" />
              <input
                type="text"
                placeholder="Nome Completo"
                required
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 w-5 h-5" />
              <input
                type="email"
                placeholder="E-mail Corporativo"
                required
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-[#1e293b] hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg">
              Enviar Solicitação
            </button>
          </form>
        )}

        {/* 3. CHANGE PASSWORD FORM */}
        {viewState === 'CHANGE_PASSWORD' && (
          <form onSubmit={handleChangePasswordSubmit} className="space-y-5">
            <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-100 flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Crie uma senha forte contendo letras, números e caractere especial (@ ou *).</span>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 w-5 h-5" />
              <input
                type="password"
                placeholder="Nova Senha"
                required
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 w-5 h-5" />
              <input
                type="password"
                placeholder="Confirmar Nova Senha"
                required
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg">
              Salvar Nova Senha
            </button>
          </form>
        )}
        
        {/* 4. RESET PASSWORD REQUEST FORM */}
        {viewState === 'RESET_PASSWORD_REQUEST' && (
            <form onSubmit={handleResetRequestSubmit} className="space-y-5">
                <div className="p-3 bg-slate-50 text-slate-600 text-xs rounded-lg border border-slate-200 mb-2">
                    Informe seu e-mail cadastrado. Se o usuário existir, o Administrador receberá uma notificação para resetar sua senha.
                </div>
                <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 w-5 h-5" />
                    <input
                        type="email"
                        placeholder="Seu e-mail cadastrado"
                        required
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-sm text-slate-700 bg-slate-50 focus:bg-white transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <button type="submit" className="w-full bg-[#1e293b] hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg">
                    Enviar Solicitação de Reset
                </button>
            </form>
        )}

        {/* Navigation Links */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm space-y-3">
          {viewState === 'LOGIN' && (
            <>
              <button onClick={() => { setViewState('REQUEST_ACCESS'); setError(''); setSuccess(''); setEmail(''); }} className="text-slate-500 hover:text-blue-700 font-medium transition-colors">
                Não possui conta? <span className="underline">Solicitar Acesso</span>
              </button>
            </>
          )}

          {(viewState === 'REQUEST_ACCESS' || viewState === 'RESET_PASSWORD_REQUEST') && (
             <button onClick={() => { setViewState('LOGIN'); setError(''); setSuccess(''); setEmail(''); }} className="text-slate-500 hover:text-slate-800 font-medium transition-colors flex items-center justify-center gap-1 mx-auto">
                ← Voltar ao login
             </button>
          )}
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="fixed bottom-4 text-center w-full pointer-events-none">
          <p className="text-slate-400/80 text-xs font-medium drop-shadow-sm">© {new Date().getFullYear()} RENOVA - Sistema de Gestão de Recadastramento</p>
      </div>
    </div>
  );
};

export default Auth;