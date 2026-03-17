import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import DetranList from './components/DetranList';
import DetranDetail from './components/DetranDetail';
import UserManagement from './components/UserManagement';
import { getUser, saveUser, removeUser, getDetranData, getAllUsers, syncFromSupabase } from './services/storageService';
import { User, DetranData } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DetranData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Sync from Supabase first
      await syncFromSupabase();
      
      const currentUser = getUser();
      if (currentUser) {
        setUser(currentUser);
      }
      setData(getDetranData());
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
        // Sincroniza os dados da nuvem (Supabase) para o localStorage
        await syncFromSupabase();
        
        setData(getDetranData());
        
        const usersDb = getAllUsers();
        const currentUserDb = usersDb.find(u => u.email.trim().toLowerCase() === user.email.trim().toLowerCase());
        
        if (!currentUserDb || !currentUserDb.isActive) {
            alert('Seu acesso foi revogado ou sua conta foi removida pelo administrador.');
            handleLogout();
        }
    }, 5000); // A cada 5 segundos
    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = (newUser: User) => {
    saveUser(newUser);
    setUser(newUser);
  };

  const handleLogout = () => {
    removeUser();
    setUser(null);
  };

  if (loading) return null;

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          {!user ? (
            <Route path="*" element={<Auth onLogin={handleLogin} />} />
          ) : (
            <>
              <Route path="/" element={<Dashboard data={data} />} />
              <Route path="/detrans" element={<DetranList data={data} />} />
              <Route path="/detran/:uf" element={<DetranDetail />} />
              {user.role === 'MASTER' && (
                 <Route path="/users" element={<UserManagement />} />
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;