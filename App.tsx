import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import DetranList from './components/DetranList';
import DetranDetail from './components/DetranDetail';
import UserManagement from './components/UserManagement';
import { getUser, saveUser, removeUser, getDetranData } from './services/storageService';
import { User, DetranData } from './types';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DetranData[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = getUser();
      
      if (session?.user && currentUser) {
        setUser(currentUser);
        
        // Fetch user data from Supabase
        const { data: userData, error } = await supabase
          .from('user_data')
          .select('data')
          .eq('user_id', session.user.id)
          .single();
          
        if (userData && userData.data) {
          localStorage.setItem('detran_app_data', JSON.stringify(userData.data));
          setData(userData.data);
        } else {
          setData(getDetranData());
        }
      } else {
        setData(getDetranData());
      }
      setLoading(false);
    };
    
    init();
  }, []);

  // Poll for data changes (simple way to keep dashboard in sync without Redux/Context for this scope)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
        setData(getDetranData());
        
        // Security Check: Ensure user session is still valid
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('Sua sessão expirou.');
            handleLogout();
        }
    }, 2000); // Check for updates every 2 seconds
    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = async (newUser: User) => {
    saveUser(newUser);
    setUser(newUser);
    
    if (newUser.id) {
      const { data: userData, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', newUser.id)
        .single();
        
      if (userData && userData.data) {
        localStorage.setItem('detran_app_data', JSON.stringify(userData.data));
        setData(userData.data);
      } else {
        const initialData = getDetranData();
        await supabase.from('user_data').upsert({ user_id: newUser.id, data: initialData }, { onConflict: 'user_id' });
        setData(initialData);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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