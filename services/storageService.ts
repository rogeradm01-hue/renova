import { DetranData, User, RegistrationStatus, AccessRequest, UserRole } from '../types';
import { BRAZIL_STATES } from '../constants';

const STORAGE_KEYS = {
  CURRENT_USER: 'detran_app_current_user',
  DETRAN_DATA: 'detran_app_data',
  USERS_DB: 'detran_app_users_db',
  ACCESS_REQUESTS: 'detran_app_requests'
};

// --- Data Initialization ---

const initializeData = (): DetranData[] => {
  const existing = localStorage.getItem(STORAGE_KEYS.DETRAN_DATA);
  if (existing) {
    return JSON.parse(existing);
  }

  const initialData: DetranData[] = BRAZIL_STATES.map((state) => ({
    uf: state.uf,
    stateName: state.name,
    contact: { name: '', phone: '', email: '' },
    documents: [],
    expirationDate: null,
    alertDays: 30,
    configMetadata: undefined,
    contactMetadata: undefined,
    statusHistory: [
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        status: 'Não Iniciada',
        notes: 'Inicialização do sistema',
      },
    ],
    currentStatus: 'Não Iniciada',
  }));

  localStorage.setItem(STORAGE_KEYS.DETRAN_DATA, JSON.stringify(initialData));
  return initialData;
};

// --- User Management Logic ---

// Garante que o usuário Master exista e esteja atualizado com as credenciais corretas
const initializeUsers = (): User[] => {
  const masterUser: User = {
    username: 'Administrador Master',
    email: 'master@master.com',
    role: 'MASTER',
    password: 'Master@01', // Senha definida conforme solicitação
    isFirstLogin: false,
    isActive: true
  };

  const existingUsersStr = localStorage.getItem(STORAGE_KEYS.USERS_DB);
  
  if (existingUsersStr) {
    let users: User[] = JSON.parse(existingUsersStr);
    let changed = false;
    
    // Migração: garantir que usuários antigos tenham o campo isActive
    users = users.map(u => {
        if (u.isActive === undefined) {
            changed = true;
            return { ...u, isActive: true };
        }
        return u;
    });
    
    // Verifica se o master já existe para atualizar a senha/perfil ou cria se não existir
    const masterIndex = users.findIndex(u => u.email === masterUser.email);
    
    if (masterIndex !== -1) {
      // Verifica se precisa atualizar dados do master
      const currentMaster = users[masterIndex];
      // Força a atualização se a senha ou status estiverem incorretos no storage antigo
      if (currentMaster.password !== masterUser.password || !currentMaster.isActive) {
          users[masterIndex] = { ...currentMaster, ...masterUser, isActive: true };
          changed = true;
      }
    } else {
      // Adiciona o master se não existir
      users.push(masterUser);
      changed = true;
    }

    if (changed) {
        localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
    }
    return users;
  }

  // Primeira inicialização
  const initialUsers = [masterUser];
  localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(initialUsers));
  return initialUsers;
};

export const getAllUsers = (): User[] => {
  return initializeUsers();
};

export const getAccessRequests = (): AccessRequest[] => {
  const reqs = localStorage.getItem(STORAGE_KEYS.ACCESS_REQUESTS);
  return reqs ? JSON.parse(reqs) : [];
};

// Solicitação de Novo Cadastro
export const createAccessRequest = (username: string, email: string): void => {
  const requests = getAccessRequests();
  const normalizedEmail = email.trim().toLowerCase();
  
  // Evitar duplicidade de solicitação
  if (requests.find(r => r.email.toLowerCase() === normalizedEmail && r.type === 'NEW_ACCOUNT')) return;

  const newRequest: AccessRequest = {
    id: crypto.randomUUID(),
    username,
    email: normalizedEmail,
    requestDate: new Date().toISOString(),
    type: 'NEW_ACCOUNT'
  };

  localStorage.setItem(STORAGE_KEYS.ACCESS_REQUESTS, JSON.stringify([...requests, newRequest]));
};

// Solicitação de Reset de Senha
export const createPasswordResetRequest = (email: string): { success: boolean, message: string } => {
    const users = getAllUsers();
    const normalizedEmail = email.trim().toLowerCase();
    
    // Verifica se o usuário realmente existe
    const userExists = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!userExists) {
        return { success: false, message: 'E-mail não encontrado na base de usuários.' };
    }

    if (userExists.role === 'MASTER') {
        return { success: false, message: 'Solicite reset de senha do Máster diretamente ao suporte técnico.' };
    }

    const requests = getAccessRequests();
    // Verifica se já existe solicitação pendente para este email
    if (requests.find(r => r.email.toLowerCase() === normalizedEmail)) {
        return { success: false, message: 'Já existe uma solicitação pendente para este e-mail.' };
    }

    const newRequest: AccessRequest = {
        id: crypto.randomUUID(),
        username: userExists.username, // Usa o nome já cadastrado
        email: normalizedEmail,
        requestDate: new Date().toISOString(),
        type: 'PASSWORD_RESET'
    };

    localStorage.setItem(STORAGE_KEYS.ACCESS_REQUESTS, JSON.stringify([...requests, newRequest]));
    return { success: true, message: 'Solicitação de reset enviada ao Administrador.' };
};

