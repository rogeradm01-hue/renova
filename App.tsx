import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import DetranList from './components/DetranList';
import DetranDetail from './components/DetranDetail';
import UserManagement from './components/UserManagement';
import { getUser, saveUser, removeUser, getDetranData, getAllUsers } from './services/storageService';
import { User, DetranData } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DetranData[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
    }
    // Load Detran data
    setData(getDetranData());
    setLoading(false);
  }, []);

  // Poll for data changes (simple way to keep dashboard in sync without Redux/Context for this scope)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
        setData(getDetranData());
        
        // Security Check: Ensure user is still active in DB and exists
        const usersDb = getAllUsers();
        const currentUserDb = usersDb.find(u => u.email === user.email);
        
        // Se o usuário não existir (foi excluído) OU estiver marcado como inativo
        if (!currentUserDb || !currentUserDb.isActive) {
            alert('Seu acesso foi revogado ou sua conta foi removida pelo administrador.');
            handleLogout();
        }
    }, 2000); // Check for updates every 2 seconds
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