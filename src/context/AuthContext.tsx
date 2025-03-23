import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';

// Define user interface
export interface User {
  id: string;
  name: string;
  registration: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

// Define auth context interface
interface AuthContextType {
  user: User | null;
  login: (registration: string, password: string) => Promise<void>;
  register: (registration: string, name: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin user data
const ADMIN_USER: User = {
  id: 'admin-id',
  name: 'Administrador',
  registration: '00123456',
  role: 'admin',
  status: 'active'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for stored user on load
  useEffect(() => {
    const storedUser = localStorage.getItem('logiswap_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem('logiswap_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (registration: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Check for admin credentials
      if (registration === '00123456' && password === 'admin') {
        setUser(ADMIN_USER);
        localStorage.setItem('logiswap_user', JSON.stringify(ADMIN_USER));
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
        return;
      }
      
      // Check for registered users
      const users = JSON.parse(localStorage.getItem('logiswap_users') || '[]');
      const foundUser = users.find((u: any) => 
        u.registration === registration && u.password === password && u.status === 'active'
      );
      
      if (foundUser) {
        const userObj: User = {
          id: foundUser.id,
          name: foundUser.name,
          registration: foundUser.registration,
          role: foundUser.role,
          status: foundUser.status
        };
        
        setUser(userObj);
        localStorage.setItem('logiswap_user', JSON.stringify(userObj));
        toast.success('Login realizado com sucesso!');
        navigate('/dashboard');
      } else {
        toast.error('Credenciais inválidas ou usuário inativo');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao realizar login');
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (registration: string, name: string, password: string, confirmPassword: string) => {
    setIsLoading(true);
    
    try {
      if (password !== confirmPassword) {
        toast.error('As senhas não coincidem');
        return;
      }
      
      if (registration.length !== 8 || !/^\d+$/.test(registration)) {
        toast.error('A matrícula deve conter 8 dígitos');
        return;
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Check if admin exists
      if (registration === ADMIN_USER.registration) {
        toast.error('Matrícula já existente');
        return;
      }
      
      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('logiswap_users') || '[]');
      if (users.some((u: any) => u.registration === registration)) {
        toast.error('Matrícula já cadastrada');
        return;
      }
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name,
        registration,
        password,
        role: 'user',
        status: 'active'
      };
      
      // Add to users array
      users.push(newUser);
      localStorage.setItem('logiswap_users', JSON.stringify(users));
      
      toast.success('Cadastro realizado com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Erro ao realizar cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('logiswap_user');
    toast.info('Sessão encerrada');
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