export const approveRequest = (requestId: string, role?: UserRole): void => {
  const requests = getAccessRequests();
  const request = requests.find(r => r.id === requestId);
  
  if (!request) return;

  const users = getAllUsers();
  
  if (request.type === 'NEW_ACCOUNT') {
      // Lógica de Novo Cadastro
      if (users.find(u => u.email.toLowerCase() === request.email.trim().toLowerCase())) {
        // Usuário já existe, apenas remove request
        const remainingRequests = requests.filter(r => r.id !== requestId);
        localStorage.setItem(STORAGE_KEYS.ACCESS_REQUESTS, JSON.stringify(remainingRequests));
        return;
      }

      const newUser: User = {
        username: request.username,
        email: request.email.trim(),
        role: role || 'VIEWER', // Default
        password: '123456', // Senha Padrão
        isFirstLogin: true,
        isActive: true
      };
      localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify([...users, newUser]));

  } else if (request.type === 'PASSWORD_RESET') {
      // Lógica de Reset de Senha
      const updatedUsers = users.map(u => {
          if (u.email.toLowerCase() === request.email.trim().toLowerCase()) {
              return { 
                  ...u, 
                  password: '123456', 
                  isFirstLogin: true // Força troca na próxima vez
              };
          }
          return u;
      });
      localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(updatedUsers));
  }

  // Remove request (comum para ambos os casos)
  const remainingRequests = requests.filter(r => r.id !== requestId);
  localStorage.setItem(STORAGE_KEYS.ACCESS_REQUESTS, JSON.stringify(remainingRequests));
};

export const deleteAccessRequest = (requestId: string): void => {
  const requests = getAccessRequests();
  const remaining = requests.filter(r => r.id !== requestId);
  localStorage.setItem(STORAGE_KEYS.ACCESS_REQUESTS, JSON.stringify(remaining));
};

export const validateLogin = (email: string, password: string): { success: boolean; user?: User; message?: string } => {
  const users = getAllUsers();
  // Case insensitive email check
  const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);

  if (user) {
    if (user.isActive === false) {
        return { success: false, message: 'Usuário inativo. Contate o administrador.' };
    }
    return { success: true, user };
  }
  return { success: false, message: 'Credenciais inválidas.' };
};

export const changeUserPassword = (email: string, newPassword: string): void => {
  const users = getAllUsers();
  const updatedUsers = users.map(u => {
    if (u.email.toLowerCase() === email.trim().toLowerCase()) {
      return { ...u, password: newPassword, isFirstLogin: false };
    }
    return u;
  });
  localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(updatedUsers));
  
  // Update current session if necessary
  const currentUser = getUser();
  if (currentUser && currentUser.email.toLowerCase() === email.trim().toLowerCase()) {
    saveUser({ ...currentUser, isFirstLogin: false });
  }
};

export const toggleUserStatus = (email: string): void => {
    const users = getAllUsers();
    const updatedUsers = users.map(u => {
        if (u.email.toLowerCase() === email.trim().toLowerCase() && u.role !== 'MASTER') { // Não permite inativar o Master
            return { ...u, isActive: !u.isActive };
        }
        return u;
    });
    localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(updatedUsers));
};

export const updateUserRole = (email: string, newRole: UserRole): void => {
    const users = getAllUsers();
    
    // Safety check: Cannot change role of MASTER user this way, and MASTER user is protected by logic below
    const updatedUsers = users.map(u => {
        if (u.role === 'MASTER') return u; // Never change master role

        if (u.email.trim().toLowerCase() === email.trim().toLowerCase()) {
            return { ...u, role: newRole };
        }
        return u;
    });
    localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(updatedUsers));
};

export const deleteUser = (email: string): void => {
    // Leitura direta do Storage para evitar efeitos colaterais de inicialização
    const existingUsersStr = localStorage.getItem(STORAGE_KEYS.USERS_DB);
    if (!existingUsersStr) return;

    let users: User[] = JSON.parse(existingUsersStr);
    
    const emailToDelete = email.trim().toLowerCase();
    
    // Cria uma nova lista filtrada
    const updatedUsers = users.filter(u => {
        // Se for o Master, mantém na lista (retorna true)
        if (u.role === 'MASTER') return true;
        
        // Se o email for diferente do que queremos apagar, mantém na lista.
        // Se o email for igual, retorna false (remove da lista).
        return u.email.trim().toLowerCase() !== emailToDelete;
    });
    
    localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(updatedUsers));
};

// --- General Data Access ---

export const getDetranData = (): DetranData[] => {
  return initializeData();
};

export const saveDetranData = (data: DetranData[]): void => {
  localStorage.setItem(STORAGE_KEYS.DETRAN_DATA, JSON.stringify(data));
};

export const updateDetran = (uf: string, updates: Partial<DetranData>): DetranData[] => {
  const currentData = getDetranData();
  const index = currentData.findIndex((d) => d.uf === uf);
  if (index !== -1) {
    currentData[index] = { ...currentData[index], ...updates };
    saveDetranData(currentData);
  }
  return currentData;
};

// --- Session Management ---

export const getUser = (): User | null => {
  const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return userStr ? JSON.parse(userStr) : null;
};

export const saveUser = (user: User): void => {
  // Remove password from session storage for security (mock)
  const { password, ...safeUser } = user;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
};

export const removeUser = (): void => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const checkExpirationStatus = (detran: DetranData): boolean => {
  if (!detran.expirationDate) return false;
  
  const today = new Date();
  const expiration = new Date(detran.expirationDate);
  const diffTime = expiration.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= detran.alertDays;
};
